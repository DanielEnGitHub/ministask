/**
 * =====================================================
 * APP - ROUTER PRINCIPAL
 * =====================================================
 * Maneja la autenticación y muestra Login o Dashboard
 * según el estado del usuario
 * =====================================================
 */

import { useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()

  // Mostrar loader mientras verifica la sesión
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

  // Si no hay usuario, mostrar Login
  if (!user) {
    return <Login />
  }

  // Si hay usuario, mostrar Dashboard
  return <Dashboard />
}

export default App
