import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const demos = [
  {
    // Happy path — everything valid
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
    // Edge case: Name mismatch (fraud signal)
    companyName: 'Pinnacle Industries LLC',
    country: 'US',
    registrationNumber: '98-7654321',
    businessAddress: '200 Park Avenue, New York, NY 10166',
    contactName: 'Robert Chen',
    contactEmail: 'robert@pinnacle-ind.com',
    contactPhone: '+1 212 555 0147',
    bankName: 'Chase Bank',
    accountHolderName: 'Robert Chen', // ← personal name, not company
    accountNumber: '7773216540',
    routingOrIban: '021000021',
    swiftBic: 'CHASUS33',
    taxId: '98-7654321',
    taxDocName: 'W9_Pinnacle_Industries.pdf',
    regDocName: 'Business_Registration_Pinnacle.pdf',
  },
  {
    // Edge case: Wrong tax ID format for declared country
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
    taxId: '98-7654321', // ← US EIN format, should be UK UTR (10 digits)
    taxDocName: 'VAT_Registration_Brighton.pdf',
    regDocName: 'Companies_House_Certificate.pdf',
  },
  {
    // Edge case: Duplicate account (shares account with GlobalTech)
    companyName: 'Nexus Digital Partners',
    country: 'US',
    registrationNumber: '55-1234567',
    businessAddress: '1200 Tech Blvd, Austin, TX 78701',
    contactName: 'Emily Torres',
    contactEmail: 'emily@nexusdigital.com',
    contactPhone: '+1 512 555 0188',
    bankName: 'First National Bank',
    accountHolderName: 'Nexus Digital Partners',
    accountNumber: '9001234567', // ← same as GlobalTech Solutions
    routingOrIban: '021000021',
    swiftBic: 'FNBKUS33',
    taxId: '55-1234567',
    taxDocName: 'W9_Nexus_Digital.pdf',
    regDocName: 'Certificate_Nexus_Digital.pdf',
  },
  {
    // Edge case: Address/country mismatch
    companyName: 'Atlantic Trade Corp',
    country: 'US',
    registrationNumber: '44-9876543',
    businessAddress: '25 Oxford Street, London, United Kingdom, W1D 2DW', // ← says US but address is UK
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
]

async function main() {
  // Clear existing data
  await prisma.validationStage.deleteMany()
  await prisma.submission.deleteMany()

  for (const demo of demos) {
    await prisma.submission.create({ data: demo })
  }

  console.log(`✓ Seeded ${demos.length} demo submissions:`)
  console.log('  1. GlobalTech Solutions — happy path (should approve)')
  console.log('  2. Pinnacle Industries — name mismatch (Stage 3 fail)')
  console.log('  3. Brighton Consulting — wrong tax ID format (Stage 2 fail)')
  console.log('  4. Nexus Digital — duplicate account number (Stage 3 fail)')
  console.log('  5. Atlantic Trade — address/country mismatch (Stage 1 fail)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
