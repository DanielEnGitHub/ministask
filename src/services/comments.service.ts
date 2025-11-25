/**
 * =====================================================
 * SERVICIO: Comentarios
 * =====================================================
 * Maneja todas las operaciones CRUD de comentarios en Supabase
 * =====================================================
 */

import { supabase } from '@/lib/supabase'

export interface Comment {
  id: string
  task_id: string
  text: string
  user_id: string
  user_name: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateCommentInput {
  taskId: string
  text: string
  userId: string
  userName: string
  parentCommentId?: string | null
}

export interface UpdateCommentInput {
  text: string
}

/**
 * Obtener todos los comentarios de una tarea
 */
export async function getCommentsByTask(taskId: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getCommentsByTask] Error:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo comentario
 */
export async function createComment(input: CreateCommentInput) {
  try {
    const comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'> = {
      task_id: input.taskId,
      text: input.text,
      user_id: input.userId,
      user_name: input.userName,
      parent_comment_id: input.parentCommentId || null,
    }

    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[createComment] Error:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un comentario
 * Solo el autor puede actualizarlo
 */
export async function updateComment(commentId: string, input: UpdateCommentInput) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({
        text: input.text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[updateComment] Error:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar un comentario
 * Solo el autor puede eliminarlo
 */
export async function deleteComment(commentId: string) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('[deleteComment] Error:', error)
    return { error }
  }
}
