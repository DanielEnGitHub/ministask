import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { cn } from '@/lib/utils'
import type { Task, Project, Comment } from '@/lib/types'
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from '@/lib/types'
import { Calendar, Folder, Edit2, CheckSquare, Square, Eye, ChevronDown, ChevronUp, MessageSquare, Send, Reply, Trash2, X } from 'lucide-react'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { getTaskProjectId, getTaskStartDate, getTaskEndDate } from '@/lib/taskUtils'
import { useAuth } from '@/contexts/AuthContext'
import * as TasksService from '@/services/tasks.service'
import * as CommentsService from '@/services/comments.service'

interface TaskDetailModalProps {
  open: boolean
  onClose: () => void
  task: Task | null
  projects?: Project[]
  onEdit: (task: Task) => void
}

export function TaskDetailModal({
  open,
  onClose,
  task,
  projects = [],
  onEdit
}: TaskDetailModalProps) {
  const { user, profile, isAdmin } = useAuth()
  const [showViews, setShowViews] = useState(false)

  // Estado para comentarios
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // Registrar vista cuando un NO admin abre el modal
  useEffect(() => {
    if (open && task && user && profile && !isAdmin) {
      const userName = profile.name || user.email || 'Usuario'
      TasksService.recordTaskView(task.id, user.id, userName)
    }
  }, [open, task, user, profile, isAdmin])

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setShowViews(false)
      setNewComment('')
      setReplyingTo(null)
      setReplyText('')
    }
  }, [open])

  // Cargar comentarios cuando se abre el modal
  useEffect(() => {
    if (open && task) {
      loadComments()
    }
  }, [open, task])

  const loadComments = async () => {
    if (!task) return

    setLoadingComments(true)
    try {
      const { data, error } = await CommentsService.getCommentsByTask(task.id)
      if (error) return

      // Convertir datos de Supabase a formato frontend
      const formattedComments: Comment[] = (data || []).map((c: any) => ({
        id: c.id,
        taskId: c.task_id,
        text: c.text,
        userId: c.user_id,
        userName: c.user_name,
        parentCommentId: c.parent_comment_id,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      }))

      // Organizar en árbol (comentarios con respuestas)
      const organized = organizeComments(formattedComments)
      setComments(organized)
    } finally {
      setLoadingComments(false)
    }
  }

  // Organizar comentarios en árbol con respuestas anidadas
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // Crear mapa de comentarios
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Organizar en árbol
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  const handleAddComment = async () => {
    if (!task || !user || !profile || !newComment.trim()) return

    const userName = profile.name || user.email || 'Usuario'

    try {
      const { error } = await CommentsService.createComment({
        taskId: task.id,
        text: newComment.trim(),
        userId: user.id,
        userName,
      })

      if (error) {
        alert('Error al crear comentario')
        return
      }

      await loadComments()
      setNewComment('')
    } catch (error) {
      alert('Error al crear comentario')
    }
  }

  const handleReply = async (parentCommentId: string) => {
    if (!task || !user || !profile || !replyText.trim()) return

    const userName = profile.name || user.email || 'Usuario'

    try {
      const { error } = await CommentsService.createComment({
        taskId: task.id,
        text: replyText.trim(),
        userId: user.id,
        userName,
        parentCommentId,
      })

      if (error) {
        alert('Error al crear respuesta')
        return
      }

      await loadComments()
      setReplyingTo(null)
      setReplyText('')
    } catch (error) {
      alert('Error al crear respuesta')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return

    try {
      const { error } = await CommentsService.deleteComment(commentId)

      if (error) {
        alert('Error al eliminar comentario')
        return
      }

      await loadComments()
    } catch (error) {
      alert('Error al eliminar comentario')
    }
  }

  if (!task) return null

  // Obtener datos de la tarea manejando tanto camelCase como snake_case
  const projectId = getTaskProjectId(task)
  const project = projects.find(p => p.id === projectId)
  const startDate = getTaskStartDate(task)
  const endDate = getTaskEndDate(task)

  // Obtener vistas de la tarea (task_views de Supabase o taskViews del frontend)
  const taskViews = (task as any).task_views || task.taskViews || []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{task.title}</DialogTitle>
            <Button
              onClick={() => {
                onEdit(task)
                onClose()
              }}
              variant="outline"
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Estado
            </label>
            <Badge
              className={cn(
                STATUS_CONFIG[task.status].bgColor,
                STATUS_CONFIG[task.status].color,
                'border-0 text-sm px-3 py-1'
              )}
            >
              {STATUS_CONFIG[task.status].label}
            </Badge>
          </div>

          {/* Etiqueta */}
          {task.label && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Etiqueta
              </label>
              <Badge
                className={cn(
                  LABEL_CONFIG[task.label].bgColor,
                  LABEL_CONFIG[task.label].color,
                  'border-0 text-sm px-3 py-1'
                )}
              >
                {LABEL_CONFIG[task.label].icon} {LABEL_CONFIG[task.label].label}
              </Badge>
            </div>
          )}

          {/* Prioridad */}
          {task.priority && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Prioridad
              </label>
              <Badge
                className={cn(
                  PRIORITY_CONFIG[task.priority].bgColor,
                  PRIORITY_CONFIG[task.priority].color,
                  'border-0 text-sm px-3 py-1'
                )}
              >
                {PRIORITY_CONFIG[task.priority].icon} {PRIORITY_CONFIG[task.priority].label}
              </Badge>
            </div>
          )}

          {/* Descripción */}
          {task.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Descripción
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Proyecto */}
          {project && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Proyecto
              </label>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{project.name}</span>
              </div>
            </div>
          )}

          {/* Fechas */}
          {(startDate || endDate) && (
            <div className="grid grid-cols-2 gap-4">
              {startDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Fecha Inicio
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDateForDisplay(startDate)}
                    </span>
                  </div>
                </div>
              )}

              {endDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Fecha Fin
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDateForDisplay(endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtareas */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Subtareas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
              </label>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                  >
                    {subtask.completed ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        subtask.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-700'
                      )}
                    >
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de vistas - Solo para administradores */}
          {isAdmin && (
            <div className="border-t pt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowViews(!showViews)}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Ver quiénes vieron esta tarea</span>
                  {taskViews.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {taskViews.length}
                    </Badge>
                  )}
                </div>
                {showViews ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showViews && (
                <div className="mt-4">
                  {taskViews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Nadie ha visto esta tarea aún</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                      {taskViews
                        .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
                        .map((view: any) => (
                          <div
                            key={view.id}
                            className="flex items-center justify-between p-2 bg-white rounded-lg text-sm hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-700">{view.userName}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(view.viewedAt).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sección de Comentarios */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Comentarios
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
                  </Badge>
                )}
              </h3>
            </div>

            {/* Formulario para nuevo comentario */}
            <div className="mb-6">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={3}
                className="mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddComment()
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Ctrl + Enter para enviar</span>
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Comentar
                </Button>
              </div>
            </div>

            {/* Lista de comentarios */}
            {loadingComments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={user?.id || ''}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    onReply={(id) => setReplyingTo(id)}
                    onCancelReply={() => {
                      setReplyingTo(null)
                      setReplyText('')
                    }}
                    onReplyTextChange={setReplyText}
                    onSubmitReply={handleReply}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente para renderizar comentarios individuales con respuestas anidadas
interface CommentItemProps {
  comment: Comment
  currentUserId: string
  replyingTo: string | null
  replyText: string
  onReply: (commentId: string) => void
  onCancelReply: () => void
  onReplyTextChange: (text: string) => void
  onSubmitReply: (parentId: string) => void
  onDelete: (commentId: string) => void
  depth?: number
}

function CommentItem({
  comment,
  currentUserId,
  replyingTo,
  replyText,
  onReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply,
  onDelete,
  depth = 0
}: CommentItemProps) {
  const isOwner = comment.userId === currentUserId
  const isReplying = replyingTo === comment.id
  const maxDepth = 3 // Máxima profundidad de anidamiento

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-8 border-l-2 border-gray-200 pl-4')}>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {comment.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{comment.userName}</p>
              <p className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{comment.text}</p>

        {depth < maxDepth && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => isReplying ? onCancelReply() : onReply(comment.id)}
          >
            {isReplying ? (
              <>
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </>
            ) : (
              <>
                <Reply className="h-3 w-3 mr-1" />
                Responder
              </>
            )}
          </Button>
        )}

        {/* Formulario de respuesta */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Escribe una respuesta..."
              rows={2}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  onSubmitReply(comment.id)
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyText.trim()}
              >
                <Send className="h-3 w-3 mr-1" />
                Responder
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Renderizar respuestas anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              replyText={replyText}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
