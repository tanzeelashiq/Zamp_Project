import { SubmissionInput, Stage, StageStatus } from '../types'

const TAX_ID_RULES: Record<string, { pattern: RegExp; label: string }> = {
  US: { pattern: /^\d{2}-?\d{7}$/, label: 'EIN (XX-XXXXXXX)' },
  GB: { pattern: /^\d{10}$|^[A-Z]{2}\d{6}[A-Z]$/, label: 'UTR (10 digits) or VAT (GB + 9 digits)' },
  DE: { pattern: /^DE\d{9}$/, label: 'VAT (DE + 9 digits)' },
  AU: { pattern: /^\d{11}$/, label: 'ABN (11 digits)' },
  CA: { pattern: /^\d{9}(RT\d{4})?$/, label: 'BN (9 digits or 9 + RT + 4)' },
  IN: { pattern: /^[A-Z]{5}\d{4}[A-Z]$/, label: 'PAN (AAAAA9999A format)' },
}

function isValidIban(value: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(value.replace(/\s/g, '').toUpperCase())
}

function isValidRouting(value: string): boolean {
  return /^\d{9}$/.test(value.replace(/\s/g, ''))
}

// Country name keywords mapped to their country code
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  US: ['united states', 'usa', 'u.s.', 'america'],
  GB: ['united kingdom', 'uk', 'u.k.', 'england', 'britain', 'scotland', 'wales'],
  DE: ['germany', 'deutschland'],
  AU: ['australia'],
  CA: ['canada'],
  IN: ['india'],
}

export function checkAddressCountryConsistency(data: SubmissionInput): Stage {
  const declaredCountry = data.country.toUpperCase()
  const addressLower = data.businessAddress.toLowerCase()

  // Only check countries we have keyword data for
  const keywords = COUNTRY_KEYWORDS[declaredCountry]
  if (!keywords) {
    return { stageNumber: 1, stageName: 'Address & Country Check', status: 'pass', message: 'Address and country declaration are consistent.' }
  }

  // Check if any other country's keywords appear in the address
  for (const [code, words] of Object.entries(COUNTRY_KEYWORDS)) {
    if (code === declaredCountry) continue
    const conflict = words.find(w => addressLower.includes(w))
    if (conflict) {
      return {
        stageNumber: 1,
        stageName: 'Address & Country Check',
        status: 'fail',
        message: `Business address appears to reference "${conflict}" but declared country is ${data.country}. Please ensure the address matches the registered country.`,
      }
    }
  }

  return { stageNumber: 1, stageName: 'Address & Country Check', status: 'pass', message: 'Business address is consistent with the declared country.' }
}

export function checkFormats(data: SubmissionInput): Stage {
  const issues: string[] = []

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    issues.push('Contact email format is invalid.')
  }

  const bic = data.swiftBic.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    issues.push(`SWIFT/BIC "${data.swiftBic}" is not a valid format (should be 8 or 11 characters).`)
  }

  const upperCountry = data.country.toUpperCase()
  if (upperCountry === 'US') {
    if (!isValidRouting(data.routingOrIban)) {
      issues.push('US routing number must be exactly 9 digits.')
    }
  } else {
    if (!isValidIban(data.routingOrIban)) {
      issues.push(`IBAN "${data.routingOrIban}" does not match the expected format.`)
    }
  }

  const rule = TAX_ID_RULES[upperCountry]
  if (rule && !rule.pattern.test(data.taxId.replace(/\s/g, ''))) {
    issues.push(`Tax ID "${data.taxId}" does not match the expected format for ${data.country}: ${rule.label}.`)
  }

  if (issues.length > 0) {
    return { stageNumber: 2, stageName: 'Format Validation', status: 'fail', message: issues.join(' ') }
  }
  return { stageNumber: 2, stageName: 'Format Validation', status: 'pass', message: 'All field formats are valid.' }
}

export function checkCrossReferences(
  data: SubmissionInput,
  existingSubmissions: Array<{ companyName: string; accountNumber: string; id: string }>
): Stage {
  const issues: string[] = []
  const warnings: string[] = []

  const holderNorm  = data.accountHolderName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const companyNorm = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const holderWords  = holderNorm.split(/\s+/)
  const companyWords = companyNorm.split(/\s+/)
  const overlap = holderWords.filter(w => w.length > 2 && companyWords.some(c => c.includes(w) || w.includes(c)))

  if (overlap.length === 0 && holderNorm !== companyNorm) {
    issues.push(
      `Account holder name "${data.accountHolderName}" does not match company name "${data.companyName}". ` +
      `Please provide a bank letter confirming the account belongs to the company.`
    )
  }

  const duplicateByAccount = existingSubmissions.find(
    s => s.accountNumber.replace(/\s/g, '') === data.accountNumber.replace(/\s/g, '')
  )
  if (duplicateByAccount) {
    issues.push(`Account number "${data.accountNumber}" already exists (submission ID: ${duplicateByAccount.id}). Duplicate submissions are not permitted.`)
  }

  const duplicateByName = existingSubmissions.find(
    s => s.companyName.toLowerCase().trim() === data.companyName.toLowerCase().trim()
  )
  if (duplicateByName && !duplicateByAccount) {
    warnings.push(`A submission for "${data.companyName}" already exists (ID: ${duplicateByName.id}). Please confirm this is not a duplicate.`)
  }

  if (issues.length > 0) {
    return { stageNumber: 3, stageName: 'Cross-Reference Check', status: 'fail', message: issues.join(' ') }
  }
  if (warnings.length > 0) {
    return { stageNumber: 3, stageName: 'Cross-Reference Check', status: 'warning', message: warnings.join(' ') }
  }
  return { stageNumber: 3, stageName: 'Cross-Reference Check', status: 'pass', message: 'No duplicates detected. Company name and account holder are consistent.' }
}

export function deriveStatus(stages: Stage[]): { status: 'approved' | 'pending' | 'rejected'; summary: string } {
  const hasFail    = stages.some(s => s.status === 'fail')
  const hasWarning = stages.some(s => s.status === 'warning')

  if (hasFail) {
    const failedStages = stages.filter(s => s.status === 'fail').map(s => s.stageName).join(', ')
    return { status: 'rejected', summary: `Submission rejected. Failed stages: ${failedStages}.` }
  }
  if (hasWarning) {
    return { status: 'pending', summary: 'Submission requires manual review due to warnings.' }
  }
  return { status: 'approved', summary: 'All checks passed.' }
}
