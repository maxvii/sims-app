import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Accept base64-encoded file via JSON (easier for OpenClaw than multipart)
export async function POST(req) {
  // Allow both session auth and Bearer token
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, filename, mimetype } = await req.json()
  if (!data) return NextResponse.json({ error: 'Missing "data" (base64 string)' }, { status: 400 })

  // Decode base64
  const buffer = Buffer.from(data, 'base64')

  // Determine extension
  const ext = filename ? path.extname(filename) : (mimetype?.includes('pdf') ? '.pdf' : mimetype?.includes('png') ? '.png' : mimetype?.includes('jpeg') ? '.jpg' : '.bin')
  const uniqueName = 'chat-' + crypto.randomBytes(12).toString('hex') + ext
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  try { await mkdir(uploadDir, { recursive: true }) } catch {}
  await writeFile(path.join(uploadDir, uniqueName), buffer)

  const url = `/api/uploads/${uniqueName}`

  return NextResponse.json({
    url,
    fullUrl: `https://sims.ai-gcc.com${url}`,
    filename: filename || uniqueName,
    size: buffer.length,
  })
}
