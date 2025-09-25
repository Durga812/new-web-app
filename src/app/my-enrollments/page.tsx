import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { supabase } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CalendarClock, ShoppingBag } from "lucide-react";

type UserEnrollmentRow = {
  id: number;
  clerk_id: string;
  item_title: string;
  product_id: string;
  enroll_id: string;
  product_type: string | null;
  cart_item_type: string | null;
  validity_duration: number | null;
  validity_type: string | null;
  price: number | string | null;
  is_active: boolean | null;
  enrollment_status: string;
  created_at: string | null;
  updated_at: string | null;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const formatValidity = (duration: number | null, type: string | null) => {
  if (!duration || !type) return null;
  const normalizedType = duration === 1 ? type : `${type}${type.endsWith("s") ? "" : "s"}`;
  return `${duration} ${normalizedType}`;
};

const normalizePrice = (price: number | string | null | undefined) => {
  if (typeof price === "number") return price;
  if (typeof price === "string") {
    const parsed = Number.parseFloat(price);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default async function MyEnrollmentsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/my-enrollments");
  }

  const { data, error } = await supabase
    .from("user_enrollments_test")
    .select("*")
    .eq("clerk_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load user enrollments", { userId, error });
    throw new Error("We could not load your enrollments. Please try again later.");
  }

  const enrollments = (data ?? []) as UserEnrollmentRow[];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">My enrollments</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Access every program you have purchased. Select a card to open the course in LearnWorlds.
          </p>
        </div>
        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
          <ShoppingBag className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          {enrollments.length} {enrollments.length === 1 ? "enrollment" : "enrollments"}
        </Badge>
      </header>

      {enrollments.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-8 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">You have not enrolled in any programs yet</h2>
            <p className="text-sm text-gray-600">Browse the catalog and add courses to your cart to see them listed here.</p>
          </div>
          <Button asChild variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100/80">
            <Link href="/courses">Explore courses</Link>
          </Button>
        </section>
      ) : (
        <section className="space-y-4">
          {enrollments.map(enrollment => {
            const price = normalizePrice(enrollment.price);
            const formattedPrice = priceFormatter.format(price);
            const purchaseDate = enrollment.created_at ? dateFormatter.format(new Date(enrollment.created_at)) : null;
            const validity = formatValidity(enrollment.validity_duration, enrollment.validity_type);
            const status = enrollment.enrollment_status?.toLowerCase() === "success" ? "success" : "fail";
            const statusBadgeClass =
              status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-600";
            const statusLabel = status === "success" ? "Enrolled" : "Attention needed";
            const programUrl = enrollment.enroll_id
              ? `https://courses.greencardiy.com/program/${encodeURIComponent(enrollment.enroll_id)}`
              : null;

            return (
              <article
                key={enrollment.id}
                className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-sm backdrop-blur-sm transition hover:shadow-lg sm:p-8"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusBadgeClass}>{statusLabel}</Badge>
                      {enrollment.cart_item_type && (
                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                          {enrollment.cart_item_type === "bundle" ? "Bundle" : "Course"}
                        </Badge>
                      )}
                      {enrollment.product_type && (
                        <Badge variant="outline" className="border-gray-200 text-gray-600">
                          {enrollment.product_type}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{enrollment.item_title}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {purchaseDate && (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4" aria-hidden="true" />
                            Purchased on {purchaseDate}
                          </span>
                        )}
                        {validity && <span className="inline-flex items-center gap-1.5">Access: {validity}</span>}
                        {enrollment.is_active === false && <span className="text-red-500">Inactive</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-4 sm:items-end">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-amber-600 sm:text-2xl">{formattedPrice}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Order #{enrollment.id}</p>
                    </div>

                    <Button
                      asChild
                      variant="default"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                      disabled={!programUrl || status !== "success"}
                    >
                      {programUrl ? (
                        <Link href={programUrl} prefetch={false}>
                          Continue to program
                          <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Continue to program
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
