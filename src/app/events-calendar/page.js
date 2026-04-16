'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

// ── Category colors — matches Sims Design System v2.0 ──
const CATEGORY_COLORS = {
  'Social/Key Moments': '#2B2E38',  // Violet Dark
  'Corporate Campaign': '#6B7B8D',  // Mauve Rose
  'Corporate Event':    '#4A6FA5',  // Blue accent
  'Sponsorships':       '#8B6BA5',  // Violet accent
  'Gifting':            '#C9956B',  // Warm tan (= Rescheduled)
  'PR Birthdays':       '#D4365C',  // Pink (= Cancelled)
  'HR & CSR':           '#6B8E6B',  // Green (= Approved)
  'Coca Cola Arena':    '#CC4444',  // Red
}

const STATUS_STYLES = {
  'Approved':    { bg: 'rgba(107,142,107,0.14)', text: '#6B8E6B', dot: '#6B8E6B' },
  'Rescheduled': { bg: 'rgba(201,149,107,0.14)', text: '#C9956B', dot: '#C9956B' },
  'Cancelled':   { bg: 'rgba(212,54,92,0.12)',   text: '#D4365C', dot: '#D4365C' },
  'Not Started': { bg: 'rgba(156,163,175,0.14)', text: '#6B7B8D', dot: '#9CA3AF' },
}

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['S','M','T','W','T','F','S']

function getCategoryColor(category) {
  if (!category) return '#6B7B8D'
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return color
    }
  }
  return '#6B7B8D'
}

function parseEventDate(ev) {
  // ev.date is "DD MMM YYYY" like "12 Apr 2026"
  if (!ev.date) return null
  const parts = ev.date.trim().split(/\s+/)
  if (parts.length < 3) return null
  const day = parseInt(parts[0], 10)
  const monthIdx = MONTHS_SHORT.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().slice(0, 3))
  const year = parseInt(parts[2], 10)
  if (isNaN(day) || monthIdx < 0 || isNaN(year)) return null
  return { day, month: monthIdx, year }
}

export default function EventsCalendarPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMonthIdx, setViewMonthIdx] = useState(new Date().getMonth())
  const [viewYear] = useState(2026)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [filterCat, setFilterCat] = useState(null)

  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Group events by date-key (YYYY-MM-DD) for fast lookup ──
  const eventsByDay = useMemo(() => {
    const map = {}
    events.forEach((ev) => {
      const d = parseEventDate(ev)
      if (!d) return
      if (d.year !== viewYear || d.month !== viewMonthIdx) return
      if (filterCat && !ev.category?.toLowerCase().includes(filterCat.toLowerCase())) return
      if (!map[d.day]) map[d.day] = []
      map[d.day].push(ev)
    })
    return map
  }, [events, viewMonthIdx, viewYear, filterCat])

  // Build calendar grid for current month
  const firstOfMonth = new Date(viewYear, viewMonthIdx, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate()
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7

  const selectedDayEvents = eventsByDay[selectedDay] || []
  const monthName = MONTHS_FULL[viewMonthIdx]

  const totalMonthEvents = Object.values(eventsByDay).reduce((acc, arr) => acc + arr.length, 0)

  const goMonth = (delta) => {
    let m = viewMonthIdx + delta
    if (m < 0) m = 11
    if (m > 11) m = 0
    setViewMonthIdx(m)
    setSelectedDay(1)
  }

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={() => router.push('/calendar')}
          className="flex items-center gap-1 text-[11px] mb-3"
          style={{ color: '#9AAAB8' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="font-display text-3xl font-black italic" style={{ color: '#2B2E38' }}>
          Sims Calendar
        </h1>
        <p className="text-[11px] mt-1" style={{ color: '#6B7B8D' }}>
          {totalMonthEvents} event{totalMonthEvents !== 1 ? 's' : ''} · {monthName} {viewYear}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(107,123,141,0.2)', borderTopColor: '#6B7B8D' }} />
        </div>
      ) : (
        <>
          {/* ── Month Pager ── */}
          <div className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-center justify-between" style={{ background: '#E7ECF1' }}>
            <button onClick={() => goMonth(-1)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: '#F7F9FA' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#363A47" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="text-center">
              <div className="font-display text-lg font-bold" style={{ color: '#2B2E38' }}>
                {monthName}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#6B7B8D' }}>
                {viewYear}
              </div>
            </div>
            <button onClick={() => goMonth(1)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: '#F7F9FA' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#363A47" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* ── Calendar Grid ── */}
          <div className="mx-4 p-4 rounded-3xl" style={{ background: '#FFFFFF', border: '1px solid #E7ECF1' }}>
            {/* Weekday strip */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold tracking-[0.15em]" style={{ color: '#9AAAB8' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const dayNum = idx - startWeekday + 1
                const inMonth = dayNum >= 1 && dayNum <= daysInMonth
                const dayEvents = inMonth ? (eventsByDay[dayNum] || []) : []
                const isSelected = inMonth && dayNum === selectedDay
                const today = new Date()
                const isToday = inMonth &&
                  dayNum === today.getDate() &&
                  viewMonthIdx === today.getMonth() &&
                  viewYear === today.getFullYear()

                return (
                  <button
                    key={idx}
                    disabled={!inMonth}
                    onClick={() => inMonth && setSelectedDay(dayNum)}
                    className="relative h-12 rounded-xl flex flex-col items-center justify-center transition-all active:scale-90"
                    style={{
                      background: isSelected ? '#363A47' : (isToday ? '#D0D9E2' : 'transparent'),
                      opacity: inMonth ? 1 : 0,
                    }}
                  >
                    <span className="text-sm font-semibold" style={{
                      color: isSelected ? '#F7F9FA' : (isToday ? '#2B2E38' : '#2B2E38'),
                    }}>
                      {inMonth ? dayNum : ''}
                    </span>
                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <span key={i} className="w-1 h-1 rounded-full" style={{
                            background: isSelected ? '#F7F9FA' : getCategoryColor(ev.category),
                          }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Category Legend (filter chips) ── */}
          <div className="px-4 mt-5">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2.5" style={{ color: '#6B7B8D' }}>
              Categories
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                const active = filterCat === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(active ? null : cat)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? color : '#FFFFFF',
                      border: `1px solid ${active ? color : '#E7ECF1'}`,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: active ? '#F7F9FA' : color }} />
                    <span className="text-[11px] font-semibold whitespace-nowrap" style={{
                      color: active ? '#F7F9FA' : '#2B2E38',
                    }}>
                      {cat}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Selected Day Events ── */}
          <div className="px-4 mt-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: '#6B7B8D' }}>
                  {monthName} {selectedDay}
                </p>
                <h3 className="font-display text-lg font-bold" style={{ color: '#2B2E38' }}>
                  {selectedDayEvents.length === 0 ? 'No events' : `${selectedDayEvents.length} event${selectedDayEvents.length !== 1 ? 's' : ''}`}
                </h3>
              </div>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center rounded-2xl" style={{ background: '#FFFFFF', border: '1px dashed #E7ECF1' }}>
                <p className="text-xs" style={{ color: '#9AAAB8' }}>Tap a day with a dot to see its events</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayEvents.map((ev) => {
                  const catColor = getCategoryColor(ev.category)
                  const statusStyle = STATUS_STYLES[ev.status] || STATUS_STYLES['Not Started']
                  return (
                    <button
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="w-full text-left rounded-2xl p-3.5 flex items-start gap-3 transition-all active:scale-[0.98]"
                      style={{ background: '#FFFFFF', border: '1px solid #E7ECF1' }}
                    >
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: catColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-tight truncate" style={{ color: '#2B2E38' }}>
                            {ev.title}
                          </h4>
                          <span
                            className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {ev.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {ev.category && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${catColor}18`, color: catColor }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                              {ev.category}
                            </span>
                          )}
                          {ev.date && <span className="text-[10px]" style={{ color: '#9AAAB8' }}>{ev.date}</span>}
                        </div>
                      </div>
                      <svg className="w-4 h-4 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="#D0D9E2" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Navbar />
    </div>
  )
}
