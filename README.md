# FleetGuard

Track insurance, inspections, licenses and permits for your fleet. Get email reminders before anything expires.

## Architecture

- **Frontend** — Next.js app on port **3000**
- **Backend** — Express API on port **3001**

The frontend talks to the Express API using a Bearer token stored in `localStorage`. No Supabase or server-side session — all authenticated requests go through `lib/api.ts`.

## Quick start

### 1. Backend (Express)

```bash
cd backend
cp .env.fleetguard.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, FRONTEND_URL
npm install
npx prisma db push
npm run dev
```


The API listens on **http://localhost:3001**.

### 2. Frontend (Next.js)

From the repo root:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

## Environment variables

### Frontend (`.env.local` in repo root)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Express API base URL |

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Prisma) |
| `JWT_SECRET` | Yes | Secret for signing auth tokens |
| `FRONTEND_URL` | Yes | Next.js origin for CORS (e.g. `http://localhost:3000`) |
| `PORT` | No | API port (default `3001`) |
| `UPLOAD_DIR` | No | Directory for uploaded document files |
| `LEMONSQUEEZY_*` | No | Lemon Squeezy billing (checkout & portal) |
| `CRON_SECRET` | No | Bearer token for `/api/cron/reminders` |
| `ENABLE_INTERNAL_CRON` | No | Set to `1` to run daily reminder sweep in-process |

See `backend/.env.fleetguard.example` for a full template.

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login`, `/register`, `/signup` | Auth (`/signup` redirects to `/register`) |
| `/app` | Dashboard |
| `/app/analytics` | Compliance analytics |
| `/app/documents` | Document list & filters |
| `/app/vehicles`, `/app/drivers` | Fleet management |
| `/app/billing` | Subscription checkout & portal |
| `/app/settings` | Company profile & password |

## Development

```bash
# Terminal 1 — API
cd backend && npm run dev

# Terminal 2 — UI
npm run dev
```

```bash
npm run build   # production build (frontend)
npm run lint    # ESLint
```

## License

Private.
