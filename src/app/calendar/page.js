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
const cardGradients = [
  'from-[#E8D5F5]/70 via-[#F5E6FF]/40 to-[#FFE0E8]/50',
  'from-[#FFE0E8]/60 via-[#FFF0F5]/40 to-[#F5E6FF]/50',
  'from-[#F0E4FF]/60 via-[#FFE8EE]/40 to-[#E8D5F5]/40',
  'from-[#FFAB91]/30 via-[#FFE0E8]/40 to-[#F5E6FF]/40',
  'from-[#C9A0DC]/30 via-[#FFE0E8]/30 to-[#FFF0F5]/50',
]

function parseEventDate(dateStr) {
  const p = dateStr.split(' ')
  return new Date(parseInt(p[2]), MONTHS.indexOf(p[1]), parseInt(p[0]))
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function CalendarPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])
  useEffect(() => { fetch('/api/events').then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d) }).catch(() => {}) }, [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  // Build a 90-day calendar strip starting from 7 days ago
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

  // Events mapped by date key
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

  // Selected day events
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Upcoming events (from today forward)
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

  // Find today's index in the strip to auto-scroll
  const todayIndex = calendarDays.findIndex(d => isSameDay(d, now))

  return (
    <div className="min-h-screen pb-safe-nav">
      {/* ── Hero ── */}
      <div className="px-5 pt-14 pb-5 relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #E8D5F5 0%, #F5E6FF 30%, #FFE0E8 60%, #FFF5F7 100%)' }}>
        <GradientSpheres variant="default" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <h1 className="font-script text-4xl text-gray-900">Sims <span className="text-[10px] font-sans font-semibold text-gray-500 tracking-[0.15em] uppercase align-middle ml-0.5" style={{ fontFamily: 'var(--font-sans)' }}>App</span></h1>
          <div className="w-9 h-9 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center border border-white/50">
            <span className="text-sm font-bold text-gray-700">{session?.user?.name?.[0] || 'A'}</span>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-semibold text-mauve uppercase tracking-[0.2em]">{dateStr}</p>
          <p className="font-display text-3xl font-bold text-gray-900 italic tracking-tight mb-2">{timeStr}</p>
          <p className="text-sm text-gray-700">Welcome, <span className="font-semibold text-gray-900">{session?.user?.name || 'Admin'}</span></p>
          <p className="font-display text-[13px] italic text-gray-500 mt-0.5">"Believe in yourself and you will be unstoppable"</p>
        </div>
      </div>

      {/* ── Calendar Strip ── */}
      <div className="px-0 pt-3 pb-2">
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

        {/* Upcoming events */}
        {!selectedDate && (
          <div className="animate-fade-in">
            {/* Stats row */}
            <div className="flex gap-2.5 mb-5">
              <div className="flex-1 liquid-glass-card p-3 text-center">
                <p className="font-display text-xl font-bold text-gray-800 italic">{events.length}</p>
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Total</p>
              </div>
              <div className="flex-1 liquid-glass-card p-3 text-center">
                <p className="font-display text-xl font-bold text-priority-critical italic">{upcomingEvents.filter(e => e.priority === 'CRITICAL').length}</p>
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Critical</p>
              </div>
              <div className="flex-1 liquid-glass-card p-3 text-center">
                <p className="font-display text-xl font-bold text-emerald-500 italic">{events.filter(e => e.status === 'Approved' || e.status === 'Published').length}</p>
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Done</p>
              </div>
            </div>

            {/* Next Up */}
            <h3 className="font-display text-base font-bold text-gray-700 italic mb-3">Next Up</h3>
            <div className="space-y-2.5">
              {upcomingEvents.slice(0, 8).map((e, i) => (
                <EventCard key={e.id} event={e} onClick={() => router.push(`/events/${e.id}`)} showDate />
              ))}
              {upcomingEvents.length === 0 && (
                <div className="liquid-glass-card p-8 text-center text-gray-500 text-sm font-display italic">No upcoming events</div>
              )}
            </div>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}

/* ── Calendar Strip Component ── */
function CalendarStrip({ days, today, selectedDate, setSelectedDate, getEventsForDate, todayIndex }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    // Auto-scroll to today on mount
    const el = document.getElementById('cal-today')
    if (el && scrollRef.current) {
      const container = scrollRef.current
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
      container.scrollTo({ left: offset, behavior: 'instant' })
    }
  }, [todayIndex])

  // Group days by month for header labels
  let currentMonth = -1

  return (
    <div
      ref={scrollRef}
      className="scrollbar-hide"
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x proximity',
        scrollBehavior: 'smooth',
      }}
    >
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

          // Month label
          let monthLabel = null
          if (day.getMonth() !== currentMonth) {
            currentMonth = day.getMonth()
            monthLabel = MONTH_FULL[day.getMonth()].substring(0, 3)
          }

          return (
            <div key={i} className="flex flex-col items-center" style={{ scrollSnapAlign: isToday ? 'center' : 'none' }}>
              {/* Month label row */}
              {monthLabel && (
                <p className="text-[8px] font-bold text-mauve uppercase tracking-wider mb-0.5 w-[44px] text-center">{monthLabel}</p>
              )}
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
                {/* Event dot */}
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
