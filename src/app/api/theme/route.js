import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const THEME_FILE = path.join(process.cwd(), 'public', 'uploads', 'theme.json')

const DEFAULT_THEME = {
  'violet-deep': '#363A47',
  'violet-dark': '#2B2E38',
  'mauve-rose': '#6B7B8D',
  'peach': '#D0D9E2',
  'cream': '#F7F9FA',
  'cream-dark': '#E7ECF1',
  'body-bg-start': '#F7F9FA',
  'body-bg-mid': '#E7ECF1',
  'body-bg-end': '#F7F9FA',
  'body-text': '#2B2E38',
}

async function loadTheme() {
  try {
    const data = await readFile(THEME_FILE, 'utf-8')
    return { ...DEFAULT_THEME, ...JSON.parse(data) }
  } catch {
    return DEFAULT_THEME
  }
}

// GET — read current theme (no auth needed, loaded by every page)
export async function GET() {
  const theme = await loadTheme()
  return NextResponse.json(theme)
}

// POST — update theme colors (requires admin or OpenClaw token)
export async function POST(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.OPENCLAW_TOKEN}`) {
    // OpenClaw access — allowed
  } else {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const updates = await req.json()

  // Validate: only allow known color keys
  const validKeys = Object.keys(DEFAULT_THEME)
  const filtered = {}
  for (const [key, value] of Object.entries(updates)) {
    if (validKeys.includes(key) && typeof value === 'string') {
      filtered[key] = value
    }
  }

  // Merge with existing theme
  const current = await loadTheme()
  const merged = { ...current, ...filtered }

  // Save
  try {
    await mkdir(path.dirname(THEME_FILE), { recursive: true })
  } catch {}
  await writeFile(THEME_FILE, JSON.stringify(merged, null, 2))

  return NextResponse.json({ success: true, theme: merged })
}
