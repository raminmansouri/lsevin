# Dynamic Admin Dashboard Scaffold

A production-oriented, metadata-driven admin dashboard scaffold for:

- Next.js App Router
- React + TypeScript
- postgres.js
- TanStack Table
- react-hook-form
- lucide-react
- Tailwind CSS

This scaffold is designed to sit **on top of** the introspection, CRUD, enum, and permission utilities you already have.

## Architecture

### 1) Metadata core
`lib/admin/core/*`

This layer introspects PostgreSQL and exposes:
- tables
- columns
- primary keys
- unique constraints
- foreign keys
- enum columns
- related tables
- full table definitions

### 2) Admin metadata resolver
`lib/admin/metadata.ts`

This layer combines:
- database metadata
- admin override config
- field inference
- locale configuration
- relation display heuristics

It produces a **resolved table definition** the UI can render safely.

### 3) Permission layer
`lib/admin/guard.ts`

Checks access for:
- list
- single
- create
- update
- delete

Navigation and server actions both use the same permission source.

### 4) Query engine
`lib/admin/list-query.ts`

Builds safe, metadata-whitelisted list queries with:
- pagination
- sorting
- global search
- column filters
- relation label hydration
- locale-aware translated output

### 5) Form engine
`components/admin/forms/*`

Dynamic form renderer based on resolved columns:
- text
- textarea
- numbers
- booleans
- dates
- enums
- JSON
- relation select
- multilingual JSON tabs

### 6) CRUD action layer
`app/(admin)/admin/_actions.ts`

Server actions for:
- create row
- update row
- delete row
- bulk delete
- many-to-many sync

### 7) UI shell
`app/(admin)/admin/*` and `components/admin/layout/*`

Includes:
- sidebar
- breadcrumbs
- topbar
- permissions-aware navigation
- list / create / edit / detail pages

## Notes

1. This scaffold prefers **metadata-driven generation** over hand-written pages.
2. Complex many-to-many and inline one-to-many editing are handled through **override config**, because those cases require business intent.
3. Localized JSON fields are rendered as translation tabs. For tables, the selected admin locale is shown with fallback support.
4. Relation dropdowns are lazy-loaded through `/api/admin/relation-options`.
