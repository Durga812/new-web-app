import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold text-gray-900">Checkout canceled</h1>
      <p className="text-base text-gray-600">
        Your payment was not completed. You can return to your cart to review your selections or try again.
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center justify-center rounded-full border border-amber-500 px-6 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
      >
        Return to courses
      </Link>
    </main>
  );
}
