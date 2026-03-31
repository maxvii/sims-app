'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GradientSpheres from '@/components/GradientSpheres'

const CATEGORY_COLORS = {
  'Social/Key Moments': '#502D55',
  'Sponsorships': '#935073',
  'Corporate Campaign': '#F6DBC0',
  'Corporate Event': '#7B3F5E',
  'Gifting': '#C98BA5',
  'PR Birthdays': '#E8C4A0',
  'HR & CSR': '#6A4C6D',
  'Coca Cola Arena': '#B86B8A',
  'Uncategorized': '#999',
}

const PRIORITY_COLORS = { CRITICAL: '#DC2626', HIGH: '#F59E0B', MEDIUM: '#3B82F6', LOW: '#10B981' }
const STATUS_COLORS = { 'Not Started': '#94A3B8', 'UPCOMING': '#3B82F6', 'IN_PROGRESS': '#F59E0B', 'In Progress': '#F59E0B', 'COMPLETED': '#10B981', 'Completed': '#10B981', 'CANCELLED': '#EF4444', 'Cancelled': '#EF4444' }

function KpiCard({ label, value, sub, icon, color }) {
  return (
    <div className="liquid-glass-card p-4 rounded-2xl animate-fade-in" style={{ background: 'rgba(255,255,255,0.6)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color || 'linear-gradient(135deg, #502D55, #935073)' }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black" style={{ color: '#502D55' }}>{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function BarChart({ data, colors, maxHeight = 120 }) {
  const maxVal = Math.max(...Object.values(data), 1)
  const entries = Object.entries(data)
  return (
    <div className="flex items-end gap-1.5 justify-between" style={{ height: maxHeight }}>
      {entries.map(([key, val]) => {
        const h = (val / maxVal) * 100
        const color = colors?.[key] || '#935073'
        return (
          <div key={key} className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[9px] font-bold mb-1" style={{ color }}>{val || ''}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-700 min-h-[2px]"
              style={{ height: `${Math.max(h, 3)}%`, background: color, opacity: val > 0 ? 1 : 0.2 }}
            />
            <span className="text-[8px] text-gray-400 mt-1 truncate w-full text-center">{key.slice(0, 3)}</span>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBar({ items, colors }) {
  const max = Math.max(...items.map(i => i.count), 1)
  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <div key={item.name}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-600 truncate flex-1 mr-2">{item.name}</span>
            <span className="text-xs font-bold" style={{ color: colors?.[item.name] || '#502D55' }}>{item.count}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.count / max) * 100}%`, background: colors?.[item.name] || '#935073' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, colors, size = 100 }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <div className="text-xs text-gray-400 text-center py-4">No data</div>

  let cumPercent = 0
  const segments = entries.map(([key, val]) => {
    const percent = (val / total) * 100
    const start = cumPercent
    cumPercent += percent
    return { key, val, percent, start, color: colors?.[key] || '#935073' }
  })

  const r = size / 2
  const strokeWidth = 14
  const normalizedR = r - strokeWidth / 2
  const circumference = 2 * Math.PI * normalizedR

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {segments.map((seg, i) => (
          <circle
            key={seg.key}
            cx={r} cy={r} r={normalizedR}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${(seg.percent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((seg.start / 100) * circumference)}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
        {segments.map(seg => (
          <div key={seg.key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[9px] text-gray-500">{seg.key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [authStatus])

  if (authStatus === 'loading') return null

  return (
    <div className="min-h-screen pb-safe-nav" style={{ background: '#F8F4E9' }}>
      {/* Header */}
      <div className="liquid-glass px-5 pt-12 pb-4 relative overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
        <GradientSpheres variant="compact" />
        <div className="relative z-10">
          <button onClick={() => router.push('/calendar')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="font-display text-3xl font-black italic text-gray-800">Analytics</h1>
          <p className="text-xs text-gray-500">Performance insights & event metrics</p>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-5 animate-fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#502D55' }} />
            <p className="text-xs text-gray-400 mt-3">Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="liquid-glass-card p-6 rounded-2xl text-center">
            <p className="text-sm text-red-500">Failed to load analytics</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-xs underline" style={{ color: '#935073' }}>Retry</button>
          </div>
        ) : data ? (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="Total Events"
                value={data.kpis.totalEvents}
                icon={<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>}
                color="linear-gradient(135deg, #502D55, #935073)"
              />
              <KpiCard
                label="Completion Rate"
                value={`${data.kpis.completionRate}%`}
                sub={`${data.kpis.completed} completed`}
                icon={<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                color="linear-gradient(135deg, #10B981, #059669)"
              />
              <KpiCard
                label="In Progress"
                value={data.kpis.inProgress}
                icon={<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                color="linear-gradient(135deg, #F59E0B, #D97706)"
              />
              <KpiCard
                label="Upcoming"
                value={data.kpis.upcoming}
                icon={<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>}
                color="linear-gradient(135deg, #3B82F6, #2563EB)"
              />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-3 gap-2">
              <div className="liquid-glass-card p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <div className="text-lg font-black" style={{ color: '#502D55' }}>{data.kpis.totalMedia}</div>
                <div className="text-[9px] text-gray-400 font-medium">Media Files</div>
              </div>
              <div className="liquid-glass-card p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <div className="text-lg font-black" style={{ color: '#935073' }}>{data.kpis.totalComments}</div>
                <div className="text-[9px] text-gray-400 font-medium">Comments</div>
              </div>
              <div className="liquid-glass-card p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <div className="text-lg font-black" style={{ color: '#10B981' }}>{data.kpis.approvedCount}</div>
                <div className="text-[9px] text-gray-400 font-medium">Approvals</div>
              </div>
            </div>

            {/* Monthly Distribution */}
            <div className="liquid-glass-card p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Monthly Distribution</h3>
              <BarChart
                data={data.byMonth}
                colors={Object.fromEntries(
                  Object.keys(data.byMonth).map((m, i) => [m, i < 3 ? '#F6DBC0' : i < 6 ? '#935073' : i < 9 ? '#502D55' : '#7B3F5E'])
                )}
              />
            </div>

            {/* Category Breakdown */}
            <div className="liquid-glass-card p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-4">By Category</h3>
              <HorizontalBar items={data.topCategories} colors={CATEGORY_COLORS} />
            </div>

            {/* Priority & Status side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="liquid-glass-card p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <h3 className="text-xs font-bold text-gray-700 mb-3">By Priority</h3>
                <DonutChart data={data.byPriority} colors={PRIORITY_COLORS} size={90} />
              </div>
              <div className="liquid-glass-card p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <h3 className="text-xs font-bold text-gray-700 mb-3">By Status</h3>
                <DonutChart data={data.byStatus} colors={STATUS_COLORS} size={90} />
              </div>
            </div>

            {/* Critical Events */}
            {data.criticalEvents.length > 0 && (
              <div className="liquid-glass-card p-5 rounded-2xl" style={{ background: 'rgba(220, 38, 38, 0.04)' }}>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Critical Events
                </h3>
                <div className="space-y-2">
                  {data.criticalEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-700 truncate">{ev.title}</div>
                        <div className="text-[10px] text-gray-400">{ev.date} {ev.month}</div>
                      </div>
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{
                        background: STATUS_COLORS[ev.status] ? `${STATUS_COLORS[ev.status]}20` : '#94A3B820',
                        color: STATUS_COLORS[ev.status] || '#94A3B8',
                      }}>
                        {ev.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="h-4" />
          </>
        ) : null}
      </div>

      <Navbar />
    </div>
  )
}
