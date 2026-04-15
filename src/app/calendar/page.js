'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Hello'
}

// ── 6 app tiles (iOS-style colored cards) ──
function getTiles(isAdmin) {
  const tiles = [
    {
      href: '/about',
      label: 'About',
      bg: 'linear-gradient(145deg, #E9D5B7 0%, #D4BC95 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6B4E2C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21v-1a8 8 0 0116 0v1"/>
        </svg>
      ),
    },
    {
      href: '/gallery',
      label: 'Gallery',
      bg: 'linear-gradient(145deg, #E89BC0 0%, #C97B9B 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#5C2B43" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      ),
    },
    {
      href: '/media-kit',
      label: 'Sims Card',
      bg: 'linear-gradient(145deg, #A8D5B5 0%, #85B895 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2C5C3D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="M7 10h4M7 14h6"/>
          <circle cx="16" cy="13" r="2"/>
        </svg>
      ),
    },
    {
      href: '/analytics',
      label: 'Simulate',
      bg: 'linear-gradient(145deg, #9DB8E2 0%, #7795C7 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1E3A6B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/>
          <path d="M7 15l4-4 3 3 5-6"/>
          <circle cx="19" cy="8" r="1"/>
        </svg>
      ),
    },
    {
      href: '/try-on',
      label: 'Try-On',
      bg: 'linear-gradient(145deg, #F0B482 0%, #D89463 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6B3818" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 5l-4-2-4 2-4-2-4 2v4l3-1v13h10V8l3 1V5z"/>
          <path d="M12 3v6"/>
        </svg>
      ),
    },
    {
      href: '/chat',
      label: 'Sims GPT',
      bg: 'linear-gradient(145deg, #7FC5CB 0%, #5AA1A7 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1C4449" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <circle cx="8" cy="10" r="0.8" fill="#1C4449"/>
          <circle cx="12" cy="10" r="0.8" fill="#1C4449"/>
          <circle cx="16" cy="10" r="0.8" fill="#1C4449"/>
        </svg>
      ),
    },
  ]
  if (isAdmin) {
    tiles.push({
      href: '/admin',
      label: 'Team',
      bg: 'linear-gradient(145deg, #C4A3D9 0%, #9E7FBD 100%)',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#3E1F5C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.5"/>
          <circle cx="17" cy="9" r="2.5"/>
          <path d="M2 19a7 7 0 0114 0"/>
          <path d="M14.5 19a5 5 0 017-4.6"/>
        </svg>
      ),
    })
  }
  return tiles
}

export default function HomePage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [now, setNow] = useState(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)

  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  if (authStatus === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FA' }}>
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  )

  const firstName = (session?.user?.name || 'there').split(' ')[0]
  const greeting = getGreeting(now.getHours())
  const avatarUrl = session?.user?.avatar || '/images/sima-portrait.jpg'
  const isAdmin = session?.user?.role === 'ADMIN'
  const tiles = getTiles(isAdmin)

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>

      {/* ── Greeting Header ── */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-semibold mb-1">
              {greeting}
            </p>
            <h1 className="font-display text-2xl font-black italic text-gray-800">
              {firstName}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="active:scale-95 transition-transform"
          >
            <div
              className="w-12 h-12 rounded-full overflow-hidden"
              style={{ border: '2px solid #E7ECF1', boxShadow: '0 2px 8px rgba(54,58,71,0.08)' }}
            >
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>
      </div>

      {/* ── App Tile Grid (3x2 / 4 rows) ── */}
      <div className="px-5 pt-2">
        <div className="grid grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <button
              key={tile.href}
              onClick={() => router.push(tile.href)}
              className="flex flex-col items-center gap-2 active:scale-90 transition-all duration-150"
            >
              <div
                className="w-full aspect-square rounded-[22px] flex items-center justify-center relative overflow-hidden"
                style={{
                  background: tile.bg,
                  boxShadow: '0 6px 16px rgba(54,58,71,0.12), inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.05)',
                }}
              >
                {/* Shine overlay */}
                <div
                  className="absolute inset-0 rounded-[22px] pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%)' }}
                />
                <div className="relative z-10">{tile.icon}</div>
              </div>
              <span className="text-[11px] font-semibold text-gray-700 tracking-tight">
                {tile.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── FAB Add Event (admin only) ── */}
      {isAdmin && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40 active:scale-90 transition-transform"
          style={{ background: '#363A47', boxShadow: '0 8px 24px rgba(54,58,71,0.35)' }}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} />}
      <Navbar />
    </div>
  )
}

/* ── Add Event Modal (unchanged logic) ── */
function AddEventModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('Social/Key Moments')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !date) return
    setSaving(true)
    const d = new Date(date + 'T00:00:00')
    const formatted = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date: formatted, category }),
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10"
        style={{ background: '#F7F9FA' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-gray-800 mb-4">New Event</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 outline-none" style={{ background: 'rgba(54,58,71,0.05)', border: '1px solid rgba(54,58,71,0.08)' }} placeholder="Event name" required />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 outline-none" style={{ background: 'rgba(54,58,71,0.05)', border: '1px solid rgba(54,58,71,0.08)' }} required />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 outline-none" style={{ background: 'rgba(54,58,71,0.05)', border: '1px solid rgba(54,58,71,0.08)' }}>
            <option>Social/Key Moments</option>
            <option>Corporate Campaign</option>
            <option>Corporate Event</option>
            <option>Sponsorships</option>
            <option>Gifting</option>
            <option>PR Birthdays</option>
            <option>HR & CSR</option>
            <option>Coca Cola Arena</option>
          </select>
          <button type="submit" disabled={saving || !title || !date} className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: '#363A47' }}>
            {saving ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
