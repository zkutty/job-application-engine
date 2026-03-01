# Agent Instructions (Job Application Engine)

## Goal
Build a Job Application Engine that:
1) parses a job description (JD),
2) maps it to candidate profile + story bank,
3) generates tailored outputs: resume bullets, cover letter, short-form app answers,
4) stores per-job artifacts + versions.

## Non-goals (for now)
- Multi-user auth
- Payments
- Chrome extension

## Tech choices (preferred)
- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Zod for validation
- Postgres via Supabase (or SQLite/Prisma if simpler)
- OpenAI API for generation
- Vitest/Jest + Playwright (lightweight)

## Working rules
- Start with a thin vertical slice: one profile, one JD, one output (cover letter) end-to-end.
- Minimize scope per PR: <= 300 LOC net change when possible.
- No large refactors without tests.
- Always run: lint, typecheck, and unit tests before finishing.
- Prefer pure functions for parsing + mapping; keep UI simple.

## Deliverables
- Clear file structure
- Basic README with setup
- .env.example
- One E2E flow working locally:
  - Paste JD -> generate tailored cover letter -> save artifact -> view history

## Output quality constraints
- No hallucinated metrics. If missing, use placeholders like: “[insert metric]”.
- Mirror JD language but do not copy phrases verbatim for more than ~8 words.
- Keep cover letters 250–350 words.

## Coding conventions
- TypeScript strict
- ESLint + Prettier
- Use server actions or API routes consistently (pick one)
