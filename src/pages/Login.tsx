/**
 * =====================================================
 * LOGIN PAGE
 * =====================================================
 * Página de inicio de sesión con formulario de email/password
 * =====================================================
 */

import { useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderKanban, AlertCircle, Loader2 } from 'lucide-react'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validaciones básicas
    if (!email || !password) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido')
      setLoading(false)
      return
    }

    // Intentar login
    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      console.error('Login error:', signInError)

      // Mensajes de error más amigables
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos')
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('Por favor confirma tu email antes de iniciar sesión')
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <FolderKanban className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MiniTasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                className="w-full"
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full"
                autoComplete="current-password"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Información de prueba (solo en desarrollo) */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Usuario de prueba:
              </p>
              <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
                <p>Email: admin@minitasks.com</p>
                <p>Password: Admin123!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          MiniTasks © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
