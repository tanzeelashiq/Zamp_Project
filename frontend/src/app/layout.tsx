import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'VendorOnboard — AI-Powered Vendor Validation',
  description: 'Automated vendor onboarding with 4-stage validation pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Nav />

        <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-400">
            <span>AI-Powered Vendor Onboarding · 4-Stage Validation Pipeline</span>
            <span>Built with Next.js + Express + Gemini</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
