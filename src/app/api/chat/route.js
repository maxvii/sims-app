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

PRESENTATIONS (use this when asked to create a deck, presentation, or slides):
Wrap your slides in [SLIDES]...[/SLIDES] tags. Each slide is a <div class="slide"> with h1/h2/p/ul content.
Example:
[SLIDES]
<div class="slide"><h1>Title Slide</h1><p>Subtitle here</p></div>
<div class="slide"><h2>Key Point</h2><ul><li>First point</li><li>Second point</li></ul></div>
<div class="slide"><h2>Thank You</h2><p>Contact info</p></div>
[/SLIDES]
The server generates a styled PDF deck from these slides. User gets a download link.

SOCIAL MEDIA SIZES (use when asked to create posts, stories, or social content):
When creating visual content, use these [SLIDES] sizes by adding a size attribute:
- Instagram Post: <div class="slide" data-size="post"> (1080x1080, square)
- Instagram Story / Reel: <div class="slide" data-size="story"> (1080x1920, 9:16 vertical)
- LinkedIn Post: <div class="slide" data-size="linkedin"> (1200x627, landscape)
- Twitter/X Post: <div class="slide" data-size="twitter"> (1600x900, 16:9)
- Facebook Cover: <div class="slide" data-size="fbcover"> (820x312, wide banner)
If no size specified, defaults to presentation (landscape A4).
Multiple slides can mix sizes. Each becomes a separate page in the PDF.

FILE SHARING:
For other files, embed base64 in [FILE:name.ext:mimetype]...[/FILE] tags.
NEVER say "I can't attach files" or "blocked by policy". Use the tags above.
NEVER include local paths (/Users/...) or full server URLs.

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

// ─── Extract embedded content from OpenClaw response ───
async function extractAndSaveContent(text) {
  const { writeFile, mkdir } = await import('fs/promises')
  const path = await import('path')
  const crypto = await import('crypto')
  const uploadDir = path.default.join(process.cwd(), 'public', 'uploads')
  let result = text

  // Extract [SLIDES]...[/SLIDES] — save as styled HTML presentation
  const slidesRegex = /\[SLIDES\]([\s\S]*?)\[\/SLIDES\]/g
  let match
  while ((match = slidesRegex.exec(text)) !== null) {
    const [fullMatch, slidesContent] = match
    try {
      const slides = slidesContent.trim()

      // Parse slides into text blocks
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

      // Build a single-page HTML with all slides as printable pages
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
      await writeFile(path.default.join(uploadDir, name), html)
      result = result.replace(fullMatch, `/api/uploads/${name}`)
    } catch (err) {
      console.error('Presentation failed:', err)
      result = result.replace(fullMatch, `[Presentation failed: ${err.message}]`)
    }
  }

  // Extract [FILE:name:mime]base64[/FILE] — save as binary
  const fileRegex = /\[FILE:([^:]+):([^\]]+)\]\s*([\s\S]*?)\s*\[\/FILE\]/g
  while ((match = fileRegex.exec(text)) !== null) {
    const [fullMatch, filename, mimetype, base64Data] = match
    try {
      const clean = base64Data.replace(/\s/g, '')
      const buffer = Buffer.from(clean, 'base64')
      if (buffer.length < 10) { result = result.replace(fullMatch, `[Empty file]`); continue }
      const ext = path.default.extname(filename) || '.bin'
      const uniqueName = 'chat-' + crypto.default.randomBytes(12).toString('hex') + ext
      try { await mkdir(uploadDir, { recursive: true }) } catch {}
      await writeFile(path.default.join(uploadDir, uniqueName), buffer)
      result = result.replace(fullMatch, `/api/uploads/${uniqueName}`)
    } catch (err) {
      result = result.replace(fullMatch, `[File failed: ${err.message}]`)
    }
  }

  return result
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
    const withContent = await extractAndSaveContent(rawResponse || '')
    const text = sanitizeResponse(withContent) || 'I received your message but got an empty response. Please try again.'

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
