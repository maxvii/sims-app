import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, status, note } = await req.json()
  if (!eventId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const approval = await prisma.approval.create({
    data: { eventId, userId: session.user.id, status, note: note || null },
    include: { user: { select: { id: true, name: true, role: true } } },
  })

  if (status === 'APPROVED') {
    await prisma.event.update({ where: { id: eventId }, data: { status: 'Approved' } })
  } else if (status === 'REJECTED') {
    await prisma.event.update({ where: { id: eventId }, data: { status: 'Needs Revision' } })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } })
  const users = await prisma.user.findMany({ where: { NOT: { id: session.user.id } } })
  for (const u of users) {
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: 'APPROVAL',
        message: `${session.user.name} ${status.toLowerCase()} "${event.title}"`,
        eventId,
      },
    })
  }

  return NextResponse.json(approval)
}
