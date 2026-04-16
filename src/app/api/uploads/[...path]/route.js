import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MIME_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.heic': 'image/heic', '.heif': 'image/heif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.html': 'text/html', '.pdf': 'application/pdf',
  '.json': 'application/json', '.txt': 'text/plain', '.md': 'text/markdown',
  '.css': 'text/css', '.js': 'application/javascript',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
}

// Files named chat-* are user-uploaded chat attachments: require an authenticated
// session OR a valid Bearer token (for OpenClaw). Everything else (event media,
// theme.json, generated decks) stays publicly readable.
async function isAuthorized(req, filename) {
  if (!filename.startsWith('chat-')) return true
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader === `Bearer ${process.env.OPENCLAW_TOKEN}`) return true
  const session = await getServerSession(authOptions)
  return !!session
}

export async function GET(req, { params }) {
  const filePath = params.path?.join('/') || ''

  // Prevent directory traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // First path segment is the filename (we don't nest chat uploads)
  const firstSeg = filePath.split('/')[0] || ''
  if (!(await isAuthorized(req, firstSeg))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath)

  try {
    const buffer = await readFile(fullPath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    const isChatUpload = firstSeg.startsWith('chat-')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Chat uploads are private — short, revalidatable cache; event media can be long-cached
        'Cache-Control': isChatUpload
          ? 'private, max-age=300, must-revalidate'
          : 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
