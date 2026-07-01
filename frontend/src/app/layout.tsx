import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vendor Onboarding',
  description: 'AI-powered vendor onboarding validation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-8">
            <Link href="/" className="font-semibold text-brand-600 text-lg">
              VendorOnboard
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/submit" className="text-sm text-gray-600 hover:text-gray-900">New Submission</Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
