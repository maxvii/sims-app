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

// ── 6 dashboard tiles (glass-morphism PNG icons from brand assets) ──
// Admin sees 7 (adds Team)
function getTiles(isAdmin) {
  const tiles = [
    { href: '/about',     label: 'About',     src: '/images/icons/About-Teams-Dashboard-Icon.png' },
    { href: '/gallery',   label: 'Gallery',   src: '/images/icons/Gallery-Dashboard-Icon.png' },
    { href: '/media-kit', label: 'Sims Card', src: '/images/icons/SimsCard-Dashboard-Icon.png' },
    { href: '/analytics', label: 'Simulate',  src: '/images/icons/Simulate-Dashboard-Icon.png' },
    { href: '/try-on',    label: 'Try-On',    src: '/images/icons/Tryon-Dashboard-Icon.png' },
    { href: '/events-calendar', label: 'Calendar', src: null, isCalendar: true },
  ]
  if (isAdmin) {
    tiles.push({ href: '/admin', label: 'Team', src: '/images/icons/Teams-Dashboard-Icon.png' })
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

      {/* ── Header: The Sims logo + avatar ── */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <img
          src="/images/the-sims-logo.png"
          alt="The Sims"
          className="h-9 w-auto"
          style={{ filter: 'brightness(0) saturate(100%) invert(15%) sepia(13%) saturate(547%) hue-rotate(196deg) brightness(94%) contrast(88%)' }}
        />
        <button
          onClick={() => router.push('/profile')}
          className="active:scale-95 transition-transform"
        >
          <div
            className="w-11 h-11 rounded-full overflow-hidden"
            style={{ border: '2px solid #E7ECF1', boxShadow: '0 2px 8px rgba(54,58,71,0.08)' }}
          >
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        </button>
      </div>

      {/* ── Greeting ── */}
      <div className="px-5 pb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: '#6B7B8D' }}>
          {greeting}
        </p>
        <h1 className="font-display text-3xl font-black italic" style={{ color: '#2B2E38' }}>
          {firstName}
        </h1>
        <p className="text-xs mt-1" style={{ color: '#9AAAB8' }}>
          {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── App Tile Grid (3 cols) ── */}
      <div className="px-5 pt-1">
        <div className="grid grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <button
              key={tile.href}
              onClick={() => router.push(tile.href)}
              className="flex flex-col items-center gap-2 active:scale-90 transition-all duration-150"
            >
              <div
                className="w-full aspect-square rounded-[22px] overflow-hidden relative"
                style={{
                  boxShadow: '0 6px 18px rgba(54,58,71,0.12), 0 1px 2px rgba(54,58,71,0.06)',
                }}
              >
                {tile.isCalendar ? (
                  <CalendarTile now={now} />
                ) : (
                  <img src={tile.src} alt={tile.label} className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-[11px] font-semibold tracking-tight" style={{ color: '#2B2E38' }}>
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

// ── Mini-calendar tile (matches palette) ──
function CalendarTile({ now }) {
  const day = now.getDate()
  const monthShort = MONTHS[now.getMonth()].toUpperCase()
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative"
      style={{
        background: 'linear-gradient(145deg, #363A47 0%, #2B2E38 100%)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 py-1.5 text-center text-[9px] font-bold tracking-[0.2em]"
        style={{ background: '#D4365C', color: '#fff' }}
      >
        {monthShort}
      </div>
      <div className="flex flex-col items-center justify-center mt-3">
        <div className="font-display text-4xl font-black leading-none" style={{ color: '#F7F9FA' }}>
          {day}
        </div>
        <div className="text-[8px] font-semibold tracking-[0.2em] mt-1.5 uppercase" style={{ color: '#D0D9E2' }}>
          {now.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
      </div>
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
