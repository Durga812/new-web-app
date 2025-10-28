// Refund policy configuration
export const REFUND_CONFIG = {
  COURSE_ELIGIBLE_DAYS: 3, // Refund window in days for individual courses
  BUNDLE_ELIGIBLE_DAYS: 6, // Refund window in days for bundles
  COURSE_SECTION_LIMIT: 2, // Maximum number of sections a learner can explore and remain eligible
  UNIT_PROGRESS_RATE_LIMIT: 0, // Maximum allowed progress in gated sections before becoming ineligible
  APPLY_PROCESSING_FEE: true, // Toggle to deduct payment processing fees from refunds
  PROCESSING_FEE_PERCENT: 0.04, // 4% processing fee

  // Email subject lines
  EMAIL_SUBJECTS: {
    REQUEST_CREATED: 'Refund Request Received',
    REFUND_PROCESSING: 'Your Refund is Being Processed',
    REFUND_COMPLETED: 'Refund Completed Successfully',
    REFUND_FAILED: 'Refund Request Issue',
  },
} as const;

export const REFUND_POLICY_URL = '/refund-policy'; // Update with your actual URL
