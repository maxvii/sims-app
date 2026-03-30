'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function EventsCalendarPage() {
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
          <h1 className="font-display text-3xl font-black italic text-gray-800">Calendar</h1>
          <p className="text-xs text-gray-500">Full event timeline</p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center px-6 mt-20 animate-fade-in">
        <div className="liquid-glass-card p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full" style={{ background: 'rgba(80, 45, 85, 0.05)' }}>
          {/* Calendar Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #502D55, #F6DBC0)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15h.008v.008H8.25V15zm0 2.25h.008v.008H8.25v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM15.75 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008z" />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold italic mb-2">
            <span className="gradient-text">Coming Soon</span>
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed">
            A full monthly and weekly calendar view for all your events, deadlines, and content drops. Plan your entire creative schedule at a glance.
          </p>

          {/* Mini calendar grid preview */}
          <div className="mt-6 grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`h-${i}`} className="w-6 h-5 flex items-center justify-center text-[9px] font-semibold" style={{ color: '#935073' }}>{d}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className="w-6 h-6 flex items-center justify-center text-[9px] rounded-md"
                style={{
                  background: i === 14 ? '#502D55' : i === 7 || i === 21 ? 'rgba(147, 80, 115, 0.15)' : 'rgba(80, 45, 85, 0.04)',
                  color: i === 14 ? 'white' : '#502D55',
                  fontWeight: i === 14 ? 700 : 400,
                }}
              >
                {i + 1}
              </div>
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
