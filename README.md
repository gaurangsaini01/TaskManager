# TaskManager

Full-stack task management application: a REST API with JWT authentication and per-user task ownership, plus a connected, responsive web UI with live updates.

## Features

**Core**
- Task CRUD — title, description, status (`To do / In progress / Done`), priority (`Low / Medium / High`), due date
- Filtering by status, **case-insensitive title search**, sorting by due date / priority / created date — all composable with each other and with **pagination**
- JWT signup & login with bcrypt-hashed passwords; sessions survive page refresh
- Strict ownership — users can only see and modify their own tasks (foreign task ids return 404, never confirming they exist)
- Input validation on every write endpoint (zod) with consistent error envelopes and proper status codes
- Loading skeletons, empty states, error states with retry; responsive layout (mobile → desktop)

**Bonus**
- 🛡 **Admin role** — admins can switch to an "All users" view (read-only on others' tasks, with owner labels)
- ⚡ **Real-time updates** — task changes stream live to other tabs/users via Server-Sent Events
- ✨ **Optimistic UI** — status toggles, edits and deletes apply instantly and roll back with a toast if the server rejects
- 📎 **Attachments** — images / PDF / DOCX (≤ 5 MB) per task, stored in Cloudinary
- 📜 **Activity log** — per-task history with field-level diffs ("status: To do → Done")
- 🌗 **Dark mode** — light / dark / system toggle, persisted across sessions

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TanStack Query v5, react-hook-form + zod |
| Backend | Express 5, TypeScript (ESM), zod validation |
| Database | PostgreSQL on [Neon](https://neon.tech), Prisma 7 (`@prisma/adapter-pg`) |
| Auth | JWT (`jsonwebtoken`), bcryptjs |
| Files | Cloudinary (multer memory storage → upload stream) |
| Tests | Vitest 4 + Supertest (29 integration tests) |

## Getting started

### Prerequisites

- Node.js ≥ 20 (developed on 22)
- A [Neon](https://neon.tech) Postgres project (free tier is fine)
- A [Cloudinary](https://cloudinary.com) account — only needed for the attachments feature

### 1. Install

```bash
git clone <repo-url> taskmanager
cd taskmanager
npm run install:all        # installs backend, frontend and root tooling
```

### 2. Configure environment

```bash
# backend
cp backend/.env.example backend/.env
# frontend
cp frontend/.env.example frontend/.env.local
```

Fill in `backend/.env`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon console → Connect, **with connection pooling ON** (host contains `-pooler`) |
| `DIRECT_URL` | Same dialog with pooling OFF — used only by `prisma migrate` |
| `TEST_DATABASE_URL` | Create a separate **Neon branch** (Branches → New → e.g. `test`) and copy its pooled string. ⚠️ The test suite TRUNCATES ALL TABLES on this database — never point it at real data. The suite refuses to run if it equals `DATABASE_URL`. |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLOUDINARY_*` | Cloudinary dashboard → API keys. Also enable **Settings → Security → "Allow delivery of PDF and ZIP files"**, otherwise PDF attachment links return 401 on free accounts. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials the seed script uses to create the admin account |

`frontend/.env.local` only needs `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

### 3. Migrate and seed

```bash
npm run db:migrate         # applies prisma migrations
npm run db:seed            # creates admin + demo user with 10 sample tasks
```

### 4. Run

```bash
npm run dev                # API on :4000 and web app on :3000, concurrently
```

Open http://localhost:3000 and log in with a seeded account or sign up.

### Seeded accounts

| Account | Email | Password |
|---|---|---|
| Admin | `admin@taskmanager.local` (or your `ADMIN_EMAIL`) | `Admin123!` (or your `ADMIN_PASSWORD`) |
| Demo user | `demo@taskmanager.local` | `Demo123!` |

> Note: the JWT embeds the role at login time — if you promote a user to admin in the database, they must log in again for it to take effect.

## Tests

```bash
npm test                   # 29 backend integration tests (Vitest + Supertest)
```

The suite applies migrations to `TEST_DATABASE_URL` automatically, truncates tables between tests, and runs strictly serially against the remote database.

## API reference

All `/tasks*` routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/auth/signup` | Create account → `201 { user, token }` |
| `POST` | `/auth/login` | Log in → `200 { user, token }` |
| `GET` | `/auth/me` | Current user from token |
| `GET` | `/tasks` | List own tasks. Query: `status`, `search`, `sortBy` (`dueDate\|priority\|createdAt`), `order` (`asc\|desc`), `page`, `limit` (≤ 50), `scope=all` (admin only) |
| `POST` | `/tasks` | Create task → `201` |
| `GET` | `/tasks/:id` | Single task (admin may read any) |
| `PATCH` | `/tasks/:id` | Partial update (`null` clears description/dueDate) |
| `DELETE` | `/tasks/:id` | Delete → `204` |
| `GET` | `/tasks/:id/activity` | Change history, newest first |
| `GET` | `/tasks/:id/attachments` | List attachments |
| `POST` | `/tasks/:id/attachments` | Multipart upload, field `file` (image/PDF/DOCX ≤ 5 MB) |
| `DELETE` | `/tasks/:id/attachments/:attachmentId` | Remove attachment → `204` |
| `GET` | `/events?token=<jwt>` | Server-Sent Events stream (`task.created/updated/deleted`) |

**Response envelopes** — lists: `{ data, meta: { page, pageSize, total, totalPages } }` · errors: `{ error: { message, code, details? } }` with `400/401/403/404/409` as appropriate.

## Project structure

```
backend/
  prisma/            # schema, migrations, seed
  src/
    app.ts           # express app (exported for tests)  ·  server.ts boots it
    middleware/      # auth (JWT), validation, central error handler
    routes/          # auth, tasks (+activity/attachments), events (SSE)
    services/        # task service (single mutation funnel), activity, sse, cloudinary
    schemas/         # zod schemas
  tests/             # vitest + supertest integration tests
frontend/
  src/
    app/             # routes: /, /login, /signup, /tasks, /tasks/[id]
    components/      # hand-rolled UI primitives + task components
    hooks/           # TanStack Query hooks (incl. optimistic mutations, SSE)
    lib/             # api client, auth context, types, validators
```

## Design notes & tradeoffs

- **JWT in localStorage** (vs httpOnly cookie): simpler cross-origin setup and explicit `Authorization` headers; the tradeoff is XSS exposure, mitigated by React's escaping and no `dangerouslySetInnerHTML`. Route guarding is therefore client-side — a brief loading flash on protected pages is accepted.
- **404 for foreign tasks** (vs 403): the API never confirms that someone else's task id exists. Admins get a real 403 on write attempts since they can already see the task.
- **Priority sorting** uses native Postgres enum ordering (`LOW < MEDIUM < HIGH` by declaration order) — no mapping tables or client-side sorting.
- **SSE connection registry is in-memory**, which assumes a single API instance. Scaling out would swap it for Postgres LISTEN/NOTIFY or Redis pub/sub behind the same interface.
- **Offset pagination** (`page`/`limit`) — right fit for this UI; cursor pagination would be the next step for very large datasets.
- **Cloudinary URLs are public-but-unguessable**; metadata access is ownership-checked through the API. Signed/authenticated delivery would be the hardening step.
- The **test suite hits a real Neon branch** rather than mocks — slower, but it exercises the exact SQL, constraints and cascade behavior production uses.
