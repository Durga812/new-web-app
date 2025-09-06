import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const eventType = evt.type

    // Clerk user object lives in evt.data
    const { id, email_addresses, first_name, last_name } = (evt as any).data ?? {}
    const email: string =
      Array.isArray(email_addresses) && email_addresses[0]?.email_address

    if (eventType === 'user.created' || eventType === 'user.updated') {
      // Upsert to handle retries & updates safely
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            clerk_id: id,
            email,     
            first_name,
            last_name,
          },
          { onConflict: 'clerk_id' } // requires UNIQUE(clerk_id) in schema
        )

      if (error) {
        console.error('Supabase upsert error:', error)
        return new Response('Error saving user', { status: 500 })
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Bad signature', { status: 400 })
  }
}