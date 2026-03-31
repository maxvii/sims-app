import prisma from '@/lib/prisma';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse "DD Mon YYYY" date string into a JS Date object for comparison.
 */
function parseDateString(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const monthIndex = MONTHS.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || monthIndex === -1 || isNaN(year)) return null;
  return new Date(year, monthIndex, day);
}

/**
 * Format a JS Date object to "DD Mon YYYY".
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Derive month string from a "DD Mon YYYY" date string.
 */
function deriveMonth(dateStr) {
  const parts = dateStr.trim().split(' ');
  if (parts.length === 3) return parts[1];
  return '';
}

// ─── Tool Functions ──────────────────────────────────────────────────────────

/**
 * Create a new event in the database.
 */
export async function createEvent(params) {
  const { title, date, category, priority, opportunityType, platforms, notes } = params || {};
  // Auto-derive month from date
  const month = deriveMonth(date);

  // Auto-increment number: find the highest existing number
  const lastEvent = await prisma.event.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  const number = (lastEvent?.number ?? 0) + 1;

  const event = await prisma.event.create({
    data: {
      number,
      month,
      date,
      title,
      category: category || null,
      opportunityType: opportunityType || null,
      priority: priority || 'MEDIUM',
      platforms: platforms || null,
      notes: notes || null,
      status: 'Not Started',
    },
  });

  return event;
}

/**
 * Search events with flexible filters.
 */
export async function searchEvents(params) {
  const { query, dateFrom, dateTo, category, status, priority, limit } = params || {};
  const take = limit || 10;

  // Build Prisma where clause
  const where = {};

  if (query) {
    where.title = { contains: query, mode: 'insensitive' };
  }

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  // Fetch events (apply date filtering in-memory since dates are stored as strings)
  let events = await prisma.event.findMany({
    where,
    orderBy: { number: 'asc' },
    take: dateFrom || dateTo ? 500 : take,
  });

  // Date range filtering (parse and compare)
  if (dateFrom || dateTo) {
    const fromDate = dateFrom ? parseDateString(dateFrom) : null;
    const toDate = dateTo ? parseDateString(dateTo) : null;

    events = events.filter((event) => {
      const eventDate = parseDateString(event.date);
      if (!eventDate) return false;
      if (fromDate && eventDate < fromDate) return false;
      if (toDate && eventDate > toDate) return false;
      return true;
    });

    events = events.slice(0, take);
  }

  return { events, count: events.length };
}

/**
 * Update an existing event's fields.
 */
export async function updateEvent(params) {
  const { eventId, status, notes, priority } = params || {};
  const data = {};

  if (status !== undefined && status !== null) data.status = status;
  if (notes !== undefined && notes !== null) data.notes = notes;
  if (priority !== undefined && priority !== null) data.priority = priority;

  const event = await prisma.event.update({
    where: { id: eventId },
    data,
  });

  return event;
}

/**
 * Get today's briefing: current events, upcoming events, status/priority counts.
 */
export async function getTodayBrief() {
  const now = new Date();
  const todayStr = formatDate(now);

  // Get all events to process
  const allEvents = await prisma.event.findMany();

  // Events happening today
  const todayEvents = allEvents.filter((e) => e.date === todayStr);

  // Upcoming events in next 7 days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingEvents = allEvents.filter((e) => {
    const eventDate = parseDateString(e.date);
    if (!eventDate) return false;
    return eventDate > today && eventDate <= nextWeek;
  });

  // Count by status
  const statusCounts = {};
  allEvents.forEach((e) => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });

  // Count by priority
  const priorityCounts = {};
  allEvents.forEach((e) => {
    priorityCounts[e.priority] = (priorityCounts[e.priority] || 0) + 1;
  });

  // Pending approvals
  const pendingApprovals = allEvents.filter(
    (e) => e.status === 'Needs Revision' || e.status === 'Planned'
  ).length;

  return {
    today: todayStr,
    todayEvents,
    upcomingEvents: upcomingEvents.sort((a, b) => {
      const da = parseDateString(a.date);
      const db = parseDateString(b.date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    }),
    totalEvents: allEvents.length,
    statusCounts,
    priorityCounts,
    pendingApprovals,
  };
}

/**
 * Get full analytics: totals, breakdowns by category/priority/status/month.
 */
export async function getAnalytics() {
  const allEvents = await prisma.event.findMany();

  // By category
  const byCategory = {};
  allEvents.forEach((e) => {
    const cat = e.category || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  // By priority
  const byPriority = {};
  allEvents.forEach((e) => {
    byPriority[e.priority] = (byPriority[e.priority] || 0) + 1;
  });

  // By status
  const byStatus = {};
  allEvents.forEach((e) => {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  });

  // By month
  const byMonth = {};
  MONTHS.forEach((m) => {
    byMonth[m] = 0;
  });
  allEvents.forEach((e) => {
    if (e.month && byMonth.hasOwnProperty(e.month)) {
      byMonth[e.month] += 1;
    }
  });

  return {
    totalEvents: allEvents.length,
    byCategory,
    byPriority,
    byStatus,
    byMonth,
  };
}
