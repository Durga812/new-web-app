// src/app/api/catalog/course-titles/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ids: unknown = body?.ids

    if (!Array.isArray(ids)) {
      return NextResponse.json({ courses: [] })
    }

    const normalizedIds = Array.from(
      new Set(
        ids
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value): value is string => Boolean(value))
      )
    )

    if (normalizedIds.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    const { data, error } = await supabase
      .from('courses')
      .select('course_id,title')
      .in('course_id', normalizedIds)

    if (error) {
      console.error('Failed to fetch course titles:', error)
      return NextResponse.json({ error: 'Failed to fetch course titles' }, { status: 500 })
    }

    return NextResponse.json({ courses: data ?? [] })
  } catch (error) {
    console.error('Unexpected error while fetching course titles:', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
