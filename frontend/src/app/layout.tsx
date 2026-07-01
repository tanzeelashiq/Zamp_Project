import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'VendorOnboard — AI-Powered Vendor Validation',
  description: 'Automated vendor onboarding with 4-stage validation pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="font-bold text-gray-900 text-lg">VendorOnboard</span>
              </Link>
              <div className="flex items-center gap-1">
                <Link href="/" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                  Dashboard
                </Link>
                <Link href="/submit" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                  New Submission
                </Link>
              </div>
            </div>
            <span className="text-xs text-gray-400 hidden sm:block">Zamp Case Study · PS-2</span>
          </div>
        </nav>

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
