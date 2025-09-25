// src/app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe/stripe_client";
import { supabase } from "@/lib/supabase/server";

const LEARNWORLDS_BASE_URL = process.env.LEARNWORLDS_BASE_URL ?? "https://courses.greencardiy.com";
const LEARNWORLDS_API_TOKEN = process.env.LEARNWORLDS_API_TOKEN;
const LEARNWORLDS_CLIENT_ID = process.env.LEARNWORLDS_CLIENT_ID;
const parsedDelay = Number.parseInt(
  process.env.LEARNWORLDS_API_DELAY_MS ?? process.env.LEARNWORLDS_ENROLL_DELAY_MS ?? "500",
  10,
);
const LEARNWORLDS_API_DELAY_MS = Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : 500;

type LearnWorldsEnrollment = {
  productId: string;
  productType: string;
  price: number;
  duration_type?: string;
  duration?: number;
};

type SupabaseEnrollmentBase = {
  clerk_id: string;
  item_title: string;
  product_id: string;
  enroll_id: string;
  product_type: string | null;
  cart_item_type: string | null;
  validity_duration: number | null;
  validity_type: string | null;
  price: number;
};

type SupabaseEnrollmentInsert = SupabaseEnrollmentBase & {
  enrollment_status: "success" | "fail";
};

type ProcessedEnrollment = {
  lineItemId: string;
  learnWorlds: LearnWorldsEnrollment;
  supabaseRecord: SupabaseEnrollmentBase | null;
};

const hasLearnWorldsConfig = Boolean(LEARNWORLDS_API_TOKEN && LEARNWORLDS_CLIENT_ID);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const normalized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };

    if (error.stack) {
      normalized.stack = error.stack;
    }

    if ("cause" in error && error.cause) {
      normalized.cause = (error as Error & { cause?: unknown }).cause;
    }

    return normalized;
  }

  if (typeof error === "object" && error !== null) {
    return error as Record<string, unknown>;
  }

  return { message: String(error) };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", normalizeError(error));
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Stripe checkout completed", {
      id: session.id,
      customer: session.customer,
      email: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
    });

    try {
      await processLearnWorldsEnrollment(session);
    } catch (error) {
      console.error("Failed to process LearnWorlds enrollment", {
        sessionId: session.id,
        error: normalizeError(error),
      });
    }
  } else {
    console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function processLearnWorldsEnrollment(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email?.toLowerCase();

  if (!email) {
    console.error("Cannot process LearnWorlds enrollment without customer email", {
      sessionId: session.id,
    });
    return;
  }

  const clerkId = typeof session.client_reference_id === "string" && session.client_reference_id.length > 0
    ? session.client_reference_id
    : typeof session.metadata?.clerk_id === "string" && session.metadata.clerk_id.length > 0
      ? session.metadata.clerk_id
      : null;

  if (!clerkId) {
    console.warn("Stripe session missing Clerk user identifier; Supabase record will not include user reference", {
      sessionId: session.id,
    });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
    limit: 100,
  });

  const processedEnrollments = lineItems.data.flatMap<ProcessedEnrollment>(item => {
    const product = item.price?.product as Stripe.Product | Stripe.DeletedProduct | string | null | undefined;

    if (!product || typeof product !== "object") {
      console.warn("Missing product information for Stripe line item; skipping", {
        sessionId: session.id,
        lineItemId: item.id,
      });
      return [];
    }

    if ("deleted" in product && product.deleted) {
      console.warn("Stripe product is deleted; skipping line item", {
        sessionId: session.id,
        lineItemId: item.id,
      });
      return [];
    }

    const metadata = product.metadata ?? {};

    const enrollId = metadata.enroll_id || metadata.product_id || metadata.item_id;
    if (!enrollId) {
      console.warn("Missing enroll_id in product metadata; skipping item", {
        sessionId: session.id,
        lineItemId: item.id,
      });
      return [];
    }

    const productId = metadata.product_id || enrollId;
    const productType = metadata.product_type || metadata.cart_item_type || "subscription";
    const cartItemType = metadata.cart_item_type || null;
    const durationRaw = typeof metadata.validity_duration === "string" ? metadata.validity_duration.trim() : "";
    const parsedDuration = durationRaw ? Number.parseInt(durationRaw, 10) : NaN;
    const validityDuration = Number.isNaN(parsedDuration) ? null : parsedDuration;
    const validityTypeRaw = typeof metadata.validity_type === "string" ? metadata.validity_type.trim() : "";
    const validityType = validityTypeRaw || null;
    const metadataPrice = typeof metadata.discounted_price === "string" ? Number.parseFloat(metadata.discounted_price) : NaN;
    const linePrice = typeof item.amount_total === "number" ? item.amount_total / 100 : NaN;
    const resolvedPrice = Number.isFinite(metadataPrice) ? metadataPrice : Number.isFinite(linePrice) ? linePrice : 0;
    const normalizedPrice = Number.isFinite(resolvedPrice) ? Number(resolvedPrice.toFixed(2)) : 0;
    const itemTitleFromMetadata = typeof metadata.item_title === "string" ? metadata.item_title.trim() : "";
    const itemTitle = itemTitleFromMetadata || product.name || item.description || enrollId;

    const learnWorlds: LearnWorldsEnrollment = {
      productId: enrollId,
      productType,
      price: normalizedPrice,
    };

    if (productType === "subscription") {
      if (validityType && typeof validityDuration === "number" && validityDuration > 0) {
        learnWorlds.duration_type = validityType;
        learnWorlds.duration = validityDuration;
      } else if (validityType) {
        console.warn("Subscription item missing valid duration; sending duration_type only", {
          sessionId: session.id,
          lineItemId: item.id,
        });
        learnWorlds.duration_type = validityType;
      }
    }

    const supabaseRecord: SupabaseEnrollmentBase | null = clerkId
      ? {
          clerk_id: clerkId,
          item_title: itemTitle,
          product_id: productId,
          enroll_id: enrollId,
          product_type: productType || null,
          cart_item_type: cartItemType,
          validity_duration: validityDuration,
          validity_type: validityType,
          price: normalizedPrice,
        }
      : null;

    return [
      {
        lineItemId: item.id,
        learnWorlds,
        supabaseRecord,
      },
    ];
  });

  if (processedEnrollments.length === 0) {
    console.warn("No enrollments derived from Stripe session", {
      sessionId: session.id,
    });
    return;
  }

  const shouldSyncWithLearnWorlds = hasLearnWorldsConfig;
  if (!shouldSyncWithLearnWorlds) {
    console.warn("LearnWorlds credentials missing; skipping remote enrollment sync", {
      sessionId: session.id,
    });
  }

  let learnWorldsReady = shouldSyncWithLearnWorlds;

  if (shouldSyncWithLearnWorlds) {
    try {
      const existingUser = await findLearnWorldsUser(email);

      if (!existingUser) {
        await createLearnWorldsUser(email);
      }
    } catch (error) {
      learnWorldsReady = false;
      console.error("LearnWorlds user preparation failed", {
        email,
        sessionId: session.id,
        error: normalizeError(error),
      });
    }
  }

  for (const enrollment of processedEnrollments) {
    let status: "success" | "fail" = learnWorldsReady || !shouldSyncWithLearnWorlds ? "success" : "fail";

    if (learnWorldsReady) {
      try {
        await enrollLearnWorldsProduct(email, enrollment.learnWorlds);
      } catch (error) {
        status = "fail";
        console.error("LearnWorlds enrollment failed", {
          email,
          sessionId: session.id,
          lineItemId: enrollment.lineItemId,
          error: normalizeError(error),
        });
      }
    }

    if (enrollment.supabaseRecord) {
      await storeUserEnrollment({
        ...enrollment.supabaseRecord,
        enrollment_status: status,
      });
    }
  }

  console.log("Checkout enrollment processing completed", {
    sessionId: session.id,
    email,
    enrolledProducts: processedEnrollments.map(item => item.learnWorlds.productId),
    storedRecords: processedEnrollments.filter(item => item.supabaseRecord).length,
    learnWorldsSynced: learnWorldsReady,
  });
}

async function learnWorldsRequest(path: string, init: RequestInit = {}) {
  if (!LEARNWORLDS_API_TOKEN || !LEARNWORLDS_CLIENT_ID) {
    throw new Error("LearnWorlds credentials are not configured");
  }

  const url = new URL(path, LEARNWORLDS_BASE_URL);
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${LEARNWORLDS_API_TOKEN}`);
  headers.set("Lw-Client", LEARNWORLDS_CLIENT_ID);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (LEARNWORLDS_API_DELAY_MS > 0) {
    await wait(LEARNWORLDS_API_DELAY_MS);
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers,
  });

  return response;
}

async function findLearnWorldsUser(email: string) {
  const response = await learnWorldsRequest(`/admin/api/v2/users/${encodeURIComponent(email)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await safeReadJson(response);
    console.error("LearnWorlds user lookup failed", { email, status: response.status, body });
    throw new Error(`LearnWorlds user lookup failed with status ${response.status}`);
  }

  return response.json();
}

async function createLearnWorldsUser(email: string) {
  const username = email.split("@")[0] ?? email;
  const payload = {
    email,
    username,
    send_registration_email: true,
  };

  const response = await learnWorldsRequest(`/admin/api/v2/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await safeReadJson(response);
    console.error("LearnWorlds user creation failed", { email, status: response.status, body });
    throw new Error(`LearnWorlds user creation failed with status ${response.status}`);
  }

  return response.json();
}

async function enrollLearnWorldsProduct(email: string, enrollment: LearnWorldsEnrollment) {
  const payload: Record<string, unknown> = {
    productId: enrollment.productId,
    productType: enrollment.productType,
    justification: "Added via Immigreat checkout",
    price: enrollment.price,
  };

  if (enrollment.productType === "subscription") {
    if (enrollment.duration_type) {
      payload.duration_type = enrollment.duration_type;
    }
    if (typeof enrollment.duration === "number") {
      payload.duration = enrollment.duration;
    }
  }

  const response = await learnWorldsRequest(`/admin/api/v2/users/${encodeURIComponent(email)}/enrollment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await safeReadJson(response);
    console.error("LearnWorlds enrollment failed", {
      email,
      enrollment,
      status: response.status,
      body,
    });
    throw new Error(`LearnWorlds enrollment failed for ${enrollment.productId}`);
  }

  return response.json();
}

async function storeUserEnrollment(record: SupabaseEnrollmentInsert) {
  const { error } = await supabase.from("user_enrollments_test").insert(record);

  if (error) {
    console.error("Failed to persist user enrollment in Supabase", {
      clerkId: record.clerk_id,
      enrollId: record.enroll_id,
      productId: record.product_id,
      status: record.enrollment_status,
      error: normalizeError(error),
    });
    return;
  }

  if (record.enrollment_status === "fail") {
    console.error("Enrollment recorded with failed status", {
      clerkId: record.clerk_id,
      enrollId: record.enroll_id,
      productId: record.product_id,
    });
  }
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
