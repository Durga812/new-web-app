// Refund policy configuration
export const REFUND_CONFIG = {
  ELIGIBLE_DAYS: 3, // Refund window in days
  MAX_PROGRESS_PERCENT: 25, // Maximum progress allowed for refund eligibility
  
  // Email subject lines
  EMAIL_SUBJECTS: {
    REQUEST_CREATED: 'Refund Request Received',
    REFUND_PROCESSING: 'Your Refund is Being Processed',
    REFUND_COMPLETED: 'Refund Completed Successfully',
    REFUND_FAILED: 'Refund Request Issue',
  },
} as const;

export const REFUND_POLICY_URL = '/refund-policy'; // Update with your actual URL