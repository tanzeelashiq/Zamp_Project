# Vendor Onboarding — Zamp Case Study

AI-powered vendor onboarding automation. Takes a vendor submission and runs it through a 4-stage validation pipeline, producing an approve/pending/reject decision with full reasoning and automated follow-up email.

## What it does

1. **Vendor submits** a multi-step form (company, contact, banking, tax)
2. **4 validation stages run live** (streamed via SSE):
   - Stage 1: Completeness check (all fields present)
   - Stage 2: Format validation (tax ID format by country, IBAN/routing, SWIFT/BIC)
   - Stage 3: Cross-reference check (name mismatch, duplicate detection)
   - Stage 4: AI reasoning pass (Claude holistic review for subtle fraud signals)
3. **Decision rendered**: Approved / Pending / Rejected with reasoning
4. **Follow-up email sent** automatically to the vendor if not approved

## Edge cases handled

- **Name mismatch**: Account holder doesn't match company name → fraud flag
- **Wrong tax ID format for country**: UK UTR vs US EIN mismatch
- **Duplicate submission**: Same company or bank account already exists
- **Document plausibility**: AI detects wrong file type or blank document

## Tech stack

- **Next.js 15** (App Router, React Server Components)
- **Prisma + SQLite** (local dev; swap for Postgres in prod)
- **Claude Opus 4.8** via Anthropic SDK (Stage 4 AI reasoning)
- **Resend** (vendor follow-up emails)
- **Tailwind CSS**

## Setup

```bash
# 1. Clone and install
git clone git@github-personal:tanzeelashiq/Zamp_Project.git
cd Zamp_Project
npm install

# 2. Environment variables
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, RESEND_API_KEY, FROM_EMAIL

# 3. Database
npx prisma db push

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
