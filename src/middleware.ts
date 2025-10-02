// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect specific app routes
const isProtectedRoute = createRouteMatcher([
  '/my-enrollments(.*)',  // Add this line
])

// Public API routes (no auth)
const isPublicApiRoute = createRouteMatcher([
  '/api/revalidate(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1) Allow public API routes
  if (isPublicApiRoute(req)) {
    return NextResponse.next()
  }

  // 2) Protect app pages that require auth
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // 3) Attach Clerk user id header for everything else
  const { userId } = await auth()
  const res = NextResponse.next()
  if (userId) res.headers.set('x-clerk-user-id', userId)
  return res
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}