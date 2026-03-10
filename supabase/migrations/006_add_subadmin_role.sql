-- =====================================================
-- Migración 006: Agregar rol subadmin
-- =====================================================
-- Agrega el valor 'subadmin' al enum user_role
-- Subadmin tiene todos los permisos del admin en sus
-- proyectos asignados, pero NO puede gestionar usuarios
-- ni ver proyectos/sprints fuera de sus asignaciones.
-- =====================================================

-- Agregar valor al enum (PostgreSQL no permite IF NOT EXISTS en ALTER TYPE)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'subadmin';
