# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiniTasks is a modern task management web application built with React 18, TypeScript, and TailwindCSS. The app is entirely client-side with local-first data persistence using IndexedDB via Dexie.js.

**Key Features**:
- **Projects**: Organize tasks into projects (optional)
- **Sprints**: Create time-boxed sprints within projects
- **Recurring Tasks**: Tasks that repeat daily/weekly/monthly on specific days
- **Multiple Views**: List, Kanban (drag & drop), and Calendar views
- **Smart Filtering**: When a project is selected, all views automatically filter tasks

**Language**: Spanish (UI text, comments, and user-facing content)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Core Architecture

### Data Layer (IndexedDB with Dexie.js)

The database is defined in `src/lib/db.ts` with **version 3** schema:
- **tasks**: Main task entities with indexed fields (id, title, status, projectId, sprintId, createdAt, startDate, endDate, isRecurring)
- **comments**: Comments associated with tasks (indexed by taskId) - schema exists but not used in UI
- **projects**: Project entities (id, name, createdAt)
- **sprints**: Sprint entities (id, name, startDate, endDate, createdAt) - **Global**, can have multiple projects

**Schema Evolution**:
- Version 1→2: Adds projects, sprints, and recurrence to tasks
- Version 2→3: Converts sprints from project-specific to global (projectId → projectIds array)

All data operations use Dexie's API. Data is loaded reactively using `useLiveQuery()` from `dexie-react-hooks`.

### State Management

No external state management library. State is managed through:
- **IndexedDB as source of truth**: All task/project/sprint data persists in IndexedDB
- **React hooks**: Local component state with `useState`
- **Dexie live queries**: Automatic re-renders when database changes via `useLiveQuery()`

Main state container is `App.tsx` which:
- Loads tasks/projects/sprints from DB with live queries
- Manages current view mode (list/kanban/calendar)
- Manages selected project filter (`selectedProjectId`)
- Handles modal visibility and editing state (tasks, projects, sprints)
- Provides CRUD operations for tasks, projects, and sprints
- Filters tasks by selected project before passing to views
- Automatically generates recurring task instances via `checkAndGenerateRecurringTasks()` on mount

### Component Structure

```
App.tsx (root)
├── Layout.tsx (sidebar with projects/sprints/views/stats)
├── Views (rendered conditionally)
│   ├── ListView.tsx (search/filter interface)
│   ├── KanbanView.tsx (drag & drop columns by status)
│   └── CalendarView.tsx (monthly calendar grid)
└── Modals
    ├── TaskModal.tsx (create/edit tasks)
    ├── ProjectModal.tsx (create/edit projects)
    └── SprintModal.tsx (create/edit sprints)
```

**View Pattern**: Each view receives **filtered tasks** (already filtered by project in App.tsx):
- `tasks`: Array of filtered tasks (all tasks if no project selected, or tasks for selected project)
- `onEditTask`: Callback to open edit modal
- `onDeleteTask`: Callback to delete task
- Additional callbacks specific to view (e.g., `onUpdateTaskStatus` for Kanban)

**Layout Pattern**: Receives projects/sprints and manages:
- Project selection (triggers filtering in App.tsx)
- Sprint display (only shows sprints for selected project)
- Quick access buttons to create projects/sprints/tasks
- Edit/delete actions for projects and sprints

### Key Technical Details

**Project/Sprint Hierarchy**:
- Projects are top-level organizational units (optional)
- **Sprints are GLOBAL** and can be associated with multiple projects (projectIds array)
- Tasks can belong to a project and optionally a sprint
- When selecting a project in sidebar, App.tsx filters tasks by `projectId`
- Layout shows sprints filtered by selected project (shows sprints that include the selected project)
- Sprint selector in TaskModal only shows sprints that include the selected project
- Deleting a project removes it from sprint's projectIds array (doesn't delete sprints)

**Recurring Tasks**:
- Parent recurring task has `isRecurring: true` and a `RecurrenceConfig` object
- `RecurrenceConfig` defines:
  - `frequency`: 'daily' | 'weekly' | 'monthly'
  - `interval`: Repeat every X days/weeks/months
  - `daysOfWeek`: For weekly recurrence (0=Sunday, 6=Saturday)
  - End condition: either `endDate` or `endAfterOccurrences`
- `src/lib/recurrence.ts` contains logic to generate task instances
- `checkAndGenerateRecurringTasks()` automatically creates instances for next 90 days
- Generated instances have `parentTaskId` set to the parent task's ID
- Generated instances are NOT recurring themselves (`isRecurring: false`)

**Task Status Flow**:
Tasks follow this status enum: `created` → `in_progress` → `paused` | `cancelled` | `completed`
- Status configuration with labels/colors defined in `src/lib/types.ts` as `STATUS_CONFIG`
- KanbanView uses drag & drop via `@hello-pangea/dnd` to change status between columns

**Drag & Drop (Kanban)**:
- Uses `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd)
- Each status column is a `Droppable` with `droppableId` = status value
- Task cards are `Draggable` with `draggableId` = task.id
- `onDragEnd` handler in `KanbanView.tsx` calls `onUpdateTaskStatus` with new status

**Date Handling**:
- Uses `date-fns` for formatting dates and recurrence calculations
- Task dates stored as Date objects in IndexedDB
- CalendarView groups tasks by date using date-fns utilities

**UI Components**:
- Uses shadcn/ui components (button, card, dialog, input, select, textarea, badge)
- Components located in `src/components/ui/`
- Styling with TailwindCSS utility classes
- Custom theme configuration in `tailwind.config.js`

**Path Aliases**:
- `@/` maps to `src/` (configured in tsconfig and vite.config.ts)

## Important Notes

- This is a **local-only** application - no backend, API, or authentication
- All user data stays in the browser's IndexedDB (not synced across devices)
- Spanish is the UI language - maintain Spanish for all user-facing text
- IDs use `Date.now().toString()` for generation (simple client-side approach for tasks, projects, sprints)
- Comments table exists in schema but comment functionality is not implemented in current UI
- Projects are optional - tasks can exist without a project
- Recurring tasks work independently of projects/sprints
- When editing a recurring parent task, existing generated instances are NOT updated automatically
