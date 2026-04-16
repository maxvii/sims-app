import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 180

const SIMS_CONTEXT = `You are Sims GPT — the AI assistant for Sima Ganwani Ved's brand management app.

You have DIRECT API access to her calendar database, media, and theme. Every write to the calendar MUST use web_fetch with this header:
    Authorization: Bearer <OPENCLAW_TOKEN>
Never call events endpoints without that header — requests without it will 401.
All bodies are JSON; set Content-Type: application/json on every POST/PATCH/DELETE.

BASE URL: https://sims.ai-gcc.com

CALENDAR:
- GET    /api/events                — list events. Query: ?month=Apr&status=Not Started (month uses 3-letter abbrev: Jan–Dec)
- POST   /api/events                — CREATE. Body: {"title":"...","date":"09 Apr 2026","category":"Social/Key Moments","status":"Not Started","notes":"..."}
- GET    /api/events/{id}           — event detail (with comments, approvals, references)
- PATCH  /api/events/{id}           — UPDATE any subset of: title, date, endDate, category, status, opportunityType, platforms, postConcept, visualDirection, captionDirection, creativeBriefDue, round1Due, round2Due, finalCreativeDue, notes
- DELETE /api/events/{id}           — REMOVE event (cascades comments, approvals, references, notifications, media)
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

MULTIMODAL:
When the user shares images, they will appear inline as data: URIs inside the message text. Treat them as first-class visual content — analyze their contents directly. For videos and large files the message will include an [ATTACHMENT filename=... kind=... url=...] tag with the public URL; fetch via web_fetch if you need the bytes.

PRESENTATIONS:
Wrap your slides in [SLIDES]...[/SLIDES] tags. Each slide is a <div class="slide"> with h1/h2/p/ul content.
Example:
[SLIDES]
<div class="slide"><h1>Title Slide</h1><p>Subtitle here</p></div>
<div class="slide"><h2>Key Point</h2><ul><li>First point</li><li>Second point</li></ul></div>
<div class="slide"><h2>Thank You</h2><p>Contact info</p></div>
[/SLIDES]
The server renders these as a styled HTML deck. User gets a link.

SOCIAL MEDIA SIZES (when creating posts, stories, social content):
- Instagram Post: <div class="slide" data-size="post"> (1080x1080, square)
- Instagram Story / Reel: <div class="slide" data-size="story"> (1080x1920, 9:16)
- LinkedIn Post: <div class="slide" data-size="linkedin"> (1200x627)
- Twitter/X Post: <div class="slide" data-size="twitter"> (1600x900)
- Facebook Cover: <div class="slide" data-size="fbcover"> (820x312)
Default (no size attribute) = A4 landscape presentation.

FILE SHARING:
For small files, embed base64 as [FILE:name.ext:mimetype]base64data[/FILE]. For large files, call POST /api/chat/upload-base64 first and return the returned URL to the user.
NEVER say "I can't attach files". Use the tags above.
NEVER include local paths (/Users/...) or full server URLs in your response.

RULES:
- Date format: "DD Mon YYYY" (e.g. "09 Apr 2026")
- There is ONLY ONE calendar. Never ask "which calendar".
- Be concise and professional.

EXAMPLE — create an event:
    POST https://sims.ai-gcc.com/api/events
    Headers: { Authorization: "Bearer <OPENCLAW_TOKEN>", Content-Type: "application/json" }
    Body:    { "title": "Dubai Fashion Week opening", "date": "18 Oct 2026", "category": "Corporate Event", "status": "Not Started" }

EXAMPLE — update status:
    PATCH https://sims.ai-gcc.com/api/events/clx5abc123
    Body:  { "status": "Approved" }

EXAMPLE — delete:
    DELETE https://sims.ai-gcc.com/api/events/clx5abc123`

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
    .replace(/  +/g, ' ')
    .trim()
}

// ─── Extract [SLIDES] and [FILE] blocks from response → save → replace with URLs ───
async function extractAndSaveContent(text) {
  const { writeFile, mkdir } = await import('fs/promises')
  const crypto = await import('crypto')
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  let result = text

  // [SLIDES]...[/SLIDES] → HTML deck
  const slidesRegex = /\[SLIDES\]([\s\S]*?)\[\/SLIDES\]/g
  let match
  while ((match = slidesRegex.exec(text)) !== null) {
    const [fullMatch, slidesContent] = match
    try {
      const slides = slidesContent.trim()
      const slideBlocks = []
      const slideRegex2 = /<div[^>]*class="slide"([^>]*)>([\s\S]*?)<\/div>/gi
      let sm
      while ((sm = slideRegex2.exec(slides)) !== null) {
        const attrs = sm[1]
        const inner = sm[2]
        const sizeMatch = attrs.match(/data-size="([^"]+)"/)
        const size = sizeMatch ? sizeMatch[1] : null
        const title = inner.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
        const bullets = []
        const liRx = /<li[^>]*>([\s\S]*?)<\/li>/gi
        let li
        while ((li = liRx.exec(inner)) !== null) bullets.push(li[1].replace(/<[^>]+>/g, '').trim())
        const para = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
        slideBlocks.push({ title, bullets, para, size })
      }
      if (slideBlocks.length === 0) {
        slideBlocks.push({ title: 'Presentation', bullets: [], para: slides.replace(/<[^>]+>/g, '').trim() })
      }

      const slidePages = slideBlocks.map((s, i) => {
        const sizeClass = s.size || 'landscape'
        let content = ''
        if (s.title) content += `<h1>${s.title}</h1>`
        if (s.bullets.length) content += `<ul>${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
        if (s.para) content += `<p>${s.para}</p>`
        content += `<div class="slide-num">${i + 1} / ${slideBlocks.length}</div>`
        return `<div class="page ${sizeClass}">${content}</div>`
      }).join('\n')

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#F7F9FA}
.page{background:#363A47;color:#D0D9E2;padding:48px;margin:16px auto;border-radius:16px;break-inside:avoid;position:relative;overflow:hidden}
.page.landscape{width:min(100%,800px);min-height:450px}
.page.post{width:min(100%,500px);min-height:500px}
.page.story{width:min(100%,360px);min-height:640px}
.page.linkedin{width:min(100%,700px);min-height:366px}
.page.twitter{width:min(100%,700px);min-height:394px}
.page.fbcover{width:min(100%,700px);min-height:266px}
h1{font-size:28px;font-weight:800;margin-bottom:20px;color:#F7F9FA}
ul{list-style:none;margin:12px 0}
li{font-size:18px;line-height:2;color:#B0B8C4}
li::before{content:"→ ";color:#6B7B8D}
p{font-size:16px;line-height:1.7;color:#9AAAB8;margin-top:12px}
.slide-num{position:absolute;bottom:16px;right:24px;font-size:11px;color:#6B7B8D}
.brand{position:absolute;bottom:16px;left:24px;font-size:10px;color:#4A5060;letter-spacing:2px;font-weight:700}
@media print{body{background:#fff}.page{margin:0;border-radius:0;page-break-after:always;width:100%;height:100vh}}
</style></head><body>${slidePages.replace(/<\/div>$/g, '<div class="brand">SIMS</div></div>')}</body></html>`

      const name = 'deck-' + crypto.default.randomBytes(8).toString('hex') + '.html'
      try { await mkdir(uploadDir, { recursive: true }) } catch {}
      await writeFile(path.join(uploadDir, name), html)
      result = result.replace(fullMatch, `/api/uploads/${name}`)
    } catch (err) {
      result = result.replace(fullMatch, `[Presentation failed: ${err.message}]`)
    }
  }

  // [FILE:name:mime]base64[/FILE] → binary
  const fileRegex = /\[FILE:([^:]+):([^\]]+)\]\s*([\s\S]*?)\s*\[\/FILE\]/g
  while ((match = fileRegex.exec(text)) !== null) {
    const [fullMatch, filename, mimetype, base64Data] = match
    try {
      const clean = base64Data.replace(/\s/g, '')
      const buffer = Buffer.from(clean, 'base64')
      if (buffer.length < 10) { result = result.replace(fullMatch, '[Empty file]'); continue }
      const { persistBuffer } = await import('@/lib/chat-upload')
      const info = await persistBuffer({ buffer, originalName: filename, mimetype })
      result = result.replace(fullMatch, info.url)
    } catch (err) {
      result = result.replace(fullMatch, `[File failed: ${err.message}]`)
    }
  }

  return result
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

// ─── Call OpenClaw with the full conversation (last N turns) ───
async function callOpenClaw(fullPrompt) {
  const url = process.env.OPENCLAW_URL || 'https://fool.khlije.app/agent'
  const token = process.env.OPENCLAW_TOKEN
  if (!token) throw new Error('OPENCLAW_TOKEN not configured')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message: fullPrompt, agent: 'main' }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`OpenClaw returned ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.output || data.result || ''
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
    const withContent = await extractAndSaveContent(rawResponse || '')
    const text = sanitizeResponse(withContent) || 'I received your message but got an empty response. Please try again.'

    const id = crypto.randomUUID()
    const stream = createUIMessageStream({
      execute: ({ writer }) => streamChunks(text, writer, id),
    })
    return createUIMessageStreamResponse({ stream, status: 200 })
  } catch (error) {
    console.error('Sims GPT chat error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process chat request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
