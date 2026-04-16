'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

// ── Category colors — matches Sims Design System v2.0 ──
const CATEGORY_COLORS = {
  'Social/Key Moments': '#2B2E38',
  'Corporate Campaign': '#6B7B8D',
  'Corporate Event':    '#4A6FA5',
  'Sponsorships':       '#8B6BA5',
  'Gifting':            '#C9956B',
  'PR Birthdays':       '#D4365C',
  'HR & CSR':           '#6B8E6B',
  'Coca Cola Arena':    '#CC4444',
}

const STATUS_STYLES = {
  'Approved':    { bg: 'rgba(107,142,107,0.14)', text: '#6B8E6B' },
  'Rescheduled': { bg: 'rgba(201,149,107,0.14)', text: '#C9956B' },
  'Cancelled':   { bg: 'rgba(212,54,92,0.12)',   text: '#D4365C' },
  'Not Started': { bg: 'rgba(156,163,175,0.14)', text: '#6B7B8D' },
}

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const VIEW_YEAR = 2026

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

  // Bucket events by month (0-indexed)
  const eventsByMonth = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => [])
    events.forEach((ev) => {
      const d = parseEventDate(ev)
      if (!d) return
      if (d.year !== VIEW_YEAR) return
      buckets[d.month].push(ev)
    })
    // Sort each bucket by day ascending
    buckets.forEach((arr) => arr.sort((a, b) => {
      const da = parseEventDate(a)?.day || 0
      const db = parseEventDate(b)?.day || 0
      return da - db
    }))
    return buckets
  }, [events])

  const selectedEvents = eventsByMonth[selectedMonth] || []
  const totalEvents = eventsByMonth.reduce((acc, arr) => acc + arr.length, 0)

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
          {totalEvents} event{totalEvents !== 1 ? 's' : ''} across the year
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(107,123,141,0.2)', borderTopColor: '#6B7B8D' }} />
        </div>
      ) : (
        <>
          {/* ── Year Header (replaces the month name) ── */}
          <div className="mx-4 mb-4 px-5 py-4 rounded-2xl flex items-center justify-between" style={{ background: '#E7ECF1' }}>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#6B7B8D' }}>
                Year
              </div>
              <div className="font-display text-3xl font-black italic" style={{ color: '#2B2E38' }}>
                {VIEW_YEAR}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#6B7B8D' }}>
                Viewing
              </div>
              <div className="font-display text-lg font-bold" style={{ color: '#2B2E38' }}>
                {MONTHS_FULL[selectedMonth]}
              </div>
            </div>
          </div>

          {/* ── 12-Month Grid (4 cols × 3 rows) — replaces the day cells ── */}
          <div className="mx-4 p-4 rounded-3xl" style={{ background: '#FFFFFF', border: '1px solid #E7ECF1' }}>
            <div className="grid grid-cols-4 gap-2">
              {MONTHS_FULL.map((monthName, idx) => {
                const count = eventsByMonth[idx].length
                const isSelected = idx === selectedMonth
                const today = new Date()
                const isCurrentMonth = idx === today.getMonth() && VIEW_YEAR === today.getFullYear()

                return (
                  <button
                    key={monthName}
                    onClick={() => setSelectedMonth(idx)}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 relative"
                    style={{
                      background: isSelected ? '#363A47' : (isCurrentMonth ? '#D0D9E2' : 'transparent'),
                      border: isSelected ? 'none' : `1px solid ${isCurrentMonth ? 'transparent' : '#E7ECF1'}`,
                    }}
                  >
                    <span
                      className="text-[11px] font-bold tracking-[0.15em] uppercase"
                      style={{ color: isSelected ? '#F7F9FA' : '#2B2E38' }}
                    >
                      {MONTHS_SHORT[idx]}
                    </span>
                    {count > 0 && (
                      <span
                        className="text-[10px] font-semibold mt-1"
                        style={{ color: isSelected ? 'rgba(247,249,250,0.75)' : '#9AAAB8' }}
                      >
                        {count} event{count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {count === 0 && (
                      <span
                        className="text-[10px] mt-1"
                        style={{ color: isSelected ? 'rgba(247,249,250,0.55)' : '#C7CED5' }}
                      >
                        —
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Selected Month Events (shown below, like the wireframe) ── */}
          <div className="px-4 mt-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: '#6B7B8D' }}>
                  {MONTHS_FULL[selectedMonth]} {VIEW_YEAR}
                </p>
                <h3 className="font-display text-lg font-bold" style={{ color: '#2B2E38' }}>
                  {selectedEvents.length === 0
                    ? 'No events'
                    : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
                </h3>
              </div>
            </div>

            {selectedEvents.length === 0 ? (
              <div className="py-10 text-center rounded-2xl" style={{ background: '#FFFFFF', border: '1px dashed #E7ECF1' }}>
                <p className="text-xs" style={{ color: '#9AAAB8' }}>No events scheduled this month</p>
              </div>
            ) : (
              <div className="space-y-2.5 animate-fade-in">
                {selectedEvents.map((ev) => {
                  const catColor = getCategoryColor(ev.category)
                  const statusStyle = STATUS_STYLES[ev.status] || STATUS_STYLES['Not Started']
                  const parsed = parseEventDate(ev)
                  return (
                    <button
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="w-full text-left rounded-2xl p-3.5 flex items-start gap-3 transition-all active:scale-[0.98]"
                      style={{ background: '#FFFFFF', border: '1px solid #E7ECF1' }}
                    >
                      {/* Day badge */}
                      <div
                        className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
                        style={{ background: `${catColor}14` }}
                      >
                        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: catColor }}>
                          {MONTHS_SHORT[selectedMonth]}
                        </span>
                        <span className="text-sm font-black leading-none" style={{ color: catColor }}>
                          {parsed?.day ?? '—'}
                        </span>
                      </div>

                      {/* Content */}
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
