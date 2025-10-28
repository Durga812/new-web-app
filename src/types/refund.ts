export type RefundEligibilityCheck = {
  eligible: boolean;
  reason?: string;
  details?: {
    enrollmentId: string;
    productTitle: string;
    purchaseDate: string;
    daysElapsed: number;
    paidAmount: number;
    processingFeeApplied: boolean;
    processingFeePercent: number;
    processingFeeAmount: number;
    refundAmount: number;
  };
};

export type RefundProcessRequest = {
  enrollmentId: string;
  refundReason?: string;
};

export type RefundItem = {
  product_id: string;
  product_type: 'course' | 'bundle';
  product_title: string;
  refund_amount: number;
  refunded_at: string;
  enrollment_id: string;
};
