# 🔧 INSTRUCCIONES PARA ARREGLAR EL ERROR

## ❌ Problema Identificado:

**Error principal:** `infinite recursion detected in policy for relation "profiles"`

Las políticas RLS de Supabase tienen recursión infinita.

---

## ✅ SOLUCIÓN (Paso a Paso):

### 1. Ejecutar la migración SQL en Supabase

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Abre **SQL Editor**
3. Click en **"New query"**
4. Abre el archivo `supabase/migrations/003_fix_rls_policies.sql`
5. **Copia TODO el contenido** del archivo
6. **Pega** en el editor SQL de Supabase
7. Click en **"Run"** (botón inferior derecha)
8. Espera a que termine (debería decir "Success")

---

### 2. Actualizar el rol del admin en user_metadata

En el mismo SQL Editor, ejecuta esto (reemplaza el UUID con el de tu usuario):

```sql
-- Actualizar el metadata del admin
UPDATE auth.users
SET raw_user_meta_data =
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
WHERE email = 'admin@minitasks.com';

-- Verificar que se actualizó
SELECT
  email,
  raw_user_meta_data->>'role' as role_in_metadata,
  (SELECT role FROM profiles WHERE id = auth.users.id) as role_in_profiles
FROM auth.users
WHERE email = 'admin@minitasks.com';
```

Debe mostrar:
```
email               | role_in_metadata | role_in_profiles
admin@minitasks.com | admin            | admin
```

---

### 3. Limpiar localStorage del navegador

En la consola del navegador (F12):

```javascript
localStorage.clear()
location.reload()
```

---

### 4. Probar el login de nuevo

1. Ve a http://localhost:5173
2. Debería mostrar la página de Login (no el loader infinito)
3. Inicia sesión con:
   - Email: `admin@minitasks.com`
   - Password: `Admin123!`
4. **AHORA SÍ** deberías ver:
   - ✅ Tu nombre/email en el sidebar
   - ✅ "Administrador" debajo de tu nombre
   - ✅ Botón de logout (icono de salida)

---

## 🧪 Verificación

Después de hacer login, abre la consola (F12) y ejecuta:

```javascript
// Verificar que el perfil se carga
const checkProfile = async () => {
  const { data: { user } } = await window.supabase.auth.getUser()
  console.log('User:', user)

  if (user) {
    const { data: profile, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    console.log('Profile:', profile)
    console.log('Error:', error)
  }
}
checkProfile()
```

Debe mostrar:
```
User: { id: "...", email: "admin@minitasks.com", ... }
Profile: { id: "...", email: "admin@minitasks.com", role: "admin", full_name: null }
Error: null
```

**Si muestra `Error: null` y `Profile` con tus datos, ¡ESTÁ ARREGLADO! ✅**

---

## ❓ Si todavía hay problemas:

Comparte:
1. Output de la query de verificación (paso 2)
2. Output del checkProfile (paso de verificación)
3. Errores en consola del navegador (si hay)
