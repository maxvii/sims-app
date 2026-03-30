'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function AnalyticsPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F8F4E9' }}>
      {/* Header */}
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl font-black italic text-gray-800">Analytics</h1>
          <p className="text-xs text-gray-500">Performance insights & metrics</p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center px-6 mt-20 animate-fade-in">
        <div className="liquid-glass-card p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full" style={{ background: 'rgba(80, 45, 85, 0.05)' }}>
          {/* Chart Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #935073, #F6DBC0)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold italic mb-2">
            <span className="gradient-text">Coming Soon</span>
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed">
            Track engagement, content performance, and audience growth with beautiful real-time dashboards and reports.
          </p>

          {/* Fake mini chart preview */}
          <div className="mt-6 flex items-end gap-1.5 h-12">
            {[40, 55, 35, 70, 50, 80, 65, 90, 75, 95].map((h, i) => (
              <div
                key={i}
                className="w-3 rounded-full transition-all"
                style={{
                  height: `${h}%`,
                  background: i >= 7 ? '#502D55' : i >= 4 ? '#935073' : '#F6DBC0',
                  opacity: 0.3 + (i * 0.07),
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-8 text-sm font-medium flex items-center gap-1"
          style={{ color: '#935073' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>
      </div>

      <Navbar />
    </div>
  )
}
