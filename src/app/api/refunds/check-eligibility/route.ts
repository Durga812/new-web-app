import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';
import { getCourseProgress } from '@/lib/learnworlds/progress';
import { REFUND_CONFIG } from '@/lib/refund/constants';
import type { RefundEligibilityCheck } from '@/types/refund';
import type { OrderRecord, PurchasedOrderItem } from '@/types/order';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId } = await req.json();

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
    }

    // Step 1: Get enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('clerk_user_id', userId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Step 2: Check if already refunded
    if (enrollment.status === 'refunded') {
      return NextResponse.json({
        eligible: false,
        reason: 'This item has already been refunded.',
      } as RefundEligibilityCheck);
    }

    // Step 3: Check if enrollment is active
    if (enrollment.enrollment_status !== 'success' || enrollment.status !== 'active') {
      return NextResponse.json({
        eligible: false,
        reason: 'Only active enrollments are eligible for refunds.',
      } as RefundEligibilityCheck);
    }

    // Step 4: Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', enrollment.order_id)
      .single();

    const order = orderData as OrderRecord | null;

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Step 5: Check refund window (30 days from purchase)
    const purchaseDate = new Date(order.paid_at);
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysElapsed > REFUND_CONFIG.ELIGIBLE_DAYS) {
      return NextResponse.json({
        eligible: false,
        reason: `Refund requests must be made within ${REFUND_CONFIG.ELIGIBLE_DAYS} days of purchase. Your purchase was ${daysElapsed} days ago.`,
      } as RefundEligibilityCheck);
    }

    // Step 6: Check course progress from LearnWorlds
    const progressResult = await getCourseProgress(order.customer_email, enrollment.enroll_id);

    // If progress check fails, allow refund but log the issue
    let progressPercent = 0;
    if (progressResult.success && progressResult.progress !== null) {
      progressPercent = progressResult.progress;
      
      if (progressPercent > REFUND_CONFIG.MAX_PROGRESS_PERCENT) {
        return NextResponse.json({
          eligible: false,
          reason: `Refunds are only available for courses with less than ${REFUND_CONFIG.MAX_PROGRESS_PERCENT}% progress. Your progress is ${progressPercent.toFixed(1)}%.`,
        } as RefundEligibilityCheck);
      }
    } else {
      console.warn('Could not fetch progress, allowing refund request:', progressResult.error);
    }

    // Step 7: Find purchase price from order
    const purchasedItem = order.purchased_items.find(
      (item: PurchasedOrderItem) => item.product_id === enrollment.product_id
    );

    if (!purchasedItem) {
      return NextResponse.json({ error: 'Purchase item not found' }, { status: 404 });
    }

    // Step 8: Return eligible response
    return NextResponse.json({
      eligible: true,
      details: {
        enrollmentId: enrollment.id,
        productTitle: enrollment.product_title,
        purchaseDate: order.paid_at,
        daysElapsed,
        progressPercent,
        refundAmount: purchasedItem.price,
      },
    } as RefundEligibilityCheck);

  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
