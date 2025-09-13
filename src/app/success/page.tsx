import stripe from '@/lib/stripe/stripe_client';
import Stripe from 'stripe';
import Link from 'next/link';
import { ClearCartClient } from './ClearCartClient';

export const metadata = {
  title: 'Payment Success',
};

export default async function SuccessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const sessionId = typeof searchParams.session_id === 'string' ? searchParams.session_id : undefined;

  let summary: { sessionId?: string; paymentIntentId?: string; amount?: number; currency?: string; status?: string } = {};
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      summary = {
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as Stripe.PaymentIntent | null | undefined)?.id,
        amount: session.amount_total ?? undefined,
        currency: (session.currency || 'usd').toUpperCase(),
        status: session.payment_status || session.status || undefined,
      };
    } catch {
      // ignore — show minimal page
    }
  }

  const fmtAmount = (amt?: number, cur?: string) => {
    if (!amt) return '—';
    const v = (amt / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${cur ?? 'USD'} ${v}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <ClearCartClient />
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">Payment Successful</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you for your purchase!</h1>
        <p className="text-gray-600 mb-8">Your enrollment will be provisioned in moments. You can access your courses from My Purchases.</p>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 text-left mx-auto max-w-xl">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-gray-500">Checkout Session</div>
            <div className="font-medium break-all">{summary.sessionId ?? sessionId ?? '—'}</div>
            <div className="text-gray-500">Payment Intent</div>
            <div className="font-medium break-all">{summary.paymentIntentId ?? '—'}</div>
            <div className="text-gray-500">Amount</div>
            <div className="font-medium">{fmtAmount(summary.amount, summary.currency)}</div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium capitalize">{summary.status ?? 'paid'}</div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/my-purchases" className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow">Go to My Purchases</Link>
          <Link href="/courses" className="px-4 py-2 rounded-md border border-amber-300 text-amber-700 bg-white">Browse More Courses</Link>
        </div>
      </div>
    </div>
  );
}
