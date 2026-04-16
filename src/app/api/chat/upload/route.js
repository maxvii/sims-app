import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { persistBuffer } from '@/lib/chat-upload'

// Max total payload Next.js buffers — raise for video uploads
export const maxDuration = 120

// Accepts one or many files in the same multipart request.
//   Field "file"  — single file (back-compat)
//   Field "files" — multiple files (new; repeated)
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData
  try {
    formData = await req.formData()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 })
  }

  // Collect files from either "file" or "files[]"
  const files = []
  const single = formData.get('file')
  if (single && typeof single !== 'string') files.push(single)
  for (const entry of formData.getAll('files')) {
    if (entry && typeof entry !== 'string') files.push(entry)
  }
  if (files.length === 0) {
    return NextResponse.json({ error: 'No file(s) provided' }, { status: 400 })
  }

  const results = []
  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const res = await persistBuffer({
        buffer,
        originalName: file.name || 'upload',
        mimetype: file.type || 'application/octet-stream',
      })
      results.push(res)
    } catch (err) {
      results.push({ error: err?.message || 'Upload failed', filename: file.name })
    }
  }

  // Back-compat: if caller sent a single "file" field, return flat shape
  if (files.length === 1 && results[0] && !results[0].error) {
    return NextResponse.json(results[0])
  }
  return NextResponse.json({ uploads: results })
}
