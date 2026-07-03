'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StageCard from '@/components/StageCard'
import StatusBadge from '@/components/StatusBadge'
import EmailPreview from '@/components/EmailPreview'
import SubmissionDetails from '@/components/SubmissionDetails'
import { getValidationStreamUrl } from '@/lib/api'
import { Submission, Stage } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const STAGE_NAMES = [
  'Address & Country Check',
  'Format Validation',
  'Cross-Reference & Credibility',
  'AI Reasoning Pass',
]

export default function SubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [stageTimings, setStageTimings] = useState<Record<number, number>>({})
  const [stageConfidence, setStageConfidence] = useState<Record<number, number>>({})
  const [runningStage, setRunningStage] = useState<number | null>(null)
  const [finalStatus, setFinalStatus] = useState<string | null>(null)
  const [decision, setDecision] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [emailHtml, setEmailHtml] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [alreadyRan, setAlreadyRan] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/submissions/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(sub => {
        if (!sub) return
        setSubmission(sub)
        if (sub.stages?.length > 0) {
          setStages(sub.stages)
          setFinalStatus(sub.status)
          setDecision(sub.decision)
          setEmailSent(sub.emailSent)
          setAlreadyRan(true)
        }
      })
  }, [id])

  function startValidation() {
    if (validating) return
    setValidating(true)
    setStages([])
    setStageTimings({})
    setStageConfidence({})
    setFinalStatus(null)
    setDecision(null)
    setEmailHtml(null)
    setError('')

    const source = new EventSource(getValidationStreamUrl(id))

    source.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'stage_start') {
        setRunningStage(data.stageNumber)
      }
      if (data.type === 'stage_done') {
        setRunningStage(null)
        if (data.elapsed !== undefined) {
          setStageTimings(prev => ({ ...prev, [data.stage.stageNumber]: data.elapsed }))
        }
        if (data.confidence !== undefined) {
          setStageConfidence(prev => ({ ...prev, [data.stage.stageNumber]: data.confidence }))
        }
        setStages(prev => {
          const next = [...prev]
          const idx = next.findIndex(s => s.stageNumber === data.stage.stageNumber)
          if (idx >= 0) next[idx] = data.stage
          else next.push(data.stage)
          return next
        })
      }
      if (data.type === 'complete') {
        setFinalStatus(data.status)
        setDecision(data.decision)
        setEmailSent(data.emailSent)
        setEmailHtml(data.emailHtml ?? null)
        setValidating(false)
        setAlreadyRan(true)
        source.close()
      }
      if (data.type === 'error') {
        setError(data.message)
        setValidating(false)
        source.close()
      }
    }

    source.onerror = () => {
      setError('Connection lost. Please try again.')
      setValidating(false)
      source.close()
    }
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Loading submission…</div>
      </div>
    )
  }

  const displayStages = STAGE_NAMES.map((name, i) => {
    const num = i + 1
    const completed = stages.find(s => s.stageNumber === num)
    if (completed) return { stage: completed, running: false }
    return {
      stage: { stageNumber: num, stageName: name, status: 'pending' as const, message: '' },
      running: runningStage === num,
    }
  })

  const completedCount = stages.length
  const progressPct = validating ? (completedCount / 4) * 100 : finalStatus ? 100 : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-brand-600 hover:text-brand-700">Dashboard</Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-600">{submission.companyName}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{submission.companyName}</h1>
            <p className="text-sm text-gray-500 mt-1">{submission.country} · {submission.contactEmail}</p>
            <p className="text-xs text-gray-400 mt-1">
              Submitted {new Date(submission.createdAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={finalStatus ?? 'pending'} />
            {emailSent && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                ✉ Email sent
              </span>
            )}
          </div>
        </div>

        {decision && (
          <div className={`mt-4 text-sm rounded-lg p-4 border ${
            finalStatus === 'approved' ? 'bg-green-50 border-green-200 text-green-800' :
            finalStatus === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
                                         'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <strong>{finalStatus === 'approved' ? '✓ Approved' : finalStatus === 'rejected' ? '✕ Rejected' : '⏳ Pending'}:</strong> {decision}
          </div>
        )}

        {/* Run button */}
        {!validating && (
          <button
            onClick={startValidation}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
          >
            {alreadyRan ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-run Validation
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run Validation
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {(validating || stages.length > 0) && (
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              finalStatus === 'approved' ? 'bg-green-500' :
              finalStatus === 'rejected' ? 'bg-red-500' :
              finalStatus === 'pending' ? 'bg-yellow-500' :
                                          'bg-brand-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Live stage view with timeline */}
      {(validating || stages.length > 0) && (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
            Validation Pipeline
            {validating && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
          </h2>
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-200 z-0" />
            <div className="space-y-3 relative z-10">
              {displayStages.map(({ stage, running }) =>
                (running || stages.find(s => s.stageNumber === stage.stageNumber) || validating) ? (
                  <StageCard
                    key={stage.stageNumber}
                    stage={stage}
                    running={running}
                    elapsed={stageTimings[stage.stageNumber]}
                    confidence={stageConfidence[stage.stageNumber]}
                  />
                ) : null
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email preview */}
      {emailHtml && <EmailPreview html={emailHtml} />}

      {/* Submission details (collapsible) */}
      {submission && (
        <SubmissionDetails data={submission as unknown as Record<string, string>} />
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
