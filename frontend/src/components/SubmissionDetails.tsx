'use client'

import { useState } from 'react'

interface Props {
  data: Record<string, string>
}

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  country: 'Country',
  registrationNumber: 'Registration Number',
  businessAddress: 'Business Address',
  contactName: 'Contact Name',
  contactEmail: 'Contact Email',
  contactPhone: 'Phone Number',
  bankName: 'Bank Name',
  accountHolderName: 'Account Holder',
  accountNumber: 'Account Number',
  routingOrIban: 'Routing / IBAN',
  swiftBic: 'SWIFT / BIC',
  taxId: 'Tax ID',
  taxDocName: 'Tax Document',
  regDocName: 'Registration Document',
}

export default function SubmissionDetails({ data }: Props) {
  const [open, setOpen] = useState(false)

  const fields = Object.entries(FIELD_LABELS).map(([key, label]) => ({
    label,
    value: data[key] ?? '—',
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Submission Details</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-200 px-5 py-4 animate-slide-in">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
