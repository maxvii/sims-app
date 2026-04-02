import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET — load chat messages for the current user's active session (or list sessions)
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const listSessions = searchParams.get('list') === 'true'

  if (listSessions) {
    // Return list of chat sessions for this user (most recent first)
    const sessions = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      select: { sessionId: true, createdAt: true, content: true, role: true },
      orderBy: { createdAt: 'desc' },
    })

    // Group by sessionId, get first user message as title
    const sessionMap = {}
    for (const msg of sessions) {
      if (!sessionMap[msg.sessionId]) {
        sessionMap[msg.sessionId] = {
          sessionId: msg.sessionId,
          lastMessageAt: msg.createdAt,
          title: null,
        }
      }
      if (msg.role === 'user' && !sessionMap[msg.sessionId].title) {
        sessionMap[msg.sessionId].title = msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : '')
      }
    }

    const list = Object.values(sessionMap)
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      .slice(0, 20)

    return NextResponse.json({ sessions: list })
  }

  if (!sessionId) {
    // Return the most recent session for this user
    const latest = await prisma.chatMessage.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true },
    })

    if (!latest) return NextResponse.json({ messages: [], sessionId: null })

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id, sessionId: latest.sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages, sessionId: latest.sessionId })
  }

  // Load specific session
  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id, sessionId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ messages, sessionId })
}

// POST — save a chat message
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, role, content } = await req.json()
  if (!sessionId || !role || !content) {
    return NextResponse.json({ error: 'Missing sessionId, role, or content' }, { status: 400 })
  }

  const msg = await prisma.chatMessage.create({
    data: {
      sessionId,
      userId: session.user.id,
      role,
      content,
    },
  })

  return NextResponse.json(msg)
}
