import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Database ready — no seed data required.')
  console.log('Submit a vendor form to create the first submission.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
