import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ─── GET — load messages, list sessions, or fetch one session ───
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const listSessions = searchParams.get('list') === 'true'

  if (listSessions) {
    // Return ChatSession rows for this user (most recent first)
    const rows = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { lastMessageAt: 'desc' },
      take: 30,
    })
    const out = rows.map((s) => ({
      sessionId: s.id,
      title: s.title || 'Untitled chat',
      lastMessageAt: s.lastMessageAt,
      createdAt: s.createdAt,
    }))
    return NextResponse.json({ sessions: out })
  }

  // Resolve sessionId: if missing, use the newest one for this user
  let activeId = sessionId
  if (!activeId) {
    const latest = await prisma.chatSession.findFirst({
      where: { userId: session.user.id },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    })
    if (!latest) {
      return NextResponse.json({ messages: [], sessionId: null })
    }
    activeId = latest.id
  }

  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id, sessionId: activeId },
    orderBy: { createdAt: 'asc' },
    include: { attachments: true },
  })

  return NextResponse.json({ messages, sessionId: activeId })
}

// ─── POST — save a message (and its attachments, and touch session title) ───
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { sessionId, role, content, attachments } = body || {}
  if (!sessionId || !role) {
    return NextResponse.json({ error: 'Missing sessionId or role' }, { status: 400 })
  }

  // Ensure session row exists (upsert by id)
  await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: { lastMessageAt: new Date() },
    create: {
      id: sessionId,
      userId: session.user.id,
      title: null,
      lastMessageAt: new Date(),
    },
  })

  const msg = await prisma.chatMessage.create({
    data: {
      sessionId,
      userId: session.user.id,
      role,
      content: content || '',
      attachments: Array.isArray(attachments) && attachments.length
        ? {
            create: attachments.map((a) => ({
              url:       a.url || '',
              filename:  a.filename || 'upload',
              mimetype:  a.mimetype || 'application/octet-stream',
              size:      Number(a.size) || 0,
              kind:      a.kind || 'other',
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  })

  // Auto-title on first user message
  if (role === 'user') {
    const existing = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { title: true } })
    if (existing && !existing.title && content) {
      // Derive a 3-5 word title from the first user message
      const title = deriveTitle(content)
      if (title) {
        await prisma.chatSession.update({ where: { id: sessionId }, data: { title } })
      }
    }
  }

  return NextResponse.json(msg)
}

// ─── DELETE — remove an entire session (plus its messages and attachments) ───
export async function DELETE(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })

  // Only allow deleting a session the user owns
  const s = await prisma.chatSession.findUnique({ where: { id: sessionId } })
  if (!s || s.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Cascade: delete messages (attachments cascade via FK), then session
  await prisma.chatMessage.deleteMany({
    where: { sessionId, userId: session.user.id },
  })
  await prisma.chatSession.delete({ where: { id: sessionId } })
  return NextResponse.json({ ok: true })
}

// ── Utility: derive a short title from a message body ────────────────────────
function deriveTitle(raw) {
  if (!raw) return null
  // Strip any inlined URLs / data URIs / [ATTACHMENT ...] tags
  const cleaned = String(raw)
    .replace(/data:[^\s]+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\/api\/uploads\/\S+/g, '')
    .replace(/\[ATTACHMENT[^\]]+\]/gi, '')
    .replace(/\[IMAGE[^\]]+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return null
  const words = cleaned.split(' ').slice(0, 7).join(' ')
  return words.length > 60 ? words.slice(0, 57) + '…' : words
}
