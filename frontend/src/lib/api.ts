import { Submission } from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function getSubmissions(): Promise<Submission[]> {
  const res = await fetch(`${BASE}/submissions`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch submissions')
  return res.json()
}

export async function createSubmission(data: Record<string, string>): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create submission')
  return res.json()
}

export function getValidationStreamUrl(id: string): string {
  return `${BASE}/validate?id=${id}`
}
