// Sims GPT tool handlers — stable, minimal, predictable JSON shapes.
// Every tool returns: { ok: true, ...data }  OR  { ok: false, error: "..." }
import prisma from '@/lib/prisma'

const VALID_CATEGORIES = [
  'Social/Key Moments', 'Corporate Campaign', 'Corporate Event', 'Sponsorships',
  'Gifting', 'PR Birthdays', 'HR & CSR', 'Coca Cola Arena',
]
const VALID_STATUSES = ['Not Started', 'Approved', 'Rescheduled', 'Cancelled']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Date helpers ─────────────────────────────────────────────────────────────
function parseDateString(s) {
  if (!s) return null
  const parts = String(s).trim().split(/\s+/)
  if (parts.length < 3) return null
  const d = parseInt(parts[0], 10)
  const m = MONTHS.indexOf(parts[1])
  const y = parseInt(parts[2], 10)
  if (isNaN(d) || m < 0 || isNaN(y)) return null
  return new Date(y, m, d)
}
function formatDate(d) {
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
function pick(obj, keys) {
  const out = {}
  for (const k of keys) if (obj != null && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k]
  return out
}

const WRITABLE_FIELDS = [
  'title','date','endDate','month','category','status',
  'opportunityType','platforms','postConcept','visualDirection','captionDirection',
  'creativeBriefDue','round1Due','round2Due','finalCreativeDue','notes',
]

// ══════════════════════════════════════════════════════════════════════════════
// Tool definitions — schema + handler
// ══════════════════════════════════════════════════════════════════════════════

export const TOOL_SCHEMAS = {
  create_event: {
    description: 'Create a new event on Sima\'s calendar.',
    required: ['title', 'date'],
    optional: ['category', 'status', 'notes', 'endDate', 'opportunityType', 'platforms',
               'postConcept', 'visualDirection', 'captionDirection',
               'creativeBriefDue', 'round1Due', 'round2Due', 'finalCreativeDue'],
    example: { title: 'Dubai Fashion Week opening', date: '18 Oct 2026', category: 'Corporate Event' },
  },
  update_event: {
    description: 'Update any subset of fields on an existing event.',
    required: ['eventId'],
    optional: WRITABLE_FIELDS,
    example: { eventId: 'clx5abc123', status: 'Approved', notes: 'Deck signed off' },
  },
  delete_event: {
    description: 'Delete an event and its comments, approvals, references, notifications, media.',
    required: ['eventId'],
    optional: [],
    example: { eventId: 'clx5abc123' },
  },
  search_events: {
    description: 'Search events by title keyword, category, status, month, or date range.',
    required: [],
    optional: ['query', 'category', 'status', 'month', 'dateFrom', 'dateTo', 'limit'],
    example: { query: 'fashion', month: 'Oct', limit: 5 },
  },
  today_brief: {
    description: 'Morning briefing: today\'s events, upcoming week, status counts.',
    required: [],
    optional: [],
    example: {},
  },
  analytics: {
    description: 'Calendar-wide stats: total, by category, by status, by month.',
    required: [],
    optional: [],
    example: {},
  },
}

// ─── create_event ────────────────────────────────────────────────────────────
export async function createEvent(input) {
  const { title, date } = input || {}
  if (!title || !date) return { ok: false, error: 'title and date are required' }

  const category = VALID_CATEGORIES.includes(input.category) ? input.category : 'Corporate Event'
  const status   = VALID_STATUSES.includes(input.status)     ? input.status   : 'Not Started'
  const month    = input.month || String(date).split(' ')[1] || ''

  const maxEvent = await prisma.event.findFirst({ orderBy: { number: 'desc' } })
  const number   = (maxEvent?.number || 0) + 1

  try {
    const event = await prisma.event.create({
      data: {
        number, title, date, month, category, status,
        endDate:          input.endDate          || null,
        opportunityType:  input.opportunityType  || null,
        platforms:        input.platforms        || null,
        postConcept:      input.postConcept      || null,
        visualDirection:  input.visualDirection  || null,
        captionDirection: input.captionDirection || null,
        creativeBriefDue: input.creativeBriefDue || null,
        round1Due:        input.round1Due        || null,
        round2Due:        input.round2Due        || null,
        finalCreativeDue: input.finalCreativeDue || null,
        notes:            input.notes            || null,
      },
    })
    return {
      ok: true,
      event: {
        id: event.id, number: event.number, title: event.title, date: event.date,
        month: event.month, category: event.category, status: event.status,
      },
    }
  } catch (err) {
    return { ok: false, error: 'Create failed', detail: String(err?.message || err) }
  }
}

// ─── update_event ────────────────────────────────────────────────────────────
export async function updateEvent(input) {
  const { eventId } = input || {}
  if (!eventId) return { ok: false, error: 'eventId is required' }

  const data = pick(input, WRITABLE_FIELDS)
  if (Object.keys(data).length === 0) {
    return { ok: false, error: 'No writable fields provided' }
  }

  // Validate enums
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    return { ok: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }
  }
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    return { ok: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }
  }

  // Keep month in sync if date changed
  if (data.date && !data.month) {
    const parts = String(data.date).split(' ')
    if (parts.length >= 2) data.month = parts[1]
  }

  try {
    const existing = await prisma.event.findUnique({
      where: { id: eventId }, select: { id: true, title: true, status: true },
    })
    if (!existing) return { ok: false, error: 'Event not found' }

    const event = await prisma.event.update({ where: { id: eventId }, data })
    return {
      ok: true,
      event: {
        id: event.id, title: event.title, date: event.date, month: event.month,
        category: event.category, status: event.status, notes: event.notes,
      },
      changes: Object.keys(data),
    }
  } catch (err) {
    return { ok: false, error: 'Update failed', detail: String(err?.message || err) }
  }
}

// ─── delete_event ────────────────────────────────────────────────────────────
export async function deleteEvent(input) {
  const { eventId } = input || {}
  if (!eventId) return { ok: false, error: 'eventId is required' }

  try {
    const existing = await prisma.event.findUnique({
      where: { id: eventId }, select: { id: true, title: true },
    })
    if (!existing) return { ok: false, error: 'Event not found' }

    await prisma.$transaction([
      prisma.comment.deleteMany({      where: { eventId } }),
      prisma.approval.deleteMany({     where: { eventId } }),
      prisma.reference.deleteMany({    where: { eventId } }),
      prisma.notification.deleteMany({ where: { eventId } }),
      prisma.media.deleteMany({        where: { eventId } }),
      prisma.event.delete({            where: { id: eventId } }),
    ])
    return { ok: true, deleted: { id: existing.id, title: existing.title } }
  } catch (err) {
    return { ok: false, error: 'Delete failed', detail: String(err?.message || err) }
  }
}

// ─── search_events ───────────────────────────────────────────────────────────
export async function searchEvents(input) {
  const i = input || {}
  const where = {}
  if (i.query)    where.title    = { contains: i.query, mode: 'insensitive' }
  if (i.category) where.category = i.category
  if (i.status)   where.status   = i.status
  if (i.month)    where.month    = i.month

  const take = Math.min(Math.max(Number(i.limit) || 20, 1), 200)
  const useDateFilter = !!(i.dateFrom || i.dateTo)

  try {
    let events = await prisma.event.findMany({
      where,
      orderBy: { number: 'asc' },
      // If we'll filter by date range in-memory, pull more so we can still return `take`
      take: useDateFilter ? 500 : take,
      select: {
        id: true, number: true, title: true, date: true, month: true,
        category: true, status: true, notes: true,
      },
    })

    if (useDateFilter) {
      const from = parseDateString(i.dateFrom)
      const to   = parseDateString(i.dateTo)
      events = events.filter((e) => {
        const d = parseDateString(e.date)
        if (!d) return false
        if (from && d < from) return false
        if (to   && d > to)   return false
        return true
      }).slice(0, take)
    }

    return { ok: true, count: events.length, events }
  } catch (err) {
    return { ok: false, error: 'Search failed', detail: String(err?.message || err) }
  }
}

// ─── today_brief ─────────────────────────────────────────────────────────────
export async function todayBrief() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7)
    const todayStr = formatDate(now)

    const all = await prisma.event.findMany({
      select: { id: true, title: true, date: true, month: true, category: true, status: true },
    })

    const todayEvents = all.filter((e) => e.date === todayStr)
    const upcoming = all
      .filter((e) => {
        const d = parseDateString(e.date)
        return d && d > today && d <= nextWeek
      })
      .sort((a, b) => (parseDateString(a.date)?.getTime() || 0) - (parseDateString(b.date)?.getTime() || 0))

    const statusCounts = {}
    for (const e of all) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1

    return {
      ok: true,
      today: todayStr,
      todayEvents,
      upcomingEvents: upcoming,
      totals: { total: all.length, byStatus: statusCounts, pending: statusCounts['Not Started'] || 0 },
    }
  } catch (err) {
    return { ok: false, error: 'Brief failed', detail: String(err?.message || err) }
  }
}

// ─── analytics ───────────────────────────────────────────────────────────────
export async function analytics() {
  try {
    const all = await prisma.event.findMany({
      select: { category: true, status: true, month: true },
    })

    const byCategory = {}
    const byStatus   = {}
    const byMonth    = Object.fromEntries(MONTHS.map((m) => [m, 0]))
    for (const e of all) {
      byCategory[e.category || 'Uncategorized'] = (byCategory[e.category || 'Uncategorized'] || 0) + 1
      byStatus[e.status] = (byStatus[e.status] || 0) + 1
      if (e.month && byMonth[e.month] !== undefined) byMonth[e.month] += 1
    }
    return { ok: true, total: all.length, byCategory, byStatus, byMonth }
  } catch (err) {
    return { ok: false, error: 'Analytics failed', detail: String(err?.message || err) }
  }
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
export const TOOL_HANDLERS = {
  create_event: createEvent,
  update_event: updateEvent,
  delete_event: deleteEvent,
  search_events: searchEvents,
  today_brief: todayBrief,
  analytics,
}

export function listTools() {
  return Object.entries(TOOL_SCHEMAS).map(([name, schema]) => ({
    name,
    url: `/api/sims-gpt/tools/${name.replace(/_/g, '-')}`,
    ...schema,
  }))
}
