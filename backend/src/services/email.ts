import { Resend } from 'resend'
import { Stage } from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'onboarding@example.com'

export function buildEmailHtml({
  companyName,
  status,
  stages,
  decision,
}: {
  companyName: string
  status: 'pending' | 'rejected'
  stages: Stage[]
  decision: string
}): string {
  const failedStages = stages.filter(s => s.status === 'fail' || s.status === 'warning')
  const issueLines = failedStages
    .map(s => `<li><strong>${s.stageName}:</strong> ${s.message}</li>`)
    .join('\n')

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; padding: 24px;">
      <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #4f46e5; margin: 0;">Vendor Onboarding</h2>
        <p style="color: #666; margin: 4px 0 0 0; font-size: 14px;">${status === 'rejected' ? 'Submission Rejected' : 'Additional Information Required'}</p>
      </div>
      <p>Dear <strong>${companyName}</strong>,</p>
      <p>We have reviewed your vendor onboarding submission and need to bring the following to your attention:</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <ul style="line-height: 1.8; margin: 0; padding-left: 20px;">${issueLines}</ul>
      </div>
      <p><strong>Decision:</strong> ${decision}</p>
      ${status === 'rejected'
        ? '<p style="background: #fee2e2; padding: 12px; border-radius: 6px;">Your submission has been <strong>rejected</strong>. Please correct the issues above and resubmit.</p>'
        : '<p style="background: #fef3c7; padding: 12px; border-radius: 6px;">Your submission is <strong>pending review</strong>. Please provide the requested information so we can proceed.</p>'
      }
      <p>If you have questions, please reply to this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Automated message from the vendor onboarding system.</p>
    </div>
  `
}

export async function sendVendorFollowUp({
  to,
  companyName,
  status,
  stages,
  decision,
}: {
  to: string
  companyName: string
  status: 'pending' | 'rejected'
  stages: Stage[]
  decision: string
}) {
  const html = buildEmailHtml({ companyName, status, stages, decision })

  const subject =
    status === 'rejected'
      ? `Action required: Your vendor submission for ${companyName}`
      : `Your vendor submission for ${companyName} requires clarification`

  await resend.emails.send({ from: FROM, to, subject, html })
}
