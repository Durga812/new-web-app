// src/app/actions/stripe_session.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import stripe from "@/lib/stripe/stripe_client";
import { getStripeIdByClerkId } from "@/lib/stripe/getStripeIdByClerkId";
import { supabase } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/stores/useCartStore";
import { getActiveEnrollmentsByClerkId } from "@/lib/data/purchase_data";

type ValidatedItem = CartItem & { price: number; original_price: number };

function computeDiscountPercent(courseCount: number): number {
  if (courseCount >= 30) return 30;
  if (courseCount >= 20) return 25;
  if (courseCount >= 10) return 20;
  if (courseCount >= 5) return 15;
  return 0;
}

async function normalizeCartPrices(
  items: CartItem[]
): Promise<{ normalized: ValidatedItem[]; duplicates: CartItem[] }> {
  const courseItems = items.filter((i) => i.product_type === "course");
  const bundleItems = items.filter((i) => i.product_type === "bundle");

  const courseIds = Array.from(new Set(courseItems.map((i) => i.product_id)));
  const bundleIds = Array.from(new Set(bundleItems.map((i) => i.product_id)));

  const [coursesRes, bundlesRes] = await Promise.all([
    courseIds.length
      ? supabase
          .from("courses")
          .select(
            `course_id, course_options(course_enroll_id,variant_code,price,original_price,currency)`
          )
          .in("course_id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    bundleIds.length
      ? supabase
          .from("bundles")
          .select("bundle_id, price, original_price")
          .in("bundle_id", bundleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (coursesRes.error || bundlesRes.error) {
    throw new Error(
      `Failed to fetch current prices: ${coursesRes.error?.message ?? ""} ${
        bundlesRes.error?.message ?? ""
      }`
    );
  }

  type CourseOptionRow = { course_enroll_id?: string; variant_code?: string; price?: number; original_price?: number; currency?: string };
  type CourseRow = { course_id: string; course_options?: CourseOptionRow[] };
  type BundleRow = { bundle_id: string; price?: number; original_price?: number };

  const coursesMap = new Map<string, CourseRow>(
    (coursesRes.data as CourseRow[]).map((c) => [c.course_id, c])
  );
  const bundlesMap = new Map<string, BundleRow>(
    (bundlesRes.data as BundleRow[]).map((b) => [b.bundle_id, b])
  );

  const normalized: ValidatedItem[] = items.map((i) => {
    if (i.product_type === "course") {
      const course = coursesMap.get(i.product_id);
      const match = course?.course_options?.find(
        (opt: CourseOptionRow) =>
          opt.course_enroll_id === i.product_enroll_id ||
          opt.variant_code === i.variant_code
      );
      const price = match?.price ?? i.price;
      const original_price = match?.original_price ?? i.original_price ?? price;
      const currency = match?.currency ?? i.currency ?? "USD";
      return { ...i, price, original_price, currency };
    } else {
      const bundle = bundlesMap.get(i.product_id);
      const price = bundle?.price ?? i.price ?? 0;
      const original_price = bundle?.original_price ?? i.original_price ?? price;
      return { ...i, price, original_price, currency: i.currency ?? "USD" };
    }
  });

  // No server-side duplicate detection at this stage; done separately using enrollments
  return { normalized, duplicates: [] };
}

function toStripeLineItem(item: ValidatedItem, discountPercentForCourses: number) {
  const isCourse = item.product_type === "course";
  const percent = isCourse ? discountPercentForCourses : 0;
  const discounted = Math.round(item.price * (1 - percent / 100));
  const unitAmount = Math.max(0, Math.round(discounted * 100)); // cents

  return {
    quantity: 1,
    price_data: {
      currency: (item.currency || "USD").toLowerCase(),
      unit_amount: unitAmount,
      product_data: {
        name: item.title,
        images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
        metadata: {
          item_type: item.product_type,
          item_id: item.product_id,
          slug: item.product_slug || "",
          enroll_id: item.product_enroll_id || "",
          variant_code: item.variant_code || "",
        },
      },
    },
  } as const;
}

export async function createStripeSession(cart: CartItem[], purchaseIntentId?: string) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect=" + encodeURIComponent("/"));
  }

  // Prevent purchasing what the user already owns
  const existing = await getActiveEnrollmentsByClerkId(userId!);
  const duplicates = cart.filter((i) =>
    existing.some(
      (e) => e.item_id === i.product_id && e.item_enroll_id === i.product_enroll_id
    )
  );
  if (duplicates.length) {
    throw new Error(
      `You already own: ${duplicates.map((d) => d.title).join(", ")}. Remove them from cart.`
    );
  }

  // Normalize latest prices
  const { normalized } = await normalizeCartPrices(cart);
  const courseCount = normalized.filter((i) => i.product_type === "course").length;
  const discountPercent = computeDiscountPercent(courseCount);

  const stripeCustomerId = await getStripeIdByClerkId(userId!);
  const line_items = normalized.map((i) => toStripeLineItem(i, discountPercent));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId!,
    customer: stripeCustomerId,
    metadata: {
      clerk_id: userId!,
      purchase_intent_id: purchaseIntentId || "",
      discount_applied_percent: String(discountPercent),
    },
    line_items,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!session.url) {
    throw new Error("Stripe session was created but no URL was returned");
  }
  // Let Next.js handle redirect by throwing the internal NEXT_REDIRECT.
  // Do not wrap in try/catch so it isn't logged as an error.
  redirect(session.url);

  try {
    
  } catch (error) {
    
  }
}
