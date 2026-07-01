import { GoogleGenerativeAI } from '@google/generative-ai'
import { SubmissionInput } from '../types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function runAIReasoningPass(
  data: SubmissionInput,
  priorIssues: string[]
): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string }> {
  const hasPriorFailures = priorIssues.length > 0

  const prompt = `You are a vendor onboarding compliance analyst. Review the following vendor submission for subtle inconsistencies, potential fraud signals, or missing credibility markers that rule-based checks may miss.

VENDOR SUBMISSION:
- Company Name: ${data.companyName}
- Country: ${data.country}
- Registration Number: ${data.registrationNumber}
- Business Address: ${data.businessAddress}
- Contact: ${data.contactName} (${data.contactEmail}, ${data.contactPhone})
- Bank: ${data.bankName}
- Account Holder: ${data.accountHolderName}
- Account Number: ${data.accountNumber}
- Routing/IBAN: ${data.routingOrIban}
- SWIFT/BIC: ${data.swiftBic}
- Tax ID: ${data.taxId}
- Tax Document: ${data.taxDocName}
- Registration Document: ${data.regDocName}

PRIOR RULE-BASED FINDINGS: ${hasPriorFailures ? priorIssues.join('; ') : 'None — all rule-based checks passed.'}

Analyze this submission holistically. Look for:
1. Internal inconsistencies (e.g. address country vs declared country, bank country vs business country)
2. Document plausibility (e.g. document names that suggest wrong file type, e.g. "invoice.pdf" instead of a W-9)
3. Contact information credibility (e.g. free email domain for a claimed large company)
4. Any other subtle red flags a compliance analyst would notice

Respond in JSON only — no markdown, no explanation outside the JSON:
{"verdict": "pass" | "warning" | "fail", "finding": "one concise sentence"}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { status: 'warning', message: 'AI review completed — no structured findings returned.' }
    }
    const parsed = JSON.parse(jsonMatch[0])
    const status = parsed.verdict === 'fail' ? 'fail' : parsed.verdict === 'warning' ? 'warning' : 'pass'
    return { status, message: parsed.finding || 'AI reasoning pass complete.' }
  } catch {
    return { status: 'warning', message: 'AI reasoning pass could not complete — manual review recommended.' }
  }
}
