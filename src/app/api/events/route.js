import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const where = {}
  if (month) where.month = month
  if (status) where.status = status
  if (priority) where.priority = priority

  const events = await prisma.event.findMany({
    where,
    include: { comments: { include: { user: { select: { name: true } } } }, approvals: true },
    orderBy: { number: 'asc' },
  })
  return NextResponse.json(events)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, date } = body
  if (!title || !date) return NextResponse.json({ error: 'title and date are required' }, { status: 400 })

  // Auto-derive month from date string like "07 Apr 2026" -> "Apr"
  const month = body.month || date.split(' ')[1] || ''

  // Auto-calculate number as max(existing) + 1
  const maxEvent = await prisma.event.findFirst({ orderBy: { number: 'desc' } })
  const number = (maxEvent?.number || 0) + 1

  const event = await prisma.event.create({
    data: {
      number,
      title,
      date,
      endDate: body.endDate || '',
      month,
      category: body.category || 'Brand Events',
      priority: body.priority || 'MEDIUM',
      opportunityType: body.opportunityType || '',
      platforms: body.platforms || '',
      status: body.status || 'Not Started',
      postConcept: body.postConcept || '',
      visualDirection: body.visualDirection || '',
      captionDirection: body.captionDirection || '',
      creativeBriefDue: body.creativeBriefDue || '',
      creativeDue: body.creativeDue || '',
      notes: body.notes || null,
    },
    include: { comments: { include: { user: { select: { name: true } } } }, approvals: true },
  })

  await notifyOthers({
    actorId: session.user.id,
    type: 'EVENT',
    message: `${session.user.name} created a new event: "${title}"`,
    eventId: event.id,
  })

  return NextResponse.json(event)
}
