# Real-Time Todo App

A real-time todo app built with TanStack Start, Electric SQL, and TanStack DB. Changes sync instantly across all open browser tabs without a page refresh.

## What it does

- Add todos via the text input (press Enter or click Add)
- Toggle completion with the checkbox
- Delete todos with the × button
- All changes propagate live to every other open tab via Electric SQL shape sync

## How it works

Postgres is the source of truth. Every write goes through an API route (`POST/PATCH/DELETE /api/todos`) that persists to Postgres via Drizzle ORM. Electric SQL watches the `todos` table and streams row-level changes as a shape stream. The TanStack DB Electric collection subscribes to that stream and keeps an in-memory store live. `useLiveQuery` in the React component subscribes to the store and re-renders when anything changes.

## Running locally

### Prerequisites

- Postgres 14+ with logical replication enabled (`wal_level = logical`)
- Electric SQL running (see [electricsql.com](https://electric-sql.com))

### Environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/todos
ELECTRIC_URL=http://localhost:3000        # local Electric instance
# For Electric Cloud, use instead:
# ELECTRIC_SOURCE_ID=<your-source-id>
# ELECTRIC_SECRET=<your-secret>
```

### Start

```bash
pnpm install
pnpm run migrate   # create the todos table
pnpm dev           # starts on http://localhost:5174
```
