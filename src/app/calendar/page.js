'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function parseEventDate(dateStr) {
  const p = dateStr.split(' ')
  return new Date(parseInt(p[2]), MONTHS.indexOf(p[1]), parseInt(p[0]))
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const CATEGORY_DOTS = {
  'Social/Key Moments': '#363A47',
  'Corporate Campaign': '#6B7B8D',
  'Corporate Event': '#4A6FA5',
  'Sponsorships': '#8B6BA5',
  'Gifting': '#C9956B',
  'PR Birthdays': '#D4365C',
  'HR & CSR': '#6B8E6B',
  'Coca Cola Arena': '#CC4444',
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

  const calendarDays = useMemo(() => {
    const days = []
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    for (let i = 0; i < 120; i++) {
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
  const todayIndex = calendarDays.findIndex(d => isSameDay(d, now))

  if (authStatus === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FA' }}>
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  )

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_FULL[now.getMonth()]}`

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>

      {/* ── Compact Header ── */}
      <div className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(165deg, #363A47 0%, #4A5060 40%, #6B7B8D 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <img src="/logo.png" alt="The Sims App" className="h-8" style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/60 font-medium">{timeStr}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40">
              <img src="/images/sima-portrait.jpg" alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-white/50 uppercase tracking-[0.15em]">{dateStr}</p>
        <p className="text-sm text-white/80 mt-0.5">Hi, <span className="font-semibold text-white">{session?.user?.name || 'Sima'}</span></p>
      </div>

      {/* ── App Icons — full width iPhone style ── */}
      <div className="px-4 py-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>, href: '/about', label: 'About', gradient: 'linear-gradient(135deg, #363A47, #5A6070)' },
            { icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>, href: '/gallery', label: 'Gallery', gradient: 'linear-gradient(135deg, #6B7B8D, #9AAAB8)' },
            { icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>, href: '/media-kit', label: 'Media Kit', gradient: 'linear-gradient(135deg, #C9956B, #D4A574)' },
            { icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"/></svg>, href: '/analytics', label: 'Simulate', gradient: 'linear-gradient(135deg, #4A6FA5, #6B8DC4)' },
            { icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>, href: '/try-on', label: 'Try-On', gradient: 'linear-gradient(135deg, #8B6BA5, #A88BC4)' },
            ...(session?.user?.role === 'ADMIN' ? [
              { icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>, href: '/admin', label: 'Team', gradient: 'linear-gradient(135deg, #6B8E6B, #88B088)' },
            ] : []),
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-2 active:scale-90 transition-all"
            >
              <div
                className="w-full aspect-square rounded-[22px] flex items-center justify-center text-white shadow-lg"
                style={{ background: item.gradient }}
              >
                {item.icon}
              </div>
              <span className="text-[11px] font-semibold text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Date Sweeper ── */}
      <DateSweeper
        days={calendarDays}
        today={now}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        getEventsForDate={getEventsForDate}
        todayIndex={todayIndex}
      />

      {/* ── Selected Date Events ── */}
      <div className="px-4 pt-3">
        {selectedDate && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                {selectedDate.getDate()} {MONTH_FULL[selectedDate.getMonth()]}
                {isSameDay(selectedDate, now) && <span className="text-xs text-gray-400 ml-1">Today</span>}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-[10px] font-medium text-gray-400">Clear</button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No events</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(e => (
                  <button
                    key={e.id}
                    onClick={() => router.push(`/events/${e.id}`)}
                    className="w-full text-left p-3 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-transform"
                    style={{ background: 'rgba(54,58,71,0.04)', border: '1px solid rgba(54,58,71,0.06)' }}
                  >
                    <div className="w-1 h-8 rounded-full" style={{ background: CATEGORY_DOTS[e.category] || '#6B7B8D' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.title}</p>
                      <p className="text-[10px] text-gray-400">{e.category}</p>
                    </div>
                    {e.status !== 'Not Started' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                        background: e.status === 'Approved' ? 'rgba(107,142,107,0.15)' : e.status === 'Cancelled' ? 'rgba(211,54,92,0.12)' : 'rgba(201,149,107,0.15)',
                        color: e.status === 'Approved' ? '#6B8E6B' : e.status === 'Cancelled' ? '#D4365C' : '#C9956B',
                      }}>{e.status}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB — Add Event */}
      {session?.user?.role === 'ADMIN' && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40 active:scale-90 transition-transform"
          style={{ background: '#363A47' }}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onCreated={() => { fetchEvents(); setShowAddEvent(false) }} />}
      <Navbar />
    </div>
  )
}

/* ── Date Sweeper ── */
function DateSweeper({ days, today, selectedDate, setSelectedDate, getEventsForDate, todayIndex }) {
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
    <div className="px-0">
      <div ref={scrollRef} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x proximity' }}>
        <div className="flex gap-0 px-4 min-w-max">
          {days.map((day, i) => {
            const isToday = isSameDay(day, today)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const dayEvents = getEventsForDate(day)
            const hasEvents = dayEvents.length > 0
            const topCat = hasEvents ? dayEvents[0].category : null

            let monthLabel = null
            if (day.getMonth() !== currentMonth) {
              currentMonth = day.getMonth()
              monthLabel = MONTH_FULL[day.getMonth()].substring(0, 3)
            }

            return (
              <div key={i} className="flex flex-col items-center" style={{ scrollSnapAlign: isToday ? 'center' : 'none' }}>
                {monthLabel ? <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 w-[42px] text-center">{monthLabel}</p> : <p className="text-[8px] mb-0.5 w-[42px]">&nbsp;</p>}
                <button
                  id={isToday ? 'cal-today' : undefined}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`w-[42px] h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 mx-[1px] transition-all active:scale-95 ${
                    isSelected ? 'text-white' : isPast ? 'opacity-40' : ''
                  }`}
                  style={
                    isSelected ? { background: '#363A47' } :
                    isToday ? { background: 'rgba(54,58,71,0.08)' } :
                    {}
                  }
                >
                  <span className={`text-[9px] font-medium ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                    {DAY_SHORT[day.getDay()]}
                  </span>
                  <span className={`text-[15px] font-bold ${isSelected ? 'text-white' : isToday ? 'text-gray-800' : 'text-gray-600'}`}>
                    {day.getDate()}
                  </span>
                  {hasEvents ? (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? '#fff' : (CATEGORY_DOTS[topCat] || '#6B7B8D') }} />
                  ) : (
                    <div className="w-1.5 h-1.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Add Event Modal ── */
function AddEventModal({ onClose, onCreated }) {
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
    onCreated()
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
