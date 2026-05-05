// Media uploads: Vercel Blob in prod, local FS in dev.
import { promises as fs } from 'fs'
import path from 'path'

export async function saveUpload(buffer, filename) {
  const safe = String(filename || 'upload').replace(/[^a-z0-9.\-_]/gi, '_')
  const stamped = `${Date.now()}-${safe}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`posts/${stamped}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: detectContentType(safe),
    })
    return blob.url
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', 'posts')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, stamped), buffer)
  return `/uploads/posts/${stamped}`
}

export function detectContentType(name) {
  const ext = String(name || '').toLowerCase().split('.').pop()
  return ({
    png:  'image/png',
    jpg:  'image/jpeg', jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
    svg:  'image/svg+xml',
    avif: 'image/avif',
    mp4:  'video/mp4',
    mov:  'video/quicktime',
    webm: 'video/webm',
  })[ext] || 'application/octet-stream'
}
