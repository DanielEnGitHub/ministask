-- =====================================================
-- MINITASKS - SCHEMA INICIAL
-- =====================================================
-- Este archivo contiene el esquema completo de la base de datos
-- para la aplicación MiniTasks con autenticación y roles.
--
-- Estructura:
-- 1. Extensiones
-- 2. Enums
-- 3. Tablas
-- 4. Row Level Security (RLS)
-- 5. Funciones auxiliares
-- 6. Triggers
-- =====================================================

-- =====================================================
-- 1. EXTENSIONES
-- =====================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. ENUMS
-- =====================================================

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'client');

-- Estados de tareas
CREATE TYPE task_status AS ENUM ('created', 'in_progress', 'paused', 'cancelled', 'completed');

-- Etiquetas de tareas
CREATE TYPE task_label AS ENUM ('bug', 'implementacion', 'mejora', 'actualizacion', 'otro');

-- =====================================================
-- 3. TABLAS
-- =====================================================

-- -----------------------------------------------------
-- Tabla: profiles
-- Extiende la tabla auth.users de Supabase
-- -----------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Comentarios
COMMENT ON TABLE profiles IS 'Perfiles de usuario extendidos con rol y metadata';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario: admin (acceso total) o client (solo proyectos asignados)';

-- -----------------------------------------------------
-- Tabla: projects
-- Proyectos que contienen tareas
-- -----------------------------------------------------
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  CONSTRAINT projects_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Índices para projects
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Comentarios
COMMENT ON TABLE projects IS 'Proyectos de la aplicación';
COMMENT ON COLUMN projects.created_by IS 'Usuario admin que creó el proyecto';

-- -----------------------------------------------------
-- Tabla: project_assignments
-- Asignación de clientes a proyectos
-- -----------------------------------------------------
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un cliente solo puede estar asignado una vez a un proyecto
  CONSTRAINT unique_project_user UNIQUE(project_id, user_id)
);

-- Índices para project_assignments
CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_project_assignments_assigned_by ON project_assignments(assigned_by);

-- Comentarios
COMMENT ON TABLE project_assignments IS 'Asignación de usuarios clientes a proyectos específicos';
COMMENT ON COLUMN project_assignments.user_id IS 'Usuario cliente asignado al proyecto';
COMMENT ON COLUMN project_assignments.assigned_by IS 'Usuario admin que hizo la asignación';

-- -----------------------------------------------------
-- Tabla: tasks
-- Tareas dentro de proyectos
-- -----------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'created',
  label task_label,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  subtasks JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tasks_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 500),
  CONSTRAINT tasks_dates_order CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- Índices para tasks
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_label ON tasks(label);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);

-- Comentarios
COMMENT ON TABLE tasks IS 'Tareas asociadas a proyectos';
COMMENT ON COLUMN tasks.subtasks IS 'Array JSON de subtareas: [{"id": "...", "text": "...", "completed": bool}]';
COMMENT ON COLUMN tasks.images IS 'Array JSON de imágenes en base64 o URLs';
COMMENT ON COLUMN tasks.created_by IS 'Usuario que creó la tarea (puede ser admin o client)';

-- -----------------------------------------------------
-- Tabla: comments
-- Comentarios en tareas (para futuro uso)
-- -----------------------------------------------------
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT comments_text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 2000)
);

-- Índices para comments
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- RLS Policies: profiles
-- -----------------------------------------------------

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden crear perfiles (nuevos usuarios)
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden actualizar perfiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden actualizar su propio perfil (solo nombre)
CREATE POLICY "Users can update own name"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------
-- RLS Policies: projects
-- -----------------------------------------------------

-- Los admins pueden ver todos los proyectos
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los clientes solo pueden ver proyectos asignados
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
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden actualizar proyectos
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden eliminar proyectos
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- RLS Policies: project_assignments
-- -----------------------------------------------------

-- Los admins pueden ver todas las asignaciones
CREATE POLICY "Admins can view all assignments"
  ON project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los clientes pueden ver sus propias asignaciones
CREATE POLICY "Clients can view own assignments"
  ON project_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Solo admins pueden crear asignaciones
CREATE POLICY "Admins can create assignments"
  ON project_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden eliminar asignaciones
CREATE POLICY "Admins can delete assignments"
  ON project_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- RLS Policies: tasks
-- -----------------------------------------------------

-- Los admins pueden ver todas las tareas
CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los clientes solo pueden ver tareas de proyectos asignados
CREATE POLICY "Clients can view tasks from assigned projects"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = tasks.project_id AND user_id = auth.uid()
    )
  );

-- Los admins pueden crear tareas en cualquier proyecto
CREATE POLICY "Admins can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los clientes pueden crear tareas solo en proyectos asignados
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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden eliminar tareas
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- RLS Policies: comments
-- -----------------------------------------------------

-- Todos pueden ver comentarios de tareas que pueden ver
CREATE POLICY "Users can view comments on accessible tasks"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = comments.task_id
    )
  );

-- Todos pueden crear comentarios en tareas accesibles
CREATE POLICY "Users can create comments on accessible tasks"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = comments.task_id
    )
  );

-- Los usuarios solo pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 5. FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at en profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Crear perfil automáticamente al registrar usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FIN DEL SCHEMA INICIAL
-- =====================================================
