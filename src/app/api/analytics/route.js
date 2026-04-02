import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allEvents = await prisma.event.findMany({
    include: {
      approvals: true,
      comments: true,
      media: true,
    },
  })

  // KPI totals
  const totalEvents = allEvents.length
  const completed = allEvents.filter(e => e.status === 'COMPLETED' || e.status === 'Completed').length
  const inProgress = allEvents.filter(e => e.status === 'IN_PROGRESS' || e.status === 'In Progress').length
  const upcoming = allEvents.filter(e => e.status === 'UPCOMING' || e.status === 'Not Started' || e.status === 'Upcoming').length
  const cancelled = allEvents.filter(e => e.status === 'CANCELLED' || e.status === 'Cancelled').length
  const completionRate = totalEvents > 0 ? Math.round((completed / totalEvents) * 100) : 0

  // By category
  const byCategory = {}
  allEvents.forEach(e => {
    const cat = e.category || 'Uncategorized'
    byCategory[cat] = (byCategory[cat] || 0) + 1
  })

  // By month
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const byMonth = {}
  months.forEach(m => { byMonth[m] = 0 })
  allEvents.forEach(e => {
    if (e.month && byMonth.hasOwnProperty(e.month)) {
      byMonth[e.month] += 1
    }
  })

  // By status
  const byStatus = {}
  allEvents.forEach(e => {
    const s = e.status || 'Not Started'
    byStatus[s] = (byStatus[s] || 0) + 1
  })

  // Content stats
  const totalComments = allEvents.reduce((sum, e) => sum + e.comments.length, 0)
  const totalMedia = allEvents.reduce((sum, e) => sum + e.media.length, 0)
  const totalApprovals = allEvents.reduce((sum, e) => sum + e.approvals.length, 0)
  const approvedCount = allEvents.reduce((sum, e) => sum + e.approvals.filter(a => a.status === 'APPROVED').length, 0)

  // Upcoming events
  const upcomingEvents = allEvents
    .filter(e => e.status === 'Not Started')
    .map(e => ({ id: e.id, title: e.title, date: e.date, month: e.month, status: e.status, category: e.category }))

  // Top categories (sorted)
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    kpis: {
      totalEvents,
      completed,
      inProgress,
      upcoming,
      cancelled,
      completionRate,
      totalComments,
      totalMedia,
      totalApprovals,
      approvedCount,
    },
    byCategory,
    byPriority,
    byMonth,
    byStatus,
    topCategories,
    criticalEvents,
  })
}
