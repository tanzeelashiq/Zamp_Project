'use client'

type Status = 'approved' | 'pending' | 'rejected' | 'pass' | 'fail' | 'warning' | 'running'

const styles: Record<Status, string> = {
  approved: 'bg-green-100 text-green-800 border border-green-200',
  pass:     'bg-green-100 text-green-800 border border-green-200',
  pending:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
  warning:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
  fail:     'bg-red-100 text-red-800 border border-red-200',
  running:  'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse',
}

const labels: Record<Status, string> = {
  approved: 'Approved',
  pass:     'Pass',
  pending:  'Pending',
  warning:  'Warning',
  rejected: 'Rejected',
  fail:     'Failed',
  running:  'Running…',
}

export default function StatusBadge({ status }: { status: string }) {
  const s = status as Status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[s] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[s] ?? status}
    </span>
  )
}
