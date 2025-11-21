/**
 * =====================================================
 * AUTH CONTEXT
 * =====================================================
 * Contexto de autenticación que provee:
 * - Usuario actual y su perfil
 * - Estado de carga
 * - Funciones de login/logout
 * - Verificación de rol
 * =====================================================
 */

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, type Profile } from '@/lib/supabase'

interface AuthContextType {
  // Estado
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean

  // Acciones
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>

  // Helpers
  isAdmin: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar perfil: usa user_metadata inmediatamente y actualiza desde DB en background
  const loadProfile = async (userId: string, userFromSession: User): Promise<Profile | null> => {
    console.log('[loadProfile] Starting for user:', userId)

    // 1. Construir perfil desde user_metadata INMEDIATAMENTE (siempre disponible)
    let profileFromMetadata: Profile | null = null
    if (userFromSession?.user_metadata?.role) {
      profileFromMetadata = {
        id: userId,
        email: userFromSession.email || '',
        full_name: userFromSession.user_metadata.full_name || null,
        role: userFromSession.user_metadata.role,
        created_at: userFromSession.created_at,
        updated_at: new Date().toISOString(),
      } as Profile
      console.log('[loadProfile] Profile from user_metadata:', profileFromMetadata)
    }

    // 2. Intentar cargar desde DB en background (sin bloquear)
    // Si la DB responde, actualizaremos el perfil después
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          console.log('[loadProfile] DB loaded successfully, updating profile:', data)
          setProfile(data)
        } else {
          console.log('[loadProfile] DB query failed:', error)
        }
      })

    // 3. Retornar inmediatamente el perfil desde user_metadata
    return profileFromMetadata
  }

  // Inicializar sesión al cargar
  useEffect(() => {
    let mounted = true

    console.log('[AuthContext] Initializing...')

    // Obtener sesión actual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthContext] Got session:', session ? 'exists' : 'null')
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[AuthContext] Loading profile for user:', session.user.id)
        const profile = await loadProfile(session.user.id, session.user)
        console.log('[AuthContext] Profile loaded:', profile)
        if (mounted) {
          setProfile(profile)
        }
      }

      if (mounted) {
        console.log('[AuthContext] Setting loading to false')
        setLoading(false)
      }
    }).catch((error) => {
      console.error('[AuthContext] Failed to get session:', error)
      if (mounted) {
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] onAuthStateChange fired:', _event, session ? 'has session' : 'no session')
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[AuthContext] onAuthStateChange loading profile')
        const profile = await loadProfile(session.user.id, session.user)
        console.log('[AuthContext] onAuthStateChange profile loaded:', profile)
        if (mounted) {
          setProfile(profile)
        }
      } else {
        if (mounted) {
          setProfile(null)
        }
      }

      if (mounted) {
        console.log('[AuthContext] onAuthStateChange setting loading to false')
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: error as AuthError }
    }
  }

  // Logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'admin',
    isClient: profile?.role === 'client',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
