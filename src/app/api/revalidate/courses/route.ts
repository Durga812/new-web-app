import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  const secret = req.headers.get('x-revalidate-secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag('course')
  return NextResponse.json({ ok: true, tags: ['course'] })
}
