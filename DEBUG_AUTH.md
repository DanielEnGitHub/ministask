# 🔍 DEBUG - Problemas con visualización de usuario

## Síntomas reportados:
- ✅ Login funciona
- ❌ No se ve nombre/rol en sidebar
- ❌ No se ve botón de logout
- ❌ App se queda atascada

## Pasos para diagnosticar:

### 1. Abrir Consola del Navegador

**Chrome/Edge:**
- Presiona `F12` o `Ctrl + Shift + I` (Windows/Linux)
- Presiona `Cmd + Option + I` (Mac)
- Ve a la pestaña "Console"

**Firefox:**
- Presiona `F12`
- Ve a la pestaña "Consola"

### 2. Buscar errores

Busca mensajes en **ROJO** en la consola que digan:

```
Error: ...
Cannot read property ...
undefined is not an object ...
Failed to fetch ...
```

### 3. Verificar que el perfil se carga

En la consola, escribe esto y presiona Enter:

```javascript
localStorage.getItem('sb-' + window.location.hostname + '-auth-token')
```

**Si responde `null`:** La sesión no se guardó correctamente.

**Si responde con un texto largo:** La sesión existe.

### 4. Verificar variables de entorno

En la consola, escribe:

```javascript
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('SUPABASE_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

**Debe mostrar:**
```
SUPABASE_URL: https://tu-proyecto.supabase.co
SUPABASE_KEY exists: true
```

**Si muestra `undefined`:** Las variables de entorno no están cargadas.

### 5. Verificar el perfil del usuario

En la consola, escribe:

```javascript
// Esto solo funciona si estás logueado
const checkProfile = async () => {
  const { data: { user } } = await window.supabase.auth.getUser()
  console.log('User:', user)

  if (user) {
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    console.log('Profile:', profile)
  }
}
checkProfile()
```

**Debe mostrar:**
```
User: { id: "...", email: "admin@minitasks.com", ... }
Profile: { id: "...", email: "admin@minitasks.com", role: "admin", ... }
```

---

## Soluciones según el error:

### Error A: "VITE_SUPABASE_URL is undefined"

**Solución:**
```bash
# 1. Verifica que existe .env.local
ls -la .env.local

# 2. Verifica el contenido
cat .env.local

# 3. Debe contener:
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# 4. Reinicia el servidor
# Mata el proceso actual
lsof -ti:5173 | xargs kill -9

# Inicia de nuevo
npm run dev
```

### Error B: "Profile is null" pero User existe

**Solución:**
Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Verificar que el perfil existe
SELECT * FROM profiles WHERE email = 'admin@minitasks.com';

-- Si no existe, crearlo manualmente
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@minitasks.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Error C: "Network error" o "Failed to fetch"

**Solución:**
1. Verifica que tu proyecto en Supabase esté activo
2. Verifica que la URL en `.env.local` sea correcta
3. Verifica que no haya bloqueo de firewall

### Error D: App se queda "atascada" en loader

**Solución 1 - Limpiar cache del navegador:**
```
Chrome: Ctrl + Shift + Delete
Marca: "Cached images and files"
Click "Clear data"
```

**Solución 2 - Limpiar localStorage:**
En la consola del navegador:
```javascript
localStorage.clear()
location.reload()
```

---

## ¿Qué información necesito?

Por favor copia y pega:

1. **Errores de la consola del navegador** (si hay)
2. **Resultado de verificar variables de entorno**
3. **Resultado de verificar perfil**
4. **Contenido de .env.local** (oculta los valores sensibles):
   ```
   VITE_SUPABASE_URL=https://XXXXX.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJXXXXX...
   ```

Con esta información podré ayudarte a resolver el problema exactamente. 🎯
