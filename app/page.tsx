import Link from 'next/link'
import { prisma } from '@/lib/db'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0

export default async function Dashboard() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { stages: { orderBy: { stageNumber: 'asc' } } },
  })

  const counts = {
    total:    submissions.length,
    approved: submissions.filter(s => s.status === 'approved').length,
    pending:  submissions.filter(s => s.status === 'pending').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Submissions</h1>
        <Link
          href="/submit"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + New Submission
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: counts.total,    color: 'text-gray-900' },
          { label: 'Approved', value: counts.approved, color: 'text-green-700' },
          { label: 'Pending',  value: counts.pending,  color: 'text-yellow-700' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No submissions yet.</p>
          <Link href="/submit" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Submit your first vendor
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Company', 'Country', 'Submitted', 'Status', 'Email Sent', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{sub.companyName}</td>
                  <td className="px-4 py-3 text-gray-600">{sub.country}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {sub.emailSent ? '✓ Sent' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/submissions/${sub.id}`}
                      className="text-brand-600 hover:underline text-xs font-medium"
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
