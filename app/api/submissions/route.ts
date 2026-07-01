import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { stages: { orderBy: { stageNumber: 'asc' } } },
  })
  return NextResponse.json(submissions)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const submission = await prisma.submission.create({
    data: {
      companyName:        body.companyName,
      country:            body.country,
      registrationNumber: body.registrationNumber,
      businessAddress:    body.businessAddress,
      contactName:        body.contactName,
      contactEmail:       body.contactEmail,
      contactPhone:       body.contactPhone,
      bankName:           body.bankName,
      accountHolderName:  body.accountHolderName,
      accountNumber:      body.accountNumber,
      routingOrIban:      body.routingOrIban,
      swiftBic:           body.swiftBic,
      taxId:              body.taxId,
      taxDocName:         body.taxDocName,
      regDocName:         body.regDocName,
    },
  })

  return NextResponse.json({ id: submission.id }, { status: 201 })
}
