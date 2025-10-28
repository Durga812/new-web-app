'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { REFUND_POLICY_URL } from '@/lib/refund/constants';
import type { RefundEligibilityCheck } from '@/types/refund';

type RefundableEnrollment = {
  id: string;
};

type RefundModalProps = {
  enrollment: RefundableEnrollment;
  isOpen: boolean;
  onClose: () => void;
};

export function RefundModal({ enrollment, isOpen, onClose }: RefundModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'checking' | 'confirm' | 'processing' | 'success' | 'error'>('checking');
  const [eligibility, setEligibility] = useState<RefundEligibilityCheck | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formatCurrency = (amount: number) =>
    amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const details = eligibility?.details;
  const originalAmount = details?.originalAmount ?? 0;
  const processingFeeApplied = details?.processingFeeApplied ?? false;
  const processingFeePercent =
    typeof details?.processingFeePercent === 'number' ? details.processingFeePercent : 0;
  const processingFeePercentLabel = `${(processingFeePercent * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
  const processingFeeAmount = details?.processingFeeAmount ?? 0;
  const refundAmount = details?.refundAmount ?? 0;

  // Check eligibility when modal opens
  useEffect(() => {
    if (isOpen && step === 'checking') {
      checkEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  async function checkEligibility() {
    try {
      const response = await fetch('/api/refunds/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });

      const data: RefundEligibilityCheck = await response.json();
      setEligibility(data);

      if (data.eligible) {
        setStep('confirm');
      } else {
        setStep('error');
        setError(data.reason || 'Not eligible for refund');
      }
    } catch (error) {
      console.error('Failed to check refund eligibility:', error);
      setStep('error');
      setError('Failed to check eligibility');
    }
  }

  async function processRefund() {
    setStep('processing');

    try {
      const response = await fetch('/api/refunds/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          refundReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Refund processing failed');
      }

      setStep('success');
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to process refund:', error);
      setStep('error');
      setError('Failed to process refund. Please contact support.');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
          <DialogDescription>
            Review the details below before proceeding
          </DialogDescription>
        </DialogHeader>

        {step === 'checking' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2">Checking eligibility...</span>
          </div>
        )}

        {step === 'confirm' && eligibility?.eligible && (
          <>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-semibold">{details?.productTitle}</h4>
                <p className="text-sm text-gray-600">
                  Purchased: {new Date(details?.purchaseDate || '').toLocaleDateString()}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Original Amount</span>
                    <span>{formatCurrency(originalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>
                      Processing Fee ({processingFeePercentLabel})
                      {!processingFeeApplied && (
                        <span className="ml-1 text-xs text-gray-500">(waived)</span>
                      )}
                    </span>
                    <span>
                      {formatCurrency(processingFeeApplied ? -processingFeeAmount : 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                    <span>Refund Total</span>
                    <span>{formatCurrency(refundAmount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Reason for refund (optional)</label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Let us know why you are requesting a refund..."
                  className="mt-1"
                />
              </div>

              <Alert>
                <AlertDescription>
                  The refund will be processed to your original payment method within 5-10 business days.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={processRefund}>
                Confirm Refund
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2">Processing refund...</span>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-semibold">Refund Submitted!</h3>
            <p className="mt-2 text-sm text-gray-600">
              Your refund is being processed. You will receive a confirmation email shortly.
            </p>
          </div>
        )}

        {step === 'error' && (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button asChild>
                <a href={REFUND_POLICY_URL} target="_blank">
                  View Refund Policy
                </a>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
