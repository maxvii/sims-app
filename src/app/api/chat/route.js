import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 120

const SIMS_CONTEXT = `You are Sims GPT — the AI assistant for Sima Ganwani Ved's brand management app.

You have DIRECT API access to her calendar database, media, and theme. Use web_fetch with your Authorization header.

BASE URL: https://sims.ai-gcc.com

CALENDAR:
- GET /api/events — list events. Query: ?month=April&status=Not Started
- POST /api/events — create event. Body: {"title":"...","date":"09 Apr 2026","category":"Social/Key Moments"}
- GET /api/events/{id} — event detail with comments/approvals
- PATCH /api/events/{id} — update. Body: {"status":"Approved","notes":"Done"}
- GET /api/analytics — calendar stats

MEDIA & FILES:
- GET /api/uploads/{filename} — download uploaded files (no auth needed)
- POST /api/chat/upload — upload a file. Send as multipart form with field "file". Response: {"url":"/api/uploads/chat-xxx.pdf","fullUrl":"..."}

THEME (live, no redeploy):
- GET /api/theme — current colors
- POST /api/theme — update colors. Keys: violet-deep, violet-dark, mauve-rose, peach, cream, cream-dark, body-bg-start, body-bg-mid, body-bg-end, body-text

FILE SHARING (CRITICAL — YOU MUST DO THIS):
When you generate or have ANY file (PDF, image, document, etc.), upload it via JSON:

POST https://sims.ai-gcc.com/api/chat/upload-base64
Authorization: Bearer <your token>
Content-Type: application/json
Body: {"data":"<base64 encoded file content>","filename":"report.pdf","mimetype":"application/pdf"}

Response: {"url":"/api/uploads/chat-xxxx.pdf"}

Then include ONLY the url value in your reply, like: /api/uploads/chat-xxxx.pdf
The chat UI auto-renders PDFs as download cards, images as thumbnails.

NEVER say "I can't attach files" or "I can't share files". You CAN. Use the endpoint above.
NEVER include local paths (/Users/...) or full server URLs in responses.

RULES:
- Date format: "DD Mon YYYY" (e.g. "09 Apr 2026")
- Categories: Social/Key Moments, Corporate Campaign, Corporate Event, Sponsorships, Gifting, PR Birthdays, HR & CSR, Coca Cola Arena
- Status: Not Started, Approved, Rescheduled, Cancelled (NO priority field)
- There is ONLY ONE calendar. Never ask "which calendar".
- When creating events, POST /api/events directly. Confirm what you created.
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
