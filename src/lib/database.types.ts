/**
 * Tipos de Supabase generados
 * Este archivo previene errores de tipos en desarrollo
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
      [_ in any]: any
    }
    Views: {
      [_ in any]: any
    }
    Functions: {
      [_ in any]: any
    }
    Enums: {
      [_ in any]: any
    }
    CompositeTypes: {
      [_ in any]: any
    }
  }
}
