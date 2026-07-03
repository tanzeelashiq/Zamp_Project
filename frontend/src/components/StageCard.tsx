'use client'

import StatusBadge from './StatusBadge'
import { Stage } from '@/types'

const icons: Record<string, string> = {
  pass: '✓', fail: '✕', warning: '⚠', running: '⋯',
}

export default function StageCard({ stage, running, elapsed, confidence }: {
  stage: Stage; running?: boolean; elapsed?: number; confidence?: number
}) {
  const status = running ? 'running' : stage.status

  return (
    <div className={`animate-slide-in flex items-start gap-3 p-4 rounded-lg border transition-all ${
      status === 'running' ? 'border-blue-200 bg-blue-50/50' :
      status === 'pass'    ? 'border-green-200 bg-green-50/50' :
      status === 'fail'    ? 'border-red-200 bg-red-50/50' :
      status === 'warning' ? 'border-yellow-200 bg-yellow-50/50' :
                             'border-gray-200 bg-gray-50/50'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        status === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' :
        status === 'pass'    ? 'bg-green-100 text-green-600' :
        status === 'fail'    ? 'bg-red-100 text-red-600' :
        status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                               'bg-gray-100 text-gray-400'
      }`}>
        {icons[status] ?? '○'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900">
            {stage.stageName}
          </span>
          <div className="flex items-center gap-2">
            {elapsed !== undefined && !running && (
              <span className="text-xs text-gray-400">{(elapsed / 1000).toFixed(1)}s</span>
            )}
            {confidence !== undefined && confidence > 0 && !running && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                confidence >= 80 ? 'bg-green-100 text-green-700' :
                confidence >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                   'bg-red-100 text-red-700'
              }`}>
                {confidence}% confidence
              </span>
            )}
            <StatusBadge status={status} />
          </div>
        </div>
        {!running && stage.message && (
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{stage.message}</p>
        )}
        {running && (
          <div className="mt-2">
            <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full animate-progress" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
