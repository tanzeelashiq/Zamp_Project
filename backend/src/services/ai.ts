import { GoogleGenerativeAI } from '@google/generative-ai'
import { SubmissionInput } from '../types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function runAIReasoningPass(
  data: SubmissionInput,
  priorIssues: string[]
): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; confidence: number }> {
  const hasPriorFailures = priorIssues.length > 0

  const prompt = `You are a senior vendor compliance analyst performing the final holistic review of a vendor onboarding submission. The previous automated checks ${hasPriorFailures ? 'flagged issues (listed below)' : 'all passed'}.

Your job is to find SUBTLE issues that rule-based checks cannot detect — things a human analyst would notice.

VENDOR SUBMISSION:
- Company Name: ${data.companyName}
- Country: ${data.country}
- Registration Number: ${data.registrationNumber}
- Business Address: ${data.businessAddress}
- Contact Person: ${data.contactName}
- Contact Email: ${data.contactEmail}
- Contact Phone: ${data.contactPhone}
- Bank Name: ${data.bankName}
- Account Holder Name: ${data.accountHolderName}
- Account Number: ${data.accountNumber}
- Routing/IBAN: ${data.routingOrIban}
- SWIFT/BIC Code: ${data.swiftBic}
- Tax ID: ${data.taxId}
- Tax Document Filename: ${data.taxDocName}
- Registration Document Filename: ${data.regDocName}

${hasPriorFailures ? `PRIOR AUTOMATED FINDINGS: ${priorIssues.join('; ')}` : ''}

ANALYZE FOR:
1. DOCUMENT PLAUSIBILITY — Do the document filenames make sense? A tax document should be named like "W9_*.pdf" or "VAT_*.pdf", not "invoice_*.pdf" or "receipt_*.pdf". A business registration should reference incorporation/registration, not unrelated documents.
2. CONTACT CREDIBILITY — Does the contact person name seem plausible for this type of company? Is the phone number format consistent with the declared country?
3. BANK PLAUSIBILITY — Does the bank name seem like a real institution for this country? Does the SWIFT code prefix match the bank name?
4. INTERNAL CONSISTENCY — Do all the pieces of data tell a coherent story about one real company?
5. RED FLAGS — Anything else suspicious: generic placeholder-like data, copy-paste errors, inconsistent naming conventions.

Respond ONLY with this exact JSON structure (no markdown, no explanation):
{"verdict": "pass", "confidence": 92, "finding": "All data points are internally consistent. Document names match expected types for the declared country."}

Where:
- verdict: "pass" (clean), "warning" (suspicious but not conclusive), or "fail" (strong fraud signal)
- confidence: 0-100 (how confident you are in your verdict)
- finding: One clear sentence explaining your most important observation`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { status: 'warning', message: 'AI review completed but could not parse structured response.', confidence: 0 }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const verdict = parsed.verdict === 'fail' ? 'fail' : parsed.verdict === 'warning' ? 'warning' : 'pass'
    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 75))
    const finding = parsed.finding || 'AI reasoning pass complete.'

    return { status: verdict, message: finding, confidence }
  } catch (err) {
    return { status: 'warning', message: 'AI reasoning pass could not complete — manual review recommended.', confidence: 0 }
  }
}
