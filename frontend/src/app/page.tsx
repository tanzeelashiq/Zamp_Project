import Link from 'next/link'
import { getSubmissions } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'

export default async function Dashboard() {
  const submissions = await getSubmissions()

  const counts = {
    total:    submissions.length,
    approved: submissions.filter(s => s.status === 'approved').length,
    pending:  submissions.filter(s => s.status === 'pending').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor vendor submissions and validation outcomes</p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Submission
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: counts.total, icon: '📋', color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Approved',          value: counts.approved, icon: '✓', color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Pending Review',    value: counts.pending,  icon: '⏳', color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Rejected',          value: counts.rejected, icon: '✕', color: 'text-red-700', bg: 'bg-red-50' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl border border-gray-200 p-5`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-900 font-medium">No submissions yet</p>
          <p className="text-gray-500 text-sm mt-1">Submit your first vendor to see the validation pipeline in action.</p>
          <Link href="/submit" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700">
            → Submit your first vendor
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-700">All Submissions</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Company', 'Country', 'Submitted', 'Status', 'Decision', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{sub.companyName}</span>
                    {sub.emailSent && <span className="ml-2 text-xs text-green-600">✉ sent</span>}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{sub.country}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={sub.status} /></td>
                  <td className="px-5 py-4 text-xs text-gray-500 max-w-[200px] truncate">
                    {sub.decision ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/submissions/${sub.id}`}
                      className="text-brand-600 hover:text-brand-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
