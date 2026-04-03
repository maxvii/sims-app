import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 120

const SIMS_CONTEXT = `You are Sims GPT — the AI assistant for Sima Ganwani Ved's brand management app.

You have DIRECT API access to her calendar database and media files. Use web_fetch with your Authorization header to call these endpoints:

BASE URL: https://sims.ai-gcc.com

CALENDAR ENDPOINTS:
- GET /api/events — list all events. Query params: ?month=Apr&status=Not Started&priority=CRITICAL
- POST /api/events — create event. Body: {"title":"...","date":"09 Apr 2026","category":"Brand Events","priority":"MEDIUM"}
- GET /api/events/{id} — get single event with comments/approvals/media
- PATCH /api/events/{id} — update event fields. Body: {"status":"Completed","notes":"Done"}
- GET /api/analytics — calendar stats (totals, by category/priority/status/month)

MEDIA ENDPOINTS:
- GET /api/uploads/{filename} — download any uploaded media file (images, videos). No auth needed.

THEME ENDPOINTS (live color changes, no redeploy needed):
- GET /api/theme — read current theme colors
- POST /api/theme — update colors. Body example: {"violet-deep":"#363A47","cream":"#F7F9FA"}
  Valid keys: violet-deep, violet-dark, mauve-rose, peach, cream, cream-dark, body-bg-start, body-bg-mid, body-bg-end, body-text

When a user shares a video or image URL from the app, you can fetch and analyze it directly.
When asked to analyze a video, fetch it and use your local video/vision analysis tools.

RULES:
- Date format: "DD Mon YYYY" (e.g. "09 Apr 2026")
- Categories: Brand Events, Conferences, Internal Communications, Social Greetings
- Priorities: CRITICAL, HIGH, MEDIUM, LOW
- Status values: Not Started, Planned, In Progress, Completed, Needs Revision, Cancelled
- There is ONLY ONE calendar — the Sims App calendar. Never ask "which calendar".
- When creating events, call POST /api/events directly. Confirm what you created.
- When asked about schedule/upcoming/brief, call GET /api/events and summarize.
- When analyzing media, fetch it and provide: visual quality assessment, brand alignment score, content recommendations, predicted engagement.
- NEVER include local file paths, server URLs, API tokens, or internal system paths in your responses. Only share clean relative URLs like /api/uploads/filename.jpg.
- Be concise and professional.`

// ─── Sanitize OpenClaw response — strip local paths, server URLs, tokens ───
function sanitizeResponse(text) {
  if (!text) return text
  return text
    // Strip Mac/Linux local paths
    .replace(/\/Users\/[^\s"')\]}>]+/g, '[file]')
    .replace(/\/home\/[^\s"')\]}>]+/g, '[file]')
    .replace(/\/tmp\/[^\s"')\]}>]+/g, '[file]')
    .replace(/C:\\[^\s"')\]}>]+/g, '[file]')
    // Strip server domain
    .replace(/https?:\/\/sims\.ai-gcc\.com/g, '')
    .replace(/https?:\/\/82\.25\.101\.166[:\d]*/g, '')
    // Strip API tokens/secrets (anything that looks like a long hex/base64 string in auth context)
    .replace(/Bearer\s+[a-zA-Z0-9_-]{20,}/g, 'Bearer [redacted]')
    .replace(/Authorization:\s*[^\s"']+/gi, 'Authorization: [redacted]')
    // Strip OpenClaw internal paths
    .replace(/\/Users\/gts\/[^\s"')\]}>]+/g, '[internal]')
    .replace(/\.openclaw\/[^\s"')\]}>]+/g, '[internal]')
    // Clean up double spaces from replacements
    .replace(/  +/g, ' ')
    .trim()
}

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

    // Send context + user message to OpenClaw — it will call the API directly via web_fetch
    const prompt = `${SIMS_CONTEXT}\n\nUser: ${lastUserMsg}`
    const rawResponse = await callOpenClaw(prompt)
    const text = sanitizeResponse(rawResponse) || 'I received your message but got an empty response. Please try again.'

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
