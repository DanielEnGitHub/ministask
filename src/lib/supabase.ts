/**
 * =====================================================
 * SUPABASE CLIENT
 * =====================================================
 * Cliente de Supabase configurado para la aplicación
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

// Validar que las variables de entorno estén configuradas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Falta la variable de entorno VITE_SUPABASE_URL. ' +
    'Asegúrate de crear un archivo .env.local con las credenciales de Supabase.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta la variable de entorno VITE_SUPABASE_ANON_KEY. ' +
    'Asegúrate de crear un archivo .env.local con las credenciales de Supabase.'
  )
}

/**
 * Cliente de Supabase con tipos generados
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
})

/**
 * Tipos exportados para usar en la aplicación
 */
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type ProjectAssignment = Database['public']['Tables']['project_assignments']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type TaskStatus = Database['public']['Enums']['task_status']
export type TaskLabel = Database['public']['Enums']['task_label']
