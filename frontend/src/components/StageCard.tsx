'use client'

import StatusBadge from './StatusBadge'
import { Stage } from '@/types'

const icons: Record<string, string> = {
  pass: '✓', fail: '✕', warning: '⚠', running: '…',
}

export default function StageCard({ stage, running }: { stage: Stage; running?: boolean }) {
  const status = running ? 'running' : stage.status
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
      status === 'running' ? 'border-blue-200 bg-blue-50' :
      status === 'pass'    ? 'border-green-200 bg-green-50' :
      status === 'fail'    ? 'border-red-200 bg-red-50' :
      status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                             'border-gray-200 bg-gray-50'
    }`}>
      <span className={`text-lg leading-none mt-0.5 ${
        status === 'running' ? 'text-blue-500 animate-pulse' :
        status === 'pass'    ? 'text-green-600' :
        status === 'fail'    ? 'text-red-600' :
        status === 'warning' ? 'text-yellow-600' : 'text-gray-400'
      }`}>
        {icons[status] ?? '○'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900">
            Stage {stage.stageNumber}: {stage.stageName}
          </span>
          <StatusBadge status={status} />
        </div>
        {!running && stage.message && (
          <p className="mt-1 text-sm text-gray-600">{stage.message}</p>
        )}
        {running && (
          <p className="mt-1 text-sm text-gray-500 italic">Running validation…</p>
        )}
      </div>
    </div>
  )
}
