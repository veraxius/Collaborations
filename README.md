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

## Quality and operations

```bash
npm run test:all   # type check + frontend tests + backend tests (no database needed)
npm run build      # production build
```

- Backend tests run the real routes against an in-memory stand-in for the database (sign-up, sign-in, roles, reset, invitations, billing webhook, reminders).
- CI runs the same checks on every push (`.github/workflows/ci.yml`).
- **`docs/OPERATIONS.md`**: environment variables, deploy checklist, scheduled jobs, backups and restore, monitoring and a runbook.
- **`PRIVATE-INSTALL.md`**: dedicated, branded installs for a single customer.

## Features at a glance

- Documents, vehicles and drivers with traffic-light status and a DOT quick-start list.
- Reminders by email (and text to drivers when Twilio is set up), with per-company reminder days, extra recipients, a Monday summary and an onboarding nudge.
- Team with roles: owner, manager (edit) and viewer (read only). Activity log shows who did what.
- USDOT lookup at sign-up (needs `FMCSA_WEBKEY`) and an automatic MCS-150 reminder.
- Email confirmation, password reset, session revocation on password change, account deletion and CSV export.
- Plans: free up to 3 vehicles and 3 drivers; Fleet plan via Lemon Squeezy with a self-service portal link.

## Plans and billing

- **Starter (free)**: up to 3 vehicles and 3 drivers, all reminders. Enforced in the API (`402 plan_limit`).
- **Fleet ($29/mo)**: unlimited + AI assistant. A company is "pro" when `subscriptionStatus` is `active`, `on_trial` or `past_due`.
- Lemon Squeezy webhook: `POST /api/billing/webhook` (set `LEMONSQUEEZY_WEBHOOK_SECRET`). Checkout prefills the account email so purchases match accounts.
- After pulling: `cd backend && npx prisma db push` (adds the `Lead` table).

## Legacy code

`/dashboard`, `/onboarding`, `/api/analyze`, `/api/translate`, `/api/ai-chat` and the other `/api/ai/*` routes (except `fleet-chat`) belong to a previous product. `middleware.ts` returns 404 for them. Delete those folders, `components/dashboard`, `components/onboarding`, `components/providers`, `lib/supabase.ts`, `lib/seo.ts`, `lib/aiAnalysis.ts`, `lib/analyzePerformance.ts`, `lib/auth.ts`, `hooks/`, `backend/auth-backend`, `backend/generated_backend` and `middleware.ts` when ready.

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
