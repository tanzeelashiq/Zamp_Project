import { Router, Request, Response } from 'express'
import { prisma } from '../db'
import { submissionSchema, Stage } from '../types'
import { checkAddressCountryConsistency, checkFormats, checkCrossReferences, deriveStatus } from '../services/validation'
import { runAIReasoningPass } from '../services/ai'
import { sendVendorFollowUp, buildEmailHtml } from '../services/email'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const submissionId = req.query.id as string | undefined

  if (!submissionId) {
    res.status(400).json({ error: 'Missing submission id' })
    return
  }

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
  if (!submission) {
    res.status(404).json({ error: 'Submission not found' })
    return
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const parseResult = submissionSchema.safeParse(submission)
    const data = parseResult.success ? parseResult.data : (submission as any)

    const stages: Stage[] = []

    // Stage 1 — address/country consistency
    send({ type: 'stage_start', stageNumber: 1, stageName: 'Address & Country Check' })
    const t1 = Date.now()
    const s1 = checkAddressCountryConsistency(data)
    stages.push(s1)
    await prisma.validationStage.create({
      data: { submissionId, stageNumber: 1, stageName: s1.stageName, status: s1.status, message: s1.message },
    })
    send({ type: 'stage_done', stage: s1, elapsed: Date.now() - t1 })

    // Stage 2 — format validation
    send({ type: 'stage_start', stageNumber: 2, stageName: 'Format Validation' })
    const t2 = Date.now()
    const s2 = checkFormats(data)
    stages.push(s2)
    await prisma.validationStage.create({
      data: { submissionId, stageNumber: 2, stageName: s2.stageName, status: s2.status, message: s2.message },
    })
    send({ type: 'stage_done', stage: s2, elapsed: Date.now() - t2 })

    // Stage 3 — cross-reference checks
    send({ type: 'stage_start', stageNumber: 3, stageName: 'Cross-Reference Check' })
    const t3 = Date.now()
    const existingSubmissions = await prisma.submission.findMany({
      where: { id: { not: submissionId } },
      select: { id: true, companyName: true, accountNumber: true },
    })
    const s3 = checkCrossReferences(data, existingSubmissions)
    stages.push(s3)
    await prisma.validationStage.create({
      data: { submissionId, stageNumber: 3, stageName: s3.stageName, status: s3.status, message: s3.message },
    })
    send({ type: 'stage_done', stage: s3, elapsed: Date.now() - t3 })

    // Stage 4 — AI reasoning pass
    send({ type: 'stage_start', stageNumber: 4, stageName: 'AI Reasoning Pass' })
    const t4 = Date.now()
    const priorIssues = stages
      .filter(s => s.status === 'fail' || s.status === 'warning')
      .map(s => s.message)
    const s4Raw = await runAIReasoningPass(data, priorIssues)
    const s4: Stage = { stageNumber: 4, stageName: 'AI Reasoning Pass', status: s4Raw.status, message: s4Raw.message }
    stages.push(s4)
    await prisma.validationStage.create({
      data: { submissionId, stageNumber: 4, stageName: s4.stageName, status: s4.status, message: s4.message },
    })
    send({ type: 'stage_done', stage: s4, elapsed: Date.now() - t4 })

    // Final decision
    const { status, summary } = deriveStatus(stages)
    const issueMessages = stages
      .filter(s => s.status === 'fail' || s.status === 'warning')
      .map(s => s.message)
    const decision = issueMessages.length > 0
      ? `${summary} Issues: ${issueMessages.join(' | ')}`
      : summary

    await prisma.submission.update({ where: { id: submissionId }, data: { status, decision } })

    // Build email preview HTML (always, for the UI)
    let emailHtml: string | null = null
    let emailSent = false

    if (status !== 'approved') {
      emailHtml = buildEmailHtml({ companyName: data.companyName, status, stages, decision })

      // Actually send the email if Resend is configured
      if (process.env.RESEND_API_KEY) {
        try {
          await sendVendorFollowUp({ to: data.contactEmail, companyName: data.companyName, status, stages, decision })
          emailSent = true
          await prisma.submission.update({ where: { id: submissionId }, data: { emailSent: true } })
        } catch {
          // email failure is non-fatal
        }
      }
    }

    send({ type: 'complete', status, decision, emailSent, emailHtml })
  } catch (err) {
    send({ type: 'error', message: String(err) })
  } finally {
    res.end()
  }
})

export default router
