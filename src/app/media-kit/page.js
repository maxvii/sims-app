'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function MediaKitPage() {
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
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="font-display text-3xl font-black italic text-gray-800">Media Kit</h1>
          <p className="text-xs text-gray-500">Press assets & brand materials</p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center px-6 mt-20 animate-fade-in">
        <div className="liquid-glass-card p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full" style={{ background: 'rgba(80, 45, 85, 0.05)' }}>
          {/* Folder/Download Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #502D55, #935073)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m0 0l-2-2m2 2l2-2" />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold italic mb-2">
            <span className="gradient-text">Coming Soon</span>
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed">
            Download logos, brand guidelines, lookbook imagery, and press-ready assets -- all in one place.
          </p>

          <div className="mt-6 flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(147, 80, 115, 0.1)', color: '#935073' }}>Logos</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(80, 45, 85, 0.1)', color: '#502D55' }}>Lookbook</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(246, 219, 192, 0.5)', color: '#935073' }}>Press</span>
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
