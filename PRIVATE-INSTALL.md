# Private installation (white-label) playbook

One customer, one dedicated install: own database, own uploads, own branding, own domain.

## What makes an install "private"

| Setting | Effect |
|---|---|
| `DEPLOYMENT_MODE=private` (API) | Unlimited vehicles/drivers/AI, no plan limits. Sign-up closes after the first admin account. |
| `NEXT_PUBLIC_DEPLOYMENT_MODE=private` (web) | Hides the marketing site (visitors go to `/login`) and the Upgrade link. Search engines are told not to index it. |
| `BRAND_NAME` / `NEXT_PUBLIC_BRAND_NAME` | Name in the UI, browser tab, reminder emails and AI assistant. |
| `NEXT_PUBLIC_BRAND_LOGO_URL` | Replaces the shield icon. |
| `NEXT_PUBLIC_BRAND_ACCENT`, `_ACCENT_DARK`, `_ON_ACCENT` | Button/link/focus colors. Use a dark `ON_ACCENT` text color on light accents and `#ffffff` on dark ones. |

## Deploy a customer

1. `cp customer.env.example customer.env` and fill it in. Generate **new** `DB_PASSWORD`, `JWT_SECRET` and `CRON_SECRET` for every customer.
2. Point two DNS names (app and API) at the server and put HTTPS in front of ports 3000 and 3001 (Caddy or nginx).
3. `docker compose -f docker-compose.private.yml --env-file customer.env up -d --build`
4. Open the app URL and create the admin account (the only sign-up the install will accept).
5. Load the customer's first documents with them, then confirm a reminder email arrives.

Reminders run daily at 08:00 in-process (`ENABLE_INTERNAL_CRON=1`). Without an email key, emails are only printed to the API log.

## Branding changes later

Branding is baked in at build time. Edit `customer.env` and re-run step 3 (the data volumes are kept).

## Backups

Back up the `dbdata` and `uploads` volumes. Example: `docker compose -f docker-compose.private.yml exec db pg_dump -U postgres fleetguard > backup.sql`.

## Status of this setup

The Docker files and the private mode were written alongside the app but have **not been run end to end** (Docker is not installed on the development machine). Do one full dry-run deploy on a test server before the first customer. Known items to verify: that `prisma db push` creates the `fleetguard` schema on a fresh Postgres, and that the web image build succeeds with your build args.

## Commercial notes

- Offer page: `/enterprise` (one-time license; the price is deliberately NOT published, it is quoted per customer). Hosting and support are described there as "quoted separately": decide those terms before the first sale.
- Put the license terms in writing (what the customer may and may not do, who owns custom changes, what support is included).
