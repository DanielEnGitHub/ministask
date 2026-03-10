-- =====================================================
-- FIX: Permitir a admins actualizar perfiles de otros usuarios
-- =====================================================
-- El bug: la política "Users can update own profile" solo permite
-- que un usuario actualice su PROPIO perfil (auth.uid() = id).
-- Falta una política que permita al admin actualizar cualquier perfil.
-- =====================================================

-- Agregar política para que admins puedan actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
