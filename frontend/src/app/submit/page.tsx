'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSubmission } from '@/lib/api'

const STEPS = ['Company', 'Contact', 'Banking', 'Tax & Docs']
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

function Field({ label, name, value, onChange, placeholder, type = 'text' }: {
  label: string; name: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  )
}

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(empty)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof FormData) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const { id } = await createSubmission(form)
      router.push(`/submissions/${id}`)
    } catch (e) {
      setError(String(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Vendor Submission</h1>

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
            <Field label="Legal Company Name *" name="companyName" value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp LLC" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <select value={form.country} onChange={e => set('country')(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Registration Number *" name="registrationNumber" value={form.registrationNumber} onChange={set('registrationNumber')} placeholder="12-3456789" />
            <Field label="Business Address *" name="businessAddress" value={form.businessAddress} onChange={set('businessAddress')} placeholder="123 Main St, City, State" />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
            <Field label="Contact Name *" name="contactName" value={form.contactName} onChange={set('contactName')} placeholder="Jane Smith" />
            <Field label="Contact Email *" name="contactEmail" value={form.contactEmail} onChange={set('contactEmail')} type="email" placeholder="jane@acmecorp.com" />
            <Field label="Phone Number *" name="contactPhone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="+1 555 123 4567" />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-semibold text-gray-900">Banking Information</h2>
            <Field label="Bank Name *" name="bankName" value={form.bankName} onChange={set('bankName')} placeholder="First National Bank" />
            <Field label="Account Holder Name *" name="accountHolderName" value={form.accountHolderName} onChange={set('accountHolderName')} placeholder="Acme Corp LLC" />
            <Field label="Account Number *" name="accountNumber" value={form.accountNumber} onChange={set('accountNumber')} placeholder="0001234567" />
            <Field label="Routing Number / IBAN *" name="routingOrIban" value={form.routingOrIban} onChange={set('routingOrIban')} placeholder="US: 9-digit routing / EU: IBAN" />
            <Field label="SWIFT / BIC *" name="swiftBic" value={form.swiftBic} onChange={set('swiftBic')} placeholder="CHASUS33XXX" />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-semibold text-gray-900">Tax &amp; Compliance</h2>
            <Field label="Tax ID *" name="taxId" value={form.taxId} onChange={set('taxId')} placeholder="US: 12-3456789 / UK: 10-digit UTR" />
            <Field label="Tax Document filename *" name="taxDocName" value={form.taxDocName} onChange={set('taxDocName')} placeholder="W9_Acme_Corp.pdf" />
            <Field label="Registration Document filename *" name="regDocName" value={form.regDocName} onChange={set('regDocName')} placeholder="Business_Certificate.pdf" />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
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
