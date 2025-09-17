// src/components/my-purchases/BillingButton.tsx
'use client';

import { useTransition } from 'react';
import { goToBillingPortal } from '@/app/actions/my-purchases';
import { Receipt, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BillingPortalButton() {
  // useTransition is the recommended way to handle Server Action loading states
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    // startTransition wraps the server action call.
    // While the action is running, `isPending` will be true.
    startTransition(async () => {
      try {
        await goToBillingPortal();
      } catch (error) {
        // This catch block will run if the server action throws an error
        console.error(error);
        // You can update the UI here to show an error message to the user
        alert('Error: Could not redirect to billing portal.');
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      title="Open billing portal"
      className="group border-2 border-amber-300 bg-white hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-amber-700 hover:text-amber-800 hover:border-amber-400 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span className="animate-pulse">Redirecting to Billing...</span>
        </>
      ) : (
        <>
          <div className="relative mr-2">
            <Receipt className="w-4 h-4 transition-transform group-hover:scale-110" />
            <CreditCard className="w-4 h-4 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span aria-live="polite">My Billing</span>
        </>
      )}
    </Button>
  );
}