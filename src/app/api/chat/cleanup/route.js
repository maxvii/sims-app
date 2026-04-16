// Admin / cron endpoint — delete chat-* upload files older than N days (default 90).
// Also removes orphan ChatAttachment rows that no longer have a file on disk.
//
// Protection: requires either ADMIN session or the OPENCLAW bearer token.
// Can be invoked from a host cron:
//   curl -H "Authorization: Bearer $OPENCLAW_TOKEN" \
//        https://sims.ai-gcc.com/api/chat/cleanup
import { NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function isAuthorized(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.OPENCLAW_TOKEN}`) return true
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN'
}

async function runCleanup({ maxAgeDays = 90, dryRun = false }) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000

  let entries = []
  try {
    entries = await readdir(uploadDir)
  } catch {
    return { scanned: 0, deleted: 0, bytesFreed: 0, note: 'uploads dir missing' }
  }

  const stats = { scanned: 0, deleted: 0, bytesFreed: 0, deletedFiles: [] }

  for (const name of entries) {
    if (!name.startsWith('chat-')) continue
    const full = path.join(uploadDir, name)
    try {
      const s = await stat(full)
      if (!s.isFile()) continue
      stats.scanned += 1
      if (s.mtimeMs < cutoffMs) {
        if (!dryRun) await unlink(full)
        stats.deleted += 1
        stats.bytesFreed += s.size
        stats.deletedFiles.push(name)
      }
    } catch {
      // ignore
    }
  }

  // Remove ChatAttachment rows whose url points at a deleted file
  if (!dryRun && stats.deletedFiles.length > 0) {
    const urls = stats.deletedFiles.map((n) => `/api/uploads/${n}`)
    try {
      await prisma.chatAttachment.deleteMany({ where: { url: { in: urls } } })
    } catch {
      // Non-fatal
    }
  }

  return stats
}

export async function POST(req) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body = {}
  try { body = await req.json() } catch {}
  const maxAgeDays = Number(body?.maxAgeDays) || 90
  const dryRun = Boolean(body?.dryRun)
  const result = await runCleanup({ maxAgeDays, dryRun })
  return NextResponse.json({ ok: true, maxAgeDays, dryRun, ...result })
}

// GET as shorthand (for simple curl-based cron)
export async function GET(req) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const maxAgeDays = Number(searchParams.get('maxAgeDays')) || 90
  const dryRun = searchParams.get('dryRun') === '1'
  const result = await runCleanup({ maxAgeDays, dryRun })
  return NextResponse.json({ ok: true, maxAgeDays, dryRun, ...result })
}
