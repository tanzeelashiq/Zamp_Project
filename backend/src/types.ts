import { z } from 'zod'

export const submissionSchema = z.object({
  companyName:        z.string().min(2, 'Company name is required'),
  country:            z.string().min(2, 'Country is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  businessAddress:    z.string().min(5, 'Business address is required'),

  contactName:  z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(7, 'Phone number is required'),

  bankName:          z.string().min(2, 'Bank name is required'),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountNumber:     z.string().min(4, 'Account number is required'),
  routingOrIban:     z.string().min(4, 'Routing / IBAN is required'),
  swiftBic:          z.string().min(8, 'SWIFT/BIC is required'),

  taxId:      z.string().min(4, 'Tax ID is required'),
  taxDocName: z.string().min(1, 'Tax document is required'),
  regDocName: z.string().min(1, 'Registration document is required'),
})

export type SubmissionInput = z.infer<typeof submissionSchema>

export type StageStatus = 'running' | 'pass' | 'fail' | 'warning'

export interface Stage {
  stageNumber: number
  stageName:   string
  status:      StageStatus
  message:     string
}

export type FinalStatus = 'approved' | 'pending' | 'rejected'
