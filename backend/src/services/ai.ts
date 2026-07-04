import { SubmissionInput } from '../types'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''

const OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-coder:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
]

function buildPrompt(data: SubmissionInput, priorIssues: string[]): string {
  const hasPriorFailures = priorIssues.length > 0

  return `You are a senior vendor compliance analyst performing the final holistic review of a vendor onboarding submission. The previous automated checks ${hasPriorFailures ? 'flagged issues (listed below)' : 'all passed'}.

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
}

function parseAIResponse(raw: string): { status: 'pass' | 'fail' | 'warning'; message: string; confidence: number } | null {
  const jsonMatch = raw.match(/\{[\s\S]*?\}/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const status = parsed.verdict === 'fail' ? 'fail' : parsed.verdict === 'warning' ? 'warning' : 'pass'
    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 75))
    const message = parsed.finding || 'AI reasoning pass complete.'
    return { status, message, confidence }
  } catch {
    return null
  }
}

async function tryGroq(prompt: string): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; confidence: number } | null> {
  if (!GROQ_API_KEY) return null

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.log(`Groq returned ${response.status}`)
      return null
    }

    const json: any = await response.json()
    const raw = json.choices?.[0]?.message?.content?.trim() ?? ''
    console.log('Groq response:', raw)
    return parseAIResponse(raw)
  } catch (err) {
    console.error('Groq error:', err)
    return null
  }
}

async function tryOpenRouter(prompt: string): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; confidence: number } | null> {
  if (!OPENROUTER_API_KEY) return null

  for (const model of OPENROUTER_MODELS) {
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

      if (response.status === 429) {
        console.log(`OpenRouter model ${model} rate limited, trying next...`)
        continue
      }
      if (!response.ok) {
        console.log(`OpenRouter model ${model} returned ${response.status}`)
        continue
      }

      const json: any = await response.json()
      const raw = json.choices?.[0]?.message?.content?.trim() ?? ''
      console.log(`OpenRouter (${model}) response:`, raw)

      const result = parseAIResponse(raw)
      if (result) return result
    } catch (err) {
      console.error(`OpenRouter model ${model} error:`, err)
      continue
    }
  }
  return null
}

export async function runAIReasoningPass(
  data: SubmissionInput,
  priorIssues: string[]
): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; confidence: number }> {
  if (!OPENROUTER_API_KEY && !GROQ_API_KEY) {
    return { status: 'warning', message: 'AI service not configured — set GROQ_API_KEY or OPENROUTER_API_KEY. Manual review recommended.', confidence: 0 }
  }

  const prompt = buildPrompt(data, priorIssues)

  // Try Groq first (more reliable free tier), then OpenRouter as fallback
  const groqResult = await tryGroq(prompt)
  if (groqResult) return groqResult

  const openRouterResult = await tryOpenRouter(prompt)
  if (openRouterResult) return openRouterResult

  return { status: 'warning', message: 'All AI services are currently rate-limited. Manual review recommended.', confidence: 0 }
}
