# Job Application Engine

A minimal Next.js (App Router) + TypeScript app for generating cover letters from job descriptions.

## What It Includes
- Homepage at `/` with:
  - large job description textarea
  - `Generate Cover Letter` button
  - generated cover letter panel
  - persisted history list loaded from API
- API routes:
  - `POST /api/cover-letter`
  - `POST /api/question-bank`
  - `GET /api/question-bank`
  - `GET /api/history`
  - `POST /api/jd-analyze`
  - `POST /api/jd-extract`
  - `PATCH/DELETE /api/jobs/:id`
  - `GET/POST /api/jobs/:id/notes`
  - `PUT/DELETE /api/jobs/:id/notes/:noteId`
  - `GET/PUT /api/profile`
  - `POST /api/profile/import/resume`
  - `POST /api/profile/resume/analyze`
  - `POST /api/profile/resume/parse`
  - `POST /api/profile/resume/export`
  - `GET/POST /api/stories`
  - `PUT/DELETE /api/stories/:id`
- OpenAI wrapper in `src/lib/openai/client.ts`
- Prompt template in `src/lib/prompts/coverLetter.ts`
- Zod request validation
- Prisma + SQLite persistence (`User`, `Session`, `Job`, `JobNote`, `Artifact`, `CandidateProfile`, `Story`)
- Billing persistence foundation (`BillingCustomer`, `BillingSubscription`, `Entitlement`, `DonationPayment`)
- Auth routes:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `POST /api/auth/password-reset/request`
  - `POST /api/auth/password-reset/confirm`
  - `GET /api/auth/google/start`
  - `GET /api/auth/google/callback`
  - `POST /api/billing/donate`
  - `POST /api/billing/portal`
  - `GET /api/billing/status`
  - `POST /api/stripe/webhook`
- Profile editor at `/profile` (per-user profile)
- Story Bank editor at `/stories` (add/edit/delete)
- ESLint + Prettier + TypeScript scripts

## Setup
1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

3. Add your API key in `.env.local`:

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL="file:./prisma/dev.db"
BASIC_AUTH_USER=
BASIC_AUTH_PASS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
APP_ORIGIN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUPPORT_DONATION_PRODUCT_NAME=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_DONATION_TEST_LINK=
```

`GOOGLE_REDIRECT_URI` is optional; if omitted, the app uses `{APP_ORIGIN}/api/auth/google/callback`.
In Google Cloud OAuth settings, allow:
- JavaScript origin: your app origin (for example `http://localhost:3000`)
- Redirect URI: `http://localhost:3000/api/auth/google/callback`

4. Run Prisma migration and generate client:

```bash
npx prisma migrate dev
npx prisma generate
```

## Run Dev Server
```bash
npm run dev
```

Open: `http://localhost:3000`

## Generate a Cover Letter
0. Create an account or sign in at `/login`.
0.1 If you forget your password, use `Forgot password?` on `/login` and open the generated link in local development.
1. Paste a full job description in the textarea, or paste a job-posting URL.
2. Click `Generate Cover Letter`.
3. The result appears in the output panel.
4. History loads from `GET /api/history` and refreshes after each generation.
5. JD analysis can run via paste or `Analyze JD`, with competencies/keywords/tools shown in the sidebar.
6. Cover letter generation includes profile summary and top 2 JD-matched stories.
7. Question Bank generation creates markdown Q&A and supports export.
8. Saved question banks can be reloaded later by role/JD from the home page selector.
9. Saved JD labels can be manually renamed as `Company - Role` from the selector panel.
10. If a protected job page cannot be extracted (common on some LinkedIn views), paste the JD text directly.
11. Use the `Job URL` input and `Extract JD from URL` to populate the JD textbox before analysis.
12. For each saved JD, set an application stage and add timestamped notes (create/edit/delete) tied to that stage.
13. Saved JDs persist summarized JD text and JD insights for later reload in the sidebar.

## Resume Import + AI Edits
1. Open `/profile/import`.
2. Upload a resume PDF and import extracted profile fields.
3. Optionally add a target role and click `Run AI Resume Edits`.
4. Review suggestions and rewritten resume text.
5. Click `Save Final Profile` to store parsed profile data.
6. Click `Download Resume DOCX` and open/edit directly in Word or Google Docs.

## Data Privacy Scope
- Profiles, stories, saved JDs, question banks, and cover-letter history are scoped to the logged-in account.
- Logged-in users cannot see or rename each other's artifacts.

## Donations + Billing Foundation
- Engine page includes Stripe Checkout one-time donations (`$5/$15/$30` + custom amount).
- Billing tables now track customer mapping, subscriptions, donation payments, and entitlements.
- Stripe webhooks update donation/subscription state:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Local webhook forwarding:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Available Scripts
- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run format` - check Prettier formatting
- `npm run format:write` - apply Prettier formatting
