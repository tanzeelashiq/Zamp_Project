import { Router } from 'express'
import { prisma } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { stages: { orderBy: { stageNumber: 'asc' } } },
  })
  res.json(submissions)
})

router.get('/:id', async (req, res) => {
  const submission = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: { stages: { orderBy: { stageNumber: 'asc' } } },
  })
  if (!submission) {
    res.status(404).json({ error: 'Submission not found' })
    return
  }
  res.json(submission)
})

router.post('/', async (req, res) => {
  const body = req.body
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
  res.status(201).json({ id: submission.id })
})

export default router
