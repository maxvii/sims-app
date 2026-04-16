import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

// Resolve auth to a normalized `session` object. Returns null on failure.
async function resolveAuth(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    return { user: { id: 'openclaw', name: 'Sims GPT', role: 'ADMIN' } }
  }
  const session = await getServerSession(authOptions)
  return session || null
}

export async function GET(req, { params }) {
  const session = await resolveAuth(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      comments:  { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' } },
      approvals: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' } },
      references:{ include: { user: { select: { name: true } } },                         orderBy: { createdAt: 'desc' } },
    },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

// Whitelist writable fields — ignore unknowns so a bad payload never crashes Prisma
const WRITABLE_FIELDS = [
  'title', 'date', 'endDate', 'month', 'category', 'status',
  'opportunityType', 'platforms', 'postConcept', 'visualDirection', 'captionDirection',
  'creativeBriefDue', 'round1Due', 'round2Due', 'finalCreativeDue', 'notes',
]

export async function PATCH(req, { params }) {
  const session = await resolveAuth(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let raw
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Only pass known fields through to Prisma
  const data = {}
  for (const key of WRITABLE_FIELDS) {
    if (raw && Object.prototype.hasOwnProperty.call(raw, key)) data[key] = raw[key]
  }

  // Keep month in sync if date changed but month wasn't explicitly set
  if (data.date && !data.month) {
    const parts = String(data.date).split(' ')
    if (parts.length >= 2) data.month = parts[1]
  }

  try {
    const oldEvent = await prisma.event.findUnique({
      where: { id: params.id },
      select: { status: true, title: true },
    })
    if (!oldEvent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const event = await prisma.event.update({ where: { id: params.id }, data })

    // Notify on status change (best-effort)
    if (data.status && data.status !== oldEvent.status) {
      try {
        await notifyOthers({
          actorId: session.user.id,
          type: 'STATUS',
          message: `${session.user.name} changed "${oldEvent.title}" to ${data.status}`,
          eventId: params.id,
        })
      } catch (err) {
        console.warn('notifyOthers failed (ignored):', err?.message)
      }
    }

    return NextResponse.json(event)
  } catch (err) {
    console.error('Update event failed:', err?.message || err)
    return NextResponse.json(
      { error: 'Update failed', detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}

export async function DELETE(req, { params }) {
  const session = await resolveAuth(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only ADMIN or OpenClaw can delete
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    })
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Cascade: remove dependent rows first (no FK onDelete in schema)
    await prisma.$transaction([
      prisma.comment.deleteMany({      where: { eventId: params.id } }),
      prisma.approval.deleteMany({     where: { eventId: params.id } }),
      prisma.reference.deleteMany({    where: { eventId: params.id } }),
      prisma.notification.deleteMany({ where: { eventId: params.id } }),
      prisma.media.deleteMany({        where: { eventId: params.id } }),
      prisma.event.delete({            where: { id: params.id } }),
    ])

    try {
      await notifyOthers({
        actorId: session.user.id,
        type: 'EVENT',
        message: `${session.user.name} deleted "${event.title}"`,
        eventId: null,
      })
    } catch (err) {
      console.warn('notifyOthers failed (ignored):', err?.message)
    }

    return NextResponse.json({ ok: true, id: event.id, title: event.title })
  } catch (err) {
    console.error('Delete event failed:', err?.message || err)
    return NextResponse.json(
      { error: 'Delete failed', detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}
