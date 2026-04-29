# KajLagbe — Tools & Skills Rent Marketplace

## Coding Agent Build Specification

Build a complete production-minded MVP from beginning to end.

The application is a Bangladesh-focused marketplace where users can rent local tools, hire local skills, or book tool-with-operator services.

The app must be deployable on:

- **Frontend + backend:** Vercel free/Hobby tier
- **Database:** Neon PostgreSQL free tier
- **Architecture:** Serverless-friendly Next.js full-stack application
- **AI:** No AI features required

---

# 1. Product Summary

## 1.1 Product Name

**KajLagbe**

Meaning: “I need work/service/tool.”

## 1.2 Product Tagline

**Rent tools. Hire local skills. Pay only when needed.**

## 1.3 Product Concept

KajLagbe is a local rental and skill-booking marketplace for Bangladesh.

Users can:

1. Rent tools from nearby people.
2. Hire skilled people for short-duration work.
3. Book tool-with-operator services.
4. List their own tools or skills to earn money.

Examples:

- Drill machine rental
- Ladder rental
- Projector rental
- Sound system rental
- Electrician booking
- Plumber booking
- Home cooking service
- Cleaning service
- Birthday magician booking
- Moving helper booking
- Photographer booking
- Tool with operator, such as “drill service with operator”

---

# 2. Deployment Constraints

This project must be designed for Vercel free/Hobby tier and Neon free tier.

## 2.1 Vercel Constraints

Design rules:

- Use Next.js App Router.
- Use server actions and route handlers for backend logic.
- Do not use long-running server jobs.
- Do not rely on persistent local filesystem storage.
- Do not run background workers on Vercel.
- Avoid heavy image processing on the server.
- Keep all server operations short.
- Use pagination everywhere.
- Use database indexes on frequently queried fields.
- Do not implement real-time WebSocket chat in MVP.
- Use polling or page refresh for notifications/messages.
- Use Node.js runtime for Prisma/database operations.
- Do not use Edge runtime for Prisma route handlers.

## 2.2 Neon Constraints

Design rules:

- Use PostgreSQL via Neon.
- Use Prisma ORM.
- Use pooled Neon connection string for runtime.
- Use direct Neon connection string for migrations.
- Keep schema practical and indexed.
- Avoid large binary storage in database.
- Do not store images directly in PostgreSQL.
- Store only image URLs.
- Keep audit logs small.
- Delete or archive unnecessary logs if needed.

## 2.3 File Upload Strategy

For MVP:

- Do not store uploaded files in Vercel filesystem.
- Support image URLs for listing images, handover photos, dispute evidence, and profile photos.
- Create a storage adapter interface so Cloudinary, UploadThing, Vercel Blob, or S3-compatible storage can be added later.
- UI should allow image URL entry in MVP.
- Optional enhancement: if `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` exist, enable Cloudinary upload.

---

# 3. Recommended Tech Stack

## 3.1 Core Stack

Use:

- Next.js latest stable App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- Neon PostgreSQL
- React Hook Form
- Zod
- bcryptjs
- jose for JWT/session cookies
- date-fns
- lucide-react
- sonner for toasts

## 3.2 Do Not Use

Do not use:

- MongoDB
- Firebase as primary database
- Supabase as primary database
- AI SDK
- WebSocket server
- Long-running queue worker
- Local file uploads as final storage
- Paid-only services as required dependencies

---

# 4. User Roles

## 4.1 Roles

```ts
enum UserRole {
  CUSTOMER
  PROVIDER
  ADMIN
}
```

A user can be both renter and provider. The `PROVIDER` role means the user can create tool/skill listings.

## 4.2 Permission Matrix

| Action | Customer | Provider | Admin |
|---|---:|---:|---:|
| Browse listings | Yes | Yes | Yes |
| Request booking | Yes | Yes | Yes |
| Create listing | No | Yes | Yes |
| Accept/reject booking | No | Yes, own listings | Yes |
| Manage own profile | Yes | Yes | Yes |
| Review after booking | Yes | Yes | Yes |
| Raise dispute | Yes | Yes | Yes |
| Moderate listings | No | No | Yes |
| Manage disputes | No | No | Yes |
| Manage users | No | No | Yes |
| Manage categories | No | No | Yes |
| View admin dashboard | No | No | Yes |

---

# 5. Marketplace Listing Types

## 5.1 Listing Types

```ts
enum ListingType {
  TOOL_ONLY
  SKILL_ONLY
  TOOL_WITH_OPERATOR
  PACKAGE
}
```

## 5.2 Tool Only

Example:

- Drill machine
- Ladder
- Projector
- Cleaning machine

The renter uses the tool themselves.

Requires:

- Deposit
- Replacement value
- Handover checklist
- Return confirmation
- Damage/late fee rules

## 5.3 Skill Only

Example:

- Cooking
- Cleaning
- Electrician
- Plumber
- Magic show

Requires:

- Service area
- Price type
- Availability
- Quote or fixed fee
- Completion confirmation

## 5.4 Tool With Operator

Example:

- Drill machine with operator
- Projector setup with operator
- Sound system with technician
- Pressure washing with operator

This is the safest first-market model.

Requires:

- Service price
- Service area
- Provider availability
- No large refundable deposit required by default

## 5.5 Package

Example:

- Birthday package: speaker + light + magician
- Small event package: projector + sound + operator

Requires:

- Package description
- Included items/services
- Optional custom quote

---

# 6. MVP Scope

## 6.1 MVP Must Include

Build these features fully:

1. Landing page
2. User registration/login/logout
3. Customer dashboard
4. Provider dashboard
5. Admin dashboard
6. Profile management
7. Category browsing
8. Search/filter listings
9. Listing details page
10. Provider listing creation/editing
11. Admin listing moderation
12. Booking request flow
13. Provider accept/reject flow
14. Manual payment record flow
15. Booking status tracking
16. Handover checklist for tools
17. Service completion flow for skills
18. Review/rating system
19. Dispute creation
20. Admin dispute resolution
21. Basic in-app messaging per booking
22. Notifications page
23. Favorites/saved listings
24. Seed data
25. Deployment-ready configuration

## 6.2 MVP Should Not Include

Do not implement these in MVP:

1. Real payment gateway integration
2. Real escrow wallet
3. Real-time chat
4. Native mobile app
5. Complex KYC automation
6. Background worker queue
7. SMS OTP integration
8. AI matching
9. Map tracking
10. Insurance system

However, design the database and service layer so these can be added later.

---

# 7. Core Business Rules

## 7.1 Legal and Safety Rules

The platform must reject illegal or restricted listings.

Create a banned keyword/category system.

Banned examples:

- Weapons
- Explosives
- Fireworks
- Illegal drugs
- Alcohol
- Gambling/betting
- Prescription medicine sale
- Fake documents
- Spy devices
- Adult/sexual services
- Stolen goods
- Hazardous chemicals
- Exam cheating services

Restricted examples:

- Heavy machinery
- Gas line repair
- Electrical work
- Medical equipment
- Childcare
- High-value camera/lens
- Generator

For MVP:

- Banned categories cannot be listed.
- Restricted categories require admin approval.
- Every listing starts as `PENDING_REVIEW`.

## 7.2 Listing Moderation Logic

New listing status:

```text
DRAFT -> PENDING_REVIEW -> ACTIVE
                    -> REJECTED
                    -> SUSPENDED
```

Rules:

- Provider creates listing as draft.
- Provider submits listing for review.
- Admin approves or rejects.
- Only active listings are visible publicly.
- Admin can suspend listing anytime.

## 7.3 Booking State Machine: Tool Rental

```text
REQUESTED
  -> ACCEPTED
  -> PAYMENT_PENDING
  -> CONFIRMED
  -> PICKUP_SCHEDULED
  -> IN_USE
  -> RETURN_DUE
  -> RETURN_REQUESTED
  -> RETURN_CONFIRMED
  -> COMPLETED

Any eligible state:
  -> CANCELLED
  -> DISPUTED
```

## 7.4 Booking State Machine: Skill Service

```text
REQUESTED
  -> QUOTE_SENT
  -> ACCEPTED
  -> PAYMENT_PENDING
  -> CONFIRMED
  -> PROVIDER_ON_WAY
  -> STARTED
  -> COMPLETED_BY_PROVIDER
  -> CONFIRMED_BY_CUSTOMER
  -> COMPLETED

Any eligible state:
  -> CANCELLED
  -> DISPUTED
```

## 7.5 Booking Rules

- A user cannot book their own listing.
- A listing must be active to be booked.
- Booking start date must be before end date.
- Booking cannot be in the past.
- Tool rentals require start and end date/time.
- Skill bookings require appointment date/time and job description.
- Provider must accept booking before payment status can move forward.
- Payment is manual in MVP: user enters payment method, transaction ID, amount, and optional screenshot URL.
- Admin can mark payment as verified.
- Provider can only manage bookings for own listings.

## 7.6 Deposit Rules

Tool-only listings require deposit.

Tool-with-operator may have zero deposit.

Skill-only listings usually have no deposit, but may require advance payment.

Deposit logic:

```text
Suggested Deposit = Replacement Value × Risk Percentage
```

Suggested risk percentages:

| Risk | Percentage |
|---|---:|
| Low | 10% |
| Medium | 25% |
| High | 50% |

Deposit is not automatically refunded in MVP. It is tracked as a payment record and admin/provider can mark it as refunded manually.

## 7.7 Late Fee Rules

Each listing may define:

- Late fee amount
- Late fee unit: hour/day

Late fee formula:

```text
Late Fee = Late Duration × Late Rate
```

In MVP:

- Calculate late fee visually.
- Do not auto-charge.
- Admin/provider can add late fee note in dispute or booking notes.

## 7.8 Damage Claim Rules

Damage claim requires:

- Damage description
- Before handover photo URL
- After return photo URL
- Claimed amount
- Admin decision

Damage claim can be handled through dispute system.

---

# 8. Pricing Logic

## 8.1 Price Types

```ts
enum PriceType {
  HOURLY
  DAILY
  WEEKLY
  TASK
  PACKAGE
  CUSTOM_QUOTE
}
```

## 8.2 Total Cost Formula

```text
Total Amount = Base Fee + Delivery Fee + Platform Fee + Deposit - Discount
```

For MVP:

- No coupon/discount required.
- Platform fee should be configurable globally.
- Default platform fee: 15%.

## 8.3 Platform Fee

```text
Platform Fee = Base Fee × Commission Percentage
```

Default:

- Tool rental: 15%
- Skill service: 15%
- Tool with operator: 15%
- Package: 15%

Store commission percentage on booking to preserve historical data.

---

# 9. Pages and Routes

Use Next.js App Router.

## 9.1 Public Pages

```text
/
/listings
/listings/[id]
/categories
/categories/[slug]
/login
/register
/about
/safety
/terms
/privacy
```

## 9.2 Authenticated User Pages

```text
/dashboard
/dashboard/bookings
/dashboard/bookings/[id]
/dashboard/favorites
/dashboard/messages
/dashboard/messages/[bookingId]
/dashboard/notifications
/dashboard/profile
/dashboard/settings
```

## 9.3 Provider Pages

```text
/provider
/provider/listings
/provider/listings/new
/provider/listings/[id]/edit
/provider/bookings
/provider/bookings/[id]
/provider/earnings
/provider/reviews
/provider/availability
```

## 9.4 Admin Pages

```text
/admin
/admin/users
/admin/users/[id]
/admin/listings
/admin/listings/[id]
/admin/categories
/admin/bookings
/admin/bookings/[id]
/admin/disputes
/admin/disputes/[id]
/admin/payments
/admin/reviews
/admin/settings
/admin/audit-logs
```

---

# 10. UI Requirements

## 10.1 Design Style

Use a clean, mobile-first Bangladesh-friendly UI.

Style:

- Mobile-first layout
- Large touch targets
- Clear Bangla-friendly labels
- Simple cards
- Minimal clutter
- Strong status badges
- Clear prices in BDT
- Use `৳` symbol
- Avoid complex dashboards for normal users

## 10.2 Navigation

Desktop:

- Top navbar
- Search bar
- Category links
- Login/register/profile

Mobile:

- Bottom navigation for logged-in users
- Home
- Search
- Bookings
- Messages
- Profile

## 10.3 Important Components

Build reusable components:

```text
components/
  app-logo.tsx
  main-nav.tsx
  mobile-nav.tsx
  listing-card.tsx
  listing-grid.tsx
  listing-filters.tsx
  price-display.tsx
  status-badge.tsx
  rating-stars.tsx
  user-avatar.tsx
  empty-state.tsx
  confirm-dialog.tsx
  form-field-error.tsx
  image-url-input-list.tsx
  booking-timeline.tsx
  handover-checklist.tsx
  admin-sidebar.tsx
  dashboard-card.tsx
```

---

# 11. Database Schema

Use Prisma.

Create `prisma/schema.prisma` with the following models and enums.

## 11.1 Prisma Datasource

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 11.2 Enums

```prisma
enum UserRole {
  CUSTOMER
  PROVIDER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

enum VerificationLevel {
  PHONE
  EMAIL
  ID_DOCUMENT
  ADDRESS
  BUSINESS
}

enum ListingType {
  TOOL_ONLY
  SKILL_ONLY
  TOOL_WITH_OPERATOR
  PACKAGE
}

enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  ACTIVE
  REJECTED
  SUSPENDED
  ARCHIVED
}

enum PriceType {
  HOURLY
  DAILY
  WEEKLY
  TASK
  PACKAGE
  CUSTOM_QUOTE
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

enum BookingStatus {
  REQUESTED
  QUOTE_SENT
  ACCEPTED
  PAYMENT_PENDING
  CONFIRMED
  PICKUP_SCHEDULED
  IN_USE
  RETURN_DUE
  RETURN_REQUESTED
  RETURN_CONFIRMED
  PROVIDER_ON_WAY
  STARTED
  COMPLETED_BY_PROVIDER
  CONFIRMED_BY_CUSTOMER
  COMPLETED
  CANCELLED
  DISPUTED
}

enum PaymentMethod {
  CASH
  BKASH
  NAGAD
  ROCKET
  BANK_TRANSFER
  CARD
  OTHER
}

enum PaymentStatus {
  PENDING
  SUBMITTED
  VERIFIED
  REJECTED
  REFUNDED
  RELEASED
}

enum PaymentType {
  RENTAL_FEE
  SERVICE_FEE
  DEPOSIT
  PLATFORM_FEE
  DELIVERY_FEE
  REFUND
  PAYOUT
  DAMAGE_FEE
  LATE_FEE
}

enum HandoverType {
  PICKUP
  RETURN
  SERVICE_START
  SERVICE_END
}

enum DisputeStatus {
  OPEN
  IN_REVIEW
  RESOLVED
  REJECTED
}

enum DisputeType {
  ITEM_DAMAGED
  ITEM_NOT_RETURNED
  FAKE_LISTING
  SERVICE_INCOMPLETE
  PROVIDER_NO_SHOW
  CUSTOMER_NO_SHOW
  PAYMENT_ISSUE
  DEPOSIT_ISSUE
  OTHER
}

enum NotificationType {
  BOOKING
  PAYMENT
  MESSAGE
  DISPUTE
  REVIEW
  SYSTEM
}
```

## 11.3 Models

```prisma
model User {
  id              String      @id @default(cuid())
  name            String
  phone           String      @unique
  email           String?     @unique
  passwordHash    String
  role            UserRole    @default(CUSTOMER)
  status          UserStatus  @default(ACTIVE)
  trustScore      Int         @default(50)
  averageRating   Decimal     @default(0) @db.Decimal(3, 2)
  totalReviews    Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  profile         UserProfile?
  listings        Listing[]   @relation("UserListings")
  renterBookings  Booking[]   @relation("RenterBookings")
  ownerBookings   Booking[]   @relation("OwnerBookings")
  sentMessages    Message[]   @relation("SentMessages")
  receivedMessages Message[]  @relation("ReceivedMessages")
  reviewsGiven    Review[]    @relation("ReviewsGiven")
  reviewsReceived Review[]    @relation("ReviewsReceived")
  disputesRaised  Dispute[]
  notifications   Notification[]
  favorites       Favorite[]
  auditLogs        AuditLog[]

  @@index([role])
  @@index([status])
  @@index([trustScore])
}

model UserProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  avatarUrl          String?
  bio                String?
  addressArea        String?
  city               String?
  gender             String?
  nidVerified        Boolean  @default(false)
  businessVerified   Boolean  @default(false)
  addressVerified    Boolean  @default(false)
  responseRate       Decimal  @default(0) @db.Decimal(5, 2)
  completedBookings  Int      @default(0)
  cancelledBookings  Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Category {
  id            String       @id @default(cuid())
  name          String
  slug          String       @unique
  description   String?
  type          ListingType?
  parentId      String?
  isRestricted  Boolean      @default(false)
  isBanned       Boolean      @default(false)
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  parent        Category?    @relation("CategoryTree", fields: [parentId], references: [id])
  children      Category[]   @relation("CategoryTree")
  listings      Listing[]

  @@index([slug])
  @@index([type])
  @@index([isActive])
}

model Listing {
  id                    String        @id @default(cuid())
  ownerId               String
  categoryId            String
  listingType           ListingType
  status                ListingStatus @default(DRAFT)
  title                 String
  slug                  String        @unique
  description           String
  brand                 String?
  model                 String?
  condition             String?
  priceType             PriceType
  basePrice             Decimal       @db.Decimal(10, 2)
  commissionPercentage  Decimal       @default(15) @db.Decimal(5, 2)
  depositAmount         Decimal       @default(0) @db.Decimal(10, 2)
  replacementValue      Decimal       @default(0) @db.Decimal(10, 2)
  riskLevel             RiskLevel     @default(LOW)
  deliveryAvailable     Boolean       @default(false)
  deliveryBaseFee       Decimal       @default(0) @db.Decimal(10, 2)
  deliveryPerKmFee      Decimal       @default(0) @db.Decimal(10, 2)
  serviceArea           String?
  locationArea          String
  city                  String        @default("Dhaka")
  exactLocation         String?
  publicLocationNote    String?
  lateFeeAmount         Decimal       @default(0) @db.Decimal(10, 2)
  lateFeeUnit           String?       // HOUR or DAY
  includedItems         String?
  notIncludedItems      String?
  safetyInstructions    String?
  cancellationPolicy    String?
  adminNote             String?
  viewCount             Int           @default(0)
  averageRating         Decimal       @default(0) @db.Decimal(3, 2)
  totalReviews          Int           @default(0)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  owner                 User          @relation("UserListings", fields: [ownerId], references: [id], onDelete: Cascade)
  category              Category      @relation(fields: [categoryId], references: [id])
  images                ListingImage[]
  availabilitySlots     AvailabilitySlot[]
  blockedDates          BlockedDate[]
  bookings              Booking[]
  favorites             Favorite[]

  @@index([ownerId])
  @@index([categoryId])
  @@index([listingType])
  @@index([status])
  @@index([city])
  @@index([locationArea])
  @@index([basePrice])
  @@index([averageRating])
  @@index([createdAt])
}

model ListingImage {
  id        String   @id @default(cuid())
  listingId String
  url       String
  alt       String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
}

model AvailabilitySlot {
  id          String   @id @default(cuid())
  listingId   String
  dayOfWeek   Int      // 0 Sunday, 6 Saturday
  startTime   String   // HH:mm
  endTime     String   // HH:mm
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@index([dayOfWeek])
}

model BlockedDate {
  id        String   @id @default(cuid())
  listingId String
  date      DateTime
  reason    String?
  createdAt DateTime @default(now())

  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@index([date])
}

model Booking {
  id                    String        @id @default(cuid())
  listingId             String
  renterId              String
  ownerId               String
  status                BookingStatus @default(REQUESTED)
  startAt               DateTime
  endAt                 DateTime?
  jobDescription        String?
  renterNote            String?
  ownerNote             String?
  quotedAmount          Decimal?      @db.Decimal(10, 2)
  baseFee               Decimal       @default(0) @db.Decimal(10, 2)
  deliveryFee           Decimal       @default(0) @db.Decimal(10, 2)
  depositAmount         Decimal       @default(0) @db.Decimal(10, 2)
  platformFee           Decimal       @default(0) @db.Decimal(10, 2)
  commissionPercentage  Decimal       @default(15) @db.Decimal(5, 2)
  totalAmount           Decimal       @default(0) @db.Decimal(10, 2)
  cancellationReason    String?
  completedAt           DateTime?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  listing               Listing       @relation(fields: [listingId], references: [id])
  renter                User          @relation("RenterBookings", fields: [renterId], references: [id])
  owner                 User          @relation("OwnerBookings", fields: [ownerId], references: [id])
  statusHistory         BookingStatusHistory[]
  payments              Payment[]
  handovers             HandoverRecord[]
  disputes              Dispute[]
  reviews               Review[]
  messages              Message[]
  notifications         Notification[]

  @@index([listingId])
  @@index([renterId])
  @@index([ownerId])
  @@index([status])
  @@index([startAt])
  @@index([createdAt])
}

model BookingStatusHistory {
  id          String        @id @default(cuid())
  bookingId   String
  oldStatus   BookingStatus?
  newStatus   BookingStatus
  changedById String?
  note        String?
  createdAt   DateTime      @default(now())

  booking     Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([createdAt])
}

model Payment {
  id            String        @id @default(cuid())
  bookingId     String
  payerId       String?
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  type          PaymentType
  status        PaymentStatus @default(PENDING)
  transactionId String?
  proofImageUrl String?
  adminNote     String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  booking       Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([status])
  @@index([method])
  @@index([createdAt])
}

model HandoverRecord {
  id                    String       @id @default(cuid())
  bookingId             String
  type                  HandoverType
  confirmedByRenter     Boolean      @default(false)
  confirmedByOwner      Boolean      @default(false)
  renterConfirmedAt     DateTime?
  ownerConfirmedAt      DateTime?
  conditionNote         String?
  otpCodeHash           String?
  otpVerified           Boolean      @default(false)
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  booking               Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  media                 HandoverMedia[]

  @@index([bookingId])
  @@index([type])
}

model HandoverMedia {
  id          String         @id @default(cuid())
  handoverId  String
  url         String
  note        String?
  createdAt   DateTime       @default(now())

  handover    HandoverRecord @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
}

model Dispute {
  id              String        @id @default(cuid())
  bookingId       String
  raisedById      String
  type            DisputeType
  status          DisputeStatus @default(OPEN)
  title           String
  description     String
  claimedAmount   Decimal?      @db.Decimal(10, 2)
  adminDecision   String?
  refundAmount    Decimal?      @db.Decimal(10, 2)
  deductionAmount Decimal?      @db.Decimal(10, 2)
  resolvedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  booking         Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  raisedBy        User          @relation(fields: [raisedById], references: [id])
  evidence        DisputeEvidence[]

  @@index([bookingId])
  @@index([raisedById])
  @@index([status])
  @@index([createdAt])
}

model DisputeEvidence {
  id          String   @id @default(cuid())
  disputeId   String
  url         String?
  text        String?
  createdAt   DateTime @default(now())

  dispute     Dispute  @relation(fields: [disputeId], references: [id], onDelete: Cascade)

  @@index([disputeId])
}

model Review {
  id             String   @id @default(cuid())
  bookingId      String
  reviewerId     String
  reviewedUserId String
  listingId      String?
  rating         Int
  comment        String?
  createdAt      DateTime @default(now())

  booking        Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  reviewer       User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  reviewedUser   User     @relation("ReviewsReceived", fields: [reviewedUserId], references: [id])

  @@unique([bookingId, reviewerId])
  @@index([reviewedUserId])
  @@index([listingId])
  @@index([rating])
}

model Message {
  id          String   @id @default(cuid())
  bookingId   String?
  senderId    String
  receiverId  String
  message     String
  attachmentUrl String?
  readAt      DateTime?
  createdAt   DateTime @default(now())

  booking     Booking? @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])

  @@index([bookingId])
  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
}

model Notification {
  id          String           @id @default(cuid())
  userId      String
  bookingId   String?
  type        NotificationType
  title       String
  body        String
  readAt      DateTime?
  createdAt   DateTime         @default(now())

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  booking     Booking?         @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([readAt])
  @@index([createdAt])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@index([userId])
  @@index([listingId])
}

model PlatformSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  entityType  String
  entityId    String?
  metadata    Json?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([createdAt])
}
```

---

# 12. Project Structure

Use this structure:

```text
kajlagbe/
  app/
    (public)/
      page.tsx
      listings/
      categories/
      about/
      safety/
      terms/
      privacy/
    (auth)/
      login/
      register/
    dashboard/
      page.tsx
      bookings/
      favorites/
      messages/
      notifications/
      profile/
      settings/
    provider/
      page.tsx
      listings/
      bookings/
      earnings/
      reviews/
      availability/
    admin/
      page.tsx
      users/
      listings/
      categories/
      bookings/
      disputes/
      payments/
      reviews/
      settings/
      audit-logs/
    api/
      health/
      auth/
      listings/
      bookings/
      payments/
      messages/
      admin/
    layout.tsx
    globals.css
  components/
    ui/
    layout/
    listings/
    bookings/
    forms/
    dashboard/
    admin/
    shared/
  lib/
    auth.ts
    db.ts
    permissions.ts
    slug.ts
    money.ts
    dates.ts
    constants.ts
    validators/
    services/
      listing-service.ts
      booking-service.ts
      payment-service.ts
      review-service.ts
      dispute-service.ts
      notification-service.ts
      admin-service.ts
  prisma/
    schema.prisma
    seed.ts
  public/
    manifest.json
    icons/
  middleware.ts
  package.json
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  .env.example
  README.md
```

---

# 13. Authentication

## 13.1 MVP Auth Method

Use custom cookie-based authentication.

Reason:

- Simple
- No paid service required
- Works on Vercel
- Phone-first design
- Email optional

## 13.2 Registration Fields

Required:

- Name
- Phone number
- Password
- Confirm password
- Role selection: customer or provider

Optional:

- Email
- City
- Area

## 13.3 Login Fields

- Phone number
- Password

## 13.4 Security Rules

- Hash password using `bcryptjs`.
- Store session token in HTTP-only cookie.
- Use `jose` for JWT signing/verification.
- Cookie must be `httpOnly`, `sameSite: 'lax'`, `secure` in production.
- Do not expose password hash.
- Middleware protects dashboard/provider/admin routes.
- Admin route requires role `ADMIN`.

## 13.5 Auth Helper Functions

Implement:

```ts
getCurrentUser()
requireUser()
requireAdmin()
requireProvider()
createSessionCookie(user)
destroySessionCookie()
hashPassword(password)
verifyPassword(password, hash)
```

---

# 14. Forms and Validation

Use Zod schemas for every server mutation.

Create validators:

```text
lib/validators/auth.ts
lib/validators/listing.ts
lib/validators/booking.ts
lib/validators/payment.ts
lib/validators/dispute.ts
lib/validators/review.ts
lib/validators/message.ts
lib/validators/admin.ts
```

## 14.1 Listing Validation

Rules:

- Title: 5–100 characters
- Description: 20–2000 characters
- Base price: greater than or equal to 0
- Deposit: greater than or equal to 0
- Replacement value: required for tool-only listings
- Location area: required
- Category: required
- Listing type: required
- At least one image URL recommended but not mandatory for MVP
- Banned words rejected

## 14.2 Booking Validation

Rules:

- Listing ID required
- Start date required
- End date required for tool-only
- Job description required for skill-only/tool-with-operator/package
- Cannot book own listing
- Cannot book inactive listing
- Cannot book past date

---

# 15. Server Actions and Services

Use service-layer functions for business logic.

Do not place complex business logic directly inside React components.

## 15.1 Listing Service

Functions:

```ts
createListing(input, currentUser)
updateListing(listingId, input, currentUser)
submitListingForReview(listingId, currentUser)
approveListing(listingId, adminUser)
rejectListing(listingId, reason, adminUser)
suspendListing(listingId, reason, adminUser)
archiveListing(listingId, currentUser)
getPublicListings(filters)
getListingBySlug(slug)
getProviderListings(providerId)
```

## 15.2 Booking Service

Functions:

```ts
requestBooking(input, currentUser)
acceptBooking(bookingId, currentUser)
rejectBooking(bookingId, reason, currentUser)
sendQuote(bookingId, amount, note, currentUser)
confirmQuote(bookingId, currentUser)
markPaymentPending(bookingId, currentUser)
confirmBookingAfterPayment(bookingId, adminOrProvider)
markPickupScheduled(bookingId, currentUser)
confirmPickup(bookingId, input, currentUser)
markInUse(bookingId, currentUser)
requestReturn(bookingId, currentUser)
confirmReturn(bookingId, input, currentUser)
markServiceStarted(bookingId, currentUser)
markServiceCompletedByProvider(bookingId, currentUser)
confirmServiceCompletedByCustomer(bookingId, currentUser)
completeBooking(bookingId, currentUser)
cancelBooking(bookingId, reason, currentUser)
moveBookingToDisputed(bookingId, currentUser)
```

Every status change must write `BookingStatusHistory`.

## 15.3 Payment Service

Functions:

```ts
submitManualPayment(input, currentUser)
verifyPayment(paymentId, adminUser)
rejectPayment(paymentId, reason, adminUser)
markRefunded(paymentId, adminUser)
markPayoutReleased(paymentId, adminUser)
calculateBookingAmounts(listing, bookingInput)
```

## 15.4 Dispute Service

Functions:

```ts
createDispute(input, currentUser)
addDisputeEvidence(disputeId, input, currentUser)
resolveDispute(disputeId, decision, adminUser)
rejectDispute(disputeId, reason, adminUser)
```

## 15.5 Review Service

Functions:

```ts
createReview(input, currentUser)
recalculateUserRating(userId)
recalculateListingRating(listingId)
updateTrustScore(userId)
```

## 15.6 Notification Service

Functions:

```ts
createNotification(userId, type, title, body, bookingId?)
markNotificationRead(notificationId, currentUser)
getUserNotifications(userId)
```

---

# 16. Search and Filters

Public listing search must support:

- Query text
- Category
- Listing type
- City
- Area
- Minimum price
- Maximum price
- Delivery available
- Rating sort
- Newest sort
- Price low to high
- Price high to low

Use query params:

```text
/listings?q=drill&type=TOOL_WITH_OPERATOR&city=Dhaka&area=Mirpur&min=100&max=1000&sort=rating
```

Search implementation:

- Use Prisma `contains` with `mode: 'insensitive'` for title/description.
- Use pagination.
- Default page size: 12.
- Max page size: 50.

---

# 17. Dashboards

## 17.1 Customer Dashboard

Show:

- Upcoming bookings
- Active bookings
- Disputed bookings
- Favorite listings
- Unread notifications
- Recent messages

## 17.2 Provider Dashboard

Show:

- Pending booking requests
- Active bookings
- Active listings
- Listings pending review
- Completed bookings
- Estimated earnings
- Average rating

## 17.3 Admin Dashboard

Show:

- Total users
- Total active providers
- Pending listings
- Active bookings
- Open disputes
- Pending payments
- Completed bookings
- Platform commission estimate

---

# 18. Admin Logic

## 18.1 Admin User Creation

Seed an admin user from environment variables:

```env
ADMIN_NAME="Admin"
ADMIN_PHONE="01700000000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeThisPassword123!"
```

Seed script must create admin if not exists.

## 18.2 Admin Listing Review

Admin can:

- View pending listings
- Approve listing
- Reject listing with reason
- Suspend active listing
- Edit category if needed

## 18.3 Admin Dispute Resolution

Admin can:

- View dispute details
- View booking details
- View handover records
- View messages
- View payment records
- Add decision
- Set refund amount
- Set deduction amount
- Resolve dispute

## 18.4 Admin Payment Management

Admin can:

- View submitted payments
- Verify payment
- Reject payment
- Mark deposit refunded
- Mark provider payout released

---

# 19. Notifications

Create notifications for:

- Booking requested
- Booking accepted
- Booking rejected
- Quote sent
- Payment submitted
- Payment verified
- Pickup confirmed
- Return requested
- Return confirmed
- Service started
- Service completed
- Dispute raised
- Dispute resolved
- Review received
- Listing approved
- Listing rejected

No external SMS/email required in MVP.

Use in-app notifications only.

---

# 20. Messaging

## 20.1 MVP Messaging Rules

- Messaging is tied to a booking.
- No global free chat needed.
- Only renter and owner/provider can message each other for a booking.
- Admin can view messages for dispute resolution.
- Use simple page refresh or polling.
- No WebSocket.

## 20.2 Message UI

Booking detail page should include:

- Message thread
- Text input
- Optional attachment URL
- Send button

---

# 21. Handover Checklist

For tool-only rental:

## 21.1 Pickup Handover

Fields:

- Condition note
- Photo URLs before handover
- Included accessories checklist
- Renter confirmation
- Owner confirmation

## 21.2 Return Handover

Fields:

- Condition note
- Photo URLs after return
- Accessories returned checklist
- Renter confirmation
- Owner confirmation

For MVP, OTP can be simulated using a random code displayed to both parties or replaced by confirmation buttons.

---

# 22. PWA Requirements

Make it installable as a PWA.

Include:

- `public/manifest.json`
- App name: KajLagbe
- Theme color
- Icons placeholders
- Mobile-friendly viewport
- Basic offline fallback page optional

Do not over-engineer service worker.

---

# 23. Environment Variables

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"

# Auth
AUTH_SECRET="replace-with-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Admin seed
ADMIN_NAME="Admin"
ADMIN_PHONE="01700000000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeThisPassword123!"

# Optional future storage
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Platform defaults
DEFAULT_COMMISSION_PERCENTAGE="15"
```

---

# 24. Required Commands

Package scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

---

# 25. Seed Data

Create seed data:

## 25.1 Categories

Tool categories:

- Power Tools
- Home Repair
- Cleaning Tools
- Event Equipment
- Photography Equipment
- Kitchen/Event Tools
- Gardening Tools
- Moving Tools

Skill categories:

- Electrician
- Plumbing
- Cleaning Service
- Cooking Service
- Event Service
- Photography
- Tuition
- Beauty Service
- Repair Service
- Moving Help

## 25.2 Example Listings

Create at least 12 sample listings:

1. Drill Machine with Operator — Mirpur
2. Ladder Rental — Mohammadpur
3. Projector Rental — Dhanmondi
4. Sound System with Technician — Uttara
5. Home Cleaning Service — Mirpur
6. Electrician Service — Mohammadpur
7. Plumbing Service — Dhanmondi
8. Birthday Magic Show — Dhaka
9. Home Cooking Service — Shyamoli
10. Moving Helper — Mirpur
11. DSLR Camera Rental — Dhanmondi
12. Carpet Cleaner with Operator — Uttara

## 25.3 Demo Users

Create:

- Admin user
- 2 provider users
- 2 customer users

Use safe demo passwords.

---

# 26. API Health Check

Create:

```text
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "app": "KajLagbe",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

# 27. Route Protection Middleware

Implement middleware:

Protected routes:

```text
/dashboard/*
/provider/*
/admin/*
```

Rules:

- No user session: redirect to `/login`
- Provider route requires `PROVIDER` or `ADMIN`
- Admin route requires `ADMIN`
- Suspended/banned users cannot access dashboard

---

# 28. Error Handling

Use consistent server action responses:

```ts
type ActionResult<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

Rules:

- Never throw raw database errors to UI.
- Log detailed error on server.
- Show user-friendly message.
- Validate inputs with Zod before database operations.

---

# 29. Security Requirements

Implement:

- HTTP-only auth cookie
- Password hashing
- Role-based route protection
- Server-side authorization for every mutation
- Zod validation
- Banned keyword/category checks
- Ownership checks for listings/bookings
- Admin-only checks for moderation
- No sensitive data in client components
- Escape user-generated display content by default through React
- Rate limiting placeholder for auth endpoints

For MVP, implement a basic in-memory rate limiter for login attempts. Note that this is not reliable on serverless cold starts, but acceptable as placeholder. Add TODO for Redis/Vercel KV later.

---

# 30. Money Handling

Use Decimal in database.

In TypeScript:

- Do not use floating point for final persisted money if avoidable.
- Convert Prisma Decimal to string or number carefully for display.
- Always display BDT with `৳`.

Create utility:

```ts
formatBDT(amount): string
calculatePlatformFee(baseFee, percentage): number
calculateTotalAmount(...): number
```

---

# 31. Acceptance Criteria

The final app is complete when:

## Public

- User can visit landing page.
- User can browse active listings.
- User can filter listings.
- User can view listing detail.
- User can register and login.

## Provider

- Provider can create listing.
- Provider can edit own listing.
- Provider can submit listing for review.
- Provider can view own booking requests.
- Provider can accept/reject bookings.
- Provider can send quote for custom quote listings.
- Provider can confirm handover/service steps.

## Customer

- Customer can request booking.
- Customer can submit manual payment information.
- Customer can track booking status.
- Customer can message provider for booking.
- Customer can raise dispute.
- Customer can review provider after completion.

## Admin

- Admin can login.
- Admin can approve/reject listings.
- Admin can view users.
- Admin can view bookings.
- Admin can verify/reject payments.
- Admin can view and resolve disputes.
- Admin can manage categories.

## Database

- Prisma schema works.
- Seed script works.
- Neon connection works.
- App builds successfully on Vercel.

## Deployment

- `.env.example` exists.
- README has local setup.
- README has Neon setup.
- README has Vercel deployment steps.
- `npm run build` passes.

---

# 32. Development Plan for Coding Agent

Follow this exact order.

## Phase 1: Project Setup

1. Create Next.js app with TypeScript and App Router.
2. Install Tailwind and shadcn/ui.
3. Install dependencies.
4. Setup Prisma.
5. Create `.env.example`.
6. Create base layout and theme.

## Phase 2: Database

1. Add Prisma schema.
2. Generate Prisma client.
3. Create seed script.
4. Add categories and demo users.
5. Add sample listings.

## Phase 3: Auth

1. Implement password hashing.
2. Implement session cookie.
3. Implement register/login/logout.
4. Implement middleware.
5. Implement role guards.

## Phase 4: Public Marketplace

1. Landing page.
2. Listing card.
3. Listing grid.
4. Listing filters.
5. Listing details.
6. Category pages.

## Phase 5: Provider Module

1. Provider dashboard.
2. Create listing form.
3. Edit listing form.
4. Submit for review.
5. Provider booking list.
6. Provider booking detail.

## Phase 6: Customer Booking Module

1. Booking request form.
2. Booking detail page.
3. Manual payment submission.
4. Booking timeline.
5. Customer dashboard.

## Phase 7: Booking Operations

1. Accept/reject booking.
2. Quote flow.
3. Payment pending/verified flow.
4. Handover pickup flow.
5. Return flow.
6. Skill service start/completion flow.
7. Booking completion flow.

## Phase 8: Messaging and Notifications

1. Booking message thread.
2. Notification creation.
3. Notification list.
4. Mark as read.

## Phase 9: Reviews and Disputes

1. Review form.
2. Rating recalculation.
3. Dispute form.
4. Evidence URL support.
5. Admin dispute resolution.

## Phase 10: Admin Panel

1. Admin dashboard.
2. Users table.
3. Listings moderation.
4. Booking management.
5. Payment verification.
6. Category management.
7. Audit logs.

## Phase 11: Polish

1. Empty states.
2. Loading states.
3. Toast messages.
4. Mobile responsiveness.
5. PWA manifest.
6. README.
7. Deployment notes.
8. Final build test.

---

# 33. README Requirements

The generated project must include a `README.md` with:

1. Project overview
2. Features
3. Tech stack
4. Local setup
5. Neon database setup
6. Environment variables
7. Prisma setup
8. Seed command
9. Admin login details from env
10. Vercel deployment steps
11. Known MVP limitations
12. Future improvements

---

# 34. Vercel Deployment Instructions

README must include:

1. Push project to GitHub.
2. Create Neon project.
3. Copy pooled connection string as `DATABASE_URL`.
4. Copy direct connection string as `DIRECT_URL`.
5. Add env variables in Vercel project settings.
6. Run migration locally or use `prisma db push` before deploy.
7. Deploy from GitHub to Vercel.
8. Confirm `/api/health` works.
9. Confirm login works.
10. Confirm listing browse works.

Important:

- Do not run Prisma migrations automatically in Vercel build unless intentionally configured.
- For MVP use local `npx prisma db push` against Neon, then deploy.

---

# 35. Future Upgrade Path

After MVP, add:

1. Real bKash/Nagad/SSLCommerz integration
2. Real escrow wallet
3. SMS OTP
4. Cloudinary/S3 upload
5. Map-based search
6. Provider subscription
7. Featured listings
8. Business accounts
9. Real-time chat
10. Push notifications
11. Damage protection plan
12. Identity verification integration
13. Delivery partner module
14. Bengali/English language toggle
15. Advanced analytics

---

# 36. Final Instruction to Coding Agent

Build the application completely according to this specification.

Do not skip database schema, seed data, authentication, dashboards, admin panel, booking flow, listing moderation, dispute flow, or deployment documentation.

Make the app simple, stable, serverless-friendly, and deployable on Vercel with Neon PostgreSQL.

Prioritize working functionality over visual complexity.

Do not add AI features.

Do not require paid services for the MVP.

Do not store uploaded files locally.

Use image URLs in MVP and keep storage integration replaceable.
