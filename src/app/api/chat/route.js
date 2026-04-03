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
The server saves this as an interactive HTML deck with navigation, keyboard controls, and swipe support. The user gets a link to open it fullscreen.

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

  // Extract [SLIDES]...[/SLIDES] — save as HTML presentation
  const slidesRegex = /\[SLIDES\]([\s\S]*?)\[\/SLIDES\]/g
  let match
  while ((match = slidesRegex.exec(text)) !== null) {
    const [fullMatch, slidesContent] = match
    try {
      const slides = slidesContent.trim()
      const html = wrapSlidesHTML(slides)
      const name = 'deck-' + crypto.default.randomBytes(8).toString('hex') + '.html'
      try { await mkdir(uploadDir, { recursive: true }) } catch {}
      await writeFile(path.default.join(uploadDir, name), html)
      const url = `/api/uploads/${name}`
      result = result.replace(fullMatch, `\n\n/api/uploads/${name}\n\nOpen the link above to view the presentation.`)
    } catch (err) {
      result = result.replace(fullMatch, `[Presentation save failed: ${err.message}]`)
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

// ─── Wrap slides content into a standalone HTML presentation ───
function wrapSlidesHTML(content) {
  // If content already has <html>, return as-is
  if (content.includes('<html') || content.includes('<!DOCTYPE')) return content

  // Otherwise wrap slide blocks into a fullscreen deck
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sims Presentation</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #1a1a2e; color: #f0f0f0; overflow: hidden; }
  .slide { width: 100vw; height: 100vh; display: none; flex-direction: column; justify-content: center; align-items: center; padding: 60px; text-align: center; }
  .slide.active { display: flex; }
  .slide h1 { font-size: 3em; font-weight: 800; margin-bottom: 20px; background: linear-gradient(135deg, #D0D9E2, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .slide h2 { font-size: 2em; font-weight: 700; margin-bottom: 16px; color: #D0D9E2; }
  .slide p, .slide li { font-size: 1.3em; line-height: 1.8; color: #b0b8c4; max-width: 800px; }
  .slide ul { list-style: none; text-align: left; }
  .slide li::before { content: "→ "; color: #6B7B8D; }
  .slide img { max-width: 60%; max-height: 50vh; border-radius: 16px; margin: 20px 0; }
  .nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; z-index: 10; }
  .nav button { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 24px; border-radius: 12px; cursor: pointer; font-size: 14px; backdrop-filter: blur(10px); }
  .nav button:hover { background: rgba(255,255,255,0.2); }
  .counter { position: fixed; bottom: 30px; right: 30px; color: rgba(255,255,255,0.3); font-size: 14px; }
  .branding { position: fixed; top: 20px; left: 30px; color: rgba(255,255,255,0.15); font-size: 12px; font-weight: 600; letter-spacing: 2px; }
</style>
</head>
<body>
<div class="branding">SIMS</div>
${content}
<div class="nav">
  <button onclick="prev()">← Prev</button>
  <button onclick="next()">Next →</button>
</div>
<div class="counter" id="counter"></div>
<script>
  const slides = document.querySelectorAll('.slide');
  let current = 0;
  function show(n) {
    slides.forEach(s => s.classList.remove('active'));
    current = Math.max(0, Math.min(n, slides.length - 1));
    slides[current].classList.add('active');
    document.getElementById('counter').textContent = (current+1) + ' / ' + slides.length;
  }
  function next() { show(current + 1); }
  function prev() { show(current - 1); }
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') next();
    if (e.key === 'ArrowLeft') prev();
  });
  // Touch swipe
  let startX;
  document.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  document.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  });
  show(0);
</script>
</body>
</html>`
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
