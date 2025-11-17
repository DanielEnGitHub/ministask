-- =====================================================
-- MINITASKS - DATOS DE PRUEBA (SEED)
-- =====================================================
-- Este archivo contiene datos de ejemplo para probar la aplicación
-- =====================================================

-- IMPORTANTE: Estos usuarios deben crearse primero desde el panel de Supabase
-- o usando la API de autenticación. Aquí solo insertamos los profiles.

-- =====================================================
-- NOTA: CREAR USUARIOS MANUALMENTE
-- =====================================================
-- Antes de ejecutar este seed, crea estos usuarios en Supabase Dashboard:
--
-- 1. Usuario Admin:
--    Email: admin@minitasks.com
--    Password: Admin123!
--
-- 2. Usuario Cliente 1:
--    Email: cliente1@example.com
--    Password: Cliente123!
--
-- 3. Usuario Cliente 2:
--    Email: cliente2@example.com
--    Password: Cliente123!
--
-- Después de crearlos, copia sus UUIDs y reemplaza en este archivo
-- =====================================================

-- REEMPLAZAR ESTOS UUIDs CON LOS REALES DE TU PROYECTO
-- Puedes obtenerlos desde: Authentication > Users en el dashboard de Supabase

-- =====================================================
-- 1. PERFILES (PROFILES)
-- =====================================================
-- Estos se crearán automáticamente con el trigger on_auth_user_created
-- pero puedes actualizarlos aquí si es necesario

-- Actualizar rol del admin (si ya existe el usuario)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@minitasks.com';

-- =====================================================
-- 2. PROYECTOS DE EJEMPLO
-- =====================================================

-- Obtener el ID del usuario admin
DO $$
DECLARE
  admin_id UUID;
  client1_id UUID;
  client2_id UUID;
  project1_id UUID;
  project2_id UUID;
  project3_id UUID;
  task1_id UUID;
  task2_id UUID;
  task3_id UUID;
BEGIN
  -- Obtener IDs de usuarios (asumiendo que ya existen)
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@minitasks.com' LIMIT 1;
  SELECT id INTO client1_id FROM profiles WHERE email = 'cliente1@example.com' LIMIT 1;
  SELECT id INTO client2_id FROM profiles WHERE email = 'cliente2@example.com' LIMIT 1;

  -- Verificar que el admin existe
  IF admin_id IS NULL THEN
    RAISE NOTICE 'ADVERTENCIA: No se encontró el usuario admin. Crea primero el usuario admin@minitasks.com en Supabase Auth.';
    RETURN;
  END IF;

  -- Crear proyectos
  INSERT INTO projects (id, name, description, color, created_by)
  VALUES
    (uuid_generate_v4(), 'Desarrollo Web', 'Proyecto de desarrollo de aplicación web', '#3B82F6', admin_id)
    RETURNING id INTO project1_id;

  INSERT INTO projects (id, name, description, color, created_by)
  VALUES
    (uuid_generate_v4(), 'Diseño UI/UX', 'Rediseño de interfaz de usuario', '#10B981', admin_id)
    RETURNING id INTO project2_id;

  INSERT INTO projects (id, name, description, color, created_by)
  VALUES
    (uuid_generate_v4(), 'Marketing Digital', 'Campaña de marketing en redes sociales', '#F59E0B', admin_id)
    RETURNING id INTO project3_id;

  RAISE NOTICE 'Proyectos creados: %, %, %', project1_id, project2_id, project3_id;

  -- Asignar clientes a proyectos (solo si existen los clientes)
  IF client1_id IS NOT NULL THEN
    INSERT INTO project_assignments (project_id, user_id, assigned_by)
    VALUES
      (project1_id, client1_id, admin_id),
      (project2_id, client1_id, admin_id);

    RAISE NOTICE 'Cliente 1 asignado a proyectos 1 y 2';
  END IF;

  IF client2_id IS NOT NULL THEN
    INSERT INTO project_assignments (project_id, user_id, assigned_by)
    VALUES
      (project2_id, client2_id, admin_id),
      (project3_id, client2_id, admin_id);

    RAISE NOTICE 'Cliente 2 asignado a proyectos 2 y 3';
  END IF;

  -- Crear tareas de ejemplo
  INSERT INTO tasks (id, title, description, status, label, project_id, created_by)
  VALUES
    (
      uuid_generate_v4(),
      'Configurar entorno de desarrollo',
      'Instalar Node.js, npm y configurar variables de entorno',
      'completed',
      'implementacion',
      project1_id,
      admin_id
    )
    RETURNING id INTO task1_id;

  INSERT INTO tasks (id, title, description, status, label, project_id, start_date, end_date, created_by, subtasks)
  VALUES
    (
      uuid_generate_v4(),
      'Diseñar componentes principales',
      'Crear mockups de los componentes principales de la aplicación',
      'in_progress',
      'mejora',
      project1_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '7 days',
      admin_id,
      '[
        {"id": "1", "text": "Componente de Header", "completed": true},
        {"id": "2", "text": "Componente de Sidebar", "completed": true},
        {"id": "3", "text": "Componente de Task Card", "completed": false}
      ]'::jsonb
    )
    RETURNING id INTO task2_id;

  INSERT INTO tasks (id, title, description, status, label, project_id, start_date, created_by)
  VALUES
    (
      uuid_generate_v4(),
      'Corregir bug en formulario de login',
      'El formulario no valida correctamente el email',
      'created',
      'bug',
      project1_id,
      CURRENT_DATE + INTERVAL '1 day',
      admin_id
    )
    RETURNING id INTO task3_id;

  INSERT INTO tasks (id, title, description, status, label, project_id, created_by)
  VALUES
    (
      uuid_generate_v4(),
      'Crear paleta de colores',
      'Definir colores primarios, secundarios y de estado',
      'in_progress',
      'implementacion',
      project2_id,
      admin_id
    );

  INSERT INTO tasks (id, title, description, status, label, project_id, created_by)
  VALUES
    (
      uuid_generate_v4(),
      'Configurar Google Analytics',
      'Integrar Google Analytics 4 en el sitio web',
      'created',
      'actualizacion',
      project3_id,
      admin_id
    );

  RAISE NOTICE 'Tareas de ejemplo creadas';

  -- Crear algunos comentarios de ejemplo
  IF task1_id IS NOT NULL THEN
    INSERT INTO comments (task_id, user_id, text)
    VALUES
      (task1_id, admin_id, 'Tarea completada sin problemas'),
      (task1_id, admin_id, 'Documentación actualizada en el README');
  END IF;

  IF task2_id IS NOT NULL THEN
    INSERT INTO comments (task_id, user_id, text)
    VALUES
      (task2_id, admin_id, 'Los componentes Header y Sidebar ya están listos'),
      (task2_id, admin_id, 'Falta revisar la Task Card con el equipo de diseño');
  END IF;

  RAISE NOTICE 'Comentarios de ejemplo creados';
  RAISE NOTICE 'Seed completado exitosamente!';

END $$;

-- =====================================================
-- FIN DEL SEED
-- =====================================================
