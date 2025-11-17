# 📝 Changelog - Integración de Supabase

Este archivo documenta todos los cambios realizados en la integración de Supabase.

---

## [PASO 1] - Configuración Inicial de Supabase - 2025-01-16

### ✅ Archivos Creados

#### Migraciones SQL
- **`supabase/migrations/001_initial_schema.sql`**
  - Esquema completo de la base de datos
  - Tablas: `profiles`, `projects`, `project_assignments`, `tasks`, `comments`
  - Enums: `user_role`, `task_status`, `task_label`
  - Row Level Security (RLS) con políticas completas
  - Triggers automáticos para `updated_at`
  - Trigger para crear perfil automáticamente al registrar usuario

#### Datos de Prueba
- **`supabase/seed.sql`**
  - Script para crear datos de ejemplo
  - 3 proyectos de muestra
  - 5 tareas de ejemplo
  - Asignaciones de clientes a proyectos
  - Comentarios de ejemplo

#### Configuración
- **`.env.local.example`**
  - Template de variables de entorno
  - Instrucciones para obtener credenciales

#### Cliente Supabase
- **`src/lib/supabase.ts`**
  - Cliente de Supabase configurado
  - Validación de variables de entorno
  - Configuración de autenticación persistente
  - Exports de tipos para usar en la app

- **`src/lib/supabase-types.ts`**
  - Tipos TypeScript generados para la base de datos
  - Interfaces completas para todas las tablas
  - Tipos para Insert/Update/Row de cada tabla

#### Documentación
- **`SUPABASE_SETUP.md`**
  - Guía completa paso a paso
  - Instrucciones para crear proyecto en Supabase
  - Cómo ejecutar migraciones
  - Cómo crear usuario admin
  - Troubleshooting común

- **`CHANGELOG_SUPABASE.md`** (este archivo)
  - Registro de todos los cambios

### 📦 Dependencias Instaladas

```json
{
  "@supabase/supabase-js": "^2.39.3"
}
```

### 🗄️ Esquema de Base de Datos

#### Tablas Creadas

**profiles**
- Extiende `auth.users` de Supabase
- Campos: `id`, `email`, `full_name`, `role`, `created_at`, `updated_at`
- Roles: `admin` | `client`

**projects**
- Campos: `id`, `name`, `description`, `color`, `created_by`, timestamps
- Relación: Pertenece a un usuario admin (`created_by`)

**project_assignments**
- Asignación many-to-many entre usuarios y proyectos
- Campos: `id`, `project_id`, `user_id`, `assigned_by`, `assigned_at`
- Constraint único: Un usuario solo puede estar asignado una vez a un proyecto

**tasks**
- Campos: `id`, `title`, `description`, `status`, `label`, `project_id`, `start_date`, `end_date`, `subtasks`, `images`, `created_by`, timestamps
- Estados: `created`, `in_progress`, `paused`, `cancelled`, `completed`
- Etiquetas: `bug`, `implementacion`, `mejora`, `actualizacion`, `otro`
- Subtareas e imágenes almacenadas como JSONB

**comments**
- Campos: `id`, `task_id`, `user_id`, `text`, `created_at`
- Para futura implementación de comentarios en tareas

#### Row Level Security (RLS)

**Políticas para Admins:**
- ✅ Ver todos los perfiles, proyectos, tareas
- ✅ Crear usuarios, proyectos, tareas
- ✅ Actualizar y eliminar proyectos y tareas
- ✅ Crear y eliminar asignaciones de proyectos

**Políticas para Clientes:**
- ✅ Ver su propio perfil
- ✅ Ver solo proyectos asignados
- ✅ Ver tareas de proyectos asignados
- ✅ Crear tareas en proyectos asignados
- ❌ NO pueden actualizar/eliminar tareas
- ❌ NO pueden cambiar estados
- ❌ NO pueden ver proyectos no asignados

### 🔄 Próximos Pasos

- [ ] **Paso 2**: Implementar autenticación y vista de Login
- [ ] **Paso 3**: Implementar sistema de roles y permisos
- [ ] **Paso 4**: Migrar datos de IndexedDB a Supabase
- [ ] **Paso 5**: Crear vistas según rol
- [ ] **Paso 6**: Implementar protección de rutas
- [ ] **Paso 7**: Testing y documentación final

---

## [PASO 2] - Autenticación y Login - 2025-01-16

### ✅ Archivos Creados

#### Autenticación
- **`src/contexts/AuthContext.tsx`**
  - Context de autenticación con React Context API
  - Manejo de sesión persistente
  - Estados: user, profile, session, loading
  - Funciones: signIn, signOut
  - Helpers: isAdmin, isClient
  - Auto-carga de perfil al iniciar sesión
  - Listener de cambios de autenticación

- **`src/pages/Login.tsx`**
  - Formulario de login con email y password
  - Validaciones frontend
  - Manejo de errores amigables
  - Diseño responsive
  - Información de usuario de prueba (solo en desarrollo)

- **`src/components/ProtectedRoute.tsx`**
  - HOC para proteger rutas
  - Soporte para requireAdmin
  - Loader mientras verifica sesión
  - Mensaje de acceso denegado

#### Reorganización
- **`src/App.tsx`** (reemplazado)
  - Router principal
  - Muestra Login o Dashboard según autenticación
  - Loader de carga inicial

- **`src/pages/Dashboard.tsx`** (App.tsx movido)
  - Contenido principal de la aplicación
  - Todavía usa IndexedDB (se migrará en Paso 4)

### 🔄 Archivos Modificados

- **`src/main.tsx`**
  - Agregado `<AuthProvider>` envolviendo la app

- **`src/components/Layout.tsx`**
  - Agregado import de `useAuth`
  - Agregada sección de información de usuario
  - Agregado botón de logout con confirmación
  - Muestra nombre/email y rol del usuario

### 🔐 Flujo de Autenticación

```
1. Usuario accede → App.tsx
2. AuthProvider verifica sesión en localStorage
3. Si no hay sesión → Login.tsx
4. Usuario ingresa credenciales
5. signIn() → Supabase Auth
6. Si éxito:
   - Supabase guarda sesión en localStorage
   - AuthContext carga perfil desde tabla profiles
   - App.tsx renderiza Dashboard
7. Si error:
   - Muestra mensaje de error amigable
```

### 🎨 Características

**Login:**
- ✅ Formulario email + password
- ✅ Validaciones frontend
- ✅ Mensajes de error amigables
- ✅ Auto-focus en email
- ✅ Loader durante login
- ✅ Diseño moderno con gradiente
- ✅ Info de usuario de prueba (DEV)

**Logout:**
- ✅ Botón en sidebar
- ✅ Modal de confirmación
- ✅ Limpia sesión y redirige a login

**Protección:**
- ✅ Rutas protegidas automáticamente
- ✅ Loader mientras verifica sesión
- ✅ Acceso denegado para no admin (opcional)

### 🧪 Cómo Probar

1. Asegúrate que `.env.local` está configurado
2. Ejecuta `npm run dev`
3. Abre http://localhost:5173
4. Deberías ver la pantalla de Login
5. Inicia sesión con:
   - Email: `admin@minitasks.com`
   - Password: `Admin123!`
6. Deberías ver el Dashboard
7. Verifica que aparece tu nombre y rol en el sidebar
8. Prueba el botón de logout

### 📝 Tipos Exportados

```typescript
// Desde supabase.ts
export type Profile
export type Project
export type Task
export type ProjectAssignment
export type Comment
export type UserRole
export type TaskStatus
export type TaskLabel
```

### 🔄 Próximos Pasos

- [ ] **Paso 3**: Implementar sistema de roles y permisos detallado
- [ ] **Paso 4**: Migrar de IndexedDB a Supabase
- [ ] **Paso 5**: Crear vistas según rol (Admin vs Cliente)
- [ ] **Paso 6**: Implementar protecci\ón de rutas por rol
- [ ] **Paso 7**: Testing y documentación final

---

## [PENDIENTE] - Paso 3: Sistema de Roles

Archivos a crear/modificar:
- Vista de gestión de usuarios (solo admin)
- Lógica de permisos según rol
- Restricciones en UI según rol

---
