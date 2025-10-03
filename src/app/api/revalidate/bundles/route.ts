// src/app/api/revalidate/bundles/route.ts
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-revalidate-secret')
    
    if (secret !== process.env.REVALIDATE_SECRET) {
        console.log(secret, process.env.REVALIDATE_SECRET);//testing .
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' }, 
        { status: 402 }
      )
    }

    // Revalidate all bundle-related caches
    revalidateTag('bundle')

    return NextResponse.json({ 
      ok: true, 
      message: 'All bundle caches revalidated',
      revalidatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Bundle revalidation error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}