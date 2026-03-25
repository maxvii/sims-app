import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const oldEvent = await prisma.event.findUnique({ where: { id: params.id }, select: { status: true, title: true } })
  const event = await prisma.event.update({ where: { id: params.id }, data })

  // Create notification when status changes
  if (data.status && oldEvent && data.status !== oldEvent.status) {
    const users = await prisma.user.findMany({ where: { NOT: { id: session.user.id } } })
    for (const u of users) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: 'STATUS',
          message: `${session.user.name} changed "${oldEvent.title}" to ${data.status}`,
          eventId: params.id,
        },
      })
    }
  }

  return NextResponse.json(event)
}
