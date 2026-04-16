import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { persistBuffer } from '@/lib/chat-upload'

// JSON base64 upload — convenient for OpenClaw to write files back.
// Body: { data: "<base64>", filename: "foo.pdf", mimetype: "application/pdf" }
export const maxDuration = 120

export async function POST(req) {
  // Allow either session auth OR Bearer token (for OpenClaw)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, filename, mimetype } = body || {}
  if (!data) return NextResponse.json({ error: 'Missing "data" (base64 string)' }, { status: 400 })

  let buffer
  try {
    buffer = Buffer.from(String(data).replace(/\s/g, ''), 'base64')
  } catch {
    return NextResponse.json({ error: 'Invalid base64 data' }, { status: 400 })
  }

  try {
    const res = await persistBuffer({
      buffer,
      originalName: filename || 'upload',
      mimetype: mimetype || 'application/octet-stream',
    })
    return NextResponse.json(res)
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 400 })
  }
}
