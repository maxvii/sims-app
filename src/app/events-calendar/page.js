'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const CATEGORY_COLORS = {
  'Social/Key Moments': '#935073',
  'Sponsorships': '#502D55',
  'Corporate Campaign': '#C9956B',
  'Corporate Event': '#7E5A8C',
  'Gifting': '#B0688A',
  'PR Birthdays': '#E8A0BF',
  'HR & CSR': '#6B8E6B',
  'Coca Cola Arena': '#D4365C',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const PRIORITY_STYLES = {
  HIGH: { bg: 'rgba(211,54,92,0.12)', text: '#D4365C', label: 'High' },
  MEDIUM: { bg: 'rgba(201,149,107,0.15)', text: '#C9956B', label: 'Med' },
  LOW: { bg: 'rgba(107,142,107,0.12)', text: '#6B8E6B', label: 'Low' },
}

function getCategoryColor(category) {
  if (!category) return '#935073'
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return color
    }
  }
  return '#935073'
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

  // Group events by month
  const eventsByMonth = {}
  MONTHS.forEach((m) => { eventsByMonth[m] = [] })
  events.forEach((ev) => {
    const m = ev.month
    if (m && eventsByMonth[m]) {
      eventsByMonth[m].push(ev)
    }
  })

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F8F4E9' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(248,244,233,0.8) 0%, rgba(246,219,192,0.35) 50%, rgba(248,244,233,0.75) 100%)',
          backdropFilter: 'blur(40px) saturate(2)',
          WebkitBackdropFilter: 'blur(40px) saturate(2)',
          borderRadius: '0 0 24px 24px',
          borderBottom: '1.5px solid rgba(248,244,233,0.7)',
          boxShadow: '0 8px 32px rgba(80,45,85,0.06)',
        }}
      >
        {/* Gradient spheres */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #935073, transparent 70%)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #502D55, transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <button
            onClick={() => router.push('/calendar')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="font-display text-3xl font-black italic text-gray-800">SIMS Calendar</h1>
          <p className="text-xs text-gray-500 mt-1">Full year 2026 overview</p>
        </div>
      </div>

      {/* Year Grid */}
      <div className="px-4 mt-5">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'rgba(147,80,115,0.2)', borderTopColor: '#935073' }} />
            <p className="text-sm text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {MONTHS.map((month) => {
              const monthEvents = eventsByMonth[month] || []
              const isExpanded = expandedMonth === month
              const hasEvents = monthEvents.length > 0

              // Gather unique categories for color dots
              const categories = [...new Set(monthEvents.map((e) => e.category).filter(Boolean))]

              return (
                <div
                  key={month}
                  className={`transition-all duration-300 ${isExpanded ? 'col-span-2' : ''}`}
                >
                  <button
                    onClick={() => setExpandedMonth(isExpanded ? null : month)}
                    className={`w-full text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] ${
                      isExpanded ? 'ring-2 ring-[#935073]/30' : ''
                    }`}
                    style={{
                      background: 'rgba(248,244,233,0.65)',
                      backdropFilter: 'blur(36px)',
                      WebkitBackdropFilter: 'blur(36px)',
                      border: '1px solid rgba(248,244,233,0.65)',
                      boxShadow: '0 2px 12px rgba(80,45,85,0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-base font-bold" style={{ color: '#502D55' }}>
                          {month}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Category color dots */}
                        <div className="flex -space-x-1">
                          {categories.slice(0, 4).map((cat, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-full border border-white/60"
                              style={{ background: getCategoryColor(cat) }}
                            />
                          ))}
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded events list */}
                  {isExpanded && monthEvents.length > 0 && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      {monthEvents.map((ev) => {
                        const catColor = getCategoryColor(ev.category)
                        const priority = PRIORITY_STYLES[ev.priority] || PRIORITY_STYLES.MEDIUM

                        return (
                          <button
                            key={ev.id}
                            onClick={() => router.push(`/events/${ev.id}`)}
                            className="w-full text-left rounded-xl p-3.5 flex items-start gap-3 transition-all active:scale-[0.98] hover:shadow-md"
                            style={{
                              background: 'rgba(255,255,255,0.5)',
                              backdropFilter: 'blur(12px)',
                              WebkitBackdropFilter: 'blur(12px)',
                              border: '1px solid rgba(248,244,233,0.5)',
                            }}
                          >
                            {/* Category color bar */}
                            <div
                              className="w-1 self-stretch rounded-full shrink-0"
                              style={{ background: catColor }}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-gray-800 leading-tight truncate">
                                  {ev.title}
                                </h4>
                                {ev.priority && (
                                  <span
                                    className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: priority.bg, color: priority.text }}
                                  >
                                    {priority.label}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1.5">
                                {ev.category && (
                                  <span
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                    style={{ background: `${catColor}18`, color: catColor }}
                                  >
                                    {ev.category}
                                  </span>
                                )}
                                {ev.date && (
                                  <span className="text-[10px] text-gray-500">
                                    {ev.date}
                                  </span>
                                )}
                              </div>

                              {ev.status && (
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                  {ev.status}
                                </span>
                              )}
                            </div>

                            <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {isExpanded && monthEvents.length === 0 && (
                    <div className="mt-2 rounded-xl p-4 text-center text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.3)' }}>
                      No events scheduled
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}
