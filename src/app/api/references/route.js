import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, url, title, type } = await req.json()
  if (!eventId || !url || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const reference = await prisma.reference.create({
    data: { eventId, userId: session.user.id, url, title, type: type || 'LINK' },
    include: { user: { select: { name: true } } },
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
