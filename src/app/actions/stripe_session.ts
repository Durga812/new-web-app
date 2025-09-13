// src/app/actions/stripe_session.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import stripe from '@/lib/stripe/stripe_client';
import { getStripeIdByClerkId } from '@/lib/stripe/getStripeIdByClerkId';

interface CartItem {
  title: string;
  course_id?: string;
  bundle_id?: string;
  slug: string;
  enroll_id: string;
  price: number;
  kind: 'course' | 'bundle';
}

function toLineItem(item: CartItem) {
  const unitAmount = Math.round(item.price * 100); // Convert to cents
  
  return {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: unitAmount,
      product_data: {
        name: item.title,
        images: ["https://uutgcpvxpdgmnfdudods.supabase.co/storage/v1/object/public/Immigreat%20site%20assets/thumbnail.png"],
        metadata: {
          kind: item.kind,
          item_id: item.course_id || item.bundle_id || '',
          slug: item.slug || '',
          enroll_id: item.enroll_id || '',
        },
      },
    },
  };
}

export async function createStripeSession(cart: CartItem[], purchaseIntentId: string) {
  const { userId } = await auth();
  
if (!userId) {
    redirect('/sign-in?redirect=' + encodeURIComponent('/checkout'));
}

  try {
    // Get or create Stripe customer ID
    const stripeCustomerId = await getStripeIdByClerkId(userId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: userId,
      customer: stripeCustomerId,
      metadata: {
        clerk_id: userId,
        purchaseIntentId: purchaseIntentId,
      },
      line_items: cart.map(toLineItem),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    console.log('Created session:', session.id, 'URL:', session.url);
    console.log(session)
    
    if (!session.url) {
      throw new Error('Stripe session was created but no URL was returned');
    }
    
    redirect(session.url);
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    throw error;
  }
}