import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  // Allow CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return response
}

export const config = {
  matcher: '/api/:path*',
}
