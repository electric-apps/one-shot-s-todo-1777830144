# Plan: Real-Time Todo App

## App Description

A real-time todo app that persists todos to Postgres and syncs changes across browser tabs instantly via Electric SQL shapes. Users can add todos, mark them complete, and delete them — all changes propagate live without page refresh.

## User Flows

1. User opens the app and sees all existing todos (loaded from the Electric shape, synced from Postgres).
2. User types text into the input and presses Enter (or clicks Add) to create a new todo.
3. The new todo appears immediately in the list via optimistic insert into the TanStack DB collection.
4. The API route persists the new todo to Postgres; Electric syncs the authoritative row back.
5. User clicks a checkbox next to a todo to toggle its `completed` status.
6. The checkbox state updates optimistically; the API route patches the row in Postgres.
7. User clicks a delete button (×) on a todo to remove it.
8. The todo disappears optimistically; the API route deletes the row from Postgres.
9. Any other browser tab open to the same app receives all changes in real-time through the shared Electric shape.

## Data Model

```ts
// src/db/schema.ts
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core"

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
```

Zod schemas (derived via drizzle-zod):
- `todoSelectSchema` / `Todo` type — used for shape rows and live-query results
- `todoInsertSchema` / `NewTodo` type — used for validating POST bodies

## Key Technical Decisions

- **Drizzle + Postgres** for persistence; `drizzle-kit generate && drizzle-kit migrate` to apply schema.
- **Electric shape proxy** at `GET /api/todos` — forwards shape requests to Electric with server-side secret injection; never exposes credentials to the browser.
- **TanStack DB Electric collection** (`src/db/collections/todos.ts`) subscribes to the `/api/todos` shape stream, giving a live in-memory store.
- **`useLiveQuery`** on the todos collection, ordered by `createdAt` ascending, powers the reactive list.
- **Optimistic mutations** via `collection.insert`, `collection.update`, `collection.delete` before API round-trips, so the UI feels instant.
- **API routes** (`POST /api/todos`, `PATCH /api/todos/$id`, `DELETE /api/todos/$id`) write to Postgres; Electric propagates changes to all tabs.
- **`ssr: false`** on the index route (uses `useLiveQuery` which is client-only).
- **`absoluteApiUrl()`** from `src/lib/client-url.ts` for the shape URL passed to the collection (required for SSR-safe absolute URLs).

## Implementation Tasks

### Phase 1 — Schema & Migration
- [ ] Fill in `src/db/schema.ts` with the `todos` pgTable definition (id, text, completed, createdAt).
- [ ] Fill in `src/db/zod-schemas.ts` with `todoSelectSchema`, `todoInsertSchema`, and exported `Todo` / `NewTodo` types.
- [ ] Run `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate` to create the `todos` table in Postgres.

### Phase 2 — Electric Shape Proxy
- [ ] Create `src/routes/api/todos.ts` — export a `Route` with a `GET` handler that calls `proxyElectricRequest(request, "todos")` from `src/lib/electric-proxy.ts`.

### Phase 3 — TanStack DB Collection
- [ ] Create `src/db/collections/todos.ts`:
  - Import `createCollection` and `electricShapeCollectionOptions` from `@tanstack/db`.
  - Build the Electric shape URL using `absoluteApiUrl("/api/todos")`.
  - Export `todosCollection` as the singleton collection.

### Phase 4 — API Mutation Routes
- [ ] Add `POST /api/todos` handler: parse body with `todoInsertSchema`, insert into Postgres via Drizzle, return the created row as JSON.
- [ ] Add `PATCH /api/todos/$id` handler: parse body (partial — `completed` boolean), update the matching row in Postgres, return the updated row.
- [ ] Add `DELETE /api/todos/$id` handler: delete the row by id, return 204.

### Phase 5 — UI
- [ ] Replace `src/routes/index.tsx` with the todo UI (set `ssr: false` on route options).
- [ ] Add a controlled text input + "Add" button at the top; on submit, call `todosCollection.insert(...)` (optimistic) then `POST /api/todos`.
- [ ] Render a scrollable list of todos ordered by `createdAt` ascending using `useLiveQuery`.
- [ ] Each todo row: checkbox (toggles `completed` via `todosCollection.update` + `PATCH`), todo text (line-through when completed), and a delete button (× via `todosCollection.delete` + `DELETE`).
- [ ] Style with Tailwind: centered card layout, clean list, proper hover/focus states.

### Phase 6 — Build & Verify
- [ ] Run `pnpm run build` and fix any TypeScript / import errors.
- [ ] Run `node scripts/preflight.mjs` (if present) to catch SSR safety issues.

### Phase 7 — Tests
- [ ] Add a Vitest unit test in `tests/` that validates the `todoSelectSchema` against a generated valid row (using `generateValidRow` from `tests/helpers/schema-test-utils.ts`).
- [ ] Confirm `pnpm test` passes.

### Phase 8 — README
- [ ] Update `README.md` with: what the app does, how to run locally (env vars needed, `pnpm dev`), and how real-time sync works.
