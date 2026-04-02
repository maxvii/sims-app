import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'

export const maxDuration = 120

// System prompt lives in OpenClaw's IDENTITY.md — not sent per request

// ─── Call OpenClaw gateway ───
async function callOpenClaw(message) {
  const url = process.env.OPENCLAW_URL || 'https://fool.khlije.app/agent'
  const token = process.env.OPENCLAW_TOKEN

  if (!token) throw new Error('OPENCLAW_TOKEN not configured')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, agent: 'main' }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`OpenClaw returned ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data.output || data.result || ''
}

// ─── Execute local tools based on user intent ───
async function executeToolsIfNeeded(lastMessage) {
  const msg = lastMessage.toLowerCase()

  if (msg.includes('brief') || msg.includes("what's on today") || msg.includes('today') || msg.includes('daily')) {
    try { return { toolName: 'get_today_brief', result: await getTodayBrief() } } catch { return null }
  }
  if (msg.includes('this week') || msg.includes('next week') || msg.includes('upcoming') || msg.includes('schedule') || msg.includes('events')) {
    try { return { toolName: 'search_events', result: await searchEvents({ limit: 10 }) } } catch { return null }
  }
  if (msg.includes('analytics') || msg.includes('stats') || msg.includes('metrics') || msg.includes('overview')) {
    try { return { toolName: 'get_analytics', result: await getAnalytics() } } catch { return null }
  }
  return null
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { messages: rawMessages } = body
  if (!rawMessages || !Array.isArray(rawMessages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const messages = rawMessages.map(msg => {
    if (Array.isArray(msg.parts)) {
      const text = msg.parts.filter(p => p.type === 'text').map(p => p.text || '').join('')
      return { role: msg.role, content: text || '' }
    }
    if (typeof msg.content === 'string') return { role: msg.role, content: msg.content }
    if (Array.isArray(msg.content)) {
      return { role: msg.role, content: msg.content.map(p => typeof p === 'string' ? p : p?.text || '').join('') }
    }
    return { role: msg.role, content: '' }
  })

  try {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || ''
    const toolResult = await executeToolsIfNeeded(lastUserMsg)

    // Only send user message + DB context — system prompt lives in OpenClaw's IDENTITY.md
    let prompt = ''
    if (toolResult) {
      prompt += `[CALENDAR DATA from ${toolResult.toolName}]:\n${JSON.stringify(toolResult.result, null, 2)}\n\n`
    }
    prompt += lastUserMsg

    const response = await callOpenClaw(prompt)
    const text = response || 'I received your message but got an empty response. Please try again.'

    const id = crypto.randomUUID()

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'text-start', id })
        writer.write({ type: 'text-delta', id, delta: text })
        writer.write({ type: 'text-end', id })
        writer.write({ type: 'finish' })
      },
    })

    return createUIMessageStreamResponse({ stream, status: 200 })
  } catch (error) {
    console.error('Sims GPT chat error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process chat request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
