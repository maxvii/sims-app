'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

export default function ChatPage() {
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
          <h1 className="font-display text-3xl font-black italic text-gray-800">Simz GPT</h1>
          <p className="text-xs text-gray-500">Your AI creative assistant</p>
        </div>
      </div>

      {/* Coming Soon Content — more elaborate for chat */}
      <div className="flex flex-col items-center justify-center px-6 mt-16 animate-fade-in">
        <div className="liquid-glass-card p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full" style={{ background: 'rgba(80, 45, 85, 0.05)' }}>
          {/* Sparkle Icon — larger and more prominent */}
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative" style={{ background: 'linear-gradient(135deg, #502D55, #935073, #F6DBC0)' }}>
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
            </svg>
            {/* Floating sparkle dots */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#F6DBC0' }} />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full" style={{ background: '#935073' }} />
            <div className="absolute top-1 -left-2 w-1.5 h-1.5 rounded-full" style={{ background: '#F6DBC0', opacity: 0.7 }} />
          </div>

          <h2 className="font-display text-2xl font-bold italic mb-1">
            <span className="gradient-text">Simz GPT</span>
          </h2>
          <p className="text-lg font-medium mb-3" style={{ color: '#502D55' }}>is coming soon</p>

          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            Your AI-powered creative assistant for Simz. Get instant styling suggestions, generate mood boards, draft social captions, and brainstorm collection ideas -- all through natural conversation.
          </p>

          {/* Feature preview pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: 'rgba(80, 45, 85, 0.08)', color: '#502D55' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              Style Advice
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: 'rgba(147, 80, 115, 0.08)', color: '#935073' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              Mood Boards
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: 'rgba(246, 219, 192, 0.4)', color: '#502D55' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              Captions
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: 'rgba(80, 45, 85, 0.06)', color: '#935073' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
              Ideas
            </span>
          </div>

          {/* Fake chat bubble preview */}
          <div className="w-full space-y-2">
            <div className="flex justify-end">
              <div className="px-3 py-2 rounded-2xl rounded-br-md text-xs text-white max-w-[200px]" style={{ background: '#502D55' }}>
                Suggest outfits for a summer launch event
              </div>
            </div>
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl rounded-bl-md text-xs max-w-[220px]" style={{ background: 'rgba(147, 80, 115, 0.1)', color: '#502D55' }}>
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#935073' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#935073', animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#935073', animationDelay: '0.4s' }} />
                </span>
              </div>
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
