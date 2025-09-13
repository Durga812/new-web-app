// src/app/test/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createStripeSession } from '@/app/actions/stripe_session';

export default function TestPage() {
  const handleCheckout = async () => {
    // Mock cart data
    const mockCart = [
      {
        title: 'EB1A Extraordinary Ability Course',
        course_id: 'course123',
        slug: 'eb1a-extraordinary-ability',
        enroll_id: 'enroll_eb1a_123',
        price: 299,
        kind: 'course' as const,
      },
      {
        title: 'Complete EB1A Bundle',
        bundle_id: 'bundle456',
        slug: 'complete-eb1a-bundle',
        enroll_id: 'enroll_bundle_456',
        price: 999,
        kind: 'bundle' as const,
      },
    ];

    const purchaseIntentId = `intent_${Date.now()}`;

    try {
      await createStripeSession(mockCart, purchaseIntentId);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Stripe Checkout Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-8">
                Click the button below to test the Stripe checkout integration.
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Test Cart Items:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• EB1A Extraordinary Ability Course - $299</li>
                  <li>• Complete EB1A Bundle - $999</li>
                  <li><strong>Total: $1,298</strong></li>
                </ul>
              </div>

              <Button
                onClick={handleCheckout}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Checkout Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}