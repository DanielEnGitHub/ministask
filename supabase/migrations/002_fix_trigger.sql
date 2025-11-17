-- =====================================================
-- FIX: Trigger de creación de perfil
-- =====================================================
-- Esta migración corrige el trigger para manejar mejor
-- la creación de usuarios desde el panel de Supabase
-- =====================================================

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recrear función mejorada con mejor manejo de errores
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_role user_role;
BEGIN
  -- Intentar obtener full_name del metadata, si no existe usar NULL
  BEGIN
    user_full_name := NEW.raw_user_meta_data->>'full_name';
  EXCEPTION WHEN OTHERS THEN
    user_full_name := NULL;
  END;

  -- Intentar obtener role del metadata, si no existe usar 'client' por defecto
  BEGIN
    user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client');
  EXCEPTION WHEN OTHERS THEN
    user_role := 'client';
  END;

  -- Insertar perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar error si ya existe

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error pero no fallar la creación del usuario
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 4. Crear perfiles para usuarios que ya existan en auth.users pero no tengan perfil
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'client')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FIN DEL FIX
-- =====================================================
