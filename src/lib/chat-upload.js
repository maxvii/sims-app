// Shared chat upload helper — MIME allowlist, size caps, original filename preserved.
// Used by /api/chat/upload (multipart) and /api/chat/upload-base64 (JSON).
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// ── Allowed types + size caps (per-file) ──────────────────────────────────────
// Map mimetype prefix/exact → { kind, maxBytes, exts }
const ALLOWED = [
  { test: (m) => m.startsWith('image/'),              kind: 'image', maxBytes: 25 * 1024 * 1024, exts: ['.jpg','.jpeg','.png','.gif','.webp','.heic','.heif'] },
  { test: (m) => m.startsWith('video/'),              kind: 'video', maxBytes: 200 * 1024 * 1024, exts: ['.mp4','.webm','.mov','.m4v'] },
  { test: (m) => m === 'application/pdf',             kind: 'pdf',   maxBytes: 50 * 1024 * 1024,  exts: ['.pdf'] },
  { test: (m) => m === 'application/msword'
              || m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                                       kind: 'doc',   maxBytes: 25 * 1024 * 1024, exts: ['.doc','.docx'] },
  { test: (m) => m === 'application/vnd.ms-excel'
              || m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              || m === 'text/csv',                     kind: 'doc',   maxBytes: 25 * 1024 * 1024, exts: ['.xls','.xlsx','.csv'] },
  { test: (m) => m === 'text/plain' || m === 'text/markdown' || m === 'application/json',
                                                       kind: 'text',  maxBytes: 5  * 1024 * 1024,  exts: ['.txt','.md','.json'] },
]

const KIND_FOR_EXT = {
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
  '.webp': 'image', '.heic': 'image', '.heif': 'image',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video', '.m4v': 'video',
  '.pdf': 'pdf',
  '.doc': 'doc', '.docx': 'doc',
  '.xls': 'doc', '.xlsx': 'doc', '.csv': 'doc',
  '.txt': 'text', '.md': 'text', '.json': 'text',
}

const GLOBAL_MAX_BYTES = 250 * 1024 * 1024 // hard ceiling regardless of type

export function resolveTypeInfo(mimetype, filename) {
  const ext = (filename ? path.extname(filename) : '').toLowerCase()
  const rule = ALLOWED.find((r) => r.test(mimetype || ''))
  if (rule) {
    const ok = rule.exts.includes(ext) || !ext // allow empty ext if mime is recognized
    if (!ok) return { ok: false, reason: `Extension ${ext} not allowed for mimetype ${mimetype}` }
    return { ok: true, kind: rule.kind, maxBytes: rule.maxBytes, ext: ext || rule.exts[0] }
  }
  // Fall back to extension-only detection
  if (KIND_FOR_EXT[ext]) {
    return { ok: true, kind: KIND_FOR_EXT[ext], maxBytes: GLOBAL_MAX_BYTES, ext }
  }
  return { ok: false, reason: `Type ${mimetype || 'unknown'} (ext ${ext || 'none'}) is not allowed` }
}

// Sanitize user-supplied filename: strip slashes, collapse spaces, cap at 120 chars,
// keep original extension if valid.
export function sanitizeFilename(name, fallbackExt = '.bin') {
  if (!name) return 'upload' + fallbackExt
  let base = name.replace(/[\\/]+/g, '_').replace(/[^\w .+()\-]/g, '_').trim()
  if (!base) base = 'upload'
  // Collapse whitespace
  base = base.replace(/\s+/g, ' ')
  if (base.length > 120) {
    const ext = path.extname(base)
    base = base.slice(0, 120 - ext.length) + ext
  }
  if (!path.extname(base)) base += fallbackExt
  return base
}

// Build final on-disk filename: "chat-{8hex}-{sanitized-original}.ext"
export function buildDiskName(originalName, fallbackExt) {
  const cleaned = sanitizeFilename(originalName, fallbackExt)
  const hash = crypto.randomBytes(4).toString('hex')
  const ext = path.extname(cleaned)
  const base = path.basename(cleaned, ext).replace(/[^\w.\-]/g, '_')
  return `chat-${hash}-${base}${ext}`
}

// Write buffer to /public/uploads and return { url, fullUrl, kind, filename, size, mimetype }
export async function persistBuffer({ buffer, originalName, mimetype }) {
  const type = resolveTypeInfo(mimetype, originalName)
  if (!type.ok) throw new Error(type.reason)
  if (buffer.length > type.maxBytes) {
    const mb = (type.maxBytes / 1024 / 1024).toFixed(0)
    throw new Error(`File too large — max ${mb}MB for ${type.kind} uploads`)
  }
  if (buffer.length > GLOBAL_MAX_BYTES) {
    throw new Error('File exceeds absolute 250MB limit')
  }
  if (buffer.length < 10) throw new Error('File is empty or corrupt')

  const diskName = buildDiskName(originalName, type.ext)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  try { await mkdir(uploadDir, { recursive: true }) } catch {}
  await writeFile(path.join(uploadDir, diskName), buffer)

  const url = `/api/uploads/${diskName}`
  const base = process.env.NEXTAUTH_URL || 'https://sims.ai-gcc.com'
  return {
    url,
    fullUrl: `${base}${url}`,
    kind: type.kind,
    filename: sanitizeFilename(originalName, type.ext),
    diskName,
    size: buffer.length,
    mimetype: mimetype || 'application/octet-stream',
  }
}

// Classify a URL/path into a kind for rendering
export function kindForUrl(url) {
  const ext = (url.match(/\.[a-zA-Z0-9]+(?:\?|#|$)/)?.[0] || '').toLowerCase().replace(/[?#].*$/, '')
  return KIND_FOR_EXT[ext] || 'other'
}
