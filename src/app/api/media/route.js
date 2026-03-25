import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')
  const eventId = formData.get('eventId')

  if (!file || !eventId) return NextResponse.json({ error: 'Missing file or eventId' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = path.extname(file.name)
  const uniqueName = crypto.randomBytes(16).toString('hex') + ext
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  // Ensure uploads directory exists
  try { await mkdir(uploadDir, { recursive: true }) } catch {}

  const filepath = path.join(uploadDir, uniqueName)
  await writeFile(filepath, buffer)

  const mimetype = file.type
  let type = 'IMAGE'
  if (mimetype.startsWith('video/')) type = 'VIDEO'

  const media = await prisma.media.create({
    data: {
      eventId,
      userId: session.user.id,
      filename: file.name,
      filepath: `/uploads/${uniqueName}`,
      mimetype,
      size: buffer.length,
      type,
    },
    include: { user: { select: { name: true } }, comments: true },
  })

  // Create notification for media upload
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } })
  const users = await prisma.user.findMany({ where: { NOT: { id: session.user.id } } })
  for (const u of users) {
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: 'MEDIA',
        message: `${session.user.name} uploaded ${type === 'VIDEO' ? 'a video' : 'an image'} to "${event?.title || 'an event'}"`,
        eventId,
      },
    })
  }

  return NextResponse.json(media)
}

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const media = await prisma.media.findMany({
    where: { eventId },
    include: {
      user: { select: { name: true } },
      comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(media)
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fs = await import('fs/promises')
  try { await fs.unlink(path.join(process.cwd(), 'public', media.filepath)) } catch {}
  await prisma.media.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
