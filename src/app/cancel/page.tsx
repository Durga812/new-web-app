import stripe from '@/lib/stripe/stripe_client';
import Stripe from 'stripe';
import Link from 'next/link';

export const metadata = {
  title: 'Payment Canceled',
};

export default async function CancelPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === 'string' ? sp.session_id : undefined;
  let details: { sessionId?: string; paymentIntentId?: string; amount?: number; currency?: string; status?: string } = {};
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      details = {
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as Stripe.PaymentIntent | null | undefined)?.id,
        amount: session.amount_total ?? undefined,
        currency: (session.currency || 'usd').toUpperCase(),
        status: session.status || session.payment_status || undefined,
      };
    } catch {}
  }

  const fmtAmount = (amt?: number, cur?: string) => {
    if (!amt) return '—';
    const v = (amt / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${cur ?? 'USD'} ${v}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">Payment Canceled</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your payment was not completed</h1>
        <p className="text-gray-600 mb-8">You can resume checkout anytime or adjust your cart.</p>

        {sessionId && (
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 text-left mx-auto max-w-xl">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-gray-500">Checkout Session</div>
              <div className="font-medium break-all">{details.sessionId ?? sessionId}</div>
              <div className="text-gray-500">Payment Intent</div>
              <div className="font-medium break-all">{details.paymentIntentId ?? '—'}</div>
              <div className="text-gray-500">Amount</div>
              <div className="font-medium">{fmtAmount(details.amount, details.currency)}</div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium capitalize">{details.status ?? 'canceled'}</div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/courses" className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700">Review Cart</Link>
          <Link href="/bundles" className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow">Browse Bundles</Link>
        </div>
      </div>
    </div>
  );
}
