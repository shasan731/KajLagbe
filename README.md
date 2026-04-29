# KajLagbe — Tools & Skills Rent Marketplace

> Rent tools. Hire local skills. Pay only when needed.

KajLagbe is a Bangladesh-focused marketplace MVP where users can rent local tools, hire skilled people for short-duration jobs, or book tool-with-operator services. It is built as a serverless-friendly Next.js full-stack app deployable to **Vercel** with **Neon PostgreSQL**.

---

## Features (MVP)

- Phone-first registration & login (custom cookie-based auth, no third-party auth required)
- Public landing page, category browse, search & filters, listing detail
- Listing creation/edit by providers (DRAFT → PENDING_REVIEW → ACTIVE / REJECTED / SUSPENDED)
- Booking request flow with full state machine for both tool rentals and skill services
- Manual payment record flow (bKash, Nagad, Rocket, bank transfer, cash)
- Admin moderation: listings, users, bookings, payments, disputes, categories
- Per-booking message thread (refresh-based, no WebSockets)
- In-app notifications, favorites, reviews & ratings, dispute resolution
- Handover checklist (photos & condition note) for tool rentals
- PWA manifest, mobile bottom nav, BDT (`৳`) currency formatting
- Seeded categories, demo users, and 12 sample listings

## Tech stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS**
- **Prisma ORM** + **Neon PostgreSQL**
- **bcryptjs** + **jose** for auth
- **Zod** validators on every server mutation
- **react-hook-form** style controlled inputs (light)
- **lucide-react** icons, **sonner** toasts

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL` — pooled Neon connection string (used by the runtime)
- `DIRECT_URL` — direct Neon connection string (used for migrations)
- `AUTH_SECRET` — long random string. Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
  ```
- `ADMIN_NAME`, `ADMIN_PHONE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used by the seed script to create the first admin

### 3. Set up the database

Push the Prisma schema to Neon:

```bash
npm run db:push
```

Then seed sample data + the admin user:

```bash
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

### Default seeded credentials

| Role | Phone | Password |
|---|---|---|
| Admin | value of `ADMIN_PHONE` (default `01700000000`) | value of `ADMIN_PASSWORD` |
| Provider 1 | `01711111111` | `Provider123!` |
| Provider 2 | `01722222222` | `Provider123!` |
| Customer 1 | `01733333333` | `Customer123!` |
| Customer 2 | `01744444444` | `Customer123!` |

Health check:

```bash
curl http://localhost:3000/api/health
# { "status": "ok", "app": "KajLagbe", "timestamp": "..." }
```

---

## Neon database setup

1. Go to <https://console.neon.tech> and create a project (free tier).
2. Copy the **pooled** connection string (with `-pooler` in the host) → set as `DATABASE_URL`.
3. Copy the **direct** connection string (without `-pooler`) → set as `DIRECT_URL`.
4. Run `npm run db:push` locally to create the tables.
5. Run `npm run db:seed` to create the admin user, demo users, categories, and sample listings.

> Free Neon allows ~5 GB and one project. The schema is small; sample data fits easily.

---

## Vercel deployment

1. Push this repo to GitHub.
2. In Vercel, **Import Project** from your repo.
3. Set the same env variables (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `ADMIN_*`) under **Settings → Environment Variables**.
4. Use the default build command (`npm run build`). Vercel will run `prisma generate && next build`.
5. Run `npm run db:push` **locally** against Neon (or trigger via your machine) before the first deploy. Do not run migrations as part of the Vercel build.
6. Deploy.
7. After deploy, hit `/api/health` to verify, then `/login` and log in with the admin user.

> **Why not migrate during build?** Free Vercel build minutes are limited and the Vercel build runtime cannot reliably reach Neon for migrations. Use `prisma db push` locally during development; switch to `prisma migrate deploy` in CI for production.

---

## Project structure

```
kajlagbe/
  app/
    (public)/      Landing, listings, categories, info pages
    (auth)/        Login, register
    dashboard/     Customer dashboard + booking detail (shared by provider/admin)
    provider/     Provider dashboard, listing CRUD, bookings
    admin/         Moderation, payments, disputes, users, categories, audit
    actions/       Server actions (auth, booking, payment, listing, dispute, ...)
    api/health     /api/health JSON endpoint
  components/
    layout/        Main + mobile nav, footer
    listings/      Listing card / grid / filters / form
    bookings/      Booking timeline
    forms/         Image-URL list, submit button, form errors
    dashboard/     Stat card
    admin/         Admin sidebar
    shared/        Logo, status badge, price, rating, avatar, empty state
  lib/
    auth.ts        Session cookie + bcrypt + role helpers
    db.ts          Singleton Prisma client
    money.ts       BDT formatting + fee/total calc
    dates.ts       date-fns helpers
    constants.ts   App constants + banned/restricted keywords
    rate-limit.ts  Naive in-memory rate limiter
    actions.ts     Discriminated ActionResult helper
    validators/    Zod schemas
    services/      Listing/booking/payment/dispute/review/admin services
  prisma/
    schema.prisma
    seed.ts
  public/manifest.json + icons/
  middleware.ts    Route protection (dashboard/provider/admin)
```

---

## Booking state machines

### Tool rental
```
REQUESTED → ACCEPTED → PAYMENT_PENDING → CONFIRMED
       → PICKUP_SCHEDULED → IN_USE → RETURN_REQUESTED → RETURN_CONFIRMED → COMPLETED
```

### Skill / service
```
REQUESTED → (QUOTE_SENT) → ACCEPTED → PAYMENT_PENDING → CONFIRMED
       → STARTED → COMPLETED_BY_PROVIDER → CONFIRMED_BY_CUSTOMER → COMPLETED
```

Any eligible state can move to `CANCELLED` or `DISPUTED`. Every transition records a row in `BookingStatusHistory`.

---

## Pricing

```
Total = BaseFee + DeliveryFee + PlatformFee + Deposit − Discount
PlatformFee = BaseFee × commissionPercentage  (default 15%)
```

The commission percentage is **stored on the booking** at request time so historical records are preserved when the global default changes.

Suggested deposit guidance:

| Risk | Percentage of replacement value |
|---|---:|
| Low | 10% |
| Medium | 25% |
| High | 50% |

---

## Known MVP limitations

- Manual payment workflow only — no real bKash/Nagad/SSLCommerz integration. Customers paste a transaction ID + optional proof URL; admin verifies.
- No real-time chat — message thread polls on page refresh.
- Image uploads are URL-only. The repo defines a Cloudinary-friendly env stub but no upload component yet.
- In-memory login rate limiter; not reliable across serverless cold starts. Replace with Redis / Vercel KV for production.
- Audit logs are written sparsely; the admin audit-logs page is a viewer placeholder.
- Availability slots & blocked dates exist in the schema but the editor UI ships in a later release.
- No SMS OTP, KYC automation, escrow wallet, native app, map tracking, or insurance.

---

## Future improvements

1. Real bKash / Nagad / SSLCommerz / Card payment gateways
2. Real escrow wallet & payouts
3. SMS OTP for phone verification
4. Cloudinary / S3 image upload widget
5. Map-based search
6. Provider subscription / featured listings
7. Business / company accounts
8. Real-time chat (Pusher, Ably, or self-hosted)
9. Push notifications
10. Damage protection plan
11. NID / business verification automation
12. Delivery partner module
13. Bengali / English language toggle
14. Advanced analytics for providers
15. PWA push + offline fallback

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Generate Prisma client + build |
| `npm run start` | Start the production server |
| `npm run db:push` | Push schema to Neon (no migration history) |
| `npm run db:migrate` | Create a migration in dev |
| `npm run db:seed` | Run `prisma/seed.ts` |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run Next.js lint |

---

## License

MIT — see `LICENSE` (or remove this section if you ship without one).
