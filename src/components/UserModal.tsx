import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { supabase } from '@/lib/supabase'
import type { UserWithAssignments } from '@/services/users.service'

interface UserModalProps {
  open: boolean
  onClose: () => void
  onSave: (userData: { role: 'admin' | 'client' | 'subadmin' }) => void
  user: UserWithAssignments | null
  onUserCreated?: () => void
}

export function UserModal({ open, onClose, onSave, user, onUserCreated }: UserModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // pendingRole almacena el rol solo cuando el usuario lo cambia manualmente en el select.
  // Mientras sea null, se usa user?.role directamente (sin depender de efectos ni timing).
  const [pendingRole, setPendingRole] = useState<'admin' | 'client' | 'subadmin' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevOpenRef = useRef(false)

  const isEditing = !!user

  // Rol efectivo: si el usuario cambió el select (pendingRole), usar ese; si no, usar user.role
  const role: 'admin' | 'client' | 'subadmin' =
    pendingRole ?? (user?.role as 'admin' | 'client' | 'subadmin') ?? 'client'

  // Resetear pendingRole y email cuando el modal abre con un nuevo usuario
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (open && !wasOpen) {
      // Modal acaba de abrirse
      setPendingRole(null)
      setEmail(user?.email ?? '')
      setPassword('')
      setError(null)
    }
  }, [open, user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isEditing) {
        // Actualizar usuario existente
        await onSave({
          role,
        })
        onClose()
      } else {
        // Crear nuevo usuario
        if (!email || !password) {
          setError('Email y contraseña son requeridos')
          setLoading(false)
          return
        }

        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            },
          },
        })

        if (authError) {
          console.error('[UserModal] Error creating user:', authError)
          setError(authError.message)
          setLoading(false)
          return
        }

        // Si se creó correctamente
        if (authData.user) {
          // El trigger de la base de datos creará automáticamente el perfil

          // Llamar callback para recargar datos
          if (onUserCreated) {
            await onUserCreated()
          }

          onClose()
        }
      }
    } catch (error: any) {
      console.error('[UserModal] Error:', error)
      setError(error.message || 'Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email - solo en modo creación */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
          )}

          {/* Email - solo lectura en modo edición */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
            </div>
          )}

          {/* Contraseña - solo en modo creación */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
          )}

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'client' | 'subadmin') => setPendingRole(value)}>
              <SelectTrigger id="role">
                <span>
                  {role === 'admin' ? 'Administrador' : role === 'subadmin' ? 'Subadministrador' : 'Cliente'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="subadmin">Subadministrador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'admin'
                ? 'Acceso completo a todos los proyectos y tareas'
                : role === 'subadmin'
                ? 'Permisos de admin en sus proyectos asignados, sin gestión de usuarios'
                : 'Solo puede ver proyectos asignados'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
