'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const categoryColors = {
  'Social/Key Moments': '#935073',
  'Sponsorships': '#502D55',
  'Corporate Campaign': '#C9956B',
  'Corporate Event': '#7E5A8C',
  'Gifting': '#B0688A',
  'PR Birthdays': '#E8A0BF',
  'HR & CSR': '#6B8E6B',
  'Coca Cola Arena': '#D4365C',
}

const priorityColors = {
  CRITICAL: 'bg-priority-critical/90 text-white',
  HIGH: 'bg-priority-high/90 text-white',
  MEDIUM: 'bg-priority-medium/90 text-gray-800',
  LOW: 'bg-priority-low/90 text-white',
}

function getCategoryColor(event) {
  if (event.category && categoryColors[event.category]) return categoryColors[event.category]
  if (event.opportunityType) {
    const t = event.opportunityType.toLowerCase()
    if (t.includes('social') || t.includes('key moment')) return '#935073'
    if (t.includes('sponsor')) return '#502D55'
    if (t.includes('corporate campaign') || t.includes('corp campaign')) return '#C9956B'
    if (t.includes('corporate event') || t.includes('corp event')) return '#7E5A8C'
    if (t.includes('gift')) return '#B0688A'
    if (t.includes('birthday') || t.includes('pr birth')) return '#E8A0BF'
    if (t.includes('hr') || t.includes('csr')) return '#6B8E6B'
    if (t.includes('coca') || t.includes('arena')) return '#D4365C'
  }
  return '#935073'
}

/* ── Quick Action Card ── */
function QuickAction({ icon, label, href }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="flex flex-col items-center gap-1.5 min-w-[60px] transition-all active:scale-95"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(240,230,255,0.25) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255,255,255,0.5)',
          boxShadow: '0 2px 10px rgba(180,160,220,0.08)',
        }}
      >
        {icon}
      </div>
      <span className="text-[10px] font-semibold text-gray-600 leading-tight text-center">{label}</span>
    </button>
  )
}

export default function CalendarPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [showAddEvent, setShowAddEvent] = useState(false)

  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])

  const fetchEvents = () => fetch('/api/events').then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d) }).catch(() => {})
  useEffect(() => { fetchEvents() }, [])

  const eventsByMonth = useMemo(() => {
    const map = {}
    MONTHS.forEach(m => { map[m] = [] })
    events.forEach(e => {
      if (e.month && map[e.month] !== undefined) {
        map[e.month].push(e)
      }
    })
    return map
  }, [events])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = MONTHS[now.getMonth()]
    return {
      total: events.length,
      critical: events.filter(e => e.priority === 'CRITICAL').length,
      thisMonth: eventsByMonth[currentMonth]?.length || 0,
    }
  }, [events, eventsByMonth])

  const handleMonthClick = (monthAbbr) => {
    setExpandedMonth(expandedMonth === monthAbbr ? null : monthAbbr)
    if (expandedMonth !== monthAbbr) {
      setTimeout(() => {
        const el = document.getElementById(`month-events-${monthAbbr}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  if (authStatus === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F4E9' }}>
      <div className="w-10 h-10 border-3 border-[#B0688A]/40 border-t-[#935073] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F8F4E9' }}>
      {/* ── Header ── */}
      <div
        className="px-5 pt-14 pb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #502D55 0%, #6B3A6E 30%, #935073 60%, #B0688A 80%, #F6DBC0 100%)' }}
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <img src="/images/simz-logo.png" alt="SIMS" className="w-9 h-9 rounded-lg object-cover" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
            <h1 className="font-display text-2xl font-black italic text-[#F8F4E9] tracking-tight">SIMS Calendar</h1>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50 shadow-md">
            <img src="/images/sima-portrait.jpg" alt="Sima" className="w-full h-full object-cover" />
          </div>
        </div>
        <p className="text-[11px] font-semibold text-[#F6DBC0]/80 relative z-10">
          Full Year 2026 &middot; {events.length} Events
        </p>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          <QuickAction
            icon={<svg className="w-5 h-5 text-[#502D55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
            label="About" href="/about"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-[#935073]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
            label="Gallery" href="/gallery"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-[#C9956B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>}
            label="Media Kit" href="/media-kit"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-[#7E5A8C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
            label="Analytics" href="/analytics"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-[#B0688A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
            label="Try-On" href="/try-on"
          />
          {session?.user?.role === 'ADMIN' && (
            <QuickAction
              icon={<svg className="w-5 h-5 text-[#6B8E6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
              label="Team" href="/admin"
            />
          )}
          <QuickAction
            icon={<svg className="w-5 h-5 text-[#502D55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>}
            label="Sims GPT" href="/chat"
          />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="px-4 pb-3">
        <div className="flex gap-2.5">
          <div className="flex-1 liquid-glass-card p-3 text-center">
            <p className="font-display text-xl font-bold italic text-[#1A1A2E]">{stats.total}</p>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Total Events</p>
          </div>
          <div className="flex-1 liquid-glass-card p-3 text-center">
            <p className="font-display text-xl font-bold italic" style={{ color: '#FF2D55' }}>{stats.critical}</p>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Critical</p>
          </div>
          <div className="flex-1 liquid-glass-card p-3 text-center">
            <p className="font-display text-xl font-bold italic" style={{ color: '#935073' }}>{stats.thisMonth}</p>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">This Month</p>
          </div>
        </div>
      </div>

      {/* ── Full Year Grid ── */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-2.5">
          {MONTHS.map((m, i) => {
            const monthEvents = eventsByMonth[m] || []
            const isExpanded = expandedMonth === m
            const now = new Date()
            const isCurrentMonth = now.getMonth() === i && now.getFullYear() === 2026

            // Collect unique category colors for this month
            const colorDots = []
            const seenColors = new Set()
            monthEvents.forEach(e => {
              const c = getCategoryColor(e)
              if (!seenColors.has(c)) { seenColors.add(c); colorDots.push(c) }
            })

            return (
              <button
                key={m}
                onClick={() => handleMonthClick(m)}
                className={`liquid-glass-card p-3 text-left transition-all active:scale-[0.97] ${isExpanded ? 'ring-2 ring-[#935073]/50' : ''} ${isCurrentMonth ? 'ring-1 ring-[#502D55]/30' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-display text-sm font-bold italic text-gray-800">{MONTH_FULL[i].substring(0, 3)}</h3>
                  {isCurrentMonth && <span className="w-2 h-2 rounded-full bg-[#935073]" />}
                </div>
                <p className="text-[20px] font-display font-black italic text-[#502D55] leading-none mb-1.5">
                  {monthEvents.length}
                </p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
                  {monthEvents.length === 1 ? 'event' : 'events'}
                </p>
                {/* Category color dots */}
                <div className="flex gap-1 flex-wrap">
                  {colorDots.slice(0, 5).map((c, j) => (
                    <span key={j} className="w-2 h-2 rounded-full" style={{ background: c }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Expanded Month Events ── */}
      {expandedMonth && (
        <div id={`month-events-${expandedMonth}`} className="px-4 pb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold italic text-gray-800">
              {MONTH_FULL[MONTHS.indexOf(expandedMonth)]} 2026
            </h3>
            <button
              onClick={() => setExpandedMonth(null)}
              className="text-[11px] font-semibold text-gray-500 px-3 py-1 rounded-full bg-white/50"
            >
              Close
            </button>
          </div>

          {(eventsByMonth[expandedMonth] || []).length === 0 ? (
            <div className="liquid-glass-card p-8 text-center text-gray-500 text-sm font-display italic">
              No events in {MONTH_FULL[MONTHS.indexOf(expandedMonth)]}
            </div>
          ) : (
            <div className="space-y-2">
              {(eventsByMonth[expandedMonth] || []).map(event => (
                <button
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="liquid-glass-card p-4 w-full text-left active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Category color bar */}
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: getCategoryColor(event) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`pill-tag text-[9px] ${priorityColors[event.priority]}`}>
                          {event.priority}
                        </span>
                        <span
                          className="pill-tag text-[9px] text-white"
                          style={{ background: getCategoryColor(event) }}
                        >
                          {event.category || event.opportunityType || 'General'}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-gray-800 text-[14px] leading-tight mb-0.5">
                        {event.title}
                      </h4>
                      <p className="text-[11px] text-gray-500">{event.date}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium flex-shrink-0 pt-1">#{event.number}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FAB — Add Event ── */}
      {session?.user?.role === 'ADMIN' && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-90"
          style={{ background: 'linear-gradient(135deg, #502D55, #935073)', boxShadow: '0 4px 20px rgba(80,45,85,0.4)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onCreated={() => { fetchEvents(); setShowAddEvent(false) }} />}

      <Navbar />
    </div>
  )
}

/* ── Quick Add Event Modal ── */
function AddEventModal({ onClose, onCreated }) {
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [opportunityType, setOpportunityType] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !date) return
    setSaving(true)
    const d = new Date(date + 'T00:00:00')
    const formatted = `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date: formatted, priority, opportunityType }),
    })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{
          background: 'linear-gradient(145deg, rgba(248,244,233,0.95), rgba(246,219,192,0.3))',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h3 className="font-display text-xl font-bold text-gray-800 italic mb-5">New Event</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#935073]/50" placeholder="Event name" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none focus:border-[#935073]/50" required />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none">
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
              <input value={opportunityType} onChange={(e) => setOpportunityType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none" placeholder="e.g. Holiday" />
            </div>
          </div>
          <button type="submit" disabled={saving || !title || !date} className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #935073, #502D55)' }}>
            {saving ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
