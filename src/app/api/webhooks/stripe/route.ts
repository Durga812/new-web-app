// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/stripe_client';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
 console.log('Received Stripe event:', event.type);
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    console.log('Checkout session completed:', session.id);
    console.log('Client reference ID (Clerk ID):', session.client_reference_id);
    console.log('Customer ID:', session.customer);
    console.log('Metadata:', session.metadata);
    
    console.log('Full session object:', session);
    // TODO: Handle successful payment
    // - Create enrollment records
    // - Send confirmation emails
    // - Update user purchase history
  }

  return NextResponse.json({ received: true });
}