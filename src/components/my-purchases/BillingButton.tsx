'use client';

import { useTransition } from 'react';
import { goToBillingPortal } from '@/app/actions/my-purchases';
import { Receipt, Loader2 } from 'lucide-react';
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
      className="border-amber-300 text-amber-700 hover:bg-amber-50 focus-visible:ring-amber-500"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Receipt className="w-4 h-4 mr-2" />
      )}
      <span aria-live="polite">
        {isPending ? 'Redirecting to Billing...' : 'My Billing'}
      </span>
    </Button>
  );
}
