# Cómo Aplicar Migraciones a Supabase

## Opción 1: Dashboard de Supabase (Recomendado - Más Rápido)

1. **Abre el SQL Editor de Supabase**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto
   - En el menú lateral, haz clic en **SQL Editor**

2. **Copia y pega la migración**
   - Abre el archivo: `supabase/migrations/005_allow_client_task_updates.sql`
   - Copia todo el contenido del archivo
   - Pégalo en el SQL Editor

3. **Ejecuta la migración**
   - Haz clic en el botón **Run** (esquina inferior derecha)
   - Deberías ver un mensaje: "Políticas de actualización de tareas actualizadas correctamente"

4. **Verifica que se aplicó correctamente**
   - Ve a **Database** → **Policies**
   - Busca la tabla `tasks`
   - Deberías ver dos políticas de UPDATE:
     - ✅ "Admins can update tasks"
     - ✅ "Clients can update assigned tasks"

---

## Opción 2: Supabase CLI (Opcional)

### Instalar Supabase CLI

```bash
npm install -g supabase
```

### Vincular tu proyecto

```bash
cd /home/daniel/Documents/Projects/minitasks
supabase link --project-ref YOUR_PROJECT_REF
```

### Aplicar migraciones

```bash
supabase db push
```

---

## ✅ Verificación

Después de aplicar la migración, los clientes podrán:

1. ✅ **Editar tareas** de proyectos asignados (título, descripción, fechas, imágenes, subtareas)
2. ✅ **Cambiar estado** solo de "En Revisión" (paused) a:
   - "Finalizado" (completed)
   - "Cancelado" (cancelled)
3. ❌ **NO podrán** cambiar el estado si la tarea no está en revisión
4. ❌ **NO podrán** cambiar a otros estados (created, in_progress, etc.)

---

## 🔍 Solución de Problemas

Si después de aplicar la migración sigues viendo errores de permisos:

1. **Verifica que la migración se aplicó**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tasks' AND policyname LIKE '%Client%';
   ```

2. **Verifica tu rol**:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'tu-email@example.com';
   ```

3. **Verifica las asignaciones de proyecto**:
   ```sql
   SELECT * FROM project_assignments WHERE user_id = auth.uid();
   ```
