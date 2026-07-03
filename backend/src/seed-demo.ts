import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const demos = [
  {
    // 1. Happy path — everything valid, should be approved
    companyName: 'GlobalTech Solutions',
    country: 'US',
    registrationNumber: '12-3456789',
    businessAddress: '500 Market Street, San Francisco, CA 94105',
    contactName: 'Sarah Martinez',
    contactEmail: 'sarah@globaltech.com',
    contactPhone: '+1 415 555 0199',
    bankName: 'First National Bank',
    accountHolderName: 'GlobalTech Solutions',
    accountNumber: '9001234567',
    routingOrIban: '021000021',
    swiftBic: 'FNBKUS33',
    taxId: '12-3456789',
    taxDocName: 'W9_GlobalTech_Solutions.pdf',
    regDocName: 'Certificate_of_Incorporation_GlobalTech.pdf',
  },
  {
    // 2. Edge case: Name mismatch → Stage 3 FAIL
    // Account holder is a personal name, not the company
    companyName: 'Pinnacle Industries LLC',
    country: 'US',
    registrationNumber: '98-7654321',
    businessAddress: '200 Park Avenue, New York, NY 10166',
    contactName: 'Robert Chen',
    contactEmail: 'robert@pinnacle-ind.com',
    contactPhone: '+1 212 555 0147',
    bankName: 'Chase Bank',
    accountHolderName: 'Robert Chen',
    accountNumber: '7773216540',
    routingOrIban: '021000021',
    swiftBic: 'CHASUS33',
    taxId: '98-7654321',
    taxDocName: 'W9_Pinnacle_Industries.pdf',
    regDocName: 'Business_Registration_Pinnacle.pdf',
  },
  {
    // 3. Edge case: Wrong tax ID format → Stage 2 FAIL
    // UK company provides US-format EIN instead of UTR
    companyName: 'Brighton Consulting Group',
    country: 'GB',
    registrationNumber: 'SC123456',
    businessAddress: '10 Downing Lane, Manchester, M1 2AB',
    contactName: 'James Whitfield',
    contactEmail: 'james@brighton-consulting.co.uk',
    contactPhone: '+44 161 555 0132',
    bankName: 'Barclays',
    accountHolderName: 'Brighton Consulting Group',
    accountNumber: '12345678',
    routingOrIban: 'GB29NWBK60161331926819',
    swiftBic: 'BARCGB22',
    taxId: '98-7654321',
    taxDocName: 'VAT_Registration_Brighton.pdf',
    regDocName: 'Companies_House_Certificate.pdf',
  },
  {
    // 4. Edge case: Address/country mismatch → Stage 1 FAIL
    // Declares US but address is clearly in London, UK
    companyName: 'Atlantic Trade Corp',
    country: 'US',
    registrationNumber: '44-9876543',
    businessAddress: '25 Oxford Street, London, United Kingdom, W1D 2DW',
    contactName: 'David Okafor',
    contactEmail: 'david@atlantictrade.com',
    contactPhone: '+1 202 555 0176',
    bankName: 'Bank of America',
    accountHolderName: 'Atlantic Trade Corp',
    accountNumber: '6667891234',
    routingOrIban: '026009593',
    swiftBic: 'BOFAUS3N',
    taxId: '44-9876543',
    taxDocName: 'W9_Atlantic_Trade.pdf',
    regDocName: 'Business_Registration_Atlantic.pdf',
  },
  {
    // 5. Edge case: Free email domain → Stage 3 WARNING → PENDING
    // Large company but using a gmail address — credibility concern
    companyName: 'Meridian Aerospace Partners',
    country: 'US',
    registrationNumber: '33-1234567',
    businessAddress: '8700 Beverly Blvd, Los Angeles, CA 90048',
    contactName: 'Karen Liu',
    contactEmail: 'karenliu.meridian@gmail.com',
    contactPhone: '+1 310 555 0211',
    bankName: 'Wells Fargo',
    accountHolderName: 'Meridian Aerospace Partners',
    accountNumber: '5559876543',
    routingOrIban: '121000248',
    swiftBic: 'WFBIUS6S',
    taxId: '33-1234567',
    taxDocName: 'W9_Meridian_Aerospace.pdf',
    regDocName: 'Certificate_Meridian_Aerospace.pdf',
  },
  {
    // 6. Edge case: Wrong document name → ONLY Stage 4 (AI) catches it
    // All rule-based checks pass, but the tax document is named "invoice_march.pdf"
    // which makes no sense as a W-9 / tax form
    companyName: 'Quantum Data Systems',
    country: 'US',
    registrationNumber: '77-8901234',
    businessAddress: '1500 Innovation Drive, Austin, TX 78701',
    contactName: 'Michael Torres',
    contactEmail: 'michael@quantumdata.io',
    contactPhone: '+1 512 555 0194',
    bankName: 'Silicon Valley Bank',
    accountHolderName: 'Quantum Data Systems',
    accountNumber: '4441237890',
    routingOrIban: '121140399',
    swiftBic: 'SVBKUS6S',
    taxId: '77-8901234',
    taxDocName: 'invoice_march_2024.pdf',
    regDocName: 'Business_Registration_Quantum.pdf',
  },
]

async function main() {
  // Clear existing data
  await prisma.validationStage.deleteMany()
  await prisma.submission.deleteMany()

  for (const demo of demos) {
    await prisma.submission.create({ data: demo })
  }

  console.log(`\n✓ Seeded ${demos.length} demo submissions:\n`)
  console.log('  1. GlobalTech Solutions     — happy path (all checks pass → Approved)')
  console.log('  2. Pinnacle Industries      — name mismatch: "Robert Chen" ≠ company (Stage 3 → Rejected)')
  console.log('  3. Brighton Consulting      — wrong tax ID format: US EIN for UK company (Stage 2 → Rejected)')
  console.log('  4. Atlantic Trade Corp      — address says "London, UK" but country is US (Stage 1 → Rejected)')
  console.log('  5. Meridian Aerospace       — free email domain (gmail.com) for large company (Stage 3 → Pending)')
  console.log('  6. Quantum Data Systems     — tax doc named "invoice_march_2024.pdf" (Stage 4 AI → Warning/Fail)')
  console.log('')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
