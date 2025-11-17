# 🚨 FIX RÁPIDO - Políticas RLS Simplificadas

## ❌ Problema:
El error anterior (`permission denied for schema auth`) sucedió porque intentábamos crear funciones en el schema `auth`, lo cual no está permitido desde el SQL Editor.

## ✅ SOLUCIÓN SIMPLE:

### **PASO 1: Ejecutar nueva migración**

1. Ve a Supabase → **SQL Editor** → **New query**
2. Abre el archivo: **`supabase/migrations/004_fix_rls_simple.sql`**
3. **Copia TODO** el contenido (desde línea 1 hasta el final)
4. **Pega** en el editor SQL
5. Click **"Run"** ▶️

**Debe mostrar:**
```
status
Políticas actualizadas correctamente
```

---

### **PASO 2: Verificar que el admin existe y tiene rol correcto**

Ejecuta esto en SQL Editor:

```sql
-- Ver admin
SELECT
  u.id,
  u.email,
  p.role,
  u.raw_user_meta_data->>'role' as metadata_role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@minitasks.com';
```

**Si NO aparece nada o role es NULL:**

```sql
-- Crear perfil si no existe
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@minitasks.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Actualizar metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'admin@minitasks.com';
```

---

### **PASO 3: Verificar resultado**

Ejecuta de nuevo:

```sql
SELECT
  u.email,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@minitasks.com';
```

**Debe mostrar:**
```
email               | profile_role | metadata_role
admin@minitasks.com | admin        | admin
```

---

### **PASO 4: Limpiar localStorage y probar**

En el navegador (F12 → Console):

```javascript
localStorage.clear()
location.reload()
```

Luego:
1. Login con `admin@minitasks.com` / `Admin123!`
2. Deberías ver el Dashboard
3. Deberías ver tu email y "Administrador" en el sidebar

---

## 🧪 Verificación Final:

En la consola del navegador (F12):

```javascript
const verify = async () => {
  const { data: { user } } = await window.supabase.auth.getUser()
  console.log('User:', user?.email)

  const { data: profile, error } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('Profile:', profile)
  console.log('Error:', error)
  console.log('✅ Success?', profile?.role === 'admin' && error === null)
}
verify()
```

**Debe mostrar:**
```
User: admin@minitasks.com
Profile: {id: "...", email: "admin@minitasks.com", role: "admin", ...}
Error: null
✅ Success? true
```

---

## 📝 ¿Qué cambió?

**Antes:** Políticas complejas que intentaban leer de `profiles` dentro de las mismas políticas de `profiles` → recursión infinita

**Ahora:** Políticas simplificadas que:
- Permiten ver todos los perfiles (evita recursión)
- Verifican rol SOLO cuando es necesario (crear/editar/eliminar)
- Confían en el frontend para filtrar datos según rol

---

**🚀 Ejecuta los 4 pasos y dime si ahora funciona.**

Si sigue habiendo error, comparte:
1. Resultado del PASO 2 (query de verificación)
2. Error exacto que aparece
