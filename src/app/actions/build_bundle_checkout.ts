// src/app/actions/build_bundle_checkout.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import stripe from "@/lib/stripe/stripe_client";
import { getStripeIdByClerkId } from "@/lib/stripe/getStripeIdByClerkId";
import { supabase } from "@/lib/supabase/server";
import { getActiveEnrollmentsByClerkId } from "@/lib/data/purchase_data";

export type BundleCourseSelectionInput = {
  course_id: string;
  course_slug?: string | null;
  title?: string | null;
  thumbnail_url?: string | null;
  variant_code?: string | null;
  course_enroll_id?: string | null;
};

type CourseOptionRow = {
  course_enroll_id?: string | null;
  variant_code?: string | null;
  price?: number | null;
  original_price?: number | null;
  currency?: string | null;
  validity?: number | null;
};

type CourseRow = {
  course_id: string;
  course_slug?: string | null;
  title?: string | null;
  urls?: { thumbnail_url?: string | null } | null;
  course_options?: CourseOptionRow[] | null;
};

type ValidatedBundleItem = {
  course_id: string;
  course_slug: string;
  title: string;
  thumbnail_url?: string;
  course_enroll_id: string;
  variant_code: string;
  price: number;
  original_price: number;
  currency: string;
};

export type BundleValidationResult = {
  items: ValidatedBundleItem[];
  purchasableItems: ValidatedBundleItem[];
  duplicates: ValidatedBundleItem[];
  discountPercent: number;
  tierName: string | null;
  subtotal: number;
  discountedSubtotal: number;
};

const BUNDLE_TIERS = [
  { name: "Extraordinary", minCourses: 40, discountPercent: 37 },
  { name: "Visionary", minCourses: 20, discountPercent: 25 },
  { name: "Leader", minCourses: 10, discountPercent: 16 },
  { name: "Foundation", minCourses: 5, discountPercent: 6 },
] as const;

const DEFAULT_VARIANT_CODE = "Standard";

function getBundleTier(courseCount: number) {
  return BUNDLE_TIERS.find((tier) => courseCount >= tier.minCourses) ?? null;
}

function coerceCurrency(currency?: string | null) {
  return (currency ?? "USD").toUpperCase();
}

function coerceNumber(value?: number | null, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

type OptionMatchParams = {
  preferredVariantCode?: string | null;
  preferredEnrollId?: string | null;
};

function findPreferredOption(
  row: CourseRow,
  params: OptionMatchParams
): CourseOptionRow | null {
  const options = row.course_options ?? [];
  if (!options.length) return null;

  const { preferredEnrollId, preferredVariantCode } = params;

  if (preferredEnrollId) {
    const exact = options.find(
      (opt) => opt.course_enroll_id && opt.course_enroll_id === preferredEnrollId
    );
    if (exact) return exact;
  }

  const effectiveVariantCode = preferredVariantCode ?? DEFAULT_VARIANT_CODE;
  const variantMatch = options.find(
    (opt) =>
      opt.variant_code &&
      opt.variant_code.toLowerCase() === effectiveVariantCode.toLowerCase()
  );
  if (variantMatch) return variantMatch;

  const twelveMonth = options.find((opt) => coerceNumber(opt.validity) === 12);
  if (twelveMonth) return twelveMonth;

  // Fall back to the option with the highest validity, else the first option.
  const sorted = [...options].sort(
    (a, b) => coerceNumber(b.validity) - coerceNumber(a.validity)
  );
  return sorted[0] ?? null;
}

async function fetchCourseRows(courseIds: string[]): Promise<Map<string, CourseRow>> {
  if (!courseIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("courses")
    .select(
      `course_id, course_slug, title, urls, course_options(course_enroll_id,variant_code,price,original_price,currency,validity)`
    )
    .in("course_id", courseIds);

  if (error) {
    throw new Error(`Failed to load courses: ${error.message}`);
  }

  const rows = (data ?? []) as CourseRow[];
  return new Map(rows.map((row) => [row.course_id, row]));
}

async function validateSelectionInternal(
  userId: string | null,
  selectedCourses: BundleCourseSelectionInput[],
  { includeDuplicates } = { includeDuplicates: true }
): Promise<BundleValidationResult> {
  if (!selectedCourses.length) {
    throw new Error("No courses selected for bundle checkout.");
  }

  const uniqueCourseIds = Array.from(
    new Set(selectedCourses.map((item) => item.course_id))
  );

  const coursesMap = await fetchCourseRows(uniqueCourseIds);

  const resolvedItems: ValidatedBundleItem[] = selectedCourses.map((selection) => {
    const row = coursesMap.get(selection.course_id);
    if (!row) {
      throw new Error(
        `Course ${selection.title ?? selection.course_id} is unavailable. Please refresh and try again.`
      );
    }

    const option = findPreferredOption(row, {
      preferredEnrollId: selection.course_enroll_id,
      preferredVariantCode: selection.variant_code,
    });

    if (!option) {
      throw new Error(
        `No pricing option found for ${row.title ?? selection.title ?? "course"}.`
      );
    }

    const course_enroll_id =
      option.course_enroll_id ?? option.variant_code ?? selection.course_enroll_id;

    if (!course_enroll_id) {
      throw new Error(
        `Course ${row.title ?? selection.title ?? ""} is missing enrollment metadata.`
      );
    }

    const title = row.title ?? selection.title ?? "Course";
    const course_slug = row.course_slug ?? selection.course_slug ?? "";
    const thumbnail_url =
      row.urls?.thumbnail_url ?? selection.thumbnail_url ?? undefined;

    const price = coerceNumber(option.price);
    if (price <= 0) {
      throw new Error(
        `Course ${title} has an invalid price configuration. Please contact support.`
      );
    }

    const original_price = Math.max(
      price,
      coerceNumber(option.original_price, price)
    );
    const currency = coerceCurrency(option.currency);

    return {
      course_id: selection.course_id,
      course_slug,
      title,
      thumbnail_url: thumbnail_url ?? undefined,
      course_enroll_id,
      variant_code: option.variant_code ?? selection.variant_code ?? DEFAULT_VARIANT_CODE,
      price,
      original_price,
      currency,
    };
  });

  let owned: ValidatedBundleItem[] = [];
  if (includeDuplicates && userId) {
    const activeEnrollments = await getActiveEnrollmentsByClerkId(userId);
    owned = resolvedItems.filter((item) =>
      activeEnrollments.some(
        (enrollment) =>
          enrollment.item_id === item.course_id &&
          enrollment.item_enroll_id === item.course_enroll_id
      )
    );
  }

  const purchasableItems = includeDuplicates
    ? resolvedItems.filter(
        (item) => !owned.some((dup) => dup.course_id === item.course_id && dup.course_enroll_id === item.course_enroll_id)
      )
    : resolvedItems;

  const subtotal = purchasableItems.reduce((sum, item) => sum + item.price, 0);
  const tier = getBundleTier(purchasableItems.length);
  const discountPercent = tier?.discountPercent ?? 0;

  const discountedSubtotal = purchasableItems.reduce((sum, item) => {
    const discounted = Math.round(item.price * (1 - discountPercent / 100));
    return sum + discounted;
  }, 0);

  return {
    items: resolvedItems,
    purchasableItems,
    duplicates: owned,
    discountPercent,
    tierName: tier?.name ?? null,
    subtotal,
    discountedSubtotal,
  };
}

export async function validateBuildYourBundleSelection(
  selectedCourses: BundleCourseSelectionInput[]
): Promise<BundleValidationResult> {
  const { userId } = await auth();
  return validateSelectionInternal(userId ?? null, selectedCourses);
}

function toStripeLineItem(item: ValidatedBundleItem, discountPercent: number) {
  const discounted = Math.max(0, Math.round(item.price * (1 - discountPercent / 100)));
  return {
    quantity: 1,
    price_data: {
      currency: item.currency.toLowerCase(),
      unit_amount: discounted * 100,
      product_data: {
        name: item.title,
        images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
        metadata: {
          item_type: "course",
          item_id: item.course_id,
          slug: item.course_slug,
          enroll_id: item.course_enroll_id,
          variant_code: item.variant_code,
          bundle_checkout: "true",
        },
      },
    },
  } as const;
}

export async function createBuildYourBundleSession(
  selectedCourses: BundleCourseSelectionInput[],
  purchaseIntentId?: string
) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect=" + encodeURIComponent("/"));
  }

  const {
    purchasableItems,
    duplicates,
    discountPercent,
    tierName,
  } = await validateSelectionInternal(userId!, selectedCourses);

  if (!purchasableItems.length) {
    throw new Error("No courses available for checkout. Please review your selection.");
  }

  if (purchasableItems.length < 5) {
    throw new Error("Select at least 5 courses to access bundle pricing.");
  }

  if (duplicates.length) {
    const ownedList = duplicates.map((item) => item.title).join(", ");
    throw new Error(`You already own: ${ownedList}. Remove them to continue.`);
  }

  const stripeCustomerId = await getStripeIdByClerkId(userId!);
  const line_items = purchasableItems.map((item) =>
    toStripeLineItem(item, discountPercent)
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId!,
    customer: stripeCustomerId,
    metadata: {
      clerk_id: userId!,
      purchase_intent_id: purchaseIntentId || "",
      discount_applied_percent: String(discountPercent),
      bundle_tier: tierName ?? "",
      bundle_course_count: String(purchasableItems.length),
    },
    line_items,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!session.url) {
    throw new Error("Stripe session was created but no URL was returned");
  }

  redirect(session.url);
}
