import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/stripe_client';
import { unenrollFromLearnWorlds } from '@/lib/learnworlds/progress';
import { sendRefundEmail } from '@/app/actions/email';
import type Stripe from 'stripe';
import type { RefundProcessRequest, RefundItem } from '@/types/refund';
import type { OrderRecord, PurchasedOrderItem } from '@/types/order';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, refundReason }: RefundProcessRequest = await req.json();

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
    }

    // Step 1: Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('clerk_user_id', userId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Step 2: Get order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', enrollment.order_id)
      .single();

    const order = orderData as OrderRecord | null;

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Step 3: Find purchase item and amount
    const purchasedItem = order.purchased_items.find(
      (item: PurchasedOrderItem) => item.product_id === enrollment.product_id
    );

    if (!purchasedItem) {
      return NextResponse.json({ error: 'Purchase item not found' }, { status: 404 });
    }

    const refundAmountCents = Math.round(purchasedItem.price * 100);

    // Step 4: Process Stripe refund
    let stripeRefund: Stripe.Response<Stripe.Refund>;
    try {
      stripeRefund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: refundAmountCents,
        metadata: {
          enrollment_id: enrollmentId,
          product_id: enrollment.product_id,
          product_title: enrollment.product_title,
          clerk_user_id: userId,
        },
      });
    } catch (stripeError: unknown) {
      console.error('Stripe refund failed:', stripeError);
      const details =
        stripeError instanceof Error
          ? stripeError.message
          : typeof stripeError === 'string'
            ? stripeError
            : 'Unknown Stripe error';
      return NextResponse.json(
        { error: 'Refund processing failed', details },
        { status: 500 }
      );
    }

    // Step 5: Unenroll from LearnWorlds
    const unenrollResult = await unenrollFromLearnWorlds(
      order.customer_email,
      enrollment.enroll_id,
      enrollment.lw_product_type // ADD THIS PARAMETER
    );

    if (!unenrollResult.success) {
      console.error('LearnWorlds unenrollment failed:', unenrollResult.error);
      // Continue anyway - we'll handle this manually if needed
    }

    // Step 6: Update enrollment record
    const { error: updateEnrollmentError } = await supabase
      .from('enrollments')
      .update({
        status: 'refunded',
        refund_requested_at: new Date().toISOString(),
        refund_approved_at: new Date().toISOString(),
        refund_approved_by: userId,
        refund_reason: refundReason || 'User requested refund',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (updateEnrollmentError) {
      console.error('Failed to update enrollment:', updateEnrollmentError);
    }

    // Step 7: Update order record
    const refundedItems: RefundItem[] = order.refunded_items || [];
    refundedItems.push({
      product_id: enrollment.product_id,
      product_type: enrollment.product_type,
      product_title: enrollment.product_title,
      refund_amount: purchasedItem.price,
      refunded_at: new Date().toISOString(),
      enrollment_id: enrollmentId,
    });

    const totalRefunded = (order.refund_amount || 0) + purchasedItem.price;
    const allItemsRefunded = order.purchased_items.length === refundedItems.length;

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        refunded_items: refundedItems,
        refund_amount: totalRefunded,
        refunded_at: new Date().toISOString(),
        refund_reason: refundReason || 'User requested refund',
        refund_processed_by: userId,
        payment_status: allItemsRefunded ? 'refunded' : 'partially_refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateOrderError) {
      console.error('Failed to update order:', updateOrderError);
    }

    // Step 8: Send refund processing email
    await sendRefundEmail({
      email: order.customer_email,
      customerName: order.customer_name,
      productTitle: enrollment.product_title,
      refundAmount: purchasedItem.price,
      orderNumber: order.order_number,
      status: 'processing',
    });

    return NextResponse.json({
      success: true,
      refundId: stripeRefund.id,
      amount: purchasedItem.price,
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
