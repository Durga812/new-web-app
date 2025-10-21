import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import MyOrdersClient from "./MyOrdersClient";
import type { OrderRecord } from "@/types/order";
import Link from "next/link";

type OrderRow = OrderRecord & {
  clerk_user_id: string;
};

export const metadata = {
  title: "My Orders - Immigreat.ai",
  description: "Review your purchase history, receipts, and refund activity.",
};

export default async function MyOrdersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/my-orders");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("paid_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch orders:", error);
    throw new Error("Unable to load your orders right now.");
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState />
    );
  }

  return (
    <MyOrdersClient orders={orders as OrderRow[]} />
  );
}

function EmptyState() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-gray-50 via-white to-amber-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6 border border-amber-100 bg-white/80 backdrop-blur rounded-3xl px-8 py-12 shadow-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
          <svg
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l1.6-8H5.4M7 13l-1.2 6h12.4M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">No purchases yet</h1>
          <p className="mt-2 text-sm text-gray-600">
            When you purchase a course or bundle, it will appear here along with your receipt and refund history.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  );
}
