'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSubmission } from '@/lib/api'

const STEPS = ['Company', 'Contact', 'Banking', 'Tax & Docs', 'Review']
const COUNTRIES = ['US', 'GB', 'DE', 'AU', 'CA', 'IN', 'Other']

type FormData = {
  companyName: string; country: string; registrationNumber: string; businessAddress: string
  contactName: string; contactEmail: string; contactPhone: string
  bankName: string; accountHolderName: string; accountNumber: string; routingOrIban: string; swiftBic: string
  taxId: string; taxDocName: string; regDocName: string
}

const empty: FormData = {
  companyName: '', country: 'US', registrationNumber: '', businessAddress: '',
  contactName: '', contactEmail: '', contactPhone: '',
  bankName: '', accountHolderName: '', accountNumber: '', routingOrIban: '', swiftBic: '',
  taxId: '', taxDocName: '', regDocName: '',
}

// Returns an error message string or '' if valid
function validateField(name: keyof FormData, value: string, form: FormData): string {
  if (!value.trim()) return 'This field is required.'

  switch (name) {
    case 'contactEmail':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.'
      break
    case 'swiftBic': {
      const bic = value.replace(/\s/g, '').toUpperCase()
      if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return 'SWIFT/BIC must be 8 or 11 characters (e.g. CHASUS33).'
      break
    }
    case 'routingOrIban':
      if (form.country === 'US') {
        if (!/^\d{9}$/.test(value.replace(/\s/g, ''))) return 'US routing number must be exactly 9 digits.'
      } else {
        if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(value.replace(/\s/g, '').toUpperCase())) return 'Enter a valid IBAN (e.g. GB29NWBK60161331926819).'
      }
      break
    case 'taxDocName':
    case 'regDocName':
      if (!/\.(pdf|png|jpg|jpeg|doc|docx)$/i.test(value)) return 'Filename must include an extension (e.g. .pdf, .jpg).'
      break
  }
  return ''
}

// Fields required per step
const STEP_FIELDS: Array<Array<keyof FormData>> = [
  ['companyName', 'registrationNumber', 'businessAddress'],
  ['contactName', 'contactEmail', 'contactPhone'],
  ['bankName', 'accountHolderName', 'accountNumber', 'routingOrIban', 'swiftBic'],
  ['taxId', 'taxDocName', 'regDocName'],
  [], // Review step — no validation needed, all fields already checked
]

function Field({ label, name, value, onChange, placeholder, type = 'text', form }: {
  label: string; name: keyof FormData; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; form: FormData
}) {
  const [touched, setTouched] = useState(false)
  const error = touched ? validateField(name, value, form) : ''

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(empty)
  const [stepErrors, setStepErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (key: keyof FormData) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  function validateStep(): boolean {
    const fields = STEP_FIELDS[step]
    const errors: Partial<Record<keyof FormData, string>> = {}
    for (const field of fields) {
      const err = validateField(field, form[field], form)
      if (err) errors[field] = err
    }
    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleNext() {
    if (validateStep()) setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { id } = await createSubmission(form)
      router.push(`/submissions/${id}`)
    } catch (e) {
      setSubmitError(String(e))
      setSubmitting(false)
    }
  }

  // Helper to show per-step error inline (for fields not using the Field component)
  const stepErr = (key: keyof FormData) =>
    stepErrors[key] ? <p className="mt-1 text-xs text-red-600">{stepErrors[key]}</p> : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Vendor Submission</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? 'bg-brand-600 text-white' :
              i === step ? 'bg-brand-100 text-brand-700 border-2 border-brand-600' :
                           'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {step === 0 && (
          <>
            <h2 className="font-semibold text-gray-900">Company Details</h2>
            <Field label="Legal Company Name" name="companyName" value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp LLC" form={form} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select value={form.country} onChange={e => set('country')(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Registration Number" name="registrationNumber" value={form.registrationNumber} onChange={set('registrationNumber')} placeholder="12-3456789" form={form} />
            <Field label="Business Address" name="businessAddress" value={form.businessAddress} onChange={set('businessAddress')} placeholder="123 Main St, City, State" form={form} />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
            <Field label="Contact Name" name="contactName" value={form.contactName} onChange={set('contactName')} placeholder="Jane Smith" form={form} />
            <Field label="Contact Email" name="contactEmail" value={form.contactEmail} onChange={set('contactEmail')} type="email" placeholder="jane@acmecorp.com" form={form} />
            <Field label="Phone Number" name="contactPhone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="+1 555 123 4567" form={form} />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-semibold text-gray-900">Banking Information</h2>
            <Field label="Bank Name" name="bankName" value={form.bankName} onChange={set('bankName')} placeholder="First National Bank" form={form} />
            <Field label="Account Holder Name" name="accountHolderName" value={form.accountHolderName} onChange={set('accountHolderName')} placeholder="Acme Corp LLC" form={form} />
            <Field label="Account Number" name="accountNumber" value={form.accountNumber} onChange={set('accountNumber')} placeholder="0001234567" form={form} />
            <Field label="Routing Number / IBAN" name="routingOrIban" value={form.routingOrIban} onChange={set('routingOrIban')} placeholder="US: 9-digit routing / EU: IBAN" form={form} />
            <Field label="SWIFT / BIC" name="swiftBic" value={form.swiftBic} onChange={set('swiftBic')} placeholder="CHASUS33XXX" form={form} />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-semibold text-gray-900">Tax &amp; Compliance</h2>
            <Field label="Tax ID" name="taxId" value={form.taxId} onChange={set('taxId')} placeholder="US: 12-3456789 / UK: 10-digit UTR" form={form} />
            <Field label="Tax Document filename" name="taxDocName" value={form.taxDocName} onChange={set('taxDocName')} placeholder="W9_Acme_Corp.pdf" form={form} />
            <Field label="Registration Document filename" name="regDocName" value={form.regDocName} onChange={set('regDocName')} placeholder="Business_Certificate.pdf" form={form} />
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="font-semibold text-gray-900">Review &amp; Confirm</h2>
            <p className="text-sm text-gray-500">Please review all information before submitting.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-3">
              {[
                ['Company Name', form.companyName],
                ['Country', form.country],
                ['Registration #', form.registrationNumber],
                ['Business Address', form.businessAddress],
                ['Contact Name', form.contactName],
                ['Contact Email', form.contactEmail],
                ['Phone', form.contactPhone],
                ['Bank Name', form.bankName],
                ['Account Holder', form.accountHolderName],
                ['Account Number', form.accountNumber],
                ['Routing / IBAN', form.routingOrIban],
                ['SWIFT / BIC', form.swiftBic],
                ['Tax ID', form.taxId],
                ['Tax Document', form.taxDocName],
                ['Registration Doc', form.regDocName],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-gray-100 pb-2">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-sm text-gray-900 font-medium">{value || '—'}</dd>
                </div>
              ))}
            </div>
            {submitError && <p className="text-sm text-red-600 mt-3">{submitError}</p>}
          </>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={handleNext}
            className="px-5 py-2 text-sm rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 text-sm rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit for Validation'}
          </button>
        )}
      </div>
    </div>
  )
}
