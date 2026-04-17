'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

// ══════════════════════════════════════════════════════════════════════════════
// Sims GPT — Chat Page
//   - Multi-attachment support (images, videos, PDFs, docs, sheets)
//   - Drag-and-drop anywhere on the page
//   - Paste-from-clipboard for screenshots
//   - PDF first-page thumbnail via pdfjs (lazy CDN load)
//   - Rich per-message attachment rendering
// ══════════════════════════════════════════════════════════════════════════════

// ─── Constants ──────────────────────────────────────────────────────────────
const SIZE_CAPS_MB = { image: 25, video: 200, pdf: 50, doc: 25, text: 5 }
const ACCEPT_ATTR = [
  'image/*', 'video/*', 'application/pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.txt', '.md', '.json',
].join(',')

const KIND_FOR_EXT = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', heic: 'image', heif: 'image',
  mp4: 'video', webm: 'video', mov: 'video', m4v: 'video',
  pdf: 'pdf',
  doc: 'doc', docx: 'doc',
  xls: 'doc', xlsx: 'doc', csv: 'doc',
  ppt: 'doc', pptx: 'doc', odp: 'doc',
  key: 'doc', pages: 'doc', numbers: 'doc',
  odt: 'doc', ods: 'doc', rtf: 'doc',
  zip: 'doc',
  txt: 'text', md: 'text', json: 'text',
  html: 'html',
}

function detectKind(file) {
  const mime = file.type || ''
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf') return 'pdf'
  const ext = (file.name || '').split('.').pop()?.toLowerCase()
  return KIND_FOR_EXT[ext] || 'other'
}

function kindForUrl(url) {
  const ext = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)?.[1]?.toLowerCase()
  return KIND_FOR_EXT[ext] || 'other'
}

function formatBytes(n) {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

// ─── Message text extraction (handles AI SDK v6 parts) ──────────────────────
function getMessageText(message) {
  if (Array.isArray(message.parts)) {
    return message.parts.filter(p => p.type === 'text').map(p => p.text || '').join('')
  }
  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content.map(p => typeof p === 'string' ? p : p?.text || '').join('')
  }
  return ''
}

function getToolInvocations(message) {
  if (Array.isArray(message.parts)) {
    return message.parts.filter(p => p.type === 'tool-invocation').map(p => p.toolInvocation || p)
  }
  return message.toolInvocations || []
}

// ─── Lazy PDF.js loader (CDN) ───────────────────────────────────────────────
let pdfjsPromise = null
function loadPdfjs() {
  if (pdfjsPromise) return pdfjsPromise
  pdfjsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.pdfjsLib) return resolve(window.pdfjsLib)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(window.pdfjsLib)
    }
    script.onerror = () => reject(new Error('pdfjs load failed'))
    document.head.appendChild(script)
  })
  return pdfjsPromise
}

async function renderPdfFirstPageToDataUrl(fileOrUrl) {
  try {
    const lib = await loadPdfjs()
    const src = fileOrUrl instanceof Blob
      ? { data: new Uint8Array(await fileOrUrl.arrayBuffer()) }
      : { url: fileOrUrl }
    const doc = await lib.getDocument(src).promise
    const page = await doc.getPage(1)
    const viewport = page.getViewport({ scale: 0.8 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

// ─── Media rendering helpers (for message bodies) ───────────────────────────
// Extensions the client will render as an inline card in a chat bubble.
// Kept in sync with KIND_FOR_EXT above.
const RENDERABLE_EXT_RE = '(?:jpg|jpeg|png|gif|webp|heic|heif|mp4|webm|mov|m4v|pdf|html|docx?|xlsx?|pptx?|odp|key|pages|numbers|odt|ods|rtf|zip|csv|txt|md|json)'
const HTTPS_MEDIA_RE = new RegExp('^https?:\\/\\/.+\\.' + RENDERABLE_EXT_RE + '(?:\\?[^\\s]*)?(?:#[^\\s]*)?$', 'i')
const LOCAL_MEDIA_RE = new RegExp('\\/api\\/uploads\\/.+\\.' + RENDERABLE_EXT_RE + '(?:\\?[^\\s]*)?(?:#[^\\s]*)?', 'i')

function isMediaUrl(str) {
  const s = str.trim()
  return HTTPS_MEDIA_RE.test(s) || LOCAL_MEDIA_RE.test(s)
}

function KindIcon({ kind, className = 'w-6 h-6' }) {
  // SVG glyphs for file types (inline, no asset deps)
  const strokeColor = 'currentColor'
  if (kind === 'pdf') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 7V4a1 1 0 0 1 1-1h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="12" y="17" fontSize="5.5" fontWeight="900" textAnchor="middle" fill={strokeColor} stroke="none">PDF</text>
    </svg>
  )
  if (kind === 'video') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <rect x="3" y="5" width="14" height="14" rx="2"/>
      <path d="m17 10 4-2v8l-4-2Z" strokeLinejoin="round"/>
    </svg>
  )
  if (kind === 'image') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <circle cx="9" cy="10" r="1.5"/>
      <path d="m3 18 6-6 4 4 3-3 5 5" strokeLinejoin="round"/>
    </svg>
  )
  if (kind === 'doc') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" strokeLinecap="round"/>
      <path d="M4 7V4a1 1 0 0 1 1-1h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" strokeLinecap="round"/>
      <path d="M8 13h8M8 17h5" strokeLinecap="round"/>
    </svg>
  )
  if (kind === 'text') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <path d="M4 5h16M4 10h16M4 15h10M4 20h16" strokeLinecap="round"/>
    </svg>
  )
  if (kind === 'html') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/** Fullscreen in-app preview modal with a Back-to-chat button.
 *  Handles images, videos, PDFs, Office docs, and any other URL.
 *  Closes on Esc. Never opens a new tab.
 */
function PreviewModal({ url, filename, mode, onClose }) {
  // mode: 'image' | 'video' | 'iframe'
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // If we're showing the Office Online viewer, the actual file URL is embedded
  // in the viewer URL — pull it back out so the Download button gives the real file.
  const downloadUrl = url.includes('view.officeapps.live.com')
    ? decodeURIComponent(url.split('src=')[1] || url)
    : url

  // Choose background: image/video look best on a dark canvas, docs/iframes on light.
  const bodyBg = (mode === 'image' || mode === 'video') ? '#0B0C10' : '#E7ECF1'

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col animate-fade-in"
      style={{ background: '#F7F9FA' }}
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center gap-2 px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(247,249,250,0.95), rgba(208,217,226,0.65))',
          borderBottom: '1px solid rgba(54,58,71,0.08)',
          backdropFilter: 'blur(20px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs active:scale-95 transition-transform"
          style={{ background: '#363A47', color: '#F7F9FA' }}
          aria-label="Back to chat"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to chat
        </button>
        <div className="flex-1 min-w-0 px-2">
          <p className="text-sm font-semibold truncate" style={{ color: '#2B2E38' }}>
            {filename}
          </p>
        </div>
        <a
          href={downloadUrl}
          download={filename}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs active:scale-95 transition-transform"
          style={{ background: 'rgba(54,58,71,0.08)', color: '#363A47' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          Download
        </a>
      </div>

      {/* Body — kind-aware viewer */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-auto"
        style={{ background: bodyBg }}
      >
        {mode === 'image' ? (
          <img
            src={url}
            alt={filename}
            className="max-w-full max-h-full object-contain"
            style={{ display: 'block' }}
          />
        ) : mode === 'video' ? (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full"
            style={{ display: 'block', background: '#000' }}
          />
        ) : (
          <iframe
            src={url}
            title={filename}
            className="w-full h-full"
            style={{ border: 0 }}
            allow="clipboard-read; clipboard-write; fullscreen"
          />
        )}
      </div>
    </div>
  )
}

/** Render a media URL inside a message body — kind-aware */
function MediaThumbnail({ url }) {
  const [pdfThumb, setPdfThumb] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const kind = kindForUrl(url)
  const filename = decodeURIComponent(url.split('/').pop() || 'file')

  useEffect(() => {
    if (kind === 'pdf') {
      renderPdfFirstPageToDataUrl(url).then(setPdfThumb)
    }
  }, [kind, url])

  if (kind === 'html') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="my-2 flex items-center gap-3 p-3 rounded-xl active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)', maxWidth: 280 }}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <KindIcon kind="html" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Open Presentation</p>
          <p className="text-[10px] text-white/60">Tap to view fullscreen</p>
        </div>
      </a>
    )
  }

  if (kind === 'pdf') {
    return (
      <>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="my-2 block rounded-2xl overflow-hidden active:scale-[0.98] transition-transform w-full text-left"
          style={{ background: 'rgba(54,58,71,0.06)', border: '1px solid rgba(54,58,71,0.08)', maxWidth: 280 }}
        >
          {pdfThumb ? (
            <img src={pdfThumb} alt={filename} className="w-full" style={{ maxHeight: 320, objectFit: 'contain', background: '#fff' }} />
          ) : (
            <div className="w-full h-40 flex items-center justify-center" style={{ background: 'rgba(212, 54, 92, 0.08)', color: '#D4365C' }}>
              <KindIcon kind="pdf" className="w-12 h-12" />
            </div>
          )}
          <div className="flex items-center gap-2 p-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white" style={{ background: '#DC2626' }}>
              <KindIcon kind="pdf" className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate">{filename}</p>
              <p className="text-[10px] text-gray-400">Tap to preview</p>
            </div>
          </div>
        </button>
        {previewOpen && (
          <PreviewModal url={url} filename={filename} mode="iframe" onClose={() => setPreviewOpen(false)} />
        )}
      </>
    )
  }

  if (kind === 'video') {
    return (
      <>
        <div className="my-2 rounded-2xl overflow-hidden relative" style={{ maxWidth: 280 }}>
          <video src={url} controls preload="metadata" className="w-full" style={{ maxHeight: 220, objectFit: 'cover' }} />
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            aria-label="Open fullscreen"
            title="Open fullscreen"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
            </svg>
          </button>
        </div>
        {previewOpen && (
          <PreviewModal url={url} filename={filename} mode="video" onClose={() => setPreviewOpen(false)} />
        )}
      </>
    )
  }

  if (kind === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="my-2 rounded-2xl overflow-hidden block w-full text-left active:scale-[0.98] transition-transform"
          style={{ maxWidth: 280 }}
          aria-label="Open preview"
        >
          <img src={url} alt={filename} className="w-full cursor-pointer" style={{ maxHeight: 240, objectFit: 'cover' }} />
        </button>
        {previewOpen && (
          <PreviewModal url={url} filename={filename} mode="image" onClose={() => setPreviewOpen(false)} />
        )}
      </>
    )
  }

  if (kind === 'doc' || kind === 'text' || kind === 'other') {
    // Resolve to an absolute URL so Office Online's viewer can reach it.
    const absoluteUrl = url.startsWith('http')
      ? url
      : (typeof window !== 'undefined' ? window.location.origin + url : url)
    const ext = (filename.split('.').pop() || '').toLowerCase()
    const officeViewable = ['ppt','pptx','doc','docx','xls','xlsx'].includes(ext)
    const previewSrc = officeViewable
      ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`
      : absoluteUrl
    const canPreview = officeViewable || ext === 'pdf' || ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'csv' || ext === 'html'

    return (
      <>
        <div className="my-2 rounded-xl overflow-hidden"
          style={{ background: 'rgba(54,58,71,0.06)', border: '1px solid rgba(54,58,71,0.08)', maxWidth: 300 }}
        >
          {/* Primary row — click anywhere to download */}
          <a href={url} download={filename}
            className="flex items-center gap-3 p-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ background: ext === 'pptx' || ext === 'ppt' ? '#D24726' : '#6B7B8D' }}
            >
              <KindIcon kind={kind} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700 truncate">{filename}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{ext || 'file'}</p>
            </div>
          </a>
          {/* Action row — Download + Preview (in-app, with Back-to-chat) */}
          <div className="flex border-t" style={{ borderColor: 'rgba(54,58,71,0.08)' }}>
            <a href={url} download={filename}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold active:scale-95 transition-transform"
              style={{ color: '#363A47' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              Download
            </a>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold active:scale-95 transition-transform border-l"
              style={{ color: '#363A47', borderColor: 'rgba(54,58,71,0.08)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Preview
            </button>
          </div>
        </div>
        {previewOpen && canPreview && (
          <PreviewModal
            url={previewSrc}
            filename={filename}
            mode="iframe"
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </>
    )
  }

  return null
}

// ─── Light markdown (**bold**, *italic*, `code`, lists, URLs) ───────────────
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    if (isMediaUrl(trimmed)) return <MediaThumbnail key={i} url={trimmed} />
    if (/^\s*[-*]\s/.test(line)) {
      const content = line.replace(/^\s*[-*]\s/, '')
      return (
        <div key={i} className="flex gap-1.5 pl-1 mb-0.5">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
          <span>{formatInline(content)}</span>
        </div>
      )
    }
    if (/^\s*\d+[.)]\s/.test(line)) {
      const num = line.match(/^\s*(\d+)/)[1]
      const content = line.replace(/^\s*\d+[.)]\s/, '')
      return (
        <div key={i} className="flex gap-1.5 pl-1 mb-0.5">
          <span className="opacity-60 shrink-0 text-xs mt-0.5">{num}.</span>
          <span>{formatInline(content)}</span>
        </div>
      )
    }
    if (!line.trim()) return <div key={i} className="h-2" />
    return <p key={i} className="mb-1">{formatInline(line)}</p>
  })
}

// Split text for inline formatting — keep markdown + any URL (we'll classify
// URLs downstream: media URLs become thumbnails, others become link chips).
function formatInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s)]+|\/api\/uploads\/[^\s)]+)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(54,58,71,0.08)' }}>{part.slice(1, -1)}</code>
    if (isMediaUrl(part)) return <MediaThumbnail key={i} url={part.trim()} />
    if (/^https?:\/\//.test(part))
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#6B7B8D' }}>{part.length > 50 ? part.slice(0, 47) + '...' : part}</a>
    return part
  })
}

// ─── Quick actions ──────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: '☀️', label: 'Brief me today', prompt: 'Brief me on today\'s schedule and pending items' },
  { emoji: '📅', label: 'Add event', prompt: 'I need to add a new event' },
  { emoji: '✍️', label: 'Draft caption', prompt: 'Draft an Instagram caption for' },
  { emoji: '🔍', label: 'Research', prompt: 'Research the latest trends in' },
  { emoji: '📊', label: 'Analytics', prompt: 'Show me event analytics and stats' },
]

const TOOL_LABELS = {
  create_event:  { icon: '📅', loading: 'Creating event...', done: 'Event created' },
  search_events: { icon: '🔍', loading: 'Searching events...', done: 'Search complete' },
  update_event:  { icon: '✏️', loading: 'Updating event...', done: 'Event updated' },
  get_today_brief: { icon: '☀️', loading: 'Fetching brief...', done: 'Brief ready' },
  get_analytics: { icon: '📊', loading: 'Pulling analytics...', done: 'Analytics ready' },
}
function toolLabel(name) { return TOOL_LABELS[name] || { icon: '🔧', loading: 'Working...', done: 'Done' } }

function ToolCard({ invocation }) {
  const label = toolLabel(invocation.toolName)
  const isToolLoading = invocation.state === 'call' || invocation.state === 'partial-call'
  const isResult = invocation.state === 'result'
  let resultSummary = null
  if (isResult && invocation.result) {
    const r = invocation.result
    if (invocation.toolName === 'create_event' && r.title) resultSummary = `${r.title} — ${r.date || ''}`
    else if (invocation.toolName === 'search_events' && Array.isArray(r.events)) resultSummary = `Found ${r.events.length} event${r.events.length !== 1 ? 's' : ''}`
    else if (invocation.toolName === 'update_event' && r.title) resultSummary = `${r.title} updated`
    else if (invocation.toolName === 'get_today_brief') {
      const count = r.todayCount ?? r.total ?? (Array.isArray(r.events) ? r.events.length : null)
      resultSummary = count != null ? `${count} event${count !== 1 ? 's' : ''} today` : 'Brief loaded'
    } else if (invocation.toolName === 'get_analytics') resultSummary = r.total != null ? `${r.total} total events tracked` : 'Analytics loaded'
    else if (typeof r === 'string') resultSummary = r.length > 80 ? r.slice(0, 77) + '...' : r
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-1 mb-1 text-xs"
      style={{ background: isResult ? 'rgba(54,58,71,0.06)' : 'rgba(107,123,141,0.08)', border: '1px solid rgba(54,58,71,0.08)' }}>
      <span className="text-sm">{label.icon}</span>
      <div className="flex-1 min-w-0">
        <span style={{ color: '#363A47' }} className="font-medium">
          {isToolLoading ? label.loading : label.done}
        </span>
        {resultSummary && <span className="block text-gray-500 truncate mt-0.5">{isResult ? '✅ ' : ''}{resultSummary}</span>}
      </div>
      {isToolLoading && (
        <span className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#6B7B8D' }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '300ms' }} />
        </span>
      )}
    </div>
  )
}

// ─── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const textContent = getMessageText(message)
  const toolInvocations = getToolInvocations(message)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in min-w-0`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full shrink-0 mt-1 mr-2 overflow-hidden" style={{ background: '#000' }}>
          <img src="/images/sims-eye.gif" alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-[80%] min-w-0 flex flex-col gap-0.5">
        {textContent ? (
          <div className={`wrap-anywhere px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'text-white rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
            style={isUser ? { background: 'linear-gradient(135deg, #363A47, #6B7B8D)' } : { background: 'rgba(247,249,250,0.65)', backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', border: '1px solid rgba(247,249,250,0.65)', color: '#1f1f1f' }}>
            {isUser ? <UserMessageText text={textContent} /> : renderMarkdown(textContent)}
          </div>
        ) : null}
        {toolInvocations.map((inv, i) => <ToolCard key={inv.toolCallId || i} invocation={inv} />)}
      </div>
    </div>
  )
}

// For user messages: strip [ATTACHMENT ...] tags but render URLs as thumbs.
function UserMessageText({ text }) {
  if (!text) return null
  // Extract attachment tags → render as thumbnails above plain text
  const attachmentRe = /\[ATTACHMENT\s+filename="([^"]+)"\s+kind="([^"]+)"\s+url="([^"]+)"\]/g
  const attachments = []
  let cleaned = text
  let m
  while ((m = attachmentRe.exec(text)) !== null) {
    attachments.push({ filename: m[1], kind: m[2], url: m[3] })
  }
  cleaned = text.replace(attachmentRe, '').replace(/\s+/g, ' ').trim()
  return (
    <>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a, i) => <MediaThumbnail key={i} url={a.url} />)}
        </div>
      )}
      {cleaned && <div className="whitespace-pre-wrap">{cleaned}</div>}
    </>
  )
}

// ─── Attachment chip (pre-send preview) ─────────────────────────────────────
function AttachmentChip({ attachment, onRemove }) {
  const { kind, file, preview, uploading, progress } = attachment
  return (
    <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ background: 'rgba(54,58,71,0.08)', width: 64, height: 64 }}>
      {kind === 'image' && preview ? (
        <img src={preview} alt="" className="w-16 h-16 object-cover" />
      ) : kind === 'pdf' && preview ? (
        <img src={preview} alt="" className="w-16 h-16 object-cover" style={{ background: '#fff' }} />
      ) : (
        <div className="w-16 h-16 flex flex-col items-center justify-center text-[#6B7B8D] px-1">
          <KindIcon kind={kind} className="w-7 h-7" />
          <span className="text-[8px] font-bold mt-0.5 uppercase truncate max-w-full">{kind}</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      )}
      {!uploading && (
        <button type="button" onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: '#D4365C', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>×</button>
      )}
      <div className="absolute bottom-0 inset-x-0 px-1 py-0.5" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <p className="text-[8px] text-white truncate">{file.name}</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════════
export default function ChatPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const inputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const fileInputRef = useRef(null)

  const [input, setInput] = useState('')
  const [chatSessionId, setChatSessionId] = useState(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const prevMessageCountRef = useRef(0)
  const pendingAttachmentsRef = useRef(null) // array to attach with next saved user msg

  const [attachments, setAttachments] = useState([]) // [{ id, file, kind, preview, uploading, uploadedUrl, filename, size, mimetype }]
  const [isDragOver, setIsDragOver] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef(null)

  const [chatError, setChatError] = useState(null)

  const { messages, sendMessage, status, error, setMessages } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Chat error:', err)
      setChatError(err?.message || 'Something went wrong. Please try again.')
    },
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  // ─── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => { if (authStatus === 'unauthenticated') router.push('/login') }, [authStatus, router])

  // ─── Load history ───────────────────────────────────────────────────────
  useEffect(() => {
    if (authStatus !== 'authenticated' || historyLoaded) return
    async function loadHistory() {
      try {
        const res = await fetch('/api/chat/history')
        const data = await res.json()
        if (data.sessionId && data.messages?.length > 0) {
          setChatSessionId(data.sessionId)
          const restored = data.messages.map(m => {
            // Render attachment tags inside the historical user text, so thumbs show up
            const attTags = (m.attachments || [])
              .map(a => `[ATTACHMENT filename="${a.filename}" kind="${a.kind}" url="${a.url}"]`)
              .join(' ')
            const content = attTags ? `${attTags} ${m.content}`.trim() : m.content
            return { id: m.id, role: m.role, content, parts: [{ type: 'text', text: content }] }
          })
          setMessages(restored)
          prevMessageCountRef.current = restored.length
        } else {
          setChatSessionId('session-' + Date.now())
        }
      } catch {
        setChatSessionId('session-' + Date.now())
      }
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [authStatus, historyLoaded, setMessages])

  // ─── Persist new messages + attachments ─────────────────────────────────
  useEffect(() => {
    if (!chatSessionId || !historyLoaded) return
    if (status === 'submitted' || status === 'streaming') return
    const newCount = messages.length
    if (newCount <= prevMessageCountRef.current) return

    const newMessages = messages.slice(prevMessageCountRef.current)
    prevMessageCountRef.current = newCount

    for (const msg of newMessages) {
      const content = getMessageText(msg)
      if (!content) continue
      // Attach pending attachments ONLY to the next user message
      let atts = null
      if (msg.role === 'user' && pendingAttachmentsRef.current) {
        atts = pendingAttachmentsRef.current
        pendingAttachmentsRef.current = null
      }
      fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: chatSessionId,
          role: msg.role,
          content,
          attachments: atts,
        }),
      }).catch(() => {})
    }
  }, [messages, status, chatSessionId, historyLoaded])

  // ─── Sessions drawer ────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false)
  const [chatSessions, setChatSessions] = useState([])

  async function loadChatSessions() {
    try {
      const res = await fetch('/api/chat/history?list=true')
      const data = await res.json()
      setChatSessions(data.sessions || [])
    } catch {}
  }

  async function loadSession(sessionId) {
    try {
      const res = await fetch(`/api/chat/history?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.messages?.length > 0) {
        setChatSessionId(data.sessionId)
        const restored = data.messages.map(m => {
          const attTags = (m.attachments || [])
            .map(a => `[ATTACHMENT filename="${a.filename}" kind="${a.kind}" url="${a.url}"]`)
            .join(' ')
          const content = attTags ? `${attTags} ${m.content}`.trim() : m.content
          return { id: m.id, role: m.role, content, parts: [{ type: 'text', text: content }] }
        })
        setMessages(restored)
        prevMessageCountRef.current = restored.length
      }
      setShowHistory(false)
    } catch {}
  }

  async function deleteSession(sessionId, e) {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    try {
      await fetch(`/api/chat/history?sessionId=${sessionId}`, { method: 'DELETE' })
      await loadChatSessions()
      if (sessionId === chatSessionId) handleNewChat()
    } catch {}
  }

  function handleNewChat() {
    setMessages([])
    setChatSessionId('session-' + Date.now())
    prevMessageCountRef.current = 0
    setChatError(null)
    setShowHistory(false)
    setAttachments([])
  }

  // ─── Speech recognition ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      setSpeechSupported(!!SR)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  // ─── Add files to pending attachments (handles dropzone, picker, paste) ──
  const addFiles = useCallback((files) => {
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, 10) // hard cap per message
    const next = []
    for (const file of list) {
      const kind = detectKind(file)
      const cap = (SIZE_CAPS_MB[kind] || 50) * 1024 * 1024
      if (file.size > cap) {
        setChatError(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB > ${SIZE_CAPS_MB[kind] || 50}MB)`)
        continue
      }
      const id = Math.random().toString(36).slice(2)
      const preview = kind === 'image' ? URL.createObjectURL(file) : null
      next.push({ id, file, kind, preview, uploading: false })
      // Lazy-generate PDF thumb
      if (kind === 'pdf') {
        renderPdfFirstPageToDataUrl(file).then(dataUrl => {
          if (dataUrl) {
            setAttachments(prev => prev.map(a => a.id === id ? { ...a, preview: dataUrl } : a))
          }
        })
      }
    }
    setAttachments(prev => [...prev, ...next])
  }, [])

  // File picker
  function handleFileSelect(e) {
    addFiles(e.target.files)
    e.target.value = '' // allow selecting the same file twice
  }

  // Drag-and-drop on the whole page
  useEffect(() => {
    function onDragOver(e) {
      if (!e.dataTransfer?.types?.includes('Files')) return
      e.preventDefault()
      setIsDragOver(true)
    }
    function onDragLeave(e) {
      if (e.target === document.documentElement || e.clientX <= 0 || e.clientY <= 0) {
        setIsDragOver(false)
      }
    }
    function onDrop(e) {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [addFiles])

  // Paste from clipboard
  useEffect(() => {
    function onPaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      const files = []
      for (const item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) files.push(f)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        addFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  // ─── Send message ──────────────────────────────────────────────────────
  async function handleSend(text) {
    const trimmed = (text || '').trim()
    if ((!trimmed && attachments.length === 0) || isLoading) return
    setInput('')

    // Upload all pending attachments in parallel
    let uploaded = []
    if (attachments.length > 0) {
      setAttachments(prev => prev.map(a => ({ ...a, uploading: true })))
      const formData = new FormData()
      for (const att of attachments) formData.append('files', att.file)
      try {
        const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (data?.uploads) uploaded = data.uploads.filter(u => !u.error)
        else if (data?.url) uploaded = [data]
        const failures = (data?.uploads || []).filter(u => u.error)
        if (failures.length) {
          setChatError(`Some uploads failed: ${failures.map(f => f.filename || '?').join(', ')}`)
        }
      } catch (err) {
        setChatError('Upload failed: ' + err.message)
      }
      setAttachments([])
    }

    // Build the outgoing user content — attachment tags + text
    const attTags = uploaded.map(u =>
      `[ATTACHMENT filename="${u.filename}" kind="${u.kind}" url="${u.url}"]`
    ).join(' ')

    const msg = attTags ? (trimmed ? `${attTags} ${trimmed}` : attTags) : trimmed
    if (!msg) return

    // Remember these to persist with the user message when useChat adds it to messages[]
    pendingAttachmentsRef.current = uploaded.map(u => ({
      url: u.url, filename: u.filename, mimetype: u.mimetype, size: u.size, kind: u.kind,
    }))

    sendMessage({ text: msg })
  }

  // ─── Voice input ───────────────────────────────────────────────────────
  function toggleVoice() {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (transcript.trim()) handleSend(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  if (authStatus === 'loading') return null

  return (
    <div
      className="flex flex-col h-screen relative overflow-x-hidden"
      style={{ background: '#F7F9FA', maxWidth: '100vw' }}
      ref={dropZoneRef}
    >

      {/* ── Drag overlay ── */}
      {isDragOver && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none animate-fade-in"
          style={{ background: 'rgba(54,58,71,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="px-8 py-6 rounded-3xl text-center" style={{ background: '#F7F9FA', border: '2px dashed #363A47' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#363A47' }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="font-display text-lg font-bold" style={{ color: '#2B2E38' }}>Drop to attach</p>
            <p className="text-xs mt-1" style={{ color: '#6B7B8D' }}>Images, videos, PDFs, docs</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="shrink-0 px-5 pt-12 pb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(247,249,250,0.8) 0%, rgba(208,217,226,0.35) 50%, rgba(247,249,250,0.75) 100%)',
          backdropFilter: 'blur(40px) saturate(2)', WebkitBackdropFilter: 'blur(40px) saturate(2)',
          borderRadius: '0 0 24px 24px', borderBottom: '1.5px solid rgba(247,249,250,0.7)',
          boxShadow: '0 8px 32px rgba(54,58,71,0.06)',
        }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6B7B8D, transparent 70%)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #363A47, transparent 70%)' }} />
          <div className="absolute top-4 right-24 w-16 h-16 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D0D9E2, transparent 70%)' }} />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => router.push('/calendar')}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{ background: 'rgba(54,58,71,0.08)' }}>
            <svg className="w-5 h-5" style={{ color: '#363A47' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: '#363A47' }}>S</div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-black italic text-gray-800">Sims GPT</h1>
            <p className="text-xs text-gray-500 -mt-0.5">Your AI assistant</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { loadChatSessions(); setShowHistory(!showHistory) }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: 'rgba(54,58,71,0.08)', color: '#363A47' }}>History</button>
            {messages.length > 0 && (
              <button onClick={handleNewChat}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                style={{ background: 'rgba(54,58,71,0.08)', color: '#363A47' }}>+ New</button>
            )}
          </div>
        </div>
      </div>

      {/* ── History drawer ── */}
      {showHistory && (
        <div className="shrink-0 px-4 py-3 max-h-60 overflow-y-auto" style={{ background: 'rgba(54,58,71,0.03)', borderBottom: '1px solid rgba(54,58,71,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Past Chats</span>
            <button onClick={() => setShowHistory(false)} className="text-[10px] text-gray-400">Close</button>
          </div>
          {chatSessions.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No past conversations</p>
          ) : (
            <div className="space-y-1.5">
              {chatSessions.map(s => (
                <button key={s.sessionId} onClick={() => loadSession(s.sessionId)}
                  className="w-full text-left p-2.5 rounded-xl active:scale-[0.98] transition-transform flex items-center gap-2"
                  style={{ background: s.sessionId === chatSessionId ? 'rgba(54,58,71,0.1)' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(54,58,71,0.06)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{s.title || 'Untitled chat'}</p>
                    <p className="text-[10px] text-gray-400">{new Date(s.lastMessageAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => deleteSession(s.sessionId, e)}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'rgba(212,54,92,0.12)', color: '#D4365C' }} aria-label="Delete">×</button>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="shrink-0 px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_ACTIONS.map((action) => (
            <button key={action.label} onClick={() => handleSend(action.prompt)} disabled={isLoading}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(247,249,250,0.65)', backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', border: '1px solid rgba(247,249,250,0.65)', color: '#363A47' }}>
              <span>{action.emoji}</span>
              <span className="whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#363A47' }}>
              <span className="text-2xl font-black text-white">S</span>
            </div>
            <h2 className="font-display text-xl font-bold italic text-gray-800 mb-1">Hi, how can I help?</h2>
            <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
              Chat, attach photos/videos/PDFs/docs. Drag, drop, paste — they'll come through.
            </p>
          </div>
        )}
        {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full shrink-0 mt-1 mr-2 flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #363A47, #6B7B8D)' }}>S</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'rgba(247,249,250,0.65)', backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', border: '1px solid rgba(247,249,250,0.65)' }}>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6B7B8D' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6B7B8D', animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        {(chatError || error) && (
          <div className="mx-2 mb-2 px-4 py-3 rounded-2xl text-sm animate-fade-in" style={{ background: 'rgba(212,54,92,0.1)', border: '1px solid rgba(212,54,92,0.2)', color: '#D4365C' }}>
            {chatError || error?.message || 'Something went wrong. Please try again.'}
            <button onClick={() => setChatError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 px-4 pt-2 pb-24">
        {isListening && (
          <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#e53e3e' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#e53e3e' }} />
            </span>
            <span className="text-xs font-medium" style={{ color: '#e53e3e' }}>Listening...</span>
          </div>
        )}

        {/* Attachments strip */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
            {attachments.map(a => (
              <AttachmentChip key={a.id} attachment={a}
                onRemove={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} />
            ))}
            <span className="text-[10px] shrink-0 ml-1" style={{ color: '#6B7B8D' }}>
              {attachments.length} file{attachments.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <input ref={fileInputRef} type="file" multiple accept={ACCEPT_ATTR} className="hidden" onChange={handleFileSelect} />

        <form onSubmit={(e) => { e.preventDefault(); handleSend(input) }} className="flex items-end gap-2">
          <div className="flex-1 flex items-end rounded-2xl px-4 py-2.5"
            style={{ background: 'rgba(247,249,250,0.65)', backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', border: '1.5px solid rgba(247,249,250,0.7)', boxShadow: '0 4px 16px rgba(54,58,71,0.06)' }}>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input) } }}
              placeholder="Ask, drop files, or paste a screenshot..." rows={1}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none max-h-24"
              style={{ fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)', lineHeight: '1.5' }} />

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="ml-2 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(54,58,71,0.08)', color: '#6B7B8D' }} aria-label="Attach files">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </button>

            {speechSupported && (
              <button type="button" onClick={toggleVoice}
                className={`ml-2 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${isListening ? 'animate-pulse' : ''}`}
                style={{ background: isListening ? 'linear-gradient(135deg, #e53e3e, #c53030)' : 'rgba(54,58,71,0.08)', color: isListening ? '#fff' : '#6B7B8D' }}
                aria-label="Voice input">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
          </div>

          <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: (input.trim() || attachments.length > 0) ? 'linear-gradient(135deg, #363A47, #6B7B8D)' : 'rgba(54,58,71,0.12)',
              boxShadow: (input.trim() || attachments.length > 0) ? '0 4px 16px rgba(54,58,71,0.3)' : 'none',
            }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={(input.trim() || attachments.length > 0) ? '#fff' : '#6B7B8D'} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>

      <Navbar />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
