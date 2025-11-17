# 🚀 Guía de Configuración de Supabase - MiniTasks

Esta guía te llevará paso a paso para configurar Supabase en el proyecto MiniTasks.

---

## 📋 Prerrequisitos

- Cuenta en [Supabase](https://app.supabase.com) (es gratis)
- Node.js instalado (versión 18 o superior)
- Las dependencias del proyecto instaladas (`npm install`)

---

## 🔧 Paso 1: Crear Proyecto en Supabase

### 1.1. Acceder a Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión o crea una cuenta nueva
3. Haz clic en **"New Project"**

### 1.2. Configurar el Proyecto

Completa los siguientes campos:

- **Name**: `MiniTasks` (o el nombre que prefieras)
- **Database Password**: Crea una contraseña segura y **guárdala** (la necesitarás después)
- **Region**: Elige la región más cercana (ej: South America - São Paulo)
- **Pricing Plan**: Selecciona **Free** (suficiente para desarrollo)

4. Haz clic en **"Create new project"**
5. Espera 1-2 minutos mientras Supabase crea tu proyecto

---

## 🗄️ Paso 2: Ejecutar las Migraciones SQL

### 2.1. Abrir el Editor SQL

1. En el panel lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**

### 2.2. Ejecutar el Schema Inicial

1. Abre el archivo `supabase/migrations/001_initial_schema.sql` de este proyecto
2. **Copia todo el contenido** del archivo
3. **Pega** el contenido en el editor SQL de Supabase
4. Haz clic en **"Run"** (botón inferior derecha)
5. Deberías ver el mensaje: **"Success. No rows returned"**

✅ **¡Listo!** Tu base de datos ya tiene todas las tablas creadas.

---

## 👤 Paso 3: Crear el Usuario Administrador

### 3.1. Configurar Email en Supabase

**IMPORTANTE**: Por defecto, Supabase requiere confirmación de email. Para desarrollo, vamos a deshabilitarlo:

1. Ve a **Authentication** → **Settings** (en el panel lateral)
2. Busca la sección **"Email Auth"**
3. **Desactiva** la opción: **"Enable email confirmations"**
4. Haz clic en **"Save"**

### 3.2. Crear el Usuario Admin

1. Ve a **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa los campos:
   - **Email**: `admin@minitasks.com`
   - **Password**: `Admin123!` (o una contraseña segura)
   - **Auto Confirm User**: ✅ **Activado**
4. Haz clic en **"Create user"**

### 3.3. Asignar Rol de Admin

1. Copia el **UUID** del usuario que acabas de crear (está en la columna "ID")
2. Ve a **SQL Editor** → **New query**
3. Ejecuta este SQL (reemplaza `USER_UUID_AQUI` con el UUID copiado):

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'e06c63c0-c1eb-4f27-8786-987e350554b9';
```

4. Verifica que se ejecutó correctamente:

```sql
SELECT email, role FROM profiles WHERE email = 'admin@minitasks.com';
```

Deberías ver: `admin@minitasks.com | admin`

---

## 🔑 Paso 4: Obtener Credenciales de API

### 4.1. Ir a la Configuración

1. En el panel lateral, haz clic en **⚙️ Project Settings**
2. Haz clic en **API**

### 4.2. Copiar las Credenciales

Necesitas copiar **2 valores**:

1. **Project URL**
   - Ejemplo: `https://abcdefghijk.supabase.co`

2. **anon/public key** (en la sección "Project API keys")
   - Es una clave larga que empieza con `eyJhbGciOi...`
   - **Esta es segura** para usar en el frontend

---

## ⚙️ Paso 5: Configurar Variables de Entorno

### 5.1. Crear el Archivo .env.local

1. En la raíz del proyecto, copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

2. Abre `.env.local` y completa con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**:
- **NO** compartas estas credenciales
- **NO** subas el archivo `.env.local` a Git (ya está en `.gitignore`)

---

## 🧪 Paso 6: Cargar Datos de Prueba (Opcional)

Si quieres datos de ejemplo para probar:

### 6.1. Crear Usuarios de Prueba

1. Ve a **Authentication** → **Users** → **"Add user"**
2. Crea estos 2 usuarios:

**Cliente 1:**
- Email: `cliente1@example.com`
- Password: `Cliente123!`
- Auto Confirm: ✅

**Cliente 2:**
- Email: `cliente2@example.com`
- Password: `Cliente123!`
- Auto Confirm: ✅

### 6.2. Ejecutar el Seed

1. Ve a **SQL Editor** → **New query**
2. Abre el archivo `supabase/seed.sql` de este proyecto
3. Copia todo el contenido y pégalo en el editor
4. Haz clic en **"Run"**

Esto creará:
- ✅ 3 proyectos de ejemplo
- ✅ 5 tareas de ejemplo
- ✅ Asignaciones de clientes a proyectos
- ✅ Algunos comentarios

---

## 🏃 Paso 7: Ejecutar la Aplicación

### 7.1. Instalar Dependencias (si no lo hiciste)

```bash
npm install
```

### 7.2. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

### 7.3. Probar el Login

1. Abre tu navegador en `http://localhost:5173`
2. Deberías ver la pantalla de Login
3. Inicia sesión con:
   - **Email**: `admin@minitasks.com`
   - **Password**: `Admin123!`

---

## ✅ Verificación Final

Ejecuta estas queries en **SQL Editor** para verificar que todo está bien:

```sql
-- Ver todos los perfiles
SELECT email, role FROM profiles;

-- Ver todos los proyectos
SELECT name, color FROM projects;

-- Ver todas las tareas
SELECT title, status, label FROM tasks;

-- Ver asignaciones
SELECT
  p.email as cliente,
  pr.name as proyecto
FROM project_assignments pa
JOIN profiles p ON p.id = pa.user_id
JOIN projects pr ON pr.id = pa.project_id;
```

---

## 🔒 Seguridad - Row Level Security (RLS)

Las políticas de seguridad ya están configuradas:

### Admins pueden:
- ✅ Ver todos los proyectos y tareas
- ✅ Crear, editar y eliminar proyectos
- ✅ Crear, editar y eliminar tareas
- ✅ Crear usuarios
- ✅ Asignar clientes a proyectos

### Clientes pueden:
- ✅ Ver solo proyectos asignados
- ✅ Ver tareas de proyectos asignados
- ✅ Crear tareas en proyectos asignados
- ❌ NO pueden editar/eliminar tareas
- ❌ NO pueden cambiar estados de tareas
- ❌ NO pueden ver otros proyectos

---

## 🐛 Troubleshooting

### Error: "Falta la variable de entorno VITE_SUPABASE_URL"

**Solución**:
1. Verifica que existe el archivo `.env.local` en la raíz
2. Verifica que las variables empiezan con `VITE_`
3. Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Invalid API key"

**Solución**:
1. Verifica que copiaste la **anon/public key** (no la service_role key)
2. Verifica que no hay espacios extra al copiar
3. La clave debe empezar con `eyJhbGciOi...`

### No puedo hacer login

**Solución**:
1. Verifica que el usuario existe en **Authentication** → **Users**
2. Verifica que el usuario está **confirmado** (columna "Confirmed At")
3. Verifica que existe un perfil en la tabla `profiles`:
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@minitasks.com';
   ```

### El admin no tiene permisos

**Solución**:
Ejecuta este SQL para asegurarte que el rol es 'admin':
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@minitasks.com';
```

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del navegador (F12 → Console)
2. Revisa los logs de Supabase (SQL Editor → Query History)
3. Verifica las políticas RLS en **Database** → **Policies**

---

**¡Listo! Tu aplicación MiniTasks ya está conectada con Supabase. 🎉**
