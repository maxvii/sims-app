import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

const VALID_CATEGORIES = [
  'Social/Key Moments', 'Corporate Campaign', 'Corporate Event', 'Sponsorships',
  'Gifting', 'PR Birthdays', 'HR & CSR', 'Coca Cola Arena',
]
const VALID_STATUSES = ['Not Started', 'Approved', 'Rescheduled', 'Cancelled']

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const status = searchParams.get('status')
  const where = {}
  if (month) where.month = month
  if (status) where.status = status

  const events = await prisma.event.findMany({
    where,
    include: {
      comments: { include: { user: { select: { name: true } } } },
      approvals: true,
    },
    orderBy: { number: 'asc' },
  })
  return NextResponse.json(events)
}

export async function POST(req) {
  const authHeader = req.headers.get('authorization')
  let session
  if (authHeader === `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    session = { user: { id: 'openclaw', name: 'Sims GPT', role: 'ADMIN' } }
  } else {
    session = await getServerSession(authOptions)
  }
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, date } = body || {}
  if (!title || !date) {
    return NextResponse.json({ error: 'title and date are required' }, { status: 400 })
  }

  // Validate category — fall back to a safe default if unrecognised
  const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'Corporate Event'
  const status   = VALID_STATUSES.includes(body.status)     ? body.status   : 'Not Started'

  // Auto-derive month from date like "09 Apr 2026" → "Apr"
  const month = body.month || String(date).split(' ')[1] || ''

  // Auto-increment number = max(existing) + 1
  const maxEvent = await prisma.event.findFirst({ orderBy: { number: 'desc' } })
  const number = (maxEvent?.number || 0) + 1

  try {
    const event = await prisma.event.create({
      data: {
        number,
        title,
        date,
        endDate:          body.endDate          || null,
        month,
        category,
        status,
        opportunityType:  body.opportunityType  || null,
        platforms:        body.platforms        || null,
        postConcept:      body.postConcept      || null,
        visualDirection:  body.visualDirection  || null,
        captionDirection: body.captionDirection || null,
        creativeBriefDue: body.creativeBriefDue || null,
        round1Due:        body.round1Due        || null,
        round2Due:        body.round2Due        || null,
        finalCreativeDue: body.finalCreativeDue || null,
        notes:            body.notes            || null,
      },
      include: {
        comments: { include: { user: { select: { name: true } } } },
        approvals: true,
      },
    })

    // Best-effort notification — never let this fail the API call
    try {
      await notifyOthers({
        actorId: session.user.id,
        type: 'EVENT',
        message: `${session.user.name} created a new event: "${title}"`,
        eventId: event.id,
      })
    } catch (notifyErr) {
      console.warn('notifyOthers failed (ignored):', notifyErr?.message)
    }

    return NextResponse.json(event)
  } catch (err) {
    console.error('Create event failed:', err?.message || err)
    return NextResponse.json(
      { error: 'Create failed', detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}
