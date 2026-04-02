import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEvent, searchEvents, updateEvent, getTodayBrief, getAnalytics } from '@/lib/agent-tools'

export const maxDuration = 120

const SIMS_CONTEXT = `You are Sims GPT — Sima Ganwani Ved's calendar & brand assistant. You have DIRECT access to her calendar database on the VPS. Do NOT ask which calendar — there is only ONE: the Sims App calendar.

When the user asks to add/create an event, respond with ONLY a JSON block like this (no extra text before it):
\`\`\`json
{"action":"create_event","title":"Event Title","date":"09 Apr 2026","category":"Brand Events","priority":"MEDIUM"}
\`\`\`

Categories: Brand Events, Conferences, Internal Communications, Social Greetings
Priorities: CRITICAL, HIGH, MEDIUM, LOW
Date format: DD Mon YYYY (e.g. "09 Apr 2026")

When the user asks about schedule/events/brief, just answer using the calendar data provided.`

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

// ─── Try to parse action JSON from OpenClaw response ───
function parseAction(text) {
  try {
    // Match ```json {...} ``` or raw {...} with action field
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[^{}]*"action"[^{}]*\})/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      if (parsed.action) return parsed
    }
  } catch {}
  return null
}

// ─── Execute action from OpenClaw response ───
async function executeAction(action) {
  if (action.action === 'create_event') {
    const event = await createEvent({
      title: action.title,
      date: action.date,
      category: action.category || 'Brand Events',
      priority: action.priority || 'MEDIUM',
      platforms: action.platforms || null,
      notes: action.notes || null,
    })
    return `Event created: "${event.title}" on ${event.date} (${event.category}, ${event.priority}). ID: ${event.id}`
  }
  return null
}

// ─── Get calendar context (always) ───
async function getCalendarContext() {
  try {
    const brief = await getTodayBrief()
    const lines = []
    lines.push(`Today: ${brief.today} | Total events: ${brief.totalEvents}`)
    if (brief.todayEvents.length > 0) {
      lines.push(`TODAY'S EVENTS:`)
      brief.todayEvents.forEach(e => lines.push(`  - ${e.title} (${e.category || 'General'}, ${e.priority})`))
    }
    if (brief.upcomingEvents.length > 0) {
      lines.push(`NEXT 7 DAYS:`)
      brief.upcomingEvents.forEach(e => lines.push(`  - ${e.date}: ${e.title} (${e.category || 'General'})`))
    }
    return lines.join('\n')
  } catch {
    return 'Calendar: connected but no data loaded'
  }
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

    // Always get calendar context so OpenClaw knows the DB
    const calendarContext = await getCalendarContext()

    // Build prompt with context
    let prompt = `${SIMS_CONTEXT}\n\n[CALENDAR DATABASE]:\n${calendarContext}\n\n`

    // Add extra data for specific queries
    const msg = lastUserMsg.toLowerCase()
    if (msg.includes('analytics') || msg.includes('stats') || msg.includes('metrics')) {
      try {
        const analytics = await getAnalytics()
        prompt += `[ANALYTICS]:\n${JSON.stringify(analytics, null, 2)}\n\n`
      } catch {}
    }
    if (msg.includes('search') || msg.includes('find') || msg.includes('show me')) {
      try {
        const results = await searchEvents({ query: lastUserMsg, limit: 15 })
        prompt += `[SEARCH RESULTS]:\n${JSON.stringify(results, null, 2)}\n\n`
      } catch {}
    }

    prompt += `User: ${lastUserMsg}`

    // Call OpenClaw
    let response = await callOpenClaw(prompt)
    let text = response || 'I received your message but got an empty response. Please try again.'

    // Check if OpenClaw wants to execute an action (create/update event)
    const action = parseAction(text)
    if (action) {
      try {
        const actionResult = await executeAction(action)
        if (actionResult) {
          text = actionResult
        }
      } catch (err) {
        text = `Failed to execute action: ${err.message}`
      }
    }

    // Return in AI SDK v6 stream format
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
