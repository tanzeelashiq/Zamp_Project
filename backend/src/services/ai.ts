import { SubmissionInput } from '../types'

// Uses OpenRouter's free models — get a key at https://openrouter.ai/keys
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''

// Fallback chain: if one model is rate-limited, try the next
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-coder:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
]

export async function runAIReasoningPass(
  data: SubmissionInput,
  priorIssues: string[]
): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; confidence: number }> {
  if (!OPENROUTER_API_KEY) {
    return { status: 'warning', message: 'AI service not configured — OPENROUTER_API_KEY is missing. Manual review recommended.', confidence: 0 }
  }

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

Respond ONLY with this exact JSON structure (no markdown, no code fences, no explanation outside the JSON):
{"verdict": "pass", "confidence": 92, "finding": "All data points are internally consistent. Document names match expected types for the declared country."}

Rules:
- verdict must be exactly one of: "pass", "warning", or "fail"
- confidence must be a number between 0 and 100
- finding must be one clear sentence explaining your most important observation
- Return ONLY the JSON object, nothing else`

  // Try each model in the fallback chain
  for (const model of FREE_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://zamp-vendor-onboarding.onrender.com',
          'X-Title': 'Vendor Onboarding Validator',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.3,
        }),
      })

      // If rate limited, try next model
      if (response.status === 429) {
        console.log(`Model ${model} rate limited, trying next...`)
        continue
      }

      if (!response.ok) {
        console.error(`Model ${model} returned ${response.status}`)
        continue
      }

      const json: any = await response.json()
      const raw = json.choices?.[0]?.message?.content?.trim() ?? ''

      console.log(`AI response from ${model}:`, raw)

      const jsonMatch = raw.match(/\{[\s\S]*?\}/)
      if (!jsonMatch) {
        console.log(`Model ${model} did not return JSON, trying next...`)
        continue
      }

      const parsed = JSON.parse(jsonMatch[0])
      const verdict = parsed.verdict === 'fail' ? 'fail' : parsed.verdict === 'warning' ? 'warning' : 'pass'
      const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 75))
      const finding = parsed.finding || 'AI reasoning pass complete.'

      return { status: verdict, message: finding, confidence }
    } catch (err) {
      console.error(`Model ${model} error:`, err)
      continue
    }
  }

  // All models failed
  return { status: 'warning', message: 'All AI models are currently unavailable. Manual review recommended.', confidence: 0 }
}
