import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = path.extname(file.name) || '.bin'
  const uniqueName = 'chat-' + crypto.randomBytes(12).toString('hex') + ext
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  try { await mkdir(uploadDir, { recursive: true }) } catch {}

  await writeFile(path.join(uploadDir, uniqueName), buffer)

  const url = `/api/uploads/${uniqueName}`
  const isVideo = file.type?.startsWith('video/')

  return NextResponse.json({
    url,
    fullUrl: `https://sims.ai-gcc.com${url}`,
    filename: file.name,
    type: isVideo ? 'video' : 'image',
    size: buffer.length,
  })
}
