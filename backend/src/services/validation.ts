import { SubmissionInput, Stage } from '../types'

// --- Constants ---

const TAX_ID_RULES: Record<string, { pattern: RegExp; label: string }> = {
  US: { pattern: /^\d{2}-?\d{7}$/, label: 'EIN (XX-XXXXXXX)' },
  GB: { pattern: /^\d{10}$|^[A-Z]{2}\d{6}[A-Z]$/, label: 'UTR (10 digits) or VAT (GB + 9 digits)' },
  DE: { pattern: /^DE\d{9}$/, label: 'VAT (DE + 9 digits)' },
  AU: { pattern: /^\d{11}$/, label: 'ABN (11 digits)' },
  CA: { pattern: /^\d{9}(RT\d{4})?$/, label: 'BN (9 digits or 9 + RT + 4)' },
  IN: { pattern: /^[A-Z]{5}\d{4}[A-Z]$/, label: 'PAN (AAAAA9999A format)' },
}

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  US: ['united states', 'usa', 'u.s.', 'america'],
  GB: ['united kingdom', 'uk', 'u.k.', 'england', 'britain', 'scotland', 'wales', 'london', 'manchester', 'birmingham'],
  DE: ['germany', 'deutschland', 'berlin', 'munich', 'frankfurt'],
  AU: ['australia', 'sydney', 'melbourne'],
  CA: ['canada', 'toronto', 'vancouver'],
  IN: ['india', 'mumbai', 'delhi', 'bangalore'],
}

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'mail.com', 'protonmail.com', 'icloud.com', 'live.com', 'ymail.com',
]

// --- Helpers ---

function isValidIban(value: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(value.replace(/\s/g, '').toUpperCase())
}

function isValidRouting(value: string): boolean {
  return /^\d{9}$/.test(value.replace(/\s/g, ''))
}

function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

// --- Stage 1: Address & Country Consistency ---

export function checkAddressCountryConsistency(data: SubmissionInput): Stage {
  const declaredCountry = data.country.toUpperCase()
  const addressLower = data.businessAddress.toLowerCase()

  for (const [code, words] of Object.entries(COUNTRY_KEYWORDS)) {
    if (code === declaredCountry) continue
    const conflict = words.find(w => addressLower.includes(w))
    if (conflict) {
      return {
        stageNumber: 1,
        stageName: 'Address & Country Check',
        status: 'fail',
        message: `Business address references "${conflict}" but declared country is ${data.country}. The registration country and business address must match.`,
      }
    }
  }

  return {
    stageNumber: 1,
    stageName: 'Address & Country Check',
    status: 'pass',
    message: `Verified: Business address is consistent with declared country (${data.country}). No conflicting geographic references found.`,
  }
}

// --- Stage 2: Format Validation ---

export function checkFormats(data: SubmissionInput): Stage {
  const issues: string[] = []
  const checks: string[] = []

  // Email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    issues.push('Contact email format is invalid.')
  } else {
    checks.push('email format')
  }

  // SWIFT/BIC
  const bic = data.swiftBic.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    issues.push(`SWIFT/BIC "${data.swiftBic}" is not a valid format (must be 8 or 11 alphanumeric characters).`)
  } else {
    checks.push('SWIFT/BIC')
  }

  // Routing / IBAN
  const upperCountry = data.country.toUpperCase()
  if (upperCountry === 'US') {
    if (!isValidRouting(data.routingOrIban)) {
      issues.push('US routing number must be exactly 9 digits.')
    } else {
      checks.push('routing number')
    }
  } else {
    if (!isValidIban(data.routingOrIban)) {
      issues.push(`IBAN "${data.routingOrIban}" does not match the expected format (e.g. GB29NWBK60161331926819).`)
    } else {
      checks.push('IBAN')
    }
  }

  // Tax ID
  const rule = TAX_ID_RULES[upperCountry]
  if (rule && !rule.pattern.test(data.taxId.replace(/\s/g, ''))) {
    issues.push(`Tax ID "${data.taxId}" does not match the expected format for ${data.country}: ${rule.label}.`)
  } else {
    checks.push(`tax ID (${data.country})`)
  }

  if (issues.length > 0) {
    return { stageNumber: 2, stageName: 'Format Validation', status: 'fail', message: issues.join(' ') }
  }
  return {
    stageNumber: 2,
    stageName: 'Format Validation',
    status: 'pass',
    message: `Verified: ${checks.join(', ')} — all formats valid for ${data.country}.`,
  }
}

// --- Stage 3: Cross-Reference & Credibility Check ---

export function checkCrossReferences(
  data: SubmissionInput,
  existingSubmissions: Array<{ companyName: string; accountNumber: string; id: string }>
): Stage {
  const issues: string[] = []
  const warnings: string[] = []
  const checks: string[] = []

  // 1. Name mismatch: account holder vs company
  const holderNorm  = data.accountHolderName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const companyNorm = data.companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const holderWords  = holderNorm.split(/\s+/).filter(w => w.length > 2)
  const companyWords = companyNorm.split(/\s+/).filter(w => w.length > 2)
  const overlap = holderWords.filter(w => companyWords.some(c => c.includes(w) || w.includes(c)))

  if (overlap.length === 0 && holderNorm !== companyNorm) {
    issues.push(
      `Account holder "${data.accountHolderName}" does not match company "${data.companyName}". ` +
      `This may indicate a personal account being used for business payments — provide a bank confirmation letter.`
    )
  } else {
    checks.push(`account holder matches company name`)
  }

  // 2. Duplicate detection: same account number
  const duplicateByAccount = existingSubmissions.find(
    s => s.accountNumber.replace(/\s/g, '') === data.accountNumber.replace(/\s/g, '')
  )
  if (duplicateByAccount) {
    issues.push(
      `Account number "${data.accountNumber}" is already registered to another vendor (ID: ${duplicateByAccount.id}). ` +
      `Duplicate bank accounts are not permitted — this may indicate submission fraud.`
    )
  } else {
    checks.push('no duplicate accounts')
  }

  // 3. Duplicate detection: same company name
  const duplicateByName = existingSubmissions.find(
    s => s.companyName.toLowerCase().trim() === data.companyName.toLowerCase().trim()
  )
  if (duplicateByName && !duplicateByAccount) {
    warnings.push(
      `A submission for "${data.companyName}" already exists (ID: ${duplicateByName.id}). ` +
      `Please confirm this is intentional and not a duplicate re-submission.`
    )
  }

  // 4. Free email domain check (credibility signal)
  const emailDomain = getEmailDomain(data.contactEmail)
  if (FREE_EMAIL_DOMAINS.includes(emailDomain)) {
    warnings.push(
      `Contact email uses a free domain (${emailDomain}). ` +
      `Registered companies typically use a corporate email domain. Please verify this is an authorized representative.`
    )
  } else {
    checks.push('corporate email domain')
  }

  if (issues.length > 0) {
    return { stageNumber: 3, stageName: 'Cross-Reference & Credibility', status: 'fail', message: issues.join(' ') }
  }
  if (warnings.length > 0) {
    return { stageNumber: 3, stageName: 'Cross-Reference & Credibility', status: 'warning', message: warnings.join(' ') }
  }
  return {
    stageNumber: 3,
    stageName: 'Cross-Reference & Credibility',
    status: 'pass',
    message: `Verified: ${checks.join(', ')}. No duplicates or credibility concerns detected.`,
  }
}

// --- Final Status Derivation ---

export function deriveStatus(stages: Stage[]): { status: 'approved' | 'pending' | 'rejected'; summary: string } {
  const hasFail    = stages.some(s => s.status === 'fail')
  const hasWarning = stages.some(s => s.status === 'warning')

  if (hasFail) {
    const failedStages = stages.filter(s => s.status === 'fail').map(s => s.stageName).join(', ')
    return { status: 'rejected', summary: `Submission rejected. Failed checks: ${failedStages}.` }
  }
  if (hasWarning) {
    const warnStages = stages.filter(s => s.status === 'warning').map(s => s.stageName).join(', ')
    return { status: 'pending', summary: `Requires manual review. Flagged by: ${warnStages}.` }
  }
  return { status: 'approved', summary: 'All validation checks passed. Vendor approved for onboarding.' }
}
