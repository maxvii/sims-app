import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TOOL_HANDLERS, TOOL_SCHEMAS } from '@/lib/sims-tools'

// Dispatcher for /api/sims-gpt/tools/{tool}
// Accepts EITHER Bearer token (for OpenClaw) OR authenticated admin session (for human debug).
// Tool name in URL uses hyphens (create-event); internal handler name uses underscores (create_event).

async function isAuthorized(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader === `Bearer ${process.env.OPENCLAW_TOKEN}`) return { via: 'bearer' }
  const session = await getServerSession(authOptions)
  if (session) return { via: 'session', session }
  return null
}

function resolveHandler(toolParam) {
  const key = String(toolParam || '').replace(/-/g, '_').toLowerCase()
  if (TOOL_HANDLERS[key]) return { key, handler: TOOL_HANDLERS[key], schema: TOOL_SCHEMAS[key] }
  return null
}

export async function POST(req, { params }) {
  const auth = await isAuthorized(req)
  if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const resolved = resolveHandler(params.tool)
  if (!resolved) {
    return NextResponse.json({
      ok: false,
      error: `Unknown tool "${params.tool}"`,
      available: Object.keys(TOOL_HANDLERS),
    }, { status: 404 })
  }

  let body = {}
  try { body = await req.json() } catch {
    // Allow empty body for tools that take no input (today_brief, analytics)
  }

  try {
    const result = await resolved.handler(body)
    const status = result?.ok === false ? 400 : 200
    return NextResponse.json(result, { status })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: 'Tool execution failed',
      detail: String(err?.message || err),
    }, { status: 500 })
  }
}

// GET on a specific tool returns its schema — useful for docs / OpenClaw to verify shape.
export async function GET(req, { params }) {
  const auth = await isAuthorized(req)
  if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const resolved = resolveHandler(params.tool)
  if (!resolved) {
    return NextResponse.json({
      ok: false,
      error: `Unknown tool "${params.tool}"`,
      available: Object.keys(TOOL_HANDLERS),
    }, { status: 404 })
  }
  return NextResponse.json({
    ok: true,
    name: resolved.key,
    url: `/api/sims-gpt/tools/${params.tool}`,
    ...resolved.schema,
  })
}
