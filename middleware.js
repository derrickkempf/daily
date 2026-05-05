// CORS for /api/* — permissive for dev, lock down in prod via env.
import { NextResponse } from 'next/server'

const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export function middleware(request) {
  const origin = request.headers.get('origin') || ''
  const allowed = !origin
    || ALLOWED.length === 0
    || ALLOWED.includes(origin)
    || origin.endsWith('.vercel.app')

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(allowed ? origin : ''),
    })
  }

  const response = NextResponse.next()
  for (const [k, v] of Object.entries(corsHeaders(allowed ? origin : ''))) {
    response.headers.set(k, v)
  }
  return response
}

export const config = { matcher: '/api/:path*' }
