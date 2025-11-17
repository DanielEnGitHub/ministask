-- =====================================================
-- FIX: Políticas RLS con recursión infinita
-- =====================================================
-- Este archivo corrige las políticas que causan recursión
-- infinita en la tabla profiles
-- =====================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own name" ON profiles;

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
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- =====================================================
-- 2. FUNCIONES AUXILIARES PARA EVITAR RECURSIÓN
-- =====================================================

-- Función para obtener el rol del usuario actual SIN consultar profiles
-- Usamos auth.jwt() que lee directamente del token JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    (SELECT role::text FROM profiles WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. NUEVAS POLÍTICAS SIN RECURSIÓN
-- =====================================================

-- -----------------------------------------------------
-- Políticas: profiles
-- -----------------------------------------------------

-- Todos pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.is_admin());

-- Admins pueden insertar perfiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.is_admin());

-- Admins pueden actualizar perfiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (auth.is_admin());

-- Los usuarios pueden actualizar su propio perfil (solo full_name)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (OLD.role = NEW.role) -- No pueden cambiar su propio rol
  );

-- -----------------------------------------------------
-- Políticas: projects
-- -----------------------------------------------------

-- Admins ven todos los proyectos
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (auth.is_admin());

-- Clientes solo ven proyectos asignados
CREATE POLICY "Clients can view assigned projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

-- Solo admins pueden crear proyectos
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.is_admin());

-- Solo admins pueden actualizar proyectos
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (auth.is_admin());

-- Solo admins pueden eliminar proyectos
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (auth.is_admin());

-- -----------------------------------------------------
-- Políticas: project_assignments
-- -----------------------------------------------------

-- Admins ven todas las asignaciones
CREATE POLICY "Admins can view all assignments"
  ON project_assignments FOR SELECT
  USING (auth.is_admin());

-- Clientes ven sus propias asignaciones
CREATE POLICY "Clients can view own assignments"
  ON project_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Solo admins pueden crear asignaciones
CREATE POLICY "Admins can create assignments"
  ON project_assignments FOR INSERT
  WITH CHECK (auth.is_admin());

-- Solo admins pueden eliminar asignaciones
CREATE POLICY "Admins can delete assignments"
  ON project_assignments FOR DELETE
  USING (auth.is_admin());

-- -----------------------------------------------------
-- Políticas: tasks
-- -----------------------------------------------------

-- Admins ven todas las tareas
CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  USING (auth.is_admin());

-- Clientes solo ven tareas de proyectos asignados
CREATE POLICY "Clients can view tasks from assigned projects"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = tasks.project_id AND user_id = auth.uid()
    )
  );

-- Admins pueden crear tareas
CREATE POLICY "Admins can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.is_admin());

-- Clientes pueden crear tareas solo en proyectos asignados
CREATE POLICY "Clients can create tasks in assigned projects"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = tasks.project_id AND user_id = auth.uid()
    )
  );

-- Solo admins pueden actualizar tareas
CREATE POLICY "Admins can update tasks"
  ON tasks FOR UPDATE
  USING (auth.is_admin());

-- Solo admins pueden eliminar tareas
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  USING (auth.is_admin());

-- -----------------------------------------------------
-- Políticas: comments
-- -----------------------------------------------------

-- Usuarios ven comentarios de tareas accesibles
CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = comments.task_id
    )
  );

-- Usuarios pueden crear comentarios
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = comments.task_id
    )
  );

-- Usuarios solo pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 4. ACTUALIZAR TRIGGER DE CREACIÓN DE USUARIO
-- =====================================================

-- Reemplazar la función para que almacene el rol en user_metadata
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_role user_role;
BEGIN
  -- Obtener valores del metadata
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client');

  -- Insertar perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, user_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 5. ACTUALIZAR ROL EN USER_METADATA
-- =====================================================

-- Actualizar el metadata de usuarios existentes para que tengan el rol
UPDATE auth.users
SET raw_user_meta_data =
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb((SELECT role::text FROM profiles WHERE profiles.id = auth.users.id))
  )
WHERE EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id);

-- =====================================================
-- FIN DEL FIX
-- =====================================================
