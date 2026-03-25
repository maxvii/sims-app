import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mediaId, content, timestamp, pinX, pinY } = await req.json()
  if (!mediaId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const comment = await prisma.mediaComment.create({
    data: {
      mediaId,
      userId: session.user.id,
      content,
      timestamp: timestamp ?? null,
      pinX: pinX ?? null,
      pinY: pinY ?? null,
    },
    include: { user: { select: { id: true, name: true } } },
  })

  // Notify other team members
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: { event: { select: { id: true, title: true } } },
  })
  const users = await prisma.user.findMany({ where: { NOT: { id: session.user.id } } })
  const label = timestamp != null ? `at ${formatTime(timestamp)}` : 'on image'
  for (const u of users) {
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: 'MEDIA_COMMENT',
        message: `${session.user.name} commented ${label} on media in "${media.event.title}"`,
        eventId: media.event.id,
      },
    })
  }

  return NextResponse.json(comment)
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.mediaComment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
