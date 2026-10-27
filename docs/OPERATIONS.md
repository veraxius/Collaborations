# Operations guide

Everything needed to run FleetGuard reliably in production: configuration, scheduled jobs, backups, monitoring and what to do when something breaks.

## 1. Configuration

### Backend (`backend/.env`)

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Add `?schema=fleetguard`. |
| `JWT_SECRET` | Yes | Signs sessions and email links. Long and random. Changing it signs everyone out. |
| `FRONTEND_URL` | Yes (production) | Public address of the web app. Used for CORS and for links in emails. |
| `RESEND_API_KEY` | Yes (production) | Without it no email is delivered and new accounts are treated as verified. |
| `EMAIL_FROM` | Recommended | `Name <reminders@your-domain.com>`. Use a domain you verified in Resend. |
| `ENABLE_INTERNAL_CRON=1` | Yes, unless you call the cron endpoints | Runs the daily reminders, the onboarding nudge and the Monday summary. |
| `CRON_SECRET` | If you use the endpoints | Bearer token for `POST /api/cron/{reminders,digest,nudge}`. Empty = endpoints return 503. |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | For billing | Signing secret of the webhook pointing at `POST /api/billing/webhook`. |
| `FMCSA_WEBKEY` | Optional | Enables the USDOT lookup on sign-up. Free key from FMCSA (Login.gov account). |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Optional | Enables text messages to drivers. Without them messages are only logged. |
| `CONTACT_TO_EMAIL` | Optional | Where new leads are emailed. |
| `UPLOAD_DIR` | Optional | Where uploaded files live. **Must be a persistent volume.** |
| `DEPLOYMENT_MODE=private`, `BRAND_NAME` | Private installs | See `PRIVATE-INSTALL.md`. |

### Frontend (`.env.local` or build args)

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public address of the API. Baked in at build time: set it before building. |
| `NEXT_PUBLIC_SITE_URL` | Your domain. Used for canonical URLs and the sitemap. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Turns on privacy-friendly analytics (no cookies). |
| `GROQ_API_KEY` | Powers the AI assistant (Fleet plan). |
| `GROQ_MODEL` | Optional. Forces a specific Groq model. By default the assistant tries `openai/gpt-oss-120b`, then `openai/gpt-oss-20b`, then `qwen/qwen3.8-27b`, and remembers the first that works. Groq retires models from time to time: if the assistant stops answering, check the logs for `[fleet-chat]` and list the models your key can use with `GET https://api.groq.com/openai/v1/models`. |

## 2. Deploy checklist

1. Set the variables above. In production the API warns at start-up about any that are missing.
2. The API runs `prisma db push` when it starts (Docker) or run it once yourself: `cd backend && npx prisma db push`.
3. Verify your sending domain in Resend (SPF and DKIM records) **before** you invite customers. Reminders are the product: if they land in spam, nothing else matters.
4. Point the Lemon Squeezy webhook at `https://<api>/api/billing/webhook` and make a real test purchase with a discount code.
5. Open `https://<api>/api/health`. It must answer 200 with `database: ok`, and shows whether email and cron are configured.
6. Create a test account, add a document that expires in a few days, and confirm the reminder email arrives.

## 3. Scheduled jobs

| Job | When (server time) | What |
|---|---|---|
| Reminders | Daily 08:00 | Emails (and SMS when enabled) for documents at their reminder days. A failed send is retried the next day. |
| Onboarding nudge | Daily 08:30 | One email to accounts 3 to 14 days old with no documents. |
| Weekly summary | Mondays 08:15 | Expired and expiring documents, only for accounts that have something to report and have not opted out. |

If you cannot keep the API process running 24/7, leave `ENABLE_INTERNAL_CRON` off and trigger the three endpoints from an external scheduler (`Authorization: Bearer $CRON_SECRET`).

## 4. Backups

The database holds everything that matters, and uploaded files are the second half. Back up both.

```bash
# Database (use the direct connection string, not the pooler)
pg_dump "$DATABASE_URL_DIRECT" --schema=fleetguard --format=custom --file=fleetguard-$(date +%F).dump

# Restore into an empty database
pg_restore --clean --if-exists --no-owner --dbname="$TARGET_URL" fleetguard-2026-10-09.dump
```

- Take a dump at least daily and keep 30 days. Store copies **outside** the provider that hosts the database.
- Copy the `UPLOAD_DIR` volume on the same schedule.
- **Restore a backup into a scratch database once a month.** A backup you have never restored is a hope, not a backup.
- If you use Supabase, also enable its own daily backups, but do not rely on them alone.

## 5. Monitoring

- Point an uptime monitor at `GET /api/health` (every 1 to 5 minutes, alert by email or SMS). A 503 means the database or a required secret is missing.
- Watch the API logs for `[reminders]`, `[cron]`, `[billing]` and `[error]`. One line per request is logged (method, path, status, time). Bodies and query strings are never logged.
- After the daily 08:00 run you should see `[cron] reminders: {"sent":N,"failed":0,...}`. A non-zero `failed` means the email provider rejected messages.

## 6. When something breaks

| Symptom | Likely cause and fix |
|---|---|
| No reminder emails | Check `/api/health` (`email: configured`), the Resend dashboard (domain verified, quota), and the `failed` count in the cron log. Unverified accounts are skipped on purpose. |
| Customers say a reminder landed in spam | Verify SPF/DKIM for the sending domain; stop using the default `onboarding@resend.dev` sender. |
| A customer paid but still sees the free plan | The webhook matches by email. Look for `no account matches the buyer's email` in the log, then fix the account's `subscriptionStatus` and billing fields by hand. |
| Everyone was signed out | `JWT_SECRET` changed, or the process restarted without it. Sessions are signed with it. |
| API returns 500 on every request | Check the database connection (`/api/health`). Run `prisma db push` if you deployed a schema change. |
| A secret leaked | Rotate it. For `JWT_SECRET`: set a new value and restart; every session and pending link stops working, which is what you want. Rotate the Resend, Lemon Squeezy and Twilio keys at the provider. |
| Suspected unauthorized access | Change the owner password (it signs out every session), remove unknown team members, and review the activity log. |

## 7. Customer data requests

- **Export**: Documents page, "Export CSV" (any role).
- **Deletion**: Settings, "Delete account" (owner, password required). Removes the company, team, vehicles, drivers, documents, activity and uploaded files.
- Keep the support address in the contact page monitored and answer data requests promptly.

## 8. Quality gate before every release

```bash
npm run test:all    # type check, frontend tests, backend tests
npm run build       # production build
```

The same checks run in GitHub Actions (`.github/workflows/ci.yml`) on every push.
