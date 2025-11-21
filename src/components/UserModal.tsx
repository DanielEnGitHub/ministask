import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
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
  onSave: (userData: { role: 'admin' | 'client' }) => void
  user: UserWithAssignments | null
  onUserCreated?: () => void
}

export function UserModal({ open, onClose, onSave, user, onUserCreated }: UserModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'client'>('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!user

  useEffect(() => {
    if (open) {
      if (user) {
        // Modo edición
        setEmail(user.email)
        setRole(user.role)
        setPassword('')
      } else {
        // Modo creación
        setEmail('')
        setPassword('')
        setRole('client')
      }
      setError(null)
    }
  }, [open, user])

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
          console.log('[UserModal] User created successfully:', authData.user.id)

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
              <p className="text-xs text-gray-500">El email no se puede modificar</p>
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
            <Select value={role} onValueChange={(value: 'admin' | 'client') => setRole(value)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {role === 'admin'
                ? 'Acceso completo a todos los proyectos y tareas'
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
