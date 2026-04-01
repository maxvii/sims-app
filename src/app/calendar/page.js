'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const priorityColors = {
  CRITICAL: 'bg-priority-critical/90 text-white',
  HIGH: 'bg-priority-high/90 text-white',
  MEDIUM: 'bg-priority-medium/90 text-gray-800',
  LOW: 'bg-priority-low/90 text-white',
}
const priorityDots = { CRITICAL: '#FF2D55', HIGH: '#FF9500', MEDIUM: '#FFCC00', LOW: '#34C759' }
const statusColors = {
  'Not Started': 'bg-gray-100/80 text-gray-500', 'Planned': 'bg-blue-50/80 text-blue-600',
  'In Progress': 'bg-amber-50/80 text-amber-600', 'Approved': 'bg-emerald-50/80 text-emerald-600',
  'Needs Revision': 'bg-red-50/80 text-red-500', 'Published': 'bg-purple-50/80 text-purple-600',
}

function parseEventDate(dateStr) {
  const p = dateStr.split(' ')
  return new Date(parseInt(p[2]), MONTHS.indexOf(p[1]), parseInt(p[0]))
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/* ── Quick Action Card ── */
function QuickAction({ icon, label, href, gradient, onClick }) {
  const router = useRouter()
  const handleClick = () => {
    if (onClick) onClick()
    else if (href) router.push(href)
  }
  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(220,228,235,0.2) 50%, rgba(255,255,255,0.4) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 16px rgba(107,123,141,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: gradient }}>
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-gray-700 leading-tight text-center">{label}</span>
    </button>
  )
}

export default function CalendarPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [now, setNow] = useState(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)

  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])
  const fetchEvents = () => fetch('/api/events').then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d) }).catch(() => {})
  useEffect(() => { fetchEvents() }, [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  // 90-day calendar strip
  const calendarDays = useMemo(() => {
    const days = []
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    for (let i = 0; i < 90; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }, [now.toDateString()])

  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(e => {
      const d = parseEventDate(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  const getEventsForDate = (date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return eventsByDate[key] || []
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const upcomingEvents = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return events
      .filter(e => parseEventDate(e.date) >= today)
      .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date))
  }, [events, now.toDateString()])

  if (authStatus === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-mauve/40 border-t-mauve rounded-full animate-spin" />
    </div>
  )

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_FULL[now.getMonth()]}`
  const todayIndex = calendarDays.findIndex(d => isSameDay(d, now))

  return (
    <div className="min-h-screen pb-safe-nav">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #363A47 0%, #4A5060 30%, #6B7B8D 60%, #9AAAB8 80%, #D0D9E2 100%)' }}>
        <GradientSpheres variant="default" />

        <div className="px-5 pt-14 pb-5 relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <img src="/logo.png" alt="The Sims App" className="h-10" />
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 shadow-md">
              <img src="/images/sima-portrait.jpg" alt="Sima" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Date & greeting */}
          <p className="text-[10px] font-semibold text-[#D0D9E2]/70 uppercase tracking-[0.2em]">{dateStr}</p>
          <p className="font-display text-3xl font-bold text-[#F7F9FA] italic tracking-tight mb-1">{timeStr}</p>
          <p className="text-sm text-[#D0D9E2]/80">Welcome, <span className="font-semibold text-[#F7F9FA]">{session?.user?.name || 'Sima'}</span></p>
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div className="px-4 -mt-1 mb-4">
        <div className="grid grid-cols-3 gap-2.5">
          <QuickAction
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
            label="About Sims"
            href="/about"
            gradient="linear-gradient(135deg, #363A47, #4A5060)"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
            label="Gallery"
            href="/gallery"
            gradient="linear-gradient(135deg, #6B7B8D, #9AAAB8)"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>}
            label="Media Kit"
            href="/media-kit"
            gradient="linear-gradient(135deg, #C9956B, #D4A574)"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
            label="Analytics"
            href="/analytics"
            gradient="linear-gradient(135deg, #5C6B7A, #7A8D9E)"
          />
          <QuickAction
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
            label="Try-On"
            href="/try-on"
            gradient="linear-gradient(135deg, #7A8F9E, #9AB0BE)"
          />
          {session?.user?.role === 'ADMIN' && (
            <QuickAction
              icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
              label="Team"
              href="/admin"
              gradient="linear-gradient(135deg, #6B8E6B, #7DA37D)"
            />
          )}
        </div>
      </div>

      {/* ── Calendar Strip ── */}
      <div className="px-0 pt-1 pb-2">
        <CalendarStrip
          days={calendarDays}
          today={now}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          getEventsForDate={getEventsForDate}
          todayIndex={todayIndex}
        />
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-2">
        {/* Selected date events */}
        {selectedDate && (
          <div className="animate-scale-in mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-bold text-gray-700 italic">
                {selectedDate.getDate()} {MONTH_FULL[selectedDate.getMonth()]}
                {isSameDay(selectedDate, now) && <span className="text-mauve ml-1.5 text-xs not-italic font-semibold">Today</span>}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-[11px] font-semibold text-gray-500">Clear</button>
            </div>
            {selectedEvents.length === 0 ? (
              <div className="liquid-glass-card p-6 text-center text-gray-500 text-sm">No events on this date</div>
            ) : (
              <div className="space-y-2.5">
                {selectedEvents.map(e => <EventCard key={e.id} event={e} onClick={() => router.push(`/events/${e.id}`)} />)}
              </div>
            )}
          </div>
        )}

        {/* Default view — stats + upcoming events */}
        {!selectedDate && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="flex gap-2.5 mb-5">
              <StatCard value={events.length} label="Total" />
              <StatCard value={upcomingEvents.filter(e => e.priority === 'CRITICAL').length} label="Critical" color="#FF2D55" />
              <StatCard value={events.filter(e => e.status === 'Approved' || e.status === 'Published').length} label="Done" color="#10B981" />
            </div>

            {/* Upcoming */}
            <h3 className="font-display text-base font-bold text-gray-700 italic mb-3">Upcoming</h3>
            <div className="space-y-2.5">
              {upcomingEvents.slice(0, 8).map((e) => (
                <EventCard key={e.id} event={e} onClick={() => router.push(`/events/${e.id}`)} showDate />
              ))}
              {upcomingEvents.length === 0 && (
                <div className="liquid-glass-card p-8 text-center text-gray-500 text-sm font-display italic">No upcoming events</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB — Add Event */}
      {session?.user?.role === 'ADMIN' && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-90"
          style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)', boxShadow: '0 4px 20px rgba(54,58,71,0.4)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onCreated={() => { fetchEvents(); setShowAddEvent(false) }} />}

      <Navbar />
    </div>
  )
}

/* ── Stat Card ── */
function StatCard({ value, label, color }) {
  return (
    <div className="flex-1 liquid-glass-card p-3 text-center">
      <p className="font-display text-xl font-bold italic" style={{ color: color || '#1A1A2E' }}>{value}</p>
      <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  )
}

/* ── Quick Add Event Modal ── */
function AddEventModal({ onClose, onCreated }) {
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
    const formatted = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
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
          background: 'linear-gradient(145deg, rgba(247,249,250,0.95), rgba(208,217,226,0.3))',
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#6B7B8D]/50" placeholder="Event name" required />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-sm text-gray-800 outline-none focus:border-[#6B7B8D]/50" required />
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
          <button type="submit" disabled={saving || !title || !date} className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6B7B8D, #363A47)' }}>
            {saving ? 'Creating...' : 'Create Event'}
          </button>
          <p className="text-[10px] text-gray-400 text-center">You can add more details after creating</p>
        </form>
      </div>
    </div>
  )
}

/* ── Calendar Strip ── */
function CalendarStrip({ days, today, selectedDate, setSelectedDate, getEventsForDate, todayIndex }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = document.getElementById('cal-today')
    if (el && scrollRef.current) {
      const container = scrollRef.current
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
      container.scrollTo({ left: offset, behavior: 'instant' })
    }
  }, [todayIndex])

  let currentMonth = -1

  return (
    <div ref={scrollRef} className="scrollbar-hide" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x proximity', scrollBehavior: 'smooth' }}>
      <div className="flex gap-0 px-4 min-w-max">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const dayEvents = getEventsForDate(day)
          const topPriority = dayEvents.length > 0 ? dayEvents.reduce((top, e) => {
            const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
            return (order[e.priority] ?? 4) < (order[top] ?? 4) ? e.priority : top
          }, dayEvents[0].priority) : null

          let monthLabel = null
          if (day.getMonth() !== currentMonth) {
            currentMonth = day.getMonth()
            monthLabel = MONTH_FULL[day.getMonth()].substring(0, 3)
          }

          return (
            <div key={i} className="flex flex-col items-center" style={{ scrollSnapAlign: isToday ? 'center' : 'none' }}>
              {monthLabel && <p className="text-[8px] font-bold text-mauve uppercase tracking-wider mb-0.5 w-[44px] text-center">{monthLabel}</p>}
              {!monthLabel && <p className="text-[8px] mb-0.5 w-[44px]">&nbsp;</p>}
              <button
                id={isToday ? 'cal-today' : undefined}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`w-[44px] h-[56px] rounded-2xl flex flex-col items-center justify-center gap-0.5 mx-[1px] transition-all active:scale-95 ${
                  isSelected ? 'bg-gradient-to-b from-mauve to-pink-400 text-white shadow-lg scale-105' :
                  isToday ? 'bg-white/80 shadow-sm ring-1.5 ring-mauve/40' :
                  isPast ? 'opacity-50' : ''
                }`}
              >
                <span className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : isToday ? 'text-mauve' : 'text-gray-500'}`}>
                  {DAY_SHORT[day.getDay()].substring(0, 2)}
                </span>
                <span className={`text-[15px] font-bold ${isSelected ? 'text-white' : isToday ? 'text-gray-800' : isPast ? 'text-gray-500' : 'text-gray-700'}`}>
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 ? (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? '#fff' : (priorityDots[topPriority] || '#9CA3AF') }} />
                ) : (
                  <div className="w-1.5 h-1.5" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Event Card ── */
function EventCard({ event, onClick, showDate }) {
  const eventDate = parseEventDate(event.date)
  const isPast = eventDate < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  return (
    <button onClick={onClick} className={`editorial-card p-4 w-full text-left active:scale-[0.98] ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {showDate && (
          <div className="flex-shrink-0 w-11 text-center pt-0.5">
            <p className="font-display text-lg font-bold text-gray-800 italic leading-none">{eventDate.getDate()}</p>
            <p className="text-[9px] font-semibold text-gray-500 uppercase">{MONTHS[eventDate.getMonth()]}</p>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`pill-tag text-[9px] ${priorityColors[event.priority]}`}>{event.priority}</span>
            <span className={`pill-tag text-[9px] ${statusColors[event.status] || 'bg-gray-100 text-gray-500'}`}>{event.status}</span>
          </div>
          <h4 className="font-display font-bold text-gray-800 text-[14px] leading-tight mb-0.5">{event.title}</h4>
          <p className="text-[11px] text-gray-500 line-clamp-1">{event.opportunityType}</p>
        </div>
        <span className="text-[9px] text-gray-500 font-medium flex-shrink-0 pt-1">{event.platforms?.split('+')[0]?.trim()}</span>
      </div>
    </button>
  )
}
