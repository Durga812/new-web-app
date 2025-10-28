import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';
import { checkCourseSectionLimit, fetchUserCourseSectionProgressMap } from '@/lib/learnworlds/progress';
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

    // Step 5: Determine product-specific refund window
    const isCourse = enrollment.product_type === 'course';
    const isBundle = enrollment.product_type === 'bundle';
    const eligibleDaysLimit = isBundle
      ? REFUND_CONFIG.BUNDLE_ELIGIBLE_DAYS
      : REFUND_CONFIG.COURSE_ELIGIBLE_DAYS;

    const describeSection = (
      sectionLimit: number,
      section?: { sectionIndex?: number; sectionName?: string | null }
    ) => {
      if (!section || typeof section.sectionIndex !== 'number') {
        return `section ${sectionLimit + 1} or later`;
      }

      const base = `section ${section.sectionIndex}`;
      return section.sectionName ? `${base} (${section.sectionName})` : base;
    };

    const purchaseDate = new Date(order.paid_at);
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysElapsed > eligibleDaysLimit) {
      return NextResponse.json({
        eligible: false,
        reason: `Refund requests for ${isBundle ? 'bundles' : 'courses'} must be made within ${eligibleDaysLimit} days of purchase. Your purchase was ${daysElapsed} days ago.`,
      } as RefundEligibilityCheck);
    }

    // Step 6: Enforce LearnWorlds section-level eligibility rules
    if (isCourse) {
      const sectionCheck = await checkCourseSectionLimit({
        email: order.customer_email,
        courseEnrollId: enrollment.enroll_id,
        sectionLimit: REFUND_CONFIG.COURSE_SECTION_LIMIT,
        unitProgressRateLimit: REFUND_CONFIG.UNIT_PROGRESS_RATE_LIMIT,
      });

      if (sectionCheck.success && sectionCheck.exceededLimit) {
        const sectionDescription = describeSection(
          REFUND_CONFIG.COURSE_SECTION_LIMIT,
          sectionCheck.violatingSection
        );

        return NextResponse.json({
          eligible: false,
          reason: `Refunds are only available before exploring beyond section ${REFUND_CONFIG.COURSE_SECTION_LIMIT}. Your LearnWorlds progress shows activity in ${sectionDescription}.`,
        } as RefundEligibilityCheck);
      }

      if (!sectionCheck.success) {
        console.warn(
          'Could not verify section-based eligibility, allowing refund request:',
          sectionCheck.error
        );
      }
    } else if (isBundle) {
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .select('lw_bundle_children')
        .eq('bundle_id', enrollment.product_id)
        .maybeSingle();

      if (bundleError) {
        console.error('Failed to fetch bundle metadata for refund eligibility:', bundleError);
      }

      const bundleChildren =
        (bundleData?.lw_bundle_children as Record<string, unknown> | null) ?? {};

      const childEntries = Object.entries(bundleChildren)
        .map(([courseId, lwChildEnrollId]) => ({
          courseId,
          enrollId: typeof lwChildEnrollId === 'string' ? lwChildEnrollId.trim() : '',
        }))
        .filter(({ enrollId }) => enrollId.length > 0);

      if (childEntries.length > 0) {
        const courseEnrollIds = Array.from(
          new Set(
            childEntries
              .map(({ enrollId }) => enrollId)
              .filter((enrollId) => enrollId.length > 0)
          )
        );

        const preloadedSections = await fetchUserCourseSectionProgressMap({
          email: order.customer_email,
          courseIds: courseEnrollIds,
        });

        const sectionChecks = await Promise.all(
          childEntries.map(async ({ courseId, enrollId }) => {
            const result = await checkCourseSectionLimit({
              email: order.customer_email,
              courseEnrollId: enrollId,
              sectionLimit: REFUND_CONFIG.COURSE_SECTION_LIMIT,
              unitProgressRateLimit: REFUND_CONFIG.UNIT_PROGRESS_RATE_LIMIT,
              sectionsOverride: preloadedSections.get(enrollId),
            });

            return { courseId, result };
          })
        );

        for (const entry of sectionChecks) {
          const { result, courseId } = entry;

          if (result.success && result.exceededLimit) {
            const sectionDescription = describeSection(
              REFUND_CONFIG.COURSE_SECTION_LIMIT,
              result.violatingSection
            );
            const courseLabel = courseId || 'one of the bundle courses';

            return NextResponse.json({
              eligible: false,
              reason: `Bundle refunds are only available before exploring beyond section ${REFUND_CONFIG.COURSE_SECTION_LIMIT} of any included course. We detected activity in ${courseLabel} - ${sectionDescription}.`,
            } as RefundEligibilityCheck);
          }

          if (!result.success) {
            console.warn(
              `Could not verify section-based eligibility for bundle course ${courseId}, allowing refund request:`,
              result.error
            );
          }
        }
      }
    }

    // Step 7: Find purchase price from order
    const purchasedItem = order.purchased_items.find(
      (item: PurchasedOrderItem) => item.product_id === enrollment.product_id
    );

    if (!purchasedItem) {
      return NextResponse.json({ error: 'Purchase item not found' }, { status: 404 });
    }

    const processingFeeApplied = REFUND_CONFIG.APPLY_PROCESSING_FEE === true;
    const processingFeePercent = REFUND_CONFIG.PROCESSING_FEE_PERCENT ?? 0;
    const originalAmountCents = Math.round((purchasedItem.price ?? 0) * 100);
    const processingFeeCents = processingFeeApplied
      ? Math.round(originalAmountCents * processingFeePercent)
      : 0;
    const refundAmountCents = Math.max(0, originalAmountCents - processingFeeCents);

    const originalAmount = Number((originalAmountCents / 100).toFixed(2));
    const processingFeeAmount = Number((processingFeeCents / 100).toFixed(2));
    const refundAmount = Number((refundAmountCents / 100).toFixed(2));

    // Step 8: Return eligible response
    return NextResponse.json({
      eligible: true,
      details: {
        enrollmentId: enrollment.id,
        productTitle: enrollment.product_title,
        purchaseDate: order.paid_at,
        daysElapsed,
        originalAmount,
        processingFeeApplied,
        processingFeePercent,
        processingFeeAmount,
        refundAmount,
      },
    } as RefundEligibilityCheck);

  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
