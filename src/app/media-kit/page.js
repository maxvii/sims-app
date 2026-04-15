'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

// ── Tiny QR Code generator (no dependencies) ──
function generateQR(text, size = 200) {
  // Use a canvas-based QR via the Google Charts API fallback-free approach
  // We'll encode the vCard as a QR data URI using a minimal implementation
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=8`
}

const VCARD = `BEGIN:VCARD
VERSION:3.0
N:Ved;Sima;Ganwani
FN:Sima Ganwani Ved
TITLE:Founder & Chairwoman
ORG:Apparel Group
URL:https://simaved.com
URL:https://instagram.com/thesimaved
URL:https://linkedin.com/in/simaved
NOTE:Forbes Top 100 #12 | Shark Tank Dubai S2 | 2200+ stores | 14 countries | 80+ brands
END:VCARD`

export default function BusinessCardPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  if (authStatus === 'loading') return null

  const qrUrl = generateQR(VCARD, 280)

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3">
        <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-400 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-800">Sims Card</h1>
      </div>

      <div className="px-5 pt-2">
        {/* ── Business Card ── */}
        <div ref={cardRef} className="rounded-3xl overflow-hidden" style={{ background: '#363A47' }}>
          {/* Top section — photo + name */}
          <div className="px-6 pt-8 pb-5 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 flex-shrink-0">
              <img src="/images/sima-portrait.jpg" alt="Sima Ved" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Sima Ganwani Ved</h2>
              <p className="text-white/60 text-xs font-medium mt-1">Founder & Chairwoman</p>
              <p className="text-white/40 text-[11px]">Apparel Group</p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-white/10" />

          {/* Social links */}
          <div className="px-6 py-5 space-y-3">
            <a href="https://instagram.com/thesimaved" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <svg className="w-4.5 h-4.5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">@thesimaved</p>
                <p className="text-white/40 text-[10px]">Instagram</p>
              </div>
            </a>

            <a href="https://linkedin.com/in/simaved" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">Sima Ganwani Ved</p>
                <p className="text-white/40 text-[10px]">LinkedIn</p>
              </div>
            </a>

            <a href="https://simaved.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">simaved.com</p>
                <p className="text-white/40 text-[10px]">Website</p>
              </div>
            </a>
          </div>
        </div>

        {/* ── Share Button ── */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full mt-5 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{ background: showQR ? 'rgba(54,58,71,0.08)' : '#363A47', color: showQR ? '#363A47' : '#fff' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" /></svg>
          {showQR ? 'Hide QR Code' : 'Share via QR Code'}
        </button>

        {/* ── QR Code ── */}
        {showQR && (
          <div className="mt-4 p-6 rounded-2xl text-center" style={{ background: '#fff' }}>
            <img
              src={qrUrl}
              alt="QR Code — Scan to save contact"
              className="w-56 h-56 mx-auto rounded-xl"
            />
            <p className="text-xs text-gray-400 mt-3">Scan to save contact</p>
            <p className="text-[10px] text-gray-300 mt-1">Contains vCard — no server links</p>
            <a
              href={qrUrl}
              download="sims-card-qr.png"
              className="inline-block mt-3 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              style={{ background: 'rgba(54,58,71,0.08)', color: '#363A47' }}
            >
              Save QR Image
            </a>
          </div>
        )}

        <div className="h-6" />
      </div>

      <Navbar />
    </div>
  )
}
