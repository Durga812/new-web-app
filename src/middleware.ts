import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect only specific app routes
const isProtectedRoute = createRouteMatcher(['/my-purchases(.*)'])

// Public API routes (no auth)
const isPublicApiRoute = createRouteMatcher([
  '/api/revalidate(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Allow public API routes and all other matched APIs without auth work
  if (isPublicApiRoute(req)) return NextResponse.next()

  // Protect app pages that require auth
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // For everything else, do nothing to preserve static/ISR caching
  return NextResponse.next()
})

// Narrow matcher so public pages (course/bundle) skip middleware entirely
export const config = {
  matcher: [
    '/my-purchases(.*)',
    '/(api|trpc)(.*)',
  ],
}
