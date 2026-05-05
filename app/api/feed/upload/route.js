// POST /api/feed/upload  (multipart "file") → { url } (admin only)
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { saveUpload } from '@/lib/storage'

const MAX_BYTES = 50 * 1024 * 1024  // 50 MB

export async function POST(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (50MB max)' }, { status: 413 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const url = await saveUpload(buf, file.name || 'upload')
  return NextResponse.json({ url })
}

export const config = {
  api: { bodyParser: false },
}
