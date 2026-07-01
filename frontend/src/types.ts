export type StageStatus = 'running' | 'pass' | 'fail' | 'warning'

export interface Stage {
  stageNumber: number
  stageName:   string
  status:      StageStatus
  message:     string
}

export type FinalStatus = 'approved' | 'pending' | 'rejected'

export interface Submission {
  id:               string
  createdAt:        string
  companyName:      string
  country:          string
  contactEmail:     string
  status:           string
  decision:         string | null
  emailSent:        boolean
  stages:           Stage[]
}
