"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCartStore } from "@/stores/cart-store";

function SuccessContent() {
  const searchParams = useSearchParams();
  const loadCart = useCartStore(state => state.loadCart);
  const sessionId = searchParams.get("session_id");
  const itemCount = searchParams.get("items");

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    // Optimistically clear local cart state so the drawer empties immediately.
    useCartStore.setState({ items: [] });

    // Sync from the server right away and once more after a short delay in case the webhook is still running.
    void loadCart();
    const retryTimeout = setTimeout(() => {
      void loadCart();
    }, 2000);

    return () => {
      clearTimeout(retryTimeout);
    };
  }, [loadCart, sessionId]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold text-gray-900">Payment successful!</h1>
      <p className="text-base text-gray-600">
        Thanks for enrolling with Immigreat. Your receipt has been emailed and your courses will be ready shortly.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
      href={`/my-enrollments?purchased=recently&items=${itemCount}&ts=${Date.now()}`}
      className="inline-flex items-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition hover:opacity-90"
    >
      Go to My Enrollments
    </Link>
        <Link
          href="/courses"
          className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-orange-200/50 transition hover:opacity-90"
        >
          Browse more courses
        </Link>
      </div>
    </main>
  );
}

function SuccessFallback() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Finalizing your order…</h1>
      <p className="text-sm text-gray-600">Hang tight while we confirm your payment details.</p>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
