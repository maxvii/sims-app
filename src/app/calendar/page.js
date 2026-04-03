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

function getDayNightIcon(hour) {
  if (hour >= 6 && hour < 12) return { icon: '☀️', label: 'Morning' }
  if (hour >= 12 && hour < 17) return { icon: '🌤', label: 'Afternoon' }
  if (hour >= 17 && hour < 20) return { icon: '🌅', label: 'Evening' }
  return { icon: '🌙', label: 'Night' }
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
  const dayNight = getDayNightIcon(now.getHours())
  const avatarUrl = session?.user?.avatar || '/images/sima-portrait.jpg'

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>

      {/* ── Light Header — no dark background ── */}
      <div className="px-5 pt-14 pb-3">
        {/* Top row: logo + avatar */}
        <div className="flex items-center justify-between mb-4">
          <img src="/logo.png" alt="The Sims App" className="h-12" />
          <button onClick={() => router.push('/profile')} className="active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200">
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>

        {/* Date, time, day/night icon */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{dayNight.icon}</span>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">{dateStr}</p>
            <p className="text-lg font-bold text-gray-800">{timeStr}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">Hi, <span className="font-semibold text-gray-800">{session?.user?.name || 'Sima'}</span></p>
      </div>

      {/* ── Date Sweeper — above icons ── */}
      <DateSweeper
        days={calendarDays}
        today={now}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        getEventsForDate={getEventsForDate}
        todayIndex={todayIndex}
      />

      {/* ── Selected Date Events ── */}
      {selectedDate && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              {selectedDate.getDate()} {MONTH_FULL[selectedDate.getMonth()]}
              {isSameDay(selectedDate, now) && <span className="text-xs text-gray-400 ml-1">Today</span>}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-[10px] font-medium text-gray-400">Clear</button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">No events</p>
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

      {/* ── App Icons — 2 column, neumorphic style with creative SVG shapes ── */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-5">
          {[
            { href: '/about', label: 'About Sima', shape: (
              <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="20" r="10" fill="#363A47"/>
                <ellipse cx="28" cy="42" rx="16" ry="10" fill="#363A47" opacity="0.7"/>
                <circle cx="28" cy="20" r="6" fill="#F7F9FA" opacity="0.15"/>
              </svg>
            )},
            { href: '/gallery', label: 'Gallery', shape: (
              <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
                <rect x="8" y="12" width="40" height="32" rx="6" fill="#363A47"/>
                <circle cx="20" cy="24" r="5" fill="#F7F9FA" opacity="0.2"/>
                <path d="M8 36 L22 26 L30 32 L38 22 L48 34 L48 38 C48 41.3 45.3 44 42 44 L14 44 C10.7 44 8 41.3 8 38 Z" fill="#363A47"/>
                <path d="M8 36 L22 26 L30 32 L38 22 L48 34 L48 38 C48 41.3 45.3 44 42 44 L14 44 C10.7 44 8 41.3 8 38 Z" fill="#F7F9FA" opacity="0.15"/>
              </svg>
            )},
            { href: '/media-kit', label: 'Simz Card', shape: (
              <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
                <rect x="14" y="6" width="28" height="44" rx="4" fill="#363A47"/>
                <rect x="18" y="12" width="20" height="3" rx="1.5" fill="#F7F9FA" opacity="0.2"/>
                <rect x="18" y="18" width="14" height="3" rx="1.5" fill="#F7F9FA" opacity="0.15"/>
                <rect x="18" y="24" width="18" height="3" rx="1.5" fill="#F7F9FA" opacity="0.12"/>
                <rect x="18" y="30" width="10" height="3" rx="1.5" fill="#F7F9FA" opacity="0.1"/>
                <circle cx="36" cy="40" r="6" fill="#F7F9FA" opacity="0.12"/>
                <path d="M34 40 L39 37 L39 43 Z" fill="#F7F9FA" opacity="0.2"/>
              </svg>
            )},
            { href: '/analytics', label: 'Simulate', shape: (
              <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
                <rect x="10" y="30" width="8" height="16" rx="3" fill="#363A47" opacity="0.5"/>
                <rect x="21" y="22" width="8" height="24" rx="3" fill="#363A47" opacity="0.7"/>
                <rect x="32" y="14" width="8" height="32" rx="3" fill="#363A47" opacity="0.85"/>
                <rect x="43" y="8" width="8" height="38" rx="3" fill="#363A47"/>
                <path d="M12 28 C18 20 26 16 34 12 C38 10 44 7 48 6" stroke="#363A47" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                <circle cx="48" cy="6" r="3" fill="#363A47" opacity="0.5"/>
              </svg>
            )},
            { href: '/try-on', label: 'Try-On', shape: (
              <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
                <path d="M28 8 C28 8 22 8 20 14 C18 20 16 24 12 28 C8 32 10 40 16 42 C20 43.5 24 42 28 38 C32 42 36 43.5 40 42 C46 40 48 32 44 28 C40 24 38 20 36 14 C34 8 28 8 28 8 Z" fill="#363A47"/>
                <path d="M22 22 C22 22 24 28 28 28 C32 28 34 22 34 22" stroke="#F7F9FA" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.2"/>
                <circle cx="22" cy="20" r="2" fill="#F7F9FA" opacity="0.15"/>
                <circle cx="34" cy="20" r="2" fill="#F7F9FA" opacity="0.15"/>
              </svg>
            )},
            ...(session?.user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Team', shape: (
              <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
                <circle cx="20" cy="18" r="7" fill="#363A47" opacity="0.7"/>
                <ellipse cx="20" cy="34" rx="11" ry="8" fill="#363A47" opacity="0.5"/>
                <circle cx="38" cy="16" r="8" fill="#363A47"/>
                <ellipse cx="38" cy="34" rx="12" ry="9" fill="#363A47" opacity="0.7"/>
                <circle cx="38" cy="16" r="4" fill="#F7F9FA" opacity="0.1"/>
              </svg>
            )}] : []),
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-2.5 active:scale-90 transition-all"
            >
              <div
                className="w-full aspect-square rounded-[28px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #F0F3F6, #D8DEE5)',
                  boxShadow: '8px 8px 20px rgba(166,180,200,0.4), -8px -8px 20px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                {item.shape}
              </div>
              <span className="text-[13px] font-semibold text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
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
    <div className="px-0 pb-2">
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
