/**
 * =====================================================
 * PROTECTED ROUTE
 * =====================================================
 * Componente para proteger rutas que requieren autenticación
 * Muestra un loader mientras verifica la sesión
 * =====================================================
 */

import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth()

  // Mostrar loader mientras carga
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, el AuthContext redirigirá al login
  if (!user || !profile) {
    return null
  }

  // Si requiere admin pero el usuario no es admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-red-700 dark:text-red-300">
              No tienes permisos para acceder a esta sección. Solo los administradores pueden ver este contenido.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
