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
  - `GET /api/history`
  - `POST /api/jd-analyze`
  - `GET/PUT /api/profile`
  - `POST /api/profile/import/resume`
  - `POST /api/profile/resume/analyze`
  - `POST /api/profile/resume/export`
  - `GET/POST /api/stories`
  - `PUT/DELETE /api/stories/:id`
- OpenAI wrapper in `src/lib/openai/client.ts`
- Prompt template in `src/lib/prompts/coverLetter.ts`
- Zod request validation
- Prisma + SQLite persistence (`Job`, `Artifact`, `CandidateProfile`, `Story`)
- Profile editor at `/profile` (single profile, no auth)
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
```

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
1. Paste a full job description in the textarea.
2. Click `Generate Cover Letter`.
3. The result appears in the output panel.
4. History loads from `GET /api/history` and refreshes after each generation.
5. JD analysis can run via paste or `Analyze JD`, with competencies/keywords/tools shown in the sidebar.
6. Cover letter generation includes profile summary and top 2 JD-matched stories.
7. Question Bank generation creates markdown Q&A and supports export.

## Resume Import + AI Edits
1. Open `/profile/import`.
2. Upload a resume PDF and import extracted profile fields.
3. Optionally add a target role and click `Run AI Resume Edits`.
4. Review suggestions and rewritten resume text.
5. Click `Save Final Profile` to store parsed profile data.
6. Click `Download Resume DOCX` and open/edit directly in Word or Google Docs.

## Available Scripts
- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run format` - check Prettier formatting
- `npm run format:write` - apply Prettier formatting
