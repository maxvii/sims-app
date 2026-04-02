import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

export async function GET(req, { params }) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      comments: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' } },
      approvals: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' } },
      references: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

export async function PATCH(req, { params }) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await req.json()
  const oldEvent = await prisma.event.findUnique({ where: { id: params.id }, select: { status: true, title: true } })
  const event = await prisma.event.update({ where: { id: params.id }, data })

  if (data.status && oldEvent && data.status !== oldEvent.status) {
    await notifyOthers({
      actorId: session.user.id,
      type: 'STATUS',
      message: `${session.user.name} changed "${oldEvent.title}" to ${data.status}`,
      eventId: params.id,
    })
  }

  return NextResponse.json(event)
}
