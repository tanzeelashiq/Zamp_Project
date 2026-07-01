import { Resend } from 'resend'
import { Stage } from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'onboarding@example.com'

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
  const failedStages = stages.filter(s => s.status === 'fail' || s.status === 'warning')
  const issueLines = failedStages
    .map(s => `<li><strong>${s.stageName}:</strong> ${s.message}</li>`)
    .join('\n')

  const subject =
    status === 'rejected'
      ? `Action required: Your vendor submission for ${companyName}`
      : `Your vendor submission for ${companyName} requires clarification`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #4f46e5;">Vendor Onboarding — ${status === 'rejected' ? 'Submission Rejected' : 'Additional Information Required'}</h2>
      <p>Dear ${companyName},</p>
      <p>Thank you for submitting your vendor onboarding details. We have reviewed your submission and need to bring the following to your attention:</p>
      <ul style="line-height: 1.8;">${issueLines}</ul>
      <p><strong>Summary:</strong> ${decision}</p>
      ${status === 'rejected'
        ? '<p>Your submission has been <strong>rejected</strong>. Please correct the issues above and resubmit.</p>'
        : '<p>Your submission is <strong>pending review</strong>. Please provide the requested information so we can proceed.</p>'
      }
      <p>If you have questions, please reply to this email.</p>
      <p style="color: #666; font-size: 0.875rem; margin-top: 2rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
        This is an automated message from the vendor onboarding system.
      </p>
    </div>
  `

  await resend.emails.send({ from: FROM, to, subject, html })
}
