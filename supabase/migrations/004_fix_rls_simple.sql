-- =====================================================
-- FIX: Políticas RLS SIMPLIFICADAS (Sin funciones auth)
-- =====================================================
-- Esta versión NO requiere crear funciones en schema auth
-- Usa una tabla auxiliar para verificar roles
-- =====================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own name" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Clients can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

DROP POLICY IF EXISTS "Admins can view all assignments" ON project_assignments;
DROP POLICY IF EXISTS "Clients can view own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON project_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON project_assignments;

DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Clients can view tasks from assigned projects" ON tasks;
DROP POLICY IF EXISTS "Admins can create tasks" ON tasks;
DROP POLICY IF EXISTS "Clients can create tasks in assigned projects" ON tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON comments;
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- =====================================================
-- 2. POLÍTICAS SIMPLIFICADAS (Sin recursión)
-- =====================================================

-- -----------------------------------------------------
-- Políticas: profiles (PERMISIVAS - Sin recursión)
-- -----------------------------------------------------

-- Todos pueden ver todos los perfiles (necesario para evitar recursión)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Todos pueden insertar perfiles (el trigger maneja la creación)
CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------
-- Políticas: projects
-- -----------------------------------------------------

-- Todos los usuarios autenticados pueden ver proyectos
-- (Frontend filtrará según el rol)
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- Solo crear proyectos si eres admin (verificamos en el perfil)
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo actualizar proyectos si eres admin
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo eliminar proyectos si eres admin
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- -----------------------------------------------------
-- Políticas: project_assignments
-- -----------------------------------------------------

-- Todos pueden ver asignaciones
CREATE POLICY "Authenticated users can view assignments"
  ON project_assignments FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins pueden crear asignaciones
CREATE POLICY "Admins can create assignments"
  ON project_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo admins pueden eliminar asignaciones
CREATE POLICY "Admins can delete assignments"
  ON project_assignments FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- -----------------------------------------------------
-- Políticas: tasks
-- -----------------------------------------------------

-- Todos pueden ver todas las tareas
-- (Frontend filtrará según asignaciones)
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Admins y clientes pueden crear tareas
CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo admins pueden actualizar tareas
CREATE POLICY "Admins can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo admins pueden eliminar tareas
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- -----------------------------------------------------
-- Políticas: comments
-- -----------------------------------------------------

-- Todos pueden ver comentarios
CREATE POLICY "Authenticated users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

-- Todos pueden crear comentarios
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 3. ACTUALIZAR METADATA DE USUARIOS EXISTENTES
-- =====================================================

-- Sincronizar rol de profiles a user_metadata
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', (SELECT role::text FROM profiles WHERE id = user_record.id))
    WHERE id = user_record.id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = user_record.id);
  END LOOP;
END $$;

-- =====================================================
-- FIN
-- =====================================================

-- Verificar que todo está bien
SELECT 'Políticas actualizadas correctamente' as status;
