'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function VirtualTryOnPage() {
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
          <h1 className="font-display text-3xl font-black italic text-gray-800">Virtual Try-On</h1>
          <p className="text-xs text-gray-500">AR-powered fitting room</p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center px-6 mt-20 animate-fade-in">
        <div className="liquid-glass-card p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full" style={{ background: 'rgba(80, 45, 85, 0.05)' }}>
          {/* Body/Hanger Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #502D55, #935073)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l-1.5 3h7.5l-1.5-3" />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold italic mb-2">
            <span className="gradient-text">Coming Soon</span>
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed">
            See how outfits look before production. Upload a photo and virtually try on any piece from your collection using AI.
          </p>

          {/* AR scan animation hint */}
          <div className="mt-6 relative w-24 h-24">
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed" style={{ borderColor: 'rgba(80, 45, 85, 0.2)' }} />
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: '#502D55' }} />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: '#502D55' }} />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: '#502D55' }} />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: '#502D55' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8" style={{ color: '#935073' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
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
