import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, url, title, type } = await req.json()
  if (!eventId || !url || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const reference = await prisma.reference.create({
    data: { eventId, userId: session.user.id, url, title, type: type || 'LINK' },
    include: { user: { select: { name: true } } },
  })

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } })
  await notifyOthers({
    actorId: session.user.id,
    type: 'REFERENCE',
    message: `${session.user.name} added a reference to "${event?.title}"`,
    eventId,
  })

  return NextResponse.json(reference)
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.reference.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
