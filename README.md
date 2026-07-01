# Vendor Onboarding — Zamp Case Study (PS-2)

AI-powered vendor onboarding automation. Takes a vendor submission and runs it through a 4-stage validation pipeline, producing an approve/pending/reject decision with full reasoning and automated follow-up email.

## Project structure

```
Zamp_Project/
├── backend/        # Express + TypeScript API server (port 4000)
└── frontend/       # Next.js app (port 3000)
```

## What it does

1. Vendor submits a multi-step form (company, contact, banking, tax)
2. 4 validation stages run live, streamed in real-time:
   - **Stage 1** — Completeness check
   - **Stage 2** — Format validation (tax ID by country, IBAN/routing, SWIFT/BIC)
   - **Stage 3** — Cross-reference check (name mismatch, duplicate detection)
   - **Stage 4** — AI reasoning pass (Claude Opus 4.8 holistic fraud review)
3. Decision rendered: Approved / Pending / Rejected with reasoning
4. Follow-up email sent automatically to the vendor if not approved

## Edge cases

- **Name mismatch** — account holder doesn't match company name → fraud flag
- **Wrong tax ID format** — UK UTR vs US EIN, DE VAT, etc.
- **Duplicate submission** — same company name or bank account already exists
- **Document plausibility** — AI detects wrong file type or blank document

## Stack

| Layer    | Tech                                        |
|----------|---------------------------------------------|
| Backend  | Express 4, TypeScript, Prisma, SQLite       |
| AI       | Claude Opus 4.8 (Anthropic SDK)             |
| Email    | Resend                                      |
| Frontend | Next.js 15, React 19, Tailwind CSS          |

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY, RESEND_API_KEY, FROM_EMAIL
npx prisma db push
npm run dev            # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                  # starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000).
