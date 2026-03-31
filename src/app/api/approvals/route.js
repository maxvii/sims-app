import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, status, note, tab } = await req.json()
  if (!eventId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const validTabs = ['artwork', 'media', 'copywriting']
  const approvalTab = validTabs.includes(tab) ? tab : 'artwork'

  const approval = await prisma.approval.create({
    data: {
      eventId,
      userId: session.user.id,
      status,
      note: note || null,
      tab: approvalTab,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  })

  // Auto-compute event status based on latest approval per tab
  const allApprovals = await prisma.approval.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  })

  if (allApprovals.length > 0) {
    // Get latest approval per tab
    const latestByTab = {}
    for (const a of allApprovals) {
      if (!latestByTab[a.tab]) {
        latestByTab[a.tab] = a
      }
    }

    const tabs = ['artwork', 'media', 'copywriting']
    const coveredTabs = tabs.filter((t) => latestByTab[t])
    const allCovered = coveredTabs.length === 3

    // Check if any tab's latest is REJECTED
    const anyRejected = coveredTabs.some((t) => latestByTab[t].status === 'REJECTED')
    // Check if all 3 tabs have latest = APPROVED
    const allApproved = allCovered && tabs.every((t) => latestByTab[t].status === 'APPROVED')

    let newStatus = null
    if (allApproved) {
      newStatus = 'Approved'
    } else if (anyRejected) {
      newStatus = 'Needs Revision'
    } else if (coveredTabs.length > 0) {
      newStatus = 'In Progress'
    }

    if (newStatus) {
      await prisma.event.update({ where: { id: eventId }, data: { status: newStatus } })
    }
  }

  // Notification logic
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } })
  await notifyOthers({
    actorId: session.user.id,
    type: 'APPROVAL',
    message: `${session.user.name} ${status.toLowerCase()} "${event?.title}" (${approvalTab})`,
    eventId,
  })

  return NextResponse.json(approval)
}
