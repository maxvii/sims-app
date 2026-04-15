'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const CATEGORY_COLORS = {
  'Social/Key Moments': '#363A47',
  'Corporate Campaign': '#6B7B8D',
  'Corporate Event': '#4A6FA5',
  'Sponsorships': '#8B6BA5',
  'Gifting': '#C9956B',
  'PR Birthdays': '#D4365C',
  'HR & CSR': '#6B8E6B',
  'Coca Cola Arena': '#CC4444',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_STYLES = {
  'Approved': { bg: 'rgba(107,142,107,0.15)', text: '#6B8E6B', label: 'Approved' },
  'Rescheduled': { bg: 'rgba(201,149,107,0.15)', text: '#C9956B', label: 'Rescheduled' },
  'Cancelled': { bg: 'rgba(211,54,92,0.12)', text: '#D4365C', label: 'Cancelled' },
}

function getCategoryColor(category) {
  if (!category) return '#6B7B8D'
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return color
    }
  }
  return '#6B7B8D'
}

export default function EventsCalendarPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedMonth, setExpandedMonth] = useState(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const eventsByMonth = {}
  MONTHS.forEach((m) => { eventsByMonth[m] = [] })
  events.forEach((ev) => {
    const m = ev.month
    if (m && eventsByMonth[m]) eventsByMonth[m].push(ev)
  })

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F7F9FA' }}>
      {/* ── Minimal Header ── */}
      <div className="px-5 pt-14 pb-4">
        <button
          onClick={() => router.push('/calendar')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="font-display text-3xl font-black italic" style={{ color: '#2B2E38' }}>
          Sims Calendar
        </h1>
      </div>

      {/* ── Vertical Month List (2-col) ── */}
      <div className="px-4 mt-2">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(107,123,141,0.2)', borderTopColor: '#6B7B8D' }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {MONTHS.map((month) => {
                const monthEvents = eventsByMonth[month] || []
                const isExpanded = expandedMonth === month

                return (
                  <button
                    key={month}
                    onClick={() => setExpandedMonth(isExpanded ? null : month)}
                    className="w-full text-left py-4 flex items-center justify-between transition-colors active:bg-black/[0.02]"
                    style={{ borderBottom: '1px solid rgba(54,58,71,0.06)' }}
                  >
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: '#2B2E38' }}>
                        {month}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>

            {/* ── Expanded month's events ── */}
            {expandedMonth && (eventsByMonth[expandedMonth] || []).length > 0 && (
              <div className="mt-4 mx-1 space-y-2 animate-fade-in">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 px-2 mb-1">
                  {expandedMonth} Events
                </p>
                {(eventsByMonth[expandedMonth] || []).map((ev) => {
                  const catColor = getCategoryColor(ev.category)
                  const statusStyle = STATUS_STYLES[ev.status]
                  return (
                    <button
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="w-full text-left rounded-2xl p-3.5 flex items-start gap-3 transition-all active:scale-[0.98]"
                      style={{
                        background: '#fff',
                        border: '1px solid #E7ECF1',
                      }}
                    >
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: catColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-tight truncate" style={{ color: '#2B2E38' }}>
                            {ev.title}
                          </h4>
                          {statusStyle && (
                            <span
                              className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: statusStyle.bg, color: statusStyle.text }}
                            >
                              {statusStyle.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {ev.category && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${catColor}18`, color: catColor }}>
                              {ev.category}
                            </span>
                          )}
                          {ev.date && <span className="text-[10px] text-gray-400">{ev.date}</span>}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Navbar />
    </div>
  )
}
