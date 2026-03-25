import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(notifications)
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, readAll } = await req.json()
  if (readAll) {
    await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } })
    return NextResponse.json({ success: true })
  }
  if (id) {
    await prisma.notification.update({ where: { id }, data: { read: true } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
}
