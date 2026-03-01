# Engine Contract

## Pipeline: Inputs -> Outputs
1. **JD Input**
   - Input: `jobDescription` (string, min 40 chars)
   - Used by: cover letter generation, JD analyzer, question bank generation

2. **Context Enrichment**
   - Candidate profile (single record): summary, voice guidelines
   - Story bank: scored against JD analyzer competencies/keywords
   - Top 2 stories selected via `src/lib/stories/select.ts`

3. **Generation Outputs**
   - Cover letter text (sanitized post-check)
   - Question bank markdown + structured JSON
   - JD analysis JSON (role/seniority/competencies/keywords/tools)

## API Routes
- `POST /api/cover-letter`
  - Body: `{ jobDescription: string }`
  - Validates with Zod
  - Runs JD analysis + story selection + cover letter generation
  - Applies post-check (250-350 words + numeric metric sanitization)
  - Persists `Job` + `Artifact(type='cover_letter')`
  - Returns: `{ coverLetter, artifactId, createdAt }`

- `POST /api/question-bank`
  - Body: `{ jobDescription: string }`
  - Uses profile + selected stories
  - Persists `Job` + `Artifact(type='question_bank')` (markdown content)
  - Returns: `{ markdown, questionBank, artifactId, createdAt }`

- `POST /api/jd-analyze`
  - Body: `{ jdText: string }`
  - Returns: `{ analysis }`

- `GET /api/history`
  - Returns last 10 cover-letter artifacts as: `{ id, createdAt, jdPreview }`

- `GET/PUT /api/profile`
  - Single profile fetch/update

- `GET/POST /api/stories`
  - List/create stories

- `PUT/DELETE /api/stories/:id`
  - Update/delete a story by id

## Data Model (Prisma)
- `Job`
  - `id`, `createdAt`, `title?`, `company?`, `jdText`
- `Artifact`
  - `id`, `createdAt`, `type`, `content`, `jobId`
  - Used types in code: `cover_letter`, `question_bank`
- `CandidateProfile`
  - `id`, `name`, `headline`, `summary`, `skillsJson`, `voiceGuidelines`
- `Story`
  - `id`, `createdAt`, `title`, `situation`, `action`, `result`, `tagsJson`
