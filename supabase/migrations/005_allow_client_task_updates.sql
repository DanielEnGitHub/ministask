-- =====================================================
-- MIGRACIÓN: Permitir a clientes actualizar tareas
-- =====================================================
-- Esta migración permite que los clientes puedan:
-- 1. Editar tareas de proyectos asignados
-- 2. Cambiar estado solo de 'paused' a 'completed' o 'cancelled'
-- =====================================================

-- 1. ELIMINAR POLÍTICA RESTRICTIVA ACTUAL
DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;

-- =====================================================
-- 2. CREAR FUNCIÓN AUXILIAR PARA VALIDAR CAMBIO DE ESTADO
-- =====================================================

-- Función que verifica si un cliente puede actualizar el estado de una tarea
CREATE OR REPLACE FUNCTION can_client_update_task_status(
  task_id UUID,
  new_status task_status
)
RETURNS BOOLEAN AS $$
DECLARE
  current_status task_status;
BEGIN
  -- Obtener el estado actual de la tarea
  SELECT status INTO current_status
  FROM tasks
  WHERE id = task_id;

  -- Si el estado no cambia, permitir
  IF current_status = new_status THEN
    RETURN TRUE;
  END IF;

  -- Si cambia, debe ser de 'paused' a 'completed' o 'cancelled'
  IF current_status = 'paused' AND new_status IN ('completed', 'cancelled') THEN
    RETURN TRUE;
  END IF;

  -- Cualquier otro cambio no está permitido
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. NUEVAS POLÍTICAS DE ACTUALIZACIÓN
-- =====================================================

-- Admins pueden actualizar cualquier tarea sin restricciones
CREATE POLICY "Admins can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Clientes pueden actualizar tareas de proyectos asignados
-- con restricción en el campo 'status'
CREATE POLICY "Clients can update assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    -- El cliente debe estar asignado al proyecto de la tarea
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'client'
    AND EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = tasks.project_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Verificar que el usuario sigue asignado al proyecto
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = tasks.project_id AND user_id = auth.uid()
    )
    AND
    -- Verificar que el cambio de estado es válido
    can_client_update_task_status(id, status)
  );

-- =====================================================
-- 4. VERIFICACIÓN
-- =====================================================

SELECT 'Políticas de actualización de tareas actualizadas correctamente' as status;
