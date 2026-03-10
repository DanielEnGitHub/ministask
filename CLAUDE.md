# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiniTasks is a modern task management web application built with React 19, TypeScript, and TailwindCSS. The app uses **Supabase** as backend (PostgreSQL database + Auth + Storage). It is a multi-user app with role-based access control.

**Key Features**:

- **Projects**: Organize tasks into projects (optional)
- **Sprints**: Global time-boxed sprints, auto-selects current sprint on load
- **Sprint Filtering**: Sidebar sprint selector with toggle to include/exclude unsprinted tasks
- **Multiple Views**: List, Kanban (drag & drop), and Calendar views
- **Smart Filtering**: Views filter tasks by selected project and/or sprint
- **Image Upload**: Tasks can have multiple images (stored in Supabase Storage)
- **Subtasks**: Checkbox subtask lists with progress tracking
- **Task Labels & Priority**: Labels (bug, implementacion, mejora, actualizacion, otro) + priority (alta, media, baja)
- **Task View History**: Tracks which users viewed each task (admin-visible)
- **Role-Based Access Control**: Admin and Client roles with distinct permissions
- **PWA Support**: Installable with offline support via Service Workers
- **Dark/Light Theme**: Persistent theme toggle

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

## Environment Variables

Required in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Core Architecture

### Backend: Supabase

The app uses Supabase for:

- **PostgreSQL Database**: All app data persisted in cloud
- **Auth**: Email/password authentication with session management
- **Storage**: Image uploads in `task-images` bucket

> Note: `src/lib/db.ts` still exists (old Dexie IndexedDB schema with 7 versions) but is **no longer used**. The app migrated fully to Supabase.

### Database Tables (Supabase PostgreSQL)

- **tasks**: id, title, description, status, label, priority, project_id, sprint_id, start_date, end_date, subtasks (jsonb), images (text[]), task_views (jsonb), created_by, created_at, updated_at
- **projects**: id, name, description, color, created_by, created_at
- **sprints**: id, name, goal, start_date, end_date, status (active|completed), created_by, created_at, updated_at
- **profiles**: id, email, full_name, role (admin|client), created_at, updated_at
- **project_assignments**: id, project_id, user_id, assigned_by
- **comments**: id, task_id, text, user_id, user_name, parent_comment_id, created_at, updated_at

### Service Layer (`src/services/`)

All Supabase operations go through service files:

- `tasks.service.ts` — CRUD, role-based filtering, status updates, task view tracking
- `projects.service.ts` — CRUD, user assignment management
- `sprints.service.ts` — CRUD, complete sprint (unassigns unfinished tasks), delete
- `users.service.ts` — Profile management, project assignment sync
- `storage.service.ts` — Image upload/delete to Supabase Storage
- `comments.service.ts` — Comment operations (schema exists, not exposed in UI yet)

### State Management

No external state management library. State managed through:

- **Supabase as source of truth**: All data persisted in PostgreSQL
- **React hooks**: Local component state with `useState`
- **Service layer**: All DB calls go through `/services/`

Main state container is `src/pages/Dashboard.tsx` (not App.tsx):

- Loads tasks/projects/sprints from Supabase
- Manages view mode (list/kanban/calendar) — persisted in localStorage
- Manages selected project filter (`selectedProjectId`) — persisted in localStorage
- Manages selected sprint filter (`selectedSprintId`)
- Toggle for unsprinted tasks (`showUnsprintedTasks`) — persisted in localStorage
- Handles modal visibility and editing state
- Provides CRUD operations for tasks, projects, and sprints
- Filters tasks by project AND sprint before passing to views

### Auth & Routing (`src/App.tsx`)

```
App.tsx
├── No user → Login page
└── User exists → BrowserRouter
    ├── "/" → Dashboard
    ├── "/users" → Users (admin only)
    └── "*" → redirect to "/"
```

`src/contexts/AuthContext.tsx` provides:

- `user` — Supabase Auth User
- `profile` — Profiles record (id, email, full_name, role)
- `session` — Supabase Session
- `loading` — Boolean during initialization
- `signIn(email, password)` / `signOut()`
- `isAdmin` — shorthand for `profile.role === 'admin'`
- `isClient` — shorthand for `profile.role === 'client'`

Profile loading strategy: immediately uses `user_metadata` from Auth session, then loads full profile from DB in background to prevent UI blocking.

### Component Structure

```
App.tsx (router + auth check)
├── Login.tsx
└── Dashboard.tsx (main state container)
    ├── Layout.tsx (sidebar: projects, sprints, views, theme)
    ├── Views (conditionally rendered)
    │   ├── ListView.tsx (search + list)
    │   ├── KanbanView.tsx (drag & drop columns)
    │   └── CalendarView.tsx (monthly grid)
    └── Modals
        ├── TaskModal.tsx (create/edit tasks + image upload)
        ├── TaskDetailModal.tsx (task detail + history)
        ├── ProjectModal.tsx (create/edit projects)
        ├── SprintModal.tsx (create/edit sprints)
        ├── UserModal.tsx (edit user role)
        ├── AssignProjectsModal.tsx (assign projects to user)
        └── HistoryModal.tsx (task view history)
```

**View Pattern**: All views receive already-filtered tasks from Dashboard:

- `tasks` — Filtered by selected project + sprint
- `onEditTask(task)` — Opens TaskModal
- `onDeleteTask(taskId)` — Confirmation + delete
- `onUpdateTaskStatus(taskId, status)` — For Kanban drag & drop

**Layout Pattern**: Sidebar receives projects/sprints, manages:

- Project selection → triggers Dashboard filtering
- Sprint selection → triggers Dashboard sprint filtering
- Toggle to show/hide unsprinted tasks
- Overdue sprint warning (red badge if active sprint past end_date)
- Quick action buttons (+ task/project/sprint)
- Edit/delete for projects and sprints
- Theme toggle, logout, user display

### Role-Based Permissions (`src/hooks/usePermissions.ts`)

**Admin**:

- Full CRUD on all tasks, projects, sprints
- Can see all projects (not filtered by assignments)
- Can manage users (`/users` page)
- Can assign users to projects
- Can change any task to any status
- Can view task view history

**Client**:

- Only sees projects assigned to them (via `project_assignments`)
- Only sees tasks from their assigned projects
- Can create tasks in assigned projects
- Can only change task status from `paused` → `completed` or `cancelled`
- Cannot edit or delete tasks
- Cannot manage projects, sprints, or users

Permission hooks:

- `canCreateProject` / `canEditProject` / `canDeleteProject` — Admin only
- `canCreateSprint` / `canEditSprint` / `canDeleteSprint` — Admin only
- `canEditTask` / `canDeleteTask` — Admin only
- `canChangeTaskStatus` — Admin: always; Client: restricted transitions only
- `canChangeTaskStatusTo(currentStatus, newStatus)` — Validates transition
- `canCreateComment` / `canDeleteComment(userId)` — Both roles; own comments only for delete
- `canViewAllProjects` / `canViewAllUsers` / `canAssignUsersToProjects` — Admin only

### Key Technical Details

**Field Name Compatibility (`src/lib/taskUtils.ts`)**:
Utilities handle both `snake_case` (Supabase responses) and `camelCase` (legacy Dexie format):

- `getTaskProjectId(task)` — returns `project_id` or `projectId`
- `getTaskSprintId(task)` — returns `sprint_id` or `sprintId`
- `getTaskStartDate(task)` / `getTaskEndDate(task)`
- `normalizeTask(task)` — converts full object

**Sprint Logic (`src/lib/sprintUtils.ts`)**:

- `getCurrentSprint(sprints)` — Auto-selects by priority: in-progress → overdue (latest) → future (earliest) → none
- `isSprintOverdue(sprint)` — active sprint with end_date < today

**Date Handling (`src/lib/dateUtils.ts`)**:

- UTC-safe operations to prevent timezone drift
- `toDateInputValue(date)` — Date → "YYYY-MM-DD" for `<input type="date">`
- `formatDateForDisplay(date)` — Date → "DD/MM/YYYY" for UI
- `normalizeDate(date)` — removes time component, uses UTC

**Task Status Flow**:
`created` → `in_progress` → `paused` | `cancelled` | `completed`

Status config with labels/colors: `STATUS_CONFIG` in `src/lib/types.ts`

**Drag & Drop (Kanban)**:
Uses `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd). Each status column is a `Droppable`, task cards are `Draggable`. Drag end triggers `onUpdateTaskStatus` service call.

**Image Upload**:

- Stored in Supabase Storage bucket `task-images`
- Path format: `{taskId}/{uuid}.{ext}`
- Public URLs stored in `tasks.images[]`
- Upload via `storage.service.ts`

**Task View History**:

- `task_views` jsonb field on tasks: `[{user_id, user_name, viewed_at}]`
- Tracked via Supabase RPC `record_task_view` (only called for non-admin viewers)
- Visible to admins in `HistoryModal.tsx`

**PWA**:

- `vite-plugin-pwa` with auto-update strategy
- Service worker via Workbox for asset precaching
- Google Fonts cache (1-year)
- App manifest: name "MiniTasks - Gestión de Tareas"

## Important Notes
s
- **Supabase backend**: Not local-only anymore. Multi-user, cloud-persisted.
- **Spanish UI**: Maintain Spanish for all user-facing text (no i18n library, hardcoded Spanish)
- **IDs**: Generated by Supabase (UUID), not `Date.now().toString()` anymore
- **Comments**: Schema exists, service implemented, but not exposed in UI
- **Old Dexie code**: `src/lib/db.ts` still in codebase but unused — do not use it for new features
- **Recurring tasks**: Logic exists in old Dexie (`src/lib/recurrence.ts`) but not implemented in current Supabase version
- **Projects are optional**: Tasks can exist without a project
- **Sprints are global**: Not project-specific, all users see sprints (filtered in UI by selected project context)
