# Vendor Onboarding — Zamp Case Study (PS-2)

AI-powered vendor onboarding automation. Takes a vendor submission and runs it through a 4-stage validation pipeline, producing an approve/pending/reject decision with full reasoning and automated follow-up email.

## What it does

1. **Vendor submits** a multi-step form with inline validation + review step
2. **4 validation stages run live** (streamed via SSE with per-stage timing):
   - **Stage 1** — Address & Country consistency check
   - **Stage 2** — Format validation (tax ID by country, IBAN/routing, SWIFT/BIC)
   - **Stage 3** — Cross-reference check (name mismatch, duplicate detection)
   - **Stage 4** — AI reasoning pass (Gemini 1.5 Flash holistic fraud review)
3. **Decision rendered**: Approved / Pending / Rejected with reasoning
4. **Follow-up email** sent automatically + preview shown in the UI

## Edge cases

| # | Scenario | What triggers it | Expected result |
|---|----------|-----------------|-----------------|
| 1 | Address/country mismatch | Address says "London, United Kingdom" but country is US | Stage 1 fail |
| 2 | Wrong tax ID format | UK company provides US EIN format | Stage 2 fail |
| 3 | Name mismatch (fraud) | Account holder "Robert Chen" doesn't match company "Pinnacle Industries" | Stage 3 fail |
| 4 | Duplicate account | Same bank account number as existing vendor | Stage 3 fail |

## Stack

| Layer    | Tech                                        |
|----------|---------------------------------------------|
| Backend  | Express 4, TypeScript, Prisma, SQLite       |
| AI       | Gemini 1.5 Flash (free tier)                |
| Email    | Resend (optional)                           |
| Frontend | Next.js 15, React 19, Tailwind CSS          |

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in GEMINI_API_KEY
npx prisma db push
npm run db:seed-demo   # seeds 5 demo submissions for testing
npm run dev            # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # starts on http://localhost:3000
```

## Demo workflow

1. Open http://localhost:3000 — dashboard shows 5 pre-seeded submissions
2. Click into "GlobalTech Solutions" → Run Validation → watch all stages pass → Approved
3. Click into "Pinnacle Industries" → Run Validation → Stage 3 fails (name mismatch) → Rejected + email preview
4. Click into "Brighton Consulting" → Run Validation → Stage 2 fails (wrong tax ID format) → Rejected
5. Click into "Atlantic Trade" → Run Validation → Stage 1 fails (address/country mismatch) → Rejected
6. Submit a new vendor through "New Submission" → fill form → review → submit → run validation
