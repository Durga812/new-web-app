// src/lib/stripe/create-checkout-session.ts
'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';
import { supabase } from '@/lib/supabase/server';
import { calculateCartDiscounts, getItemDiscountRate } from '@/lib/pricing/discounts';
import stripe from '@/lib/stripe/stripe_client';
import type { CartItem } from '@/types/cart';

export type CheckoutSessionPayload = {
  items: CartItem[];
};

const formatCurrency = (value: number) => value.toFixed(2);

export const createCheckoutSession = async ({ items }: CheckoutSessionPayload) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('You must be signed in to start checkout.');
  }

  const user = await currentUser();
  const customerEmail = user?.primaryEmailAddress?.emailAddress;

  if (!items || items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  // Enrich cart items with database data
  const enrichedItems = await enrichCartItemsForCheckout(items);

  const discountSummary = calculateCartDiscounts(enrichedItems);
  const { discountRate, subtotal, discountAmount, total, currentTier } = discountSummary;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = enrichedItems.map(item => {
    const itemDiscountRate = getItemDiscountRate(item, discountRate);
    const baseCents = Math.round(item.price * 100);
    const discountedCents = Math.round(baseCents * (1 - itemDiscountRate));
    const appliedCents = Math.max(discountedCents, 0);
    const currency = (item.currency ?? 'USD').toLowerCase();
    const discountPercent = Math.round(itemDiscountRate * 100);

    const metadata: Record<string, string> = {
      item_title: item.title,
      product_id: item.productId,
      enroll_id: item.enrollId ?? '',
      product_type: item.type,
      lw_product_type: item.lwProductType ?? 'subscription',
      validity_duration: item.validityDuration?.toString() ?? '',
      validity_type: item.validityType ?? '',
      discounted_price: formatCurrency(appliedCents / 100),
      discount_percent: discountPercent.toString(),
      base_price: formatCurrency(baseCents / 100),
    };

    return {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: appliedCents,
        product_data: {
          name: item.title,
          images: item.imageUrl ? [item.imageUrl] : undefined,
          metadata,
        },
      },
    } satisfies Stripe.Checkout.SessionCreateParams.LineItem;
  });

  const nonZeroLineItems = lineItems.filter(item => Boolean(item.price_data?.unit_amount));

  if (nonZeroLineItems.length === 0) {
    throw new Error('Unable to prepare Stripe line items.');
  }

  if (nonZeroLineItems.length !== lineItems.length) {
    throw new Error('One or more items have an invalid price. Please update your cart and try again.');
  }

  const discountPercent = Math.round(discountRate * 100);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: userId,
    line_items: nonZeroLineItems,
    customer_email: customerEmail,
    metadata: {
      clerk_id: userId,
      discount_applied_percent: discountPercent.toString(),
      discount_tier_name: currentTier?.name || '', // Add tier name
      subtotal: formatCurrency(subtotal),
      discount_amount: formatCurrency(discountAmount),
      total: formatCurrency(total),
      item_count: items.length.toString(),
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!session.url) {
    throw new Error('Stripe session was created but no URL was returned');
  }

  redirect(session.url);
};

// Helper function to enrich cart items with database data
async function enrichCartItemsForCheckout(items: CartItem[]): Promise<CartItem[]> {
  const courseIds = items.filter(i => i.type === 'course').map(i => i.productId);
  const bundleIds = items.filter(i => i.type === 'bundle').map(i => i.productId);

  const enrichedItems: CartItem[] = [];

  // Fetch courses data
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('course_id, enroll_id, product_type, lw_product_type, title, pricing')
      .in('course_id', courseIds);

    for (const item of items.filter(i => i.type === 'course')) {
      const courseData = courses?.find(c => c.course_id === item.productId);
      if (courseData) {
        const pricingKey = item.pricingKey || 'price3';
        const pricingData = courseData.pricing?.[pricingKey];
        
        enrichedItems.push({
          ...item,
          enrollId: courseData.enroll_id,
          lwProductType: courseData.lw_product_type || 'subscription',
          title: courseData.title || item.title,
          validityDuration: pricingData?.validity_duration || item.validityDuration,
          validityType: pricingData?.validity_type || item.validityType,
        });
      } else {
        enrichedItems.push(item);
      }
    }
  }

  // Fetch bundles data
  if (bundleIds.length > 0) {
    const { data: bundles } = await supabase
      .from('bundles')
      .select('bundle_id, enroll_id, product_type, lw_product_type, title, pricing')
      .in('bundle_id', bundleIds);

    for (const item of items.filter(i => i.type === 'bundle')) {
      const bundleData = bundles?.find(b => b.bundle_id === item.productId);
      if (bundleData) {
        enrichedItems.push({
          ...item,
          enrollId: bundleData.enroll_id,
          lwProductType: bundleData.lw_product_type || 'bundle',
          title: bundleData.title || item.title,
          validityDuration: bundleData.pricing?.validity_duration || item.validityDuration,
          validityType: bundleData.pricing?.validity_type || item.validityType,
        });
      } else {
        enrichedItems.push(item);
      }
    }
  }

  return enrichedItems;
}