import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyOthers } from '@/lib/notify'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, eventId } = await req.json()
  if (!content || !eventId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const comment = await prisma.comment.create({
    data: { content, eventId, userId: session.user.id },
    include: { user: { select: { id: true, name: true, role: true } } },
  })

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } })
  await notifyOthers({
    actorId: session.user.id,
    type: 'COMMENT',
    message: `${session.user.name} commented on "${event?.title}"`,
    eventId,
  })

  return NextResponse.json(comment)
}
