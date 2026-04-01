import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are Sims GPT, the personal AI assistant for Sima Ganwani Ved — Founder & Chairwoman of Apparel Group, Dubai. You manage her brand calendar, create content, and provide strategic insights.

Sima's brand portfolio includes: Guess, Tommy Hilfiger, Calvin Klein, DKNY, Aeropostale, Nine West, Aldo, Skechers, Charles & Keith, Tim Hortons, Victoria's Secret, and many more across 2,200+ stores in 14 countries with 22,000+ employees.

She is @thesimaved on Instagram and LinkedIn. She appeared on Shark Tank Dubai Season 2, is Forbes Top 100 (#12), and YPO MENA STAR.

Event categories available: Brand Events, Conferences, Internal Communications, Social Greetings.
Priority levels: CRITICAL, HIGH, MEDIUM, LOW.

When users ask about schedule or events, include relevant data from the calendar.
Be professional, concise, and proactive. Use emojis sparingly. Always confirm actions taken.`

// ─── Call OpenClaw webhook ───
async function callOpenClaw(message) {
  const tunnelUrl = process.env.OPENCLAW_TUNNEL_URL
  const secret = process.env.OPENCLAW_WEBHOOK_SECRET

  if (!tunnelUrl) throw new Error('OPENCLAW_TUNNEL_URL not configured')

  const res = await fetch(tunnelUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'X-Webhook-Secret': secret } : {}),
    },
    body: JSON.stringify({
      message,
      agent: 'main',
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`OpenClaw returned ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data.result || data.response || data.message || data.output || JSON.stringify(data)
}

// ─── Execute local tools based on user intent ───
async function executeToolsIfNeeded(lastMessage) {
  const msg = lastMessage.toLowerCase()

  // Today's brief
  if (msg.includes('brief') || msg.includes("what's on today") || msg.includes('today') || msg.includes('daily')) {
    try {
      return { toolName: 'get_today_brief', result: await getTodayBrief() }
    } catch { return null }
  }

  // Search events
  if (msg.includes('this week') || msg.includes('next week') || msg.includes('upcoming') || msg.includes('schedule') || msg.includes('events')) {
    try {
      return { toolName: 'search_events', result: await searchEvents({ limit: 10 }) }
    } catch { return null }
  }

  // Analytics
  if (msg.includes('analytics') || msg.includes('stats') || msg.includes('metrics') || msg.includes('overview')) {
    try {
      return { toolName: 'get_analytics', result: await getAnalytics() }
    } catch { return null }
  }

  return null
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { messages: rawMessages } = body

  if (!rawMessages || !Array.isArray(rawMessages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // AI SDK v6: client sends UIMessage[] with parts array — convert to clean text
  const messages = rawMessages.map(msg => {
    if (Array.isArray(msg.parts)) {
      const text = msg.parts.filter(p => p.type === 'text').map(p => p.text || '').join('')
      return { role: msg.role, content: text || '' }
    }
    if (typeof msg.content === 'string') return { role: msg.role, content: msg.content }
    if (Array.isArray(msg.content)) {
      const text = msg.content.map(p => typeof p === 'string' ? p : p?.text || '').join('')
      return { role: msg.role, content: text || '' }
    }
    return { role: msg.role, content: '' }
  })

  try {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || ''

    // Execute local DB tools if the user's message triggers them
    const toolResult = await executeToolsIfNeeded(lastUserMsg)

    // Build the full prompt for OpenClaw
    let fullPrompt = SYSTEM_PROMPT + '\n\n'

    // Add tool data as context if available
    if (toolResult) {
      fullPrompt += `[CALENDAR DATA from ${toolResult.toolName}]:\n${JSON.stringify(toolResult.result, null, 2)}\n\n`
      fullPrompt += `Use the calendar data above to answer the user's question.\n\n`
    }

    // Add conversation history (last 10 messages for context)
    const recentMessages = messages.slice(-10)
    fullPrompt += 'Conversation:\n'
    for (const msg of recentMessages) {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
    }
    fullPrompt += '\nAssistant:'

    // Call OpenClaw
    const response = await callOpenClaw(fullPrompt)

    // Return in AI SDK v6 UIMessage stream format so useChat() understands it
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Text content — AI SDK v6 text stream protocol: prefix 0: for text parts
        controller.enqueue(encoder.encode(`0:${JSON.stringify(response || 'I received your message but got an empty response. Please try again.')}\n`))
        // Finish step
        controller.enqueue(encoder.encode(`e:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0 }, isContinued: false })}\n`))
        // Finish message
        controller.enqueue(encoder.encode(`d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0 } })}\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('Sims GPT chat error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process chat request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
