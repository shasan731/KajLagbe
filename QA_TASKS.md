# KajLagbe — QA Audit & Task List

Senior QA pass covering backend correctness, frontend / mobile UX, and Vercel + Neon free-tier deployment readiness. **97 findings**, prioritized so you can fix top-down.

Each task has:
- **Severity**: Critical / High / Medium / Low
- **Where**: file path with line numbers
- **What**: one-line description
- **Fix**: concrete recommendation

> **Read this first.** The four most important problems are:
> 1. A renter can self-confirm payment without admin verification (skips the manual-payment review entirely) — finding **B-1**.
> 2. No tool-rental conflict check; two customers can book the same tool over the same dates — finding **B-2**.
> 3. PWA install on Android & iOS is broken (SVG-only icons, no apple-touch-icon, no service worker) — findings **D-3, D-4, F-1**.
> 4. Admins have **zero** mobile navigation — finding **F-2**.

---

## Section A — Executive Summary

| Area | Critical | High | Medium | Low |
|---|---:|---:|---:|---:|
| Backend (B) | 6 | 14 | 16 | 10 |
| Frontend / Mobile (F) | 5 | 20 | 16 | 11 |
| Deployment / PWA (D) | 3 | 7 | 6 | 8 |

Many issues in mobile UX overlap with PWA readiness — fixing the manifest + adding mobile admin nav unlocks both.

---

## Section B — Backend & Logic Bugs

### B — Critical

- [ ] **B-1** Renter / provider can confirm their own booking after payment without admin review.
  *Where:* [`app/actions/booking.ts:77-82`](app/actions/booking.ts#L77-L82) → [`lib/services/booking-service.ts:260-266`](lib/services/booking-service.ts#L260-L266)
  *Fix:* Gate `confirmBookingAction` with `requireAdmin()`; restrict the `transition` call to admin-only (add `onlyAdmin` flag to `transition`). The whole point of the "manual payment" workflow is that admin verifies before the booking advances.

- [ ] **B-2** No conflict check on tool-rental bookings — two customers can book the same `TOOL_ONLY` listing over overlapping dates.
  *Where:* [`lib/services/booking-service.ts:76-126`](lib/services/booking-service.ts#L76-L126) (`requestBooking`)
  *Fix:* Before insert, query for bookings on the same `listingId` whose `status` is in the active set and whose `[startAt, endAt]` overlaps; reject if any. Better still: do this inside a `prisma.$transaction` and rely on a Postgres exclusion constraint on `listingId` + tstzrange.

- [ ] **B-3** Stale-status reads / race in handover confirmations.
  *Where:* [`lib/services/booking-service.ts` `confirmPickup` lines ~336-338, `confirmReturn` ~371-373](lib/services/booking-service.ts)
  *Fix:* The guard `booking.status === "PICKUP_SCHEDULED"` reads the in-memory copy from before the update. If renter and owner confirm concurrently, both can race past the guard. Use `update({ where: { id, status: "PICKUP_SCHEDULED" } })` with row-count check; wrap in `$transaction`. Pass the *actual* previous status to `recordStatusChange`.

- [ ] **B-4** Time-of-check / time-of-use race in registration.
  *Where:* [`app/actions/auth.ts:32-37`](app/actions/auth.ts#L32-L37)
  *Fix:* Drop the `findFirst` pre-check; rely on the unique index. Catch Prisma error code `P2002` from `prisma.user.create` and return a friendly "phone or email already registered" failure.

- [ ] **B-5** Payment verify / reject / refund / payout has no precondition on payment status.
  *Where:* [`lib/services/payment-service.ts:56-93`](lib/services/payment-service.ts#L56-L93)
  *Fix:* Each function should `update` with `where: { id, status: <expected> }` and check the row-count. Today an admin can re-verify an already-rejected payment, double-fire notifications, and re-confirm the booking.

- [ ] **B-6** Many state changes are non-atomic — booking-update + history-row + notification run as separate awaits.
  *Where:* [`lib/services/booking-service.ts:166-170`](lib/services/booking-service.ts#L166-L170) (`transition`); also `sendQuote`, `submitManualPayment`, `createDispute`.
  *Fix:* Wrap the whole status-change chain in `prisma.$transaction([...])`. Mid-execution Lambda timeout will otherwise leave orphaned states.

### B — High

- [ ] **B-7** Customer can self-promote to PROVIDER from the profile form with no verification, then create listings.
  *Where:* [`app/actions/profile.ts:31-63`](app/actions/profile.ts#L31-L63), profile schema permits `role: ["CUSTOMER","PROVIDER"]`.
  *Fix:* Either require admin approval for the role flip, or remove the role select from the profile form entirely and create a separate "Apply to be a provider" flow.

- [ ] **B-8** Banned/suspended users with valid JWTs aren't kicked out at the middleware layer.
  *Where:* [`middleware.ts:24-59`](middleware.ts#L24-L59)
  *Fix:* Middleware can't query Prisma on the Edge runtime. Add a `tokenVersion` claim to the JWT and bump it on ban/role-change/password-change; verify in middleware. Or move sensitive role checks into `requireUser` (Node-only) and skip them in middleware.

- [ ] **B-9** No session invalidation on role change, password change, or ban.
  *Where:* [`lib/auth.ts`](lib/auth.ts), 30-day session TTL
  *Fix:* Implement a `tokenVersion` per user (column + JWT claim); bump it whenever role, status, or password changes; revoke any existing sessions.

- [ ] **B-10** In-memory rate limiter is per-Lambda-instance only.
  *Where:* [`lib/rate-limit.ts`](lib/rate-limit.ts), used in [`app/actions/auth.ts:66`](app/actions/auth.ts#L66)
  *Fix:* Move to Vercel KV or Upstash Redis. Key on phone + IP. README already flags this — escalate to "must" before going to real users.

- [ ] **B-11** Admin moderation actions (`approveListing`, `rejectListing`, `suspendListing`) skip the existing zod validators and have no precondition on status.
  *Where:* [`lib/services/listing-service.ts:158-212`](lib/services/listing-service.ts#L158-L212), [`lib/validators/admin.ts`](lib/validators/admin.ts) (unused).
  *Fix:* Use `rejectListingSchema` / `suspendListingSchema` in the action layer; add `where: { id, status: 'PENDING_REVIEW' }` (or relevant) to the update.

- [ ] **B-12** `submitListingForReview` doesn't re-run banned-keyword check on the loaded record.
  *Where:* [`lib/services/listing-service.ts:141-156`](lib/services/listing-service.ts#L141-L156)
  *Fix:* Defense-in-depth — re-validate `title + description` against banned keywords before flipping to `PENDING_REVIEW`.

- [ ] **B-13** Banned-keyword detector uses substring `String.includes`. False positives ("begun", "argue") and trivial bypasses ("g.un", `g​un`).
  *Where:* [`lib/validators/listing.ts:17-20`](lib/validators/listing.ts#L17-L20)
  *Fix:* Normalize via `.normalize('NFKC').toLowerCase()`, strip zero-width chars, then word-boundary regex (`\bgun\b` etc.).

- [ ] **B-14** `submitManualPayment` doesn't validate booking status, doesn't check amount, and allows duplicate submissions.
  *Where:* [`lib/services/payment-service.ts:9-54`](lib/services/payment-service.ts#L9-L54)
  *Fix:* Restrict booking status to `ACCEPTED`/`PAYMENT_PENDING`; require amount within tolerance of `booking.totalAmount`; supersede prior `SUBMITTED` payments for the same booking.

- [ ] **B-15** `sendQuote` lets a provider rewrite `quotedAmount` from any state — including `COMPLETED`.
  *Where:* [`lib/services/booking-service.ts:208-241`](lib/services/booking-service.ts#L208-L241)
  *Fix:* Restrict from-states to `["REQUESTED", "QUOTE_SENT"]`.

- [ ] **B-16** `createDispute` force-sets booking to `DISPUTED` from any state, including `COMPLETED` or `CANCELLED`.
  *Where:* [`lib/services/dispute-service.ts:35-47`](lib/services/dispute-service.ts#L35-L47)
  *Fix:* Whitelist allowed from-states; reject otherwise. Wrap in `$transaction`.

- [ ] **B-17** Action wrappers use `requireUser` where they should use `requireProvider` / `requireAdmin`.
  *Where:* `app/actions/listing.ts`, `app/actions/booking.ts` — many functions.
  *Fix:* Use the most specific guard. Today a CUSTOMER can call `submitListingAction(...)` and only get rejected after a DB read.

- [ ] **B-18** `archiveListing` doesn't block when there are non-terminal bookings.
  *Where:* [`lib/services/listing-service.ts`](lib/services/listing-service.ts) (archive path)
  *Fix:* Refuse archive if any booking is not COMPLETED/CANCELLED/DISPUTED-resolved; notify open renters.

- [ ] **B-19** Admin can demote/ban the *last* admin and lock everyone out of the platform.
  *Where:* [`lib/services/admin-service.ts:47-66`](lib/services/admin-service.ts#L47-L66)
  *Fix:* Refuse to demote/ban the last remaining ADMIN; write an `AuditLog` row on every role/status change.

- [ ] **B-20** `verifyPayment`, `rejectPayment`, etc. don't write to `AuditLog`.
  *Where:* `lib/services/payment-service.ts`, `lib/services/admin-service.ts`, `lib/services/dispute-service.ts`.
  *Fix:* Add `auditLog.create` rows for every admin mutation; this is the entire purpose of the `AuditLog` model.

### B — Medium

- [ ] **B-21** Public listing query doesn't filter on owner status — listings of BANNED/SUSPENDED owners are visible.
  *Fix:* Add `owner: { status: 'ACTIVE' }` to `getPublicListings` and `getListingBySlug` filters.

- [ ] **B-22** `getProviderListings` is unbounded — no `take` / `skip`.
  *Where:* [`lib/services/listing-service.ts:322-332`](lib/services/listing-service.ts#L322-L332)
  *Fix:* Add pagination args; default `take: 50`.

- [ ] **B-23** `recalculateUserRating` / `recalculateListingRating` set rating to `0` when there are no reviews — UI then renders "0 stars" instead of "no reviews yet".
  *Where:* [`lib/services/review-service.ts:61-89`](lib/services/review-service.ts#L61-L89)
  *Fix:* Set to `null` (make column nullable); UI already checks `totalReviews > 0` before rendering, so this is mostly cosmetic — but the contract is wrong.

- [ ] **B-24** `createReview` writes the review and recalculates aggregates outside a transaction.
  *Where:* [`lib/services/review-service.ts:34-48`](lib/services/review-service.ts#L34-L48)
  *Fix:* `prisma.$transaction([...])` for the create + both recalcs + notification.

- [ ] **B-25** `updateTrustScore` is exported but never called.
  *Where:* [`lib/services/review-service.ts:91-106`](lib/services/review-service.ts#L91-L106)
  *Fix:* Call it after booking completion / cancellation events.

- [ ] **B-26** `calculateBookingAmounts` for `CUSTOM_QUOTE` stores `baseFee = 0` initially — misleading.
  *Where:* [`lib/services/booking-service.ts:43-74`](lib/services/booking-service.ts#L43-L74)
  *Fix:* Store nulls until quote is sent; or set status to `QUOTE_SENT` directly on request.

- [ ] **B-27** bcryptjs is pure-JS (slow on cold-starts), and `password.max(72)` is char-count not byte-count.
  *Where:* [`lib/auth.ts:25-31`](lib/auth.ts#L25-L31), [`lib/validators/auth.ts:11`](lib/validators/auth.ts#L11)
  *Fix:* Document the bcrypt 72-byte limit; reject passwords whose UTF-8 byte length exceeds 72.

- [ ] **B-28** Optimistic concurrency missing on `transition`.
  *Fix:* `update({ where: { id, status: { in: allowedFrom } } })` with `count` check.

- [ ] **B-29** Deactivating a category doesn't hide its listings.
  *Where:* [`lib/services/admin-service.ts:87-95`](lib/services/admin-service.ts#L87-L95)
  *Fix:* Filter `category: { isActive: true }` in `getPublicListings`, or batch-suspend listings on deactivate.

- [ ] **B-30** No graceful category-delete path — Prisma will throw on FK violation.
  *Fix:* Add a delete service that returns a friendly fail when listings/children exist.

- [ ] **B-31** `where.basePrice` builder spreads `undefined` — works but hides typing bug.
  *Where:* [`lib/services/listing-service.ts:243-269`](lib/services/listing-service.ts#L243-L269)
  *Fix:* Initialize as `{}` once if either bound is set.

- [ ] **B-32** Slug uniqueness via `Math.random` — collisions throw a 500 with no retry.
  *Where:* [`lib/slug.ts:11-15`](lib/slug.ts#L11-L15)
  *Fix:* Use `nanoid` and a small retry loop on collision.

- [ ] **B-33** Schema has no DB-level CHECK constraints (commission ≤ 100, basePrice ≥ 0, rating 1–5).
  *Where:* [`prisma/schema.prisma`](prisma/schema.prisma)
  *Fix:* Add via raw migration; defense-in-depth alongside zod.

- [ ] **B-34** Missing indexes on `Booking.completedAt`, `Payment.payerId`, `Listing.viewCount`, `User.createdAt`.
  *Fix:* Add indexes anticipating reports/admin filters.

- [ ] **B-35** Login error messages don't distinguish "phone not found" vs "wrong password" — good for security but no friendly hint either.
  *Fix:* Keep as-is for security; add a generic "if you don't have an account, register" link.

- [ ] **B-36** Notifications fire-and-await inside the `transition` chain; one failure aborts the whole transition.
  *Fix:* `Promise.allSettled` outside the transaction; log failures; never block the state change on a notification.

### B — Low

- [ ] **B-37** `getCurrentUser` queries Prisma on every call; called multiple times per render.
  *Fix:* Wrap with `import { cache } from 'react'`.

- [ ] **B-38** Profile email update doesn't catch P2002 (unique violation).
  *Where:* [`app/actions/profile.ts:8-29`](app/actions/profile.ts#L8-L29)
  *Fix:* Catch P2002 and return a friendly fail.

- [ ] **B-39** `adminDashboardStats.platformCommissionEstimate` ignores refunds and dispute deductions.
  *Fix:* Subtract `Dispute.refundAmount` / `deductionAmount`.

- [ ] **B-40** Seed script generates random slug suffixes, so re-seeding creates duplicate listings instead of being idempotent.
  *Where:* [`prisma/seed.ts`](prisma/seed.ts) ~line 300-325
  *Fix:* Use deterministic slugs (`slugify(title)`); or skip seeding if listings exist.

- [ ] **B-41** `sendQuote` allows `amount: 0` and has no upper bound.
  *Fix:* Add reasonable min/max bounds.

- [ ] **B-42** `submitManualPayment` allows `amount: 0` and has no rate-limit.
  *Where:* [`lib/validators/payment.ts:5`](lib/validators/payment.ts#L5)
  *Fix:* Min `> 0`; rate-limit the action.

- [ ] **B-43** `markNotificationRead` returns BatchPayload but caller never inspects the count — silent failure if user passes someone else's notification ID.
  *Fix:* Return a boolean and surface to caller.

- [ ] **B-44** Toggle-favorite has no rate limit.
  *Fix:* Add basic rate-limit; consider single-roundtrip upsert pattern.

- [ ] **B-45** `inputToData` strips two fields by name; rest fall through positionally — fragile if validators are renamed.
  *Where:* [`lib/services/listing-service.ts:11-15`](lib/services/listing-service.ts#L11-L15)
  *Fix:* Use Prisma generated `Listing.UncheckedCreateInput` as the canonical shape.

- [ ] **B-46** Middleware matcher doesn't include `/login` `/register` — logged-in users can still see those.
  *Fix:* Add a redirect away from auth pages when a session cookie is present.

---

## Section F — Frontend, UX, Mobile, Accessibility

### F — Critical

- [ ] **F-1** PWA icons are SVG-only with `purpose: "any maskable"` — Chrome on Android refuses to install, iOS shows a generic icon.
  *Where:* [`public/manifest.json:9-22`](public/manifest.json#L9-L22)
  *Fix:* Ship `192x192` and `512x512` PNG icons (and a separate `512x512` maskable PNG with safe-zone padding). Keep SVG as a supplementary entry only.

- [ ] **F-2** Admin layout has **zero** mobile navigation. The sidebar is `hidden md:block` and there's no MobileNav, no hamburger.
  *Where:* [`app/admin/layout.tsx`](app/admin/layout.tsx)
  *Fix:* Add a horizontally scrollable pill-row of admin sections under the header on `<md` (mirror the provider layout pattern), or render a mobile drawer toggle.

- [ ] **F-3** Listing detail's primary CTA (booking form) sits at the bottom of mobile flow — far below the fold, with no anchored action.
  *Where:* [`app/(public)/listings/[slug]/page.tsx:65, 160-193`](app/(public)/listings/[slug]/page.tsx#L65)
  *Fix:* Add a mobile-only sticky-bottom CTA (price + "Request to book" anchor link), or grid-`order` the booking aside above reviews on mobile.

- [ ] **F-4** Inline form components (`booking-actions.tsx` cancel/handover) trigger render-phase side-effects: `if (state.ok) { onDone(); router.refresh(); }` is called during render, not in `useEffect`.
  *Where:* [`app/dashboard/bookings/[id]/booking-actions.tsx:260-263, 302-305`](app/dashboard/bookings/[id]/booking-actions.tsx#L260)
  *Fix:* Wrap in `useEffect(() => { if (state.ok) {...} }, [state.ok])`. Today this can produce React warnings and infinite refresh loops.

- [ ] **F-5** Multiple destructive flows use native `prompt()` for the reason — unstyleable, looks broken on mobile, and inconsistent with the rest of the UI.
  *Where:* booking cancel/reject ([`booking-actions.tsx`](app/dashboard/bookings/[id]/booking-actions.tsx)), dispute reject ([`resolve-form.tsx`](app/admin/disputes/[id]/resolve-form.tsx)), payment reject ([`payment-actions.tsx`](app/admin/payments/payment-actions.tsx)), category status changes.
  *Fix:* Replace `prompt()` and `confirm()` with styled inline forms or a dialog component.

### F — High

- [ ] **F-6** No service worker — "PWA" is in name only. No offline fallback, no add-to-home-screen prompt logic.
  *Where:* `app/layout.tsx`, no `public/sw.js`.
  *Fix:* Adopt `next-pwa` or hand-roll a workbox SW that at minimum precaches `/`, `/listings`, `/login`, `/offline`.

- [ ] **F-7** No `apple-touch-icon`, no `appleWebApp` metadata.
  *Where:* [`app/layout.tsx:6-17`](app/layout.tsx#L6-L17)
  *Fix:*
  ```ts
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  ```
  Ship `/public/icons/apple-touch-icon.png` (180x180 PNG).

- [ ] **F-8** `MobileNav` uses `sticky bottom-0` (not `fixed`) — combined with Android Chrome's URL-bar behavior the nav can scroll off-screen.
  *Where:* [`components/layout/mobile-nav.tsx`](components/layout/mobile-nav.tsx)
  *Fix:* `fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]`. Add `pb-20` to dashboard/provider main containers.

- [ ] **F-9** `MobileNav` items are dashboard-centric. A provider on `/provider/bookings` sees a bottom nav pointing at `/dashboard/bookings` — duplicate, confusing.
  *Fix:* Make MobileNav role-aware (separate item arrays for customer / provider / admin).

- [ ] **F-10** Top nav on mobile (<md) has logo + auth buttons but no menu, no search input. Mobile users on `/` have no path to /listings/categories/safety.
  *Where:* [`components/layout/main-nav.tsx`](components/layout/main-nav.tsx)
  *Fix:* Add a hamburger that opens a drawer with Browse / Categories / Safety + a search input.

- [ ] **F-11** Listing filters are 8 stacked controls on mobile with no collapse — users scroll ~600px past filters before reaching results.
  *Where:* [`components/listings/listing-filters.tsx:61-148`](components/listings/listing-filters.tsx#L61)
  *Fix:* Wrap filters in a collapsible `<details>` or off-canvas drawer on mobile (default closed, with a "Show filters" button).

- [ ] **F-12** New-listing form is ~25 stacked inputs on mobile with no section grouping. Delivery section appears even for `SKILL_ONLY` where it doesn't apply.
  *Where:* [`components/listings/listing-form.tsx`](components/listings/listing-form.tsx)
  *Fix:* Group fields into accordion sections (Basics, Pricing, Location, Delivery, Details, Photos, Policies). Hide delivery block when `listingType === "SKILL_ONLY"`.

- [ ] **F-13** Listing form has no toast on success and doesn't reset — users can't tell whether the save worked.
  *Fix:* `useEffect` watching `state.ok`, fire `toast.success(state.message)` and either redirect to edit or `formRef.current?.reset()`.

- [ ] **F-14** Booking detail timeline lives in the right aside (`lg:grid-cols-3`) and on mobile appears at the very bottom after 5+ large cards.
  *Where:* [`app/dashboard/bookings/[id]/page.tsx:46-132`](app/dashboard/bookings/[id]/page.tsx#L46)
  *Fix:* On mobile, collapse timeline into an accordion right under the booking summary card.

- [ ] **F-15** Message thread compose row stacks badly on 360px — `<input w-44>` (attachment URL) forces the textarea to ~140px and the row overflows.
  *Where:* [`app/dashboard/bookings/[id]/message-thread.tsx:71-89`](app/dashboard/bookings/[id]/message-thread.tsx#L71)
  *Fix:* `flex-col sm:flex-row`. Hide attachment URL behind a "Attach" toggle.

- [ ] **F-16** Star-rating buttons in `review-section.tsx` have no `aria-label`, no radio-group semantics, and no keyboard arrow-key navigation.
  *Where:* [`app/dashboard/bookings/[id]/review-section.tsx:36-47`](app/dashboard/bookings/[id]/review-section.tsx#L36)
  *Fix:* `role="radiogroup"` wrapper; each button `role="radio" aria-checked={n === rating} aria-label="{n} stars"`; arrow-key handler.

- [ ] **F-17** Many `grid-cols-2` / `grid-cols-3` have no responsive prefix, so they stay multi-column at 360px. Sample sites:
  - [`app/(auth)/register/form.tsx:44-67`](app/(auth)/register/form.tsx#L44) — password / confirm password
  - [`app/dashboard/bookings/[id]/quote-form.tsx:15`](app/dashboard/bookings/[id]/quote-form.tsx#L15)
  - [`app/admin/disputes/[id]/resolve-form.tsx:40`](app/admin/disputes/[id]/resolve-form.tsx#L40)
  - [`app/provider/earnings/page.tsx:23`](app/provider/earnings/page.tsx#L23)
  *Fix:* Use `grid-cols-1 sm:grid-cols-2` (or 3) consistently.

- [ ] **F-18** Admin status-pill row sits on the same line as the heading — overflows badly on 360px.
  *Where:* [`app/admin/listings/page.tsx:35-49`](app/admin/listings/page.tsx#L35)
  *Fix:* `flex-col sm:flex-row`; let pills wrap below heading on mobile.

- [ ] **F-19** Admin settings page uses a plain `<table>` with no overflow wrapper — clips horizontally on mobile.
  *Where:* [`app/admin/settings/page.tsx:16-33`](app/admin/settings/page.tsx#L16)
  *Fix:* `<div className="overflow-x-auto">` wrapper, or convert to a stacked dl/list on mobile.

- [ ] **F-20** Booking and message list rows don't truncate long titles — names + listing title + status badge overflow on 360px.
  *Where:* [`app/dashboard/bookings/page.tsx:32-50`](app/dashboard/bookings/page.tsx#L32), [`app/dashboard/messages/page.tsx:33-55`](app/dashboard/messages/page.tsx#L33)
  *Fix:* Add `min-w-0` to the inner div and `truncate` to title elements.

- [ ] **F-21** Listing form `Detail` component force-`toLowerCase`s + `capitalize`s the value — mangles user-entered fields like "Like new" → "Like new" works but free-text would lose proper casing.
  *Where:* [`app/(public)/listings/[slug]/page.tsx:212`](app/(public)/listings/[slug]/page.tsx#L212), [`app/admin/listings/[id]/page.tsx:92`](app/admin/listings/[id]/page.tsx#L92)
  *Fix:* Don't normalize user-entered fields; only enums.

- [ ] **F-22** Datetime-local inputs allow past dates client-side — only server-side validation.
  *Where:* [`app/(public)/listings/[slug]/booking-form.tsx:67-87`](app/(public)/listings/[slug]/booking-form.tsx#L67)
  *Fix:* Add `min={new Date().toISOString().slice(0,16)}`.

- [ ] **F-23** No back button / breadcrumb on detail screens — fatal in PWA standalone where there's no browser back.
  *Where:* [`app/dashboard/bookings/[id]/page.tsx`](app/dashboard/bookings/[id]/page.tsx), [`app/dashboard/messages/[bookingId]/page.tsx`](app/dashboard/messages/[bookingId]/page.tsx), [`app/admin/disputes/[id]/page.tsx`](app/admin/disputes/[id]/page.tsx), [`app/(public)/listings/[slug]/page.tsx`](app/(public)/listings/[slug]/page.tsx)
  *Fix:* Add a `<Link href="...">← Back to ...</Link>` at the top of every detail page.

- [ ] **F-24** Login form has no "show password" toggle and no "forgot password" link.
  *Where:* [`app/(auth)/login/form.tsx`](app/(auth)/login/form.tsx)
  *Fix:* Eye toggle for show/hide; placeholder "Forgot password — contact admin" until reset flow is built.

- [ ] **F-25** Footer renders below MobileNav on dashboard layouts — two stacked bottom bars feel heavy.
  *Where:* [`components/layout/footer.tsx`](components/layout/footer.tsx) used in dashboard layouts
  *Fix:* `<Footer className="hidden md:block">` on dashboard/provider/admin layouts; only show on public pages.

### F — Medium

- [ ] **F-26** Provider sub-nav pills don't highlight the current page.
  *Where:* [`app/provider/layout.tsx:11-31`](app/provider/layout.tsx#L11)
  *Fix:* Convert to a client component using `usePathname`; apply `bg-brand-50 text-brand-800` to active link.

- [ ] **F-27** Hero "featured" tile grid pushes CTA below the fold on mobile.
  *Where:* [`app/(public)/page.tsx:30-46`](app/(public)/page.tsx#L30)
  *Fix:* `hidden md:grid` on the right-side tile grid, or limit to 2 thumbnails on mobile.

- [ ] **F-28** All `<img>` tags have no `width`/`height` → CLS on slow networks. Affects every listing card, hero, listing detail, admin moderation, provider listings, etc.
  *Fix:* Add explicit dimensions and `loading="lazy" decoding="async"` everywhere; consider migrating hero/featured to `next/image`.

- [ ] **F-29** Booking timeline shows all dots in the same color — user can't see which entry is current.
  *Where:* [`components/bookings/booking-timeline.tsx:19-31`](components/bookings/booking-timeline.tsx#L19)
  *Fix:* Highlight the entry where `h.newStatus === currentStatus`.

- [ ] **F-30** `MobileNav` "Home" tab is always active when any dashboard sub-route is open (because `path.startsWith("/dashboard")` matches everything).
  *Where:* [`components/layout/mobile-nav.tsx:25`](components/layout/mobile-nav.tsx#L25)
  *Fix:* Exact match for "/dashboard"; prefix match only for nested items.

- [ ] **F-31** Image-URL list "Add another" button is a plain text link — easy to miss as interactive.
  *Where:* [`components/forms/image-url-input-list.tsx:42-50`](components/forms/image-url-input-list.tsx#L42)
  *Fix:* `btn-secondary` styling with a `+` icon.

- [ ] **F-32** Hidden `<input type="hidden" name="imageUrls">` only renders filled rows; empty rows are silently dropped with no UI hint.
  *Fix:* Show "(will be ignored)" hint on empty rows, or block submit until empty rows are removed.

- [ ] **F-33** Favorite button only differs by color and heart fill — `aria-label` is static "Toggle favorite".
  *Where:* [`app/(public)/listings/[slug]/favorite-button.tsx:25`](app/(public)/listings/[slug]/favorite-button.tsx#L25)
  *Fix:* `aria-pressed={favored}` + dynamic label "Add to favorites" / "Remove from favorites".

- [ ] **F-34** SubmitButton has no `aria-busy` while pending.
  *Where:* [`components/forms/submit-button.tsx:23`](components/forms/submit-button.tsx#L23)
  *Fix:* `aria-busy={pending}` and an sr-only "Submitting…" span.

- [ ] **F-35** Notification "unread" indicator is color-only (a small green dot).
  *Where:* [`app/dashboard/notifications/page.tsx:41-45`](app/dashboard/notifications/page.tsx#L41)
  *Fix:* Bold the unread title in addition to the dot; add `aria-label="Unread"` on the dot.

- [ ] **F-36** Dispute / payment / handover sections drop server-side `fieldErrors` because their state types are `{ ok; error? }` only.
  *Where:* [`app/dashboard/bookings/[id]/dispute-section.tsx:28-31`](app/dashboard/bookings/[id]/dispute-section.tsx#L28), [`payment-section.tsx`](app/dashboard/bookings/[id]/payment-section.tsx)
  *Fix:* Widen state types to include `fieldErrors`; render per-field errors.

- [ ] **F-37** Pagination on listings page silently skips array search params.
  *Where:* [`app/(public)/listings/page.tsx:33-35`](app/(public)/listings/page.tsx#L33)
  *Fix:* Iterate with `appendAll` to preserve repeated params.

- [ ] **F-38** Backdrop blur on the top nav is a known performance hit on cheap Android devices.
  *Where:* [`components/layout/main-nav.tsx:10`](components/layout/main-nav.tsx#L10)
  *Fix:* `bg-white md:bg-white/80 md:backdrop-blur` — disable blur on small screens.

- [ ] **F-39** `useEffect` watcher for booking-form toast watches the whole `state` object — re-fires on identical errors.
  *Where:* [`app/(public)/listings/[slug]/booking-form.tsx:37-44`](app/(public)/listings/[slug]/booking-form.tsx#L37)
  *Fix:* Track last-handled state with a `useRef`, or watch a stable key (`state.ok`, `state.error` separately).

- [ ] **F-40** Tap highlight is removed (`-webkit-tap-highlight-color: transparent`) but no `:active` feedback added — buttons feel dead on cheap Androids.
  *Where:* [`app/globals.css:14-16`](app/globals.css#L14)
  *Fix:* Add `:active` scale or background-color transitions to buttons (already partly done via `active:scale-[0.98]` on `.btn`).

- [ ] **F-41** Login `searchParams.next` accepts any path starting with `/` but not role-checked. A customer logging in via `?next=/admin` gets bounced with no friendly message.
  *Where:* [`app/(auth)/login/page.tsx:7-10`](app/(auth)/login/page.tsx#L7)
  *Fix:* Validate role compatibility before redirecting; fall back to default dashboard.

### F — Low

- [ ] **F-42** No empty-state for "no notifications yet" beyond a small line — could be friendlier.
- [ ] **F-43** Logout button on `/dashboard` overflows on small phones with long names.
  *Where:* [`app/dashboard/page.tsx:38-41`](app/dashboard/page.tsx#L38)
  *Fix:* `flex-col sm:flex-row` + `min-w-0 truncate` on title.
- [ ] **F-44** No dark mode (could be deferred forever, but worth flagging).
- [ ] **F-45** `*  { box-sizing: border-box; }` is duplicate with Tailwind preflight.
- [ ] **F-46** `<form action="/listings">` in main-nav search uses native form submission; browser-level navigation works but feels jarring vs `router.push`.
- [ ] **F-47** No skeleton/loading state on any page (relying on server-side rendering only).
- [ ] **F-48** Listing card category label uses `text-xs uppercase` — fine but inconsistent vs the chip style on categories page.
- [ ] **F-49** Manifest is missing `id`, `scope`, `screenshots` — hurts Chrome's "richer install UI".
  *Fix:* Add `"id": "/"`, `"scope": "/"`, and at least one wide + one narrow screenshot.
- [ ] **F-50** `manifest.json` lacks `categories: ["business","shopping"]` and `lang: "en-BD"`.
- [ ] **F-51** Toaster `richColors` can stack identical toasts during fast resubmits — see F-39.
- [ ] **F-52** Footer copyright shows current year; fine, but no language toggle exists for Bangla even as a stub.

---

## Section D — Deployment, PWA, Vercel free-tier

### D — Critical

- [ ] **D-1** No `postinstall: prisma generate` hook.
  *Where:* [`package.json`](package.json) `scripts`
  *Fix:* Add `"postinstall": "prisma generate"`. Vercel caches `node_modules`; the cached `@prisma/client` can become stale across deploys when the schema changes.

- [ ] **D-2** No `runtime = 'nodejs'` declaration on layouts that depend on Prisma.
  *Where:* [`app/api/health/route.ts`](app/api/health/route.ts) is the only file that pins it.
  *Fix:* Add `export const runtime = "nodejs"` to `app/dashboard/layout.tsx`, `app/provider/layout.tsx`, `app/admin/layout.tsx`, and any future `route.ts` that touches Prisma. Today the app accidentally runs on Node by default; this makes the contract explicit.

- [ ] **D-3** Listings full-text search (`contains` + `mode: insensitive`) plus `force-dynamic` on every request risks the 10-second function limit on cold-starts.
  *Where:* [`app/(public)/listings/page.tsx`](app/(public)/listings/page.tsx) calling [`getPublicListings`](lib/services/listing-service.ts)
  *Fix:* Add a `pg_trgm` GIN index on `Listing.title` + `description`, switch to `tsvector` with `to_tsquery`. Also wrap Prisma calls in a small retry helper for Neon cold-start.

### D — High

- [ ] **D-4** PWA manifest icons are SVG-only — duplicate of F-1, called out separately because it ALSO blocks "Add to Home Screen" prompts on Android Chrome.
- [ ] **D-5** No `apple-touch-icon` / iOS metadata — duplicate of F-7.
- [ ] **D-6** No service worker — duplicate of F-6.
- [ ] **D-7** In-memory rate limiter doesn't work on Vercel — duplicate of B-10.
- [ ] **D-8** `images.remotePatterns` allows `**` over both http and https.
  *Where:* [`next.config.mjs:3-8`](next.config.mjs#L3)
  *Fix:* Restrict to your CDN(s) (Cloudinary). Two reasons: (a) free-tier image-optimizer abuse vector, (b) `<img>` everywhere bypasses optimization anyway, so this config is misleading.
- [ ] **D-9** No security headers configured.
  *Where:* [`next.config.mjs`](next.config.mjs)
  *Fix:* Add a `headers()` function returning at minimum `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and HSTS.
- [ ] **D-10** No `app/robots.ts` or `app/sitemap.ts`.
  *Fix:* Add `app/robots.ts` disallowing `/dashboard`, `/provider`, `/admin`, `/api`. Add `app/sitemap.ts` listing public categories/listings (cap at a few hundred entries).

### D — Medium

- [ ] **D-11** Home page is `force-dynamic` and runs two cold Prisma queries on every request.
  *Where:* [`app/(public)/page.tsx:7`](app/(public)/page.tsx#L7)
  *Fix:* Drop `force-dynamic`; use `export const revalidate = 60` so the landing page caches via ISR. `revalidatePath('/')` from the listing-approval action when listings change.

- [ ] **D-12** Admin list pages have `take: 100/200` and no real pagination.
  *Where:* `app/admin/users/page.tsx`, `app/admin/bookings/page.tsx`, `app/admin/payments/page.tsx`, `app/admin/disputes/page.tsx`, `app/admin/audit-logs/page.tsx`
  *Fix:* Cursor or page-based pagination; default `take: 50`.

- [ ] **D-13** `getCurrentUser` is called multiple times per render but is not memoized — duplicate of B-37, called out for the deployment cost.

- [ ] **D-14** `.env.example` shows a non-pooler URL; README says use pooled URL.
  *Where:* [`.env.example`](.env.example), [`README.md`](README.md)
  *Fix:* Update example to show `?sslmode=require&pgbouncer=true&connection_limit=1` for `DATABASE_URL` and a plain `?sslmode=require` for `DIRECT_URL`.

- [ ] **D-15** No retry / friendly error for Neon cold-start `P1001`/`P1017`.
  *Fix:* Wrap Prisma calls in a 3-attempt retry helper inside `lib/db.ts`; add `error.tsx` boundaries showing "Waking up — please refresh".

- [ ] **D-16** Health endpoint doesn't actually probe the database.
  *Where:* [`app/api/health/route.ts`](app/api/health/route.ts)
  *Fix:* `prisma.$queryRaw\`SELECT 1\`` behind a 2-second timeout; return 503 on failure.

### D — Low

- [ ] **D-17** No `metadataBase` set — Open Graph URLs render relative.
  *Where:* [`app/layout.tsx`](app/layout.tsx)
  *Fix:* `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")`.

- [ ] **D-18** `experimental.serverActions` shape is no longer experimental in Next 14.2+.
  *Where:* [`next.config.mjs:9-13`](next.config.mjs#L9)
  *Fix:* Move `serverActions: { bodySizeLimit: "2mb" }` to the top level.

- [ ] **D-19** No `vercel.json` pinning region.
  *Fix:* Add `vercel.json`: `{ "regions": ["iad1"] }`. Verify Neon project is in `aws-us-east-1`.

- [ ] **D-20** Manifest is missing `id`, `scope`, `screenshots`, `categories`, `lang`.
  *Fix:* See F-49 / F-50.

- [ ] **D-21** No keep-alive / pre-warm — Neon free tier auto-suspends after 5 min idle, so the first morning visitor takes the cold-start hit.
  *Fix:* (Optional) cron-ping `/api/health` every 4 minutes from a free uptime monitor.

- [ ] **D-22** README's "use `prisma db push` locally" is fine for MVP but doesn't scale.
  *Fix:* Document the migration story for v1 (`prisma migrate deploy` in CI / a one-shot Vercel build step gated behind an env flag).

- [ ] **D-23** No `app/loading.tsx` boundaries — every route shows a blank screen during navigation on slow networks.
  *Fix:* Add `app/loading.tsx` (or per-segment) with a skeleton.

- [ ] **D-24** No `app/error.tsx` global boundary — runtime errors show the default Next.js fallback.
  *Fix:* Add a styled `app/error.tsx` and per-segment ones for dashboard/provider/admin.

---

## Section R — Recommended fix order

If you have one focused day, do these in order. Each line lists tasks above.

1. **Security & data correctness (must-fix before real users):** B-1 → B-2 → B-3 → B-4 → B-5 → B-6 → B-7 → B-8 → B-9 → B-10 → B-19.
2. **Mobile / PWA installability (must-fix to ship as a "PWA"):** F-1 → F-2 → F-6 → F-7 → F-8 → F-10 → F-23 → D-4..D-7 → D-20.
3. **Top mobile UX rough edges:** F-3 → F-4 → F-5 → F-11 → F-12 → F-14 → F-15 → F-17.
4. **Vercel polish:** D-1 → D-2 → D-3 → D-8 → D-9 → D-10 → D-19.
5. **Everything else** in the order above.

---

## Section P — Pre-launch acceptance checklist

Before going live with real users, verify each of the following:

- [ ] **Booking** — two customers cannot book the same TOOL_ONLY listing over overlapping dates (B-2)
- [ ] **Booking** — a customer cannot self-confirm payment without admin verification (B-1)
- [ ] **Auth** — registering twice with the same phone returns a friendly error (B-4)
- [ ] **Admin** — banning a user immediately revokes their session (B-8 / B-9)
- [ ] **Admin** — last admin cannot demote/ban themselves (B-19)
- [ ] **PWA** — Android Chrome shows the install prompt and installs with a proper PNG icon (F-1 / D-4)
- [ ] **PWA** — iOS Safari "Add to Home Screen" uses the custom icon and opens fullscreen (F-7 / D-5)
- [ ] **Mobile** — admin can navigate between admin sections at 360px width (F-2)
- [ ] **Mobile** — booking detail's primary CTA is reachable without scrolling past 5+ cards (F-3)
- [ ] **Mobile** — no `prompt()`/`confirm()` dialogs in any flow (F-5)
- [ ] **Vercel** — `prisma generate` runs on every deploy via `postinstall` (D-1)
- [ ] **Vercel** — `/api/health` does a real DB probe and returns 503 on failure (D-16)
- [ ] **Vercel** — security headers are set (D-9)
- [ ] **Vercel** — `robots.txt` disallows admin / dashboard / provider (D-10)
- [ ] **Neon** — `DATABASE_URL` uses the pooled host with `pgbouncer=true&connection_limit=1` (D-14)
- [ ] **Neon** — first request after suspend shows a friendly retry message instead of a 500 (D-15)

---

*Generated by senior-QA audit. 97 findings across backend (46), frontend / mobile (52), and deployment / PWA (24); some PWA & mobile issues appear in both categories with cross-references.*
