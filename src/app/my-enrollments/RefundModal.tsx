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
      <DialogContent>
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
                <h4 className="font-semibold">{eligibility.details?.productTitle}</h4>
                <p className="text-sm text-gray-600">
                  Purchased: {new Date(eligibility.details?.purchaseDate || '').toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Progress: {eligibility.details?.progressPercent.toFixed(1)}%
                </p>
                <p className="mt-2 text-lg font-bold">
                  Refund Amount: ${eligibility.details?.refundAmount.toFixed(2)}
                </p>
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
