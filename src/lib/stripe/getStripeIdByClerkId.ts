// src/lib/stripe/getStripeIdByClerkId.ts
import 'server-only';
import stripe from './stripe_client';
import { supabase } from '@/lib/supabase/server';

/**
 * Ensures a Stripe customer exists for the given Clerk user.
 * - Checks users table for stripe_customer_id
 * - If missing, creates a new Stripe customer, updates the row
 * - Returns the stripe_customer_id
 */
export async function getStripeIdByClerkId(clerkId: string): Promise<string> {
  // 1. Lookup user in Supabase
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, stripe_customer_id')
    .eq('clerk_id', clerkId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }
  if (!user) {
    throw new Error(`User with Clerk ID ${clerkId} not found`);
  }

  // 2. Return existing Stripe customer if present
  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // 3. Build full name from first_name + last_name
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined;

  // 4. Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: fullName,
    metadata: { clerk_id: clerkId },
  });

  // 5. Update users table with new Stripe customer ID
  const { error: updateError } = await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', user.id);

  if (updateError) {
    throw new Error(`Failed to update user with Stripe ID: ${updateError.message}`);
  }

  return customer.id;
}
