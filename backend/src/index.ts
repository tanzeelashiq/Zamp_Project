import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import submissionsRouter from './routes/submissions'
import validateRouter from './routes/validate'
import { prisma } from './db'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors())
app.use(express.json())

app.use('/submissions', submissionsRouter)
app.use('/validate', validateRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Auto-seed demo data if database is empty
async function seedIfEmpty() {
  try {
    const count = await prisma.submission.count()
    if (count === 0) {
      console.log('Database empty — seeding demo data...')
      const demos = [
        {
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

      for (const demo of demos) {
        await prisma.submission.create({ data: demo })
      }
      console.log(`✓ Seeded ${demos.length} demo submissions`)
    } else {
      console.log(`Database has ${count} submissions — skipping seed`)
    }
  } catch (err) {
    console.error('Seed error (non-fatal):', err)
  }
}

seedIfEmpty().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
})
