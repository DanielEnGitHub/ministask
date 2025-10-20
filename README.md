# MiniTasks

Una aplicación web moderna de gestión de tareas construida con React, TypeScript y TailwindCSS.

## Características

- **Gestión completa de tareas**: Crea, edita y elimina tareas con título, descripción, subtareas, fechas y estados
- **Múltiples vistas**:
  - **Lista**: Vista simple con búsqueda y filtros por estado
  - **Kanban**: Vista tipo tablero con drag & drop entre estados
  - **Cronograma**: Vista de calendario mensual mostrando tareas por fecha
- **Estados de tareas**: Creado, En Proceso, Pausado, Cancelado, Finalizado
- **Subtareas**: Añade y gestiona subtareas con checkboxes
- **Rangos de fechas**: Asigna fechas de inicio y fin a las tareas
- **Persistencia local**: Todos los datos se guardan automáticamente en IndexedDB
- **Diseño responsive**: Funciona perfectamente en escritorio y móvil
- **Interfaz minimalista**: Diseño limpio con colores suaves y componentes de shadcn/ui

## Tecnologías

- **React 18** + **TypeScript**
- **Vite** para desarrollo rápido
- **TailwindCSS** para estilos
- **shadcn/ui** componentes UI
- **Dexie.js** para persistencia con IndexedDB
- **@hello-pangea/dnd** para drag & drop
- **date-fns** para manejo de fechas
- **lucide-react** para iconos

## Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## Uso

### Crear una tarea

1. Haz clic en el botón "Nueva Tarea" en la barra lateral
2. Completa el formulario con título (obligatorio) y otros campos opcionales
3. Añade subtareas si lo deseas
4. Haz clic en "Crear Tarea"

### Editar una tarea

- Haz clic en el ícono de editar (lápiz) en cualquier tarea
- Modifica los campos necesarios
- Guarda los cambios

### Cambiar estado (Vista Kanban)

- Arrastra y suelta las tarjetas entre las columnas de estados
- El estado se actualiza automáticamente

### Ver tareas en calendario

- Cambia a la vista "Cronograma" para ver las tareas organizadas por fecha
- Navega entre meses con los botones de navegación
- Las tareas sin fechas se muestran en la parte inferior

### Buscar y filtrar (Vista Lista)

- Usa la barra de búsqueda para buscar por título
- Filtra por estado usando el selector desplegable

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/              # Componentes base de shadcn/ui
│   ├── views/           # Vistas principales (Lista, Kanban, Calendario)
│   ├── Layout.tsx       # Layout principal con navegación
│   └── TaskModal.tsx    # Modal de crear/editar tareas
├── lib/
│   ├── db.ts           # Configuración de IndexedDB con Dexie
│   ├── types.ts        # Tipos TypeScript
│   └── utils.ts        # Utilidades
├── App.tsx             # Componente principal
└── main.tsx            # Punto de entrada
```

## Contadores de estado

La barra lateral muestra contadores en tiempo real de tareas por estado:
- Creados
- En Proceso
- Pausados
- Cancelados
- Finalizados

## Almacenamiento de datos

Todos los datos se almacenan localmente en IndexedDB del navegador. Esto significa:
- ✅ No se requiere conexión a internet
- ✅ Los datos persisten entre sesiones
- ✅ Privacidad total (los datos nunca salen de tu dispositivo)
- ⚠️ Los datos son específicos del navegador (no se sincronizan entre dispositivos)

## Licencia

MIT

---

Desarrollado con React + TypeScript + TailwindCSS
