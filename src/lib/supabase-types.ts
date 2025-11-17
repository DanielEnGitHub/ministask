/**
 * =====================================================
 * SUPABASE DATABASE TYPES
 * =====================================================
 * Tipos TypeScript generados para la base de datos
 * =====================================================
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'client'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'client'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'client'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_assignments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          assigned_by: string
          assigned_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          assigned_by: string
          assigned_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          assigned_by?: string
          assigned_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'created' | 'in_progress' | 'paused' | 'cancelled' | 'completed'
          label: 'bug' | 'implementacion' | 'mejora' | 'actualizacion' | 'otro' | null
          project_id: string
          start_date: string | null
          end_date: string | null
          subtasks: Json
          images: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'created' | 'in_progress' | 'paused' | 'cancelled' | 'completed'
          label?: 'bug' | 'implementacion' | 'mejora' | 'actualizacion' | 'otro' | null
          project_id: string
          start_date?: string | null
          end_date?: string | null
          subtasks?: Json
          images?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'created' | 'in_progress' | 'paused' | 'cancelled' | 'completed'
          label?: 'bug' | 'implementacion' | 'mejora' | 'actualizacion' | 'otro' | null
          project_id?: string
          start_date?: string | null
          end_date?: string | null
          subtasks?: Json
          images?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          text?: string
          created_at?: string
        }
      }
    }
    Enums: {
      user_role: 'admin' | 'client'
      task_status: 'created' | 'in_progress' | 'paused' | 'cancelled' | 'completed'
      task_label: 'bug' | 'implementacion' | 'mejora' | 'actualizacion' | 'otro'
    }
  }
}
