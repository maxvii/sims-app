import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listTools } from '@/lib/sims-tools'

// Discoverability endpoint — OpenClaw (or anyone with Bearer/session) can fetch this once
// on startup to learn every tool, its URL, required args, and an example payload.
export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    baseUrl: 'https://sims.ai-gcc.com',
    authHeader: 'Authorization: Bearer <OPENCLAW_TOKEN>',
    contentType: 'application/json',
    method: 'POST',
    note: 'Call POST <tool.url> with the required body fields. GET <tool.url> returns the schema for that tool only.',
    tools: listTools(),
  })
}
