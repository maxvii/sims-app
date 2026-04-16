import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 180

const SIMS_CONTEXT = `You are Sims GPT — the AI assistant for Sima Ganwani Ved's brand management app.

YOUR CAPABILITIES — use them whenever the task calls for them:
  • Sub-agent orchestration — split complex asks into parallel research + generation threads.
  • Sandbox code execution — run scripts safely to compute, transform data, or automate steps.
  • Built-in presentation (PPT) generation with AI-generated slide images — produce decks and pitch decks end-to-end; return the final URL.
  • Built-in image generation with reference-image support — produce art, mockups, social visuals; return the URL.
  • Built-in video generation — produce short videos; return the URL.
  • Deep research with source verification — use it for market, competitor, trend questions; cite sources briefly.
  • Chart / data visualization — build charts from calendar analytics or supplied data; return the rendered image URL.
  • Persistent memory across sessions — remember Sima's brand voice, priorities, team, and preferences you learn.
  • Context summarization — when a thread is long, compress silently; never tell the user you summarized.
Never describe these tools by name or brand — present the finished output naturally.

You have DIRECT API access to her calendar database, media, and theme. Every write to the calendar MUST use web_fetch with this header:
    Authorization: Bearer <OPENCLAW_TOKEN>
Never call events endpoints without that header — requests without it will 401.
All bodies are JSON; set Content-Type: application/json on every POST/PATCH/DELETE.

BASE URL: https://sims.ai-gcc.com

CALENDAR TOOLS (preferred — stable, minimal, POST-only, all take JSON bodies):
- POST /api/sims-gpt/tools/create-event    — Body: {"title":"...","date":"09 Apr 2026","category":"Corporate Event","status":"Not Started","notes":"..."}
- POST /api/sims-gpt/tools/update-event    — Body: {"eventId":"clx5...","status":"Approved","notes":"..."}  (any subset of writable fields)
- POST /api/sims-gpt/tools/delete-event    — Body: {"eventId":"clx5..."}
- POST /api/sims-gpt/tools/search-events   — Body: {"query":"fashion","month":"Oct","category":"Corporate Event","status":"Approved","dateFrom":"01 Oct 2026","dateTo":"31 Oct 2026","limit":20}  (all fields optional)
- POST /api/sims-gpt/tools/today-brief     — Body: {}     → today + upcoming week + status totals
- POST /api/sims-gpt/tools/analytics       — Body: {}     → totals by category, status, month
- GET  /api/sims-gpt/tools                 — list every tool + its schema + one example body

All tool responses use the shape: { ok: true, ...data }  OR  { ok: false, error: "..." }

RAW ENDPOINTS (fallback only — prefer the tools above):
- GET    /api/events                — list events. Query: ?month=Apr&status=Not Started
- POST   /api/events                — CREATE
- GET    /api/events/{id}           — event detail (with comments, approvals, references)
- PATCH  /api/events/{id}           — UPDATE (any subset of: title, date, endDate, category, status, opportunityType, platforms, postConcept, visualDirection, captionDirection, creativeBriefDue, round1Due, round2Due, finalCreativeDue, notes)
- DELETE /api/events/{id}           — REMOVE event (cascades dependents)
- GET    /api/analytics             — calendar stats

VALID VALUES:
- category (one of): Social/Key Moments · Corporate Campaign · Corporate Event · Sponsorships · Gifting · PR Birthdays · HR & CSR · Coca Cola Arena
- status   (one of): Not Started · Approved · Rescheduled · Cancelled
- date format: "DD Mon YYYY" with 3-letter month (e.g. "09 Apr 2026"). The month field auto-derives from date.

When the user asks to add, update, reschedule, cancel, approve, or delete an event: EXECUTE the write immediately via web_fetch, then confirm what you did in one short sentence. Do not ask for confirmation first unless the request is ambiguous.

MEDIA & FILES:
- GET /api/uploads/{filename} — download uploaded files (Bearer token OR session auth required for chat-* files)
- POST /api/chat/upload-base64 — upload a file from base64. Body: {"data":"...","filename":"foo.pdf","mimetype":"application/pdf"}

THEME (live, no redeploy):
- GET /api/theme — current colors
- POST /api/theme — update colors. Keys: violet-deep, violet-dark, mauve-rose, peach, cream, cream-dark, body-bg-start, body-bg-mid, body-bg-end, body-text

MULTIMODAL INPUT (what the user sends you):
When the user shares images, they appear inline as data: URIs inside the message text. Treat them as first-class visual content — analyze them directly. For videos and large files the message will include an [ATTACHMENT filename=... kind=... url=...] tag with the public URL; fetch via web_fetch if you need the bytes.

NATIVE MEDIA GENERATION (what YOU send back):
Use your built-in tools to generate images, videos, presentations, and pitch decks directly. When you produce media:
  • If the tool returns a public https:// URL → put that URL on its own line in your reply. The client renders it as a thumbnail (image), video player, or preview card automatically.
  • If the tool returns a data: URI or base64 blob → upload it via POST /api/chat/upload-base64 with body {"data":"<base64>","filename":"<file>.<ext>","mimetype":"<mime>"} and include the returned "fullUrl" in your reply.
  • Supported renderings in the client: jpg/jpeg/png/gif/webp/heic · mp4/webm/mov · pdf · doc/docx · xls/xlsx/csv · txt/md/json
  • Do NOT emit [SLIDES], [FILE:...], or raw HTML — they will not render. Let your media tools produce the finished artifact and share the URL.

RESPONSE FORMAT:
Reply in plain text or light markdown (**bold**, *italic*, inline code, bullets, numbered lists). Keep answers tight and conversational. Never include local paths (/Users/...) or full internal server URLs in your reply.

RULES:
- Date format: "DD Mon YYYY" (e.g. "09 Apr 2026")
- There is ONLY ONE calendar. Never ask "which calendar".
- Be concise and professional.

EXAMPLE — create an event (preferred):
    POST https://sims.ai-gcc.com/api/sims-gpt/tools/create-event
    Headers: { Authorization: "Bearer <OPENCLAW_TOKEN>", Content-Type: "application/json" }
    Body:    { "title": "Dubai Fashion Week opening", "date": "18 Oct 2026", "category": "Corporate Event", "status": "Not Started" }

EXAMPLE — update status:
    POST https://sims.ai-gcc.com/api/sims-gpt/tools/update-event
    Body:  { "eventId": "clx5abc123", "status": "Approved", "notes": "Deck signed off" }

EXAMPLE — delete:
    POST https://sims.ai-gcc.com/api/sims-gpt/tools/delete-event
    Body:  { "eventId": "clx5abc123" }`

// ─── Sanitize response: strip local paths, server URLs, tokens ───
function sanitizeResponse(text) {
  if (!text) return text
  return text
    .replace(/\/Users\/[^\s"')\]}>]+/g, '[file]')
    .replace(/\/home\/[^\s"')\]}>]+/g, '[file]')
    .replace(/\/tmp\/[^\s"')\]}>]+/g, '[file]')
    .replace(/C:\\[^\s"')\]}>]+/g, '[file]')
    .replace(/https?:\/\/sims\.ai-gcc\.com/g, '')
    .replace(/https?:\/\/82\.25\.101\.166[:\d]*/g, '')
    .replace(/Bearer\s+[a-zA-Z0-9_-]{20,}/g, 'Bearer [redacted]')
    .replace(/Authorization:\s*[^\s"']+/gi, 'Authorization: [redacted]')
    .replace(/\/Users\/gts\/[^\s"')\]}>]+/g, '[internal]')
    .replace(/\.openclaw\/[^\s"')\]}>]+/g, '[internal]')
    .replace(/\.dearflow\/[^\s"')\]}>]+/g, '[internal]')
    .replace(/  +/g, ' ')
    .trim()
}

// Strip any stray [SLIDES]...[/SLIDES] or [FILE:...] blocks the model might still emit.
// No HTML rendering — the client handles markdown + media URLs directly.
function stripLegacyBlocks(text) {
  if (!text) return text
  return text
    .replace(/\[SLIDES\][\s\S]*?\[\/SLIDES\]/g, '')
    .replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Read local upload file → data URL (for multimodal) ───
const IMAGE_DATA_URL_MAX = 6 * 1024 * 1024 // 6MB cap — keep prompt reasonable

async function localUrlToDataUrl(url) {
  // /api/uploads/chat-xxx.png → public/uploads/chat-xxx.png
  const m = url.match(/^\/api\/uploads\/([^?#]+)/)
  if (!m) return null
  const filename = m[1]
  if (filename.includes('..')) return null
  const ext = path.extname(filename).toLowerCase()
  // Only inline small images — videos and large files remain as URL refs
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  if (!imageExts.includes(ext)) return null
  const full = path.join(process.cwd(), 'public', 'uploads', filename)
  try {
    const buf = await readFile(full)
    if (buf.length > IMAGE_DATA_URL_MAX) return null
    const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' }[ext]
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

// Rewrite user content so any [ATTACHMENT ...] tags get their images inlined as data: URIs.
async function expandAttachmentsForModel(content) {
  if (!content) return content
  // Match [ATTACHMENT filename=... kind=... url=...]
  const re = /\[ATTACHMENT\s+filename="([^"]+)"\s+kind="([^"]+)"\s+url="([^"]+)"\]/g
  let out = content
  let match
  const replacements = []
  while ((match = re.exec(content)) !== null) {
    const [full, filename, kind, url] = match
    replacements.push({ full, filename, kind, url })
  }
  for (const r of replacements) {
    if (r.kind === 'image') {
      const dataUrl = await localUrlToDataUrl(r.url)
      if (dataUrl) {
        out = out.replace(r.full, `\n[IMAGE ${r.filename}] ${dataUrl}\n`)
        continue
      }
    }
    // Non-image or too large → keep as URL reference for web_fetch
    out = out.replace(r.full, `\n[ATTACHMENT ${r.kind} "${r.filename}" url=${r.url}]\n`)
  }
  return out
}

// ─── Friendly error messages for upstream failures ───
// Maps gateway / Cloudflare status codes to short, human-readable text
// so we never dump raw HTML error pages into the chat bubble.
function friendlyGatewayError(status) {
  if (status === 401 || status === 403) return 'The AI gateway rejected our credentials. Try again in a moment — if it persists, the token needs refreshing.'
  if (status === 404) return 'The AI endpoint returned 404. The gateway route may be misconfigured.'
  if (status === 408) return 'The AI took too long to respond. Try a shorter or simpler request.'
  if (status === 429) return 'The AI is rate-limited right now. Give it a few seconds and try again.'
  if (status === 502) return 'The AI gateway is temporarily unreachable. Please try again in a moment.'
  if (status === 503) return 'The AI service is restarting. Please try again in a moment.'
  if (status === 504) return 'The AI took too long to respond (gateway timeout). Heavy generations like videos or big decks can exceed the upstream 100s limit — try a smaller scope or try again.'
  if (status === 524) return 'The AI is still working but exceeded the upstream 100-second timeout. For long tasks (videos, pitch decks, deep research), try a smaller scope — or have the gateway stream output so progress is visible.'
  if (status >= 500) return `The AI gateway returned an error (${status}). Please try again in a moment.`
  return `The AI gateway returned an unexpected status (${status}).`
}

// ─── Extract URLs from an "artifacts" list ──────────────────────────────────
// Gateway returns artifacts in the done frame. Shape isn't rigidly specified so
// we accept strings OR objects and hunt for anything URL-shaped.
function artifactUrls(artifacts) {
  if (!artifacts) return []
  const list = Array.isArray(artifacts) ? artifacts : [artifacts]
  const urls = []
  for (const a of list) {
    if (!a) continue
    if (typeof a === 'string') {
      urls.push(a)
      continue
    }
    // Common field names — try them in order
    const candidate = a.url || a.fullUrl || a.download_url || a.downloadUrl || a.path || a.href
    if (candidate) urls.push(String(candidate))
  }
  return urls
}

// ─── Read an SSE stream until we get a {type:"done"} frame ──────────────────
// Reference shape from the bridge:
//   data: { type: "progress", ... }      ← keep-alive / thinking / tool-call
//   data: { type: "done",
//           result: "<text>",
//           artifacts: [ { url, filename, mimetype, ... }, ... ],
//           quality: { ... } }
//   data: { type: "error", error: "<msg>" }
//
// We ignore progress/keepalive frames (Cloudflare sees bytes → no 524), and on
// {done} we concatenate the result text + one-line-per-artifact URL so the
// client's MediaThumbnail renders images/videos/PDFs/decks automatically.
async function readSseUntilDone(res) {
  const reader = res.body?.getReader()
  if (!reader) throw new Error('The AI gateway returned an empty stream.')
  const decoder = new TextDecoder()
  let buf = ''
  let finalFrame = null

  try {
    outer: while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // SSE frames are separated by a blank line (\n\n).
      let sep
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, sep)
        buf = buf.slice(sep + 2)

        // A frame may contain multiple "data:" lines — concatenate them.
        const dataLines = frame.split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).replace(/^\s/, ''))
        if (dataLines.length === 0) continue
        const payload = dataLines.join('\n')
        if (payload === '[DONE]') continue

        let parsed
        try { parsed = JSON.parse(payload) } catch { continue }

        if (parsed?.type === 'done') {
          finalFrame = parsed
          try { await reader.cancel() } catch {}
          break outer
        }
        if (parsed?.type === 'error') {
          const msg = parsed.error || parsed.message || 'The AI reported an error.'
          throw new Error(msg)
        }
        // progress / tool-call / anything else → ignore
      }
    }
  } finally {
    try { reader.releaseLock() } catch {}
  }

  if (!finalFrame) {
    throw new Error('The AI stream ended without a final response. Please try again.')
  }

  // Diagnostic logging — helps debug why artifacts aren't showing up.
  // (Dokploy service logs; trims the blob so it stays readable.)
  try {
    const snapshot = {
      hasResult: typeof finalFrame.result === 'string',
      resultLen: (finalFrame.result || '').length,
      artifactCount: Array.isArray(finalFrame.artifacts) ? finalFrame.artifacts.length : 0,
      artifactSample: Array.isArray(finalFrame.artifacts)
        ? finalFrame.artifacts.slice(0, 3).map((a) => typeof a === 'string' ? a.slice(0, 200) : a)
        : undefined,
      qualityKeys: finalFrame.quality ? Object.keys(finalFrame.quality) : null,
      frameKeys: Object.keys(finalFrame),
    }
    console.log('[chat] done frame:', JSON.stringify(snapshot).slice(0, 2000))
  } catch {}

  // Compose the final reply: .result text first, then each artifact URL on its
  // own line so the client renders them as thumbnails / players / preview cards.
  const text = String(finalFrame.result ?? finalFrame.output ?? '').trim()
  const urls = artifactUrls(finalFrame.artifacts)
  if (urls.length === 0) return text
  const joinedUrls = urls.join('\n')
  return text ? `${text}\n\n${joinedUrls}` : joinedUrls
}

// ─── Call the gateway with the full conversation (last N turns) ───
// Request shape (per bridge spec):
//   POST <OPENCLAW_URL>
//   x-webhook-secret: <OPENCLAW_TOKEN>          ← primary auth header
//   Authorization:    Bearer <OPENCLAW_TOKEN>   ← kept for back-compat
//   Content-Type:     application/json
//   body:             { "message": "<prompt>" }
// Response is SSE by default (text/event-stream), JSON legacy fallback also ok.
async function callOpenClaw(fullPrompt) {
  const url = process.env.OPENCLAW_URL
  const token = process.env.OPENCLAW_TOKEN
  if (!url)   throw new Error('OPENCLAW_URL not configured — update the env var in Dokploy')
  if (!token) throw new Error('OPENCLAW_TOKEN not configured — update the env var in Dokploy')

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'Accept':          'text/event-stream, application/json',
        'x-webhook-secret': token,
        'Authorization':   `Bearer ${token}`,
      },
      body: JSON.stringify({ message: fullPrompt }),
    })
  } catch (err) {
    const e = new Error('Could not reach the AI gateway. Please try again in a moment.')
    e.cause = err
    e.status = 0
    throw e
  }

  if (!res.ok) {
    await res.text().catch(() => {})  // drain + discard
    const e = new Error(friendlyGatewayError(res.status))
    e.status = res.status
    throw e
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase()

  // Path A — SSE: keep reading until {type:"done"}.
  if (contentType.includes('text/event-stream')) {
    return await readSseUntilDone(res)
  }

  // Path B — JSON fallback (back-compat).
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('The AI gateway returned an unexpected response. Please try again.')
  }
  return data?.output || data?.result || ''
}

// Build the single-message prompt OpenClaw expects — prepend context + recent history.
async function buildPromptFromMessages(messages) {
  const MAX_TURNS = 10
  const recent = messages.slice(-MAX_TURNS)

  // Expand attachments ONLY on user turns (assistant responses don't carry our tags)
  const expanded = []
  for (const m of recent) {
    if (m.role === 'user') {
      expanded.push({ role: 'user', content: await expandAttachmentsForModel(m.content) })
    } else {
      expanded.push({ role: m.role, content: m.content })
    }
  }

  const convo = expanded
    .map((m) => {
      const label = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'
      return `${label}: ${m.content}`
    })
    .join('\n\n')

  return `${SIMS_CONTEXT}\n\n${convo}\n\nAssistant:`
}

// Stream text to the client as a series of text-delta chunks so replies feel live.
function streamChunks(text, writer, id) {
  // Chunk at word boundaries, 4-8 words per chunk
  const words = text.split(/(\s+)/) // keep whitespace tokens
  const CHUNK_WORDS = 6
  const chunks = []
  let buf = ''
  let count = 0
  for (const w of words) {
    buf += w
    if (/\S/.test(w)) count += 1
    if (count >= CHUNK_WORDS) {
      chunks.push(buf)
      buf = ''
      count = 0
    }
  }
  if (buf) chunks.push(buf)

  writer.write({ type: 'text-start', id })
  for (const c of chunks) {
    writer.write({ type: 'text-delta', id, delta: c })
  }
  writer.write({ type: 'text-end', id })
  writer.write({ type: 'finish' })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages: rawMessages } = body
  if (!rawMessages || !Array.isArray(rawMessages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const messages = rawMessages.map((msg) => {
    if (Array.isArray(msg.parts)) {
      const text = msg.parts.filter((p) => p.type === 'text').map((p) => p.text || '').join('')
      return { role: msg.role, content: text || '' }
    }
    if (typeof msg.content === 'string') return { role: msg.role, content: msg.content }
    if (Array.isArray(msg.content)) {
      return { role: msg.role, content: msg.content.map((p) => typeof p === 'string' ? p : p?.text || '').join('') }
    }
    return { role: msg.role, content: '' }
  })

  try {
    const prompt = await buildPromptFromMessages(messages)
    const rawResponse = await callOpenClaw(prompt)
    const cleaned = stripLegacyBlocks(rawResponse || '')
    const text = sanitizeResponse(cleaned) || 'I received your message but got an empty response. Please try again.'

    const id = crypto.randomUUID()
    const stream = createUIMessageStream({
      execute: ({ writer }) => streamChunks(text, writer, id),
    })
    return createUIMessageStreamResponse({ stream, status: 200 })
  } catch (error) {
    // Log the full error server-side, but only return the short user-safe message.
    console.error('Sims GPT chat error:', error?.status || '', error?.message || error)
    const userMessage = typeof error?.message === 'string' && error.message.length < 400
      ? error.message
      : 'Failed to process chat request. Please try again.'
    // Strip any HTML that might have slipped into an Error message, as a defence-in-depth
    const safeMessage = userMessage.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
