import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { submissionSchema } from '@/lib/types'
import {
  checkCompleteness,
  checkFormats,
  checkCrossReferences,
  deriveStatus,
} from '@/lib/validation'
import { runAIReasoningPass } from '@/lib/ai'
import { sendVendorFollowUp } from '@/lib/email'
import { Stage } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encode(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const submissionId = searchParams.get('id')

  if (!submissionId) {
    return new Response('Missing submission id', { status: 400 })
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  })

  if (!submission) {
    return new Response('Submission not found', { status: 404 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encode(data))

      try {
        const parseResult = submissionSchema.safeParse(submission)
        const data = parseResult.success ? parseResult.data : (submission as any)

        const stages: Stage[] = []

        // Stage 1 — completeness
        send({ type: 'stage_start', stageNumber: 1, stageName: 'Completeness Check' })
        const s1 = checkCompleteness(data)
        stages.push(s1)
        await prisma.validationStage.create({
          data: { submissionId, stageNumber: 1, stageName: s1.stageName, status: s1.status, message: s1.message },
        })
        send({ type: 'stage_done', stage: s1 })

        // Stage 2 — format validation
        send({ type: 'stage_start', stageNumber: 2, stageName: 'Format Validation' })
        const s2 = checkFormats(data)
        stages.push(s2)
        await prisma.validationStage.create({
          data: { submissionId, stageNumber: 2, stageName: s2.stageName, status: s2.status, message: s2.message },
        })
        send({ type: 'stage_done', stage: s2 })

        // Stage 3 — cross-reference checks
        send({ type: 'stage_start', stageNumber: 3, stageName: 'Cross-Reference Check' })
        const existingSubmissions = await prisma.submission.findMany({
          where: { id: { not: submissionId } },
          select: { id: true, companyName: true, accountNumber: true },
        })
        const s3 = checkCrossReferences(data, existingSubmissions)
        stages.push(s3)
        await prisma.validationStage.create({
          data: { submissionId, stageNumber: 3, stageName: s3.stageName, status: s3.status, message: s3.message },
        })
        send({ type: 'stage_done', stage: s3 })

        // Stage 4 — AI reasoning pass
        send({ type: 'stage_start', stageNumber: 4, stageName: 'AI Reasoning Pass' })
        const priorIssues = stages
          .filter(s => s.status === 'fail' || s.status === 'warning')
          .map(s => s.message)
        const s4Raw = await runAIReasoningPass(data, priorIssues)
        const s4: Stage = {
          stageNumber: 4,
          stageName: 'AI Reasoning Pass',
          status: s4Raw.status,
          message: s4Raw.message,
        }
        stages.push(s4)
        await prisma.validationStage.create({
          data: { submissionId, stageNumber: 4, stageName: s4.stageName, status: s4.status, message: s4.message },
        })
        send({ type: 'stage_done', stage: s4 })

        // Derive final decision
        const { status, summary } = deriveStatus(stages)
        const issueMessages = stages
          .filter(s => s.status === 'fail' || s.status === 'warning')
          .map(s => s.message)
        const decision = issueMessages.length > 0
          ? `${summary} Issues: ${issueMessages.join(' | ')}`
          : summary

        await prisma.submission.update({
          where: { id: submissionId },
          data: { status, decision },
        })

        // Send follow-up email if not approved
        let emailSent = false
        if (status !== 'approved' && process.env.RESEND_API_KEY) {
          try {
            await sendVendorFollowUp({
              to: data.contactEmail,
              companyName: data.companyName,
              status,
              stages,
              decision,
            })
            emailSent = true
            await prisma.submission.update({
              where: { id: submissionId },
              data: { emailSent: true },
            })
          } catch {
            // email failure is non-fatal
          }
        }

        send({ type: 'complete', status, decision, emailSent })
      } catch (err) {
        send({ type: 'error', message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
