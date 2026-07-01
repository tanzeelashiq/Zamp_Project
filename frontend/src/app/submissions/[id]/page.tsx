'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StageCard from '@/components/StageCard'
import StatusBadge from '@/components/StatusBadge'
import { getSubmissions, getValidationStreamUrl } from '@/lib/api'
import { Submission, Stage } from '@/types'

const STAGE_NAMES = [
  'Completeness Check',
  'Format Validation',
  'Cross-Reference Check',
  'AI Reasoning Pass',
]

export default function SubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [runningStage, setRunningStage] = useState<number | null>(null)
  const [finalStatus, setFinalStatus] = useState<string | null>(null)
  const [decision, setDecision] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [validating, setValidating] = useState(false)
  const [alreadyRan, setAlreadyRan] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSubmissions().then(all => {
      const sub = all.find(s => s.id === id)
      if (!sub) return
      setSubmission(sub)
      if (sub.stages.length > 0) {
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
    setFinalStatus(null)
    setDecision(null)
    setError('')

    const source = new EventSource(getValidationStreamUrl(id))

    source.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'stage_start') {
        setRunningStage(data.stageNumber)
      }
      if (data.type === 'stage_done') {
        setRunningStage(null)
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

  if (!submission) return <p className="text-gray-500">Loading…</p>

  const displayStages = STAGE_NAMES.map((name, i) => {
    const num = i + 1
    const completed = stages.find(s => s.stageNumber === num)
    if (completed) return { stage: completed, running: false }
    return {
      stage: { stageNumber: num, stageName: name, status: 'pending' as const, message: '' },
      running: runningStage === num,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">{submission.companyName}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{submission.companyName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{submission.country} · {submission.contactEmail}</p>
            <p className="text-xs text-gray-400 mt-1">Submitted {new Date(submission.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={finalStatus ?? submission.status} />
            {emailSent && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                ✓ Email sent
              </span>
            )}
          </div>
        </div>

        {decision && (
          <p className="mt-4 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">{decision}</p>
        )}

        {!validating && (
          <button onClick={startValidation}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
            {alreadyRan ? '↺ Re-run Validation' : '▶ Run Validation'}
          </button>
        )}
      </div>

      {(validating || stages.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Validation Pipeline {validating && <span className="text-blue-500 animate-pulse">● Live</span>}
          </h2>
          {displayStages.map(({ stage, running }) =>
            (running || stages.find(s => s.stageNumber === stage.stageNumber) || validating) ? (
              <StageCard key={stage.stageNumber} stage={stage} running={running} />
            ) : null
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}
    </div>
  )
}
