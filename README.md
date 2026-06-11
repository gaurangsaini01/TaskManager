# TaskManager

Full-stack task management application.

- **Backend**: Express 5 + TypeScript + Prisma 7 + PostgreSQL (Neon)
- **Frontend**: Next.js 16 (App Router) + Tailwind CSS v4 + TanStack Query v5

> 🚧 Work in progress — full setup instructions, API reference and feature docs land in the final phase.

## Quick start (current state)

```bash
# 1. Install everything
npm run install:all

# 2. Configure environment
#    - copy backend/.env.example  -> backend/.env   (Neon URLs, JWT secret, Cloudinary)
#    - copy frontend/.env.example -> frontend/.env.local

# 3. Apply database migrations
npm run db:migrate --prefix backend

# 4. Run both apps (API on :4000, web on :3000)
npm run dev
```
