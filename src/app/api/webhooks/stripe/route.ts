// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/stripe_client';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase/server';
import { learnWorldsService } from '@/lib/services/learnworlds.service';
import Stripe from 'stripe';

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
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('Checkout session completed:', session.id);
    console.log('Client reference ID (Clerk ID):', session.client_reference_id);
    console.log('Customer ID:', session.customer);
    console.log('Metadata:', session.metadata);
    
    console.log('Full session object:', session);
    try {
      const clerkUserId: string | undefined = session.client_reference_id || session.metadata?.clerk_id;
      const paymentIntentId: string | undefined = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id;
      const paymentSessionId: string = session.id;

      if (!clerkUserId) {
        console.error('Missing clerk user id on session');
        return NextResponse.json({ error: 'Missing clerk user id' }, { status: 400 });
      }

      // 0) Clear user's active cart just after webhook validation, before enrollments
      try {
        const { error: cartErr } = await supabase
          .from('cart_items')
          .delete()
          .match({ clerk_user_id: clerkUserId, is_active: true });
        if (cartErr) {
          console.warn('Could not clear cart_items for user:', cartErr.message);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Cart clear threw:', msg);
      }

      // 1) Idempotently create/update purchase order
      const totalAmount = session.amount_total ?? 0; // in cents
      const currency = (session.currency || 'USD').toUpperCase();
      const paymentStatus = session.payment_status || 'paid';

      // Try to find existing order for this payment_intent
      let existingOrderId: string | null = null;
      if (paymentIntentId) {
        const { data: existingOrder, error: findErr } = await supabase
          .from('purchase_orders')
          .select('id, status, enrollment_completed_at')
          .eq('payment_intent_id', paymentIntentId)
          .maybeSingle();
        if (findErr) {
          console.warn('Warning: purchase_orders lookup failed:', findErr.message);
        } else if (existingOrder) {
          existingOrderId = existingOrder.id;
          // If we already completed enrollments for this order, short-circuit to acknowledge
          if (existingOrder.enrollment_completed_at) {
            console.log('Purchase order already completed, skipping reprocessing:', existingOrderId);
            return NextResponse.json({ received: true, skipped: true });
          }
        }
      }

      // Insert if not found
      if (!existingOrderId) {
        const { data: order, error: insertErr } = await supabase
          .from('purchase_orders')
          .insert({
            clerk_user_id: clerkUserId,
            payment_session_id: paymentSessionId,
            payment_intent_id: paymentIntentId || null,
            status: paymentStatus === 'paid' ? 'success' : paymentStatus,
            enrollment_status: 'pending',
            total_amount: totalAmount,
            currency,
          })
          .select('id')
          .single();
        if (insertErr) {
          console.error('Failed to insert purchase order:', insertErr.message);
          return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
        }
        existingOrderId = order.id;
      }

      const purchaseOrderId = existingOrderId!;

      // 2) Load line items with product metadata (item_type, item_id, slug, enroll_id)
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      type LineItem = {
        description?: string | null;
        amount_total?: number | null; // cents
        price?: { product?: Stripe.Product | string } | null;
      };

      const items = (lineItems.data as LineItem[]).map((li) => {
        const prodRaw = li.price?.product;
        const product: Stripe.Product | undefined = prodRaw && typeof prodRaw !== 'string' ? (prodRaw as Stripe.Product) : undefined;
        const md = (product?.metadata ?? {}) as Record<string, string>;
        const itemType = (md.item_type as 'course' | 'bundle') || 'course';
        const itemId = md.item_id || '';
        const slug = md.slug || null;
        const enrollId = md.enroll_id || '';
        const variantCode = md.variant_code || '';
        const name = product?.name || li.description || 'Unknown';
        const priceCents = typeof li.amount_total === 'number' ? li.amount_total : 0;
        return {
          item_type: itemType,
          item_id: itemId,
          product_slug: slug,
          item_enroll_id: enrollId,
          variant_code: variantCode,
          item_name: name,
          price_cents: priceCents,
        };
      });

      // Persist purchased_items snapshot (best-effort)
      try {
        await supabase
          .from('purchase_orders')
          .update({
            purchased_items: items.map(it => ({
              item_type: it.item_type,
              item_id: it.item_id,
              product_slug: it.product_slug,
              item_enroll_id: it.item_enroll_id,
              variant_code: it.variant_code,
              item_name: it.item_name,
              price_cents: it.price_cents,
            })),
            purchase_metadata: session.metadata ?? null,
            enrollment_started_at: new Date().toISOString(),
          })
          .eq('id', purchaseOrderId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Unable to update purchased_items/purchase_metadata:', msg);
      }

      // 3) Ensure LearnWorlds user exists using Supabase user email/username
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, learnworlds_user_id')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (userErr || !userRow) {
        console.error('User lookup error for enrollment:', userErr?.message);
        // We still stored order; return 200 to prevent retries storm but log
        return NextResponse.json({ error: 'User not found for enrollment' }, { status: 200 });
      }

      const email = userRow.email as string | null;
      const username = [userRow.first_name, userRow.last_name].filter(Boolean).join(' ') || (email || '');
      if (!email) {
        console.error('User has no email, cannot enroll in LearnWorlds');
        return NextResponse.json({ error: 'Missing email for enrollment' }, { status: 200 });
      }

      // Create LW user if needed
      try {
        const lwUser = await learnWorldsService.ensureUserExists(email, username);
        // Attempt to save LearnWorlds ID if column exists
        if (lwUser?.id) {
          const { error: lwSaveErr } = await supabase
            .from('users')
            .update({ learnworlds_user_id: lwUser.id })
            .eq('id', userRow.id);
          if (lwSaveErr) {
            console.warn('Could not save learnworlds_user_id:', lwSaveErr.message);
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Failed ensuring LearnWorlds user:', msg);
        // We can proceed to attempt enrollment by email; LW API may still work
      }

      // 3a) Prepare validity maps for expiry calculation
      const now = new Date();
      const addMonths = (date: Date, months: number) => {
        const d = new Date(date.getTime());
        d.setMonth(d.getMonth() + months);
        return d;
      };

      const courseIds = Array.from(new Set(items.filter(i => i.item_type === 'course').map(i => i.item_id)));
      const bundleIds = Array.from(new Set(items.filter(i => i.item_type === 'bundle').map(i => i.item_id)));

      const courseOptionsByCourseId: Record<string, Array<{ course_enroll_id?: string; variant_code?: string; validity?: number }>> = {};
      const bundleValidityMap: Record<string, number | null> = {};

      if (courseIds.length) {
        const { data: coursesData, error: cErr } = await supabase
          .from('courses')
          .select('course_id, course_options(course_enroll_id, variant_code, validity)')
          .in('course_id', courseIds);
        if (cErr) {
          console.warn('Unable to fetch courses for validity:', cErr.message);
        } else {
          type CourseValidityRow = { course_id: string; course_options?: Array<{ course_enroll_id?: string; variant_code?: string; validity?: number }> };
          for (const c of (coursesData || []) as CourseValidityRow[]) {
            courseOptionsByCourseId[c.course_id] = c.course_options || [];
          }
        }
      }

      if (bundleIds.length) {
        const { data: bundlesData, error: bErr } = await supabase
          .from('bundles')
          .select('bundle_id, validity')
          .in('bundle_id', bundleIds);
        if (bErr) {
          console.warn('Unable to fetch bundles for validity:', bErr.message);
        } else {
          type BundleValidityRow = { bundle_id: string; validity?: number | null };
          for (const b of (bundlesData || []) as BundleValidityRow[]) {
            bundleValidityMap[b.bundle_id] = b.validity ?? null;
          }
        }
      }

      // 3b) Fetch any existing enrollments for this particular Stripe session to ensure idempotency
      // If Stripe retries the webhook, we will skip items we've already recorded for this session.
      const { data: existingEnrollmentsForSession, error: existingEnrollmentsErr } = await supabase
        .from('user_enrollment')
        .select('item_id,item_type')
        .eq('clerk_user_id', clerkUserId)
        .eq('payment_session_id', paymentSessionId);
      if (existingEnrollmentsErr) {
        console.warn('Could not load existing enrollments for session:', existingEnrollmentsErr.message);
      }
      type ExistingEnrollmentRow = { item_id: string; item_type: 'course' | 'bundle' };
      const skipKeys = new Set(
        ((existingEnrollmentsForSession || []) as ExistingEnrollmentRow[])
          .map((e) => `${e.item_type}:${e.item_id}`)
      );

      // If everything for this session is already recorded, we can safely acknowledge and exit
      const allItemKeys = new Set(items.map((it) => `${it.item_type}:${it.item_id}`));
      const allAlreadyRecorded = Array.from(allItemKeys).every(k => skipKeys.has(k));
      if (allAlreadyRecorded) {
        console.log('All items for session already recorded. Skipping processing.');
        return NextResponse.json({ received: true, skipped: true });
      }

      // 4) Enroll each item one-by-one, capture results, and store in user_enrollment
      let successCount = 0;
      const alreadyRecordedCount = skipKeys.size;
      for (const [index, it] of items.entries()) {
        // Idempotency guard: if we already wrote an enrollment row for this item in this session, skip re-processing
        const itemKey = `${it.item_type}:${it.item_id}`;
        if (skipKeys.has(itemKey)) {
          console.log('Skipping duplicate enrollment for session item:', itemKey);
          continue;
        }
        const justification = `Stripe purchase ${paymentIntentId || session.id} item#${index + 1}`;
        const priceMajor = Math.max(0, Math.round(it.price_cents) / 100);
        let enrollStatus: string = 'pending';
        // Compute validity months
        let validityMonths: number | null = null;
        let effectiveEnrollId: string = it.item_enroll_id || '';
        if (it.item_type === 'course') {
          const opts = courseOptionsByCourseId[it.item_id] || [];
          let match = opts.find(o => (o.course_enroll_id && it.item_enroll_id && o.course_enroll_id === it.item_enroll_id) || (o.variant_code && it.variant_code && o.variant_code === it.variant_code));
          // If not matched yet but we derived an effectiveEnrollId, try matching by it
          if (!match && effectiveEnrollId) {
            match = opts.find(o => o.course_enroll_id && o.course_enroll_id === effectiveEnrollId);
          }
          validityMonths = match?.validity ?? null;
          // If enroll_id was missing in metadata but variant_code matched, derive the correct LW enroll id
          if (!effectiveEnrollId && match?.course_enroll_id) {
            effectiveEnrollId = match.course_enroll_id;
          }
        } else if (it.item_type === 'bundle') {
          validityMonths = bundleValidityMap[it.item_id] ?? null;
        }
        const expiresAtSec = validityMonths && validityMonths > 0
          ? Math.floor(addMonths(now, validityMonths).getTime() / 1000)
          : null;
        try {
          const ok = await learnWorldsService.enrollUser(email, {
            productId: effectiveEnrollId || it.item_enroll_id, // Must be LW enroll id
            productType: it.item_type,
            justification,
            price: priceMajor,
            send_enrollment_email: true,
          });
          if (ok) {
            enrollStatus = 'success';
            successCount++;
          } else {
            enrollStatus = 'failed';
          }
        } catch {
          enrollStatus = 'failed';
        }

        // Insert enrollment row (best-effort). If duplicate, try update.
        const enrollmentRow: Record<string, unknown> = {
          clerk_user_id: clerkUserId,
          purchase_order_id: purchaseOrderId,
          payment_session_id: paymentSessionId,
          payment_intent_id: paymentIntentId || null,
          item_id: it.item_id,
          item_name: it.item_name,
          item_type: it.item_type,
          product_slug: it.product_slug,
          item_enroll_id: effectiveEnrollId || it.item_enroll_id || it.item_id, // fallback to product id to satisfy not-null
          enroll_status: enrollStatus, // keep under 50 chars as per schema
          expires_at: expiresAtSec,
          is_expired: expiresAtSec ? Date.now() / 1000 > expiresAtSec : false,
        };

        const { error: insertEnrollErr } = await supabase
          .from('user_enrollment')
          .insert(enrollmentRow);
        if (insertEnrollErr) {
          console.warn('Enrollment insert failed, attempting upsert-like update:', insertEnrollErr.message);
          // If schema allows, try update by unique composite (if any). Otherwise, ignore.
          try {
            await supabase
              .from('user_enrollment')
              .update(enrollmentRow)
              .match({
                clerk_user_id: clerkUserId,
                item_id: it.item_id,
                item_type: it.item_type,
              });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn('Enrollment update fallback failed:', msg);
          }
        }
      }

      // 5) Update order with enrollment summary (best-effort)
      const totalSuccessful = successCount + alreadyRecordedCount;
      const enrollSummary = totalSuccessful === items.length
        ? 'success'
        : totalSuccessful > 0
          ? 'partial'
          : 'failed';

      const { error: orderUpdateErr } = await supabase
        .from('purchase_orders')
        .update({ enrollment_status: enrollSummary, enrollment_completed_at: new Date().toISOString() })
        .eq('id', purchaseOrderId);
      if (orderUpdateErr) {
        // Column may not exist; log and continue
        console.warn('Could not update purchase_orders.enrollment_status:', orderUpdateErr.message);
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Stripe webhook post-processing error:', msg);
      // Always acknowledge to avoid repeated retries; monitoring should capture failures
    }
  }

  return NextResponse.json({ received: true });
}
