// src/app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe/stripe_client";
import { supabase } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendEnrollmentCompleteEmail } from "@/app/actions/email";

type PurchasedItem = {
  product_id: string;
  enroll_id: string;
  product_type: string; // 'course' | 'bundle'
  lw_product_type: string;
  title: string;
  price: number;
  validity_duration: number;
  validity_type: string; // 'days' | 'months' | 'years' | string
};

type LearnWorldsUser = { id: string } & Record<string, unknown>;

type LwEnrollmentPayload = {
  productId: string;
  productType: string;
  price: number;
  justification: string;
  send_enrollment_email: boolean;
  duration?: number;
  duration_type?: string;
};

const LEARNWORLDS_BASE_URL = process.env.LEARNWORLDS_BASE_URL ?? "https://courses.greencardiy.com";
const LEARNWORLDS_API_TOKEN = process.env.LEARNWORLDS_API_TOKEN;
const LEARNWORLDS_CLIENT_ID = process.env.LEARNWORLDS_CLIENT_ID;

const hasLearnWorldsConfig = Boolean(LEARNWORLDS_API_TOKEN && LEARNWORLDS_CLIENT_ID);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Processing checkout session:", session.id);

    try {
      await processCheckoutSession(session);
    } catch (error) {
      console.error("Failed to process checkout session:", error);
    }
  }

  return NextResponse.json({ received: true });
}

async function processCheckoutSession(session: Stripe.Checkout.Session) {
  const clerkId = session.client_reference_id || session.metadata?.clerk_id;
  const email = session.customer_details?.email?.toLowerCase();

  if (!clerkId || !email) {
    console.error("Missing clerk ID or email in session");
    return;
  }

  // Fetch line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
    limit: 100,
  });

  if (lineItems.data.length === 0) {
    console.error("No line items found in session");
    return;
  }

  // Extract purchased items from line items
  const purchasedItems = lineItems.data.map(item => {
    const product = item.price?.product as Stripe.Product;
    const metadata = product?.metadata || {};
    
    return {
      product_id: metadata.product_id || '',
      enroll_id: metadata.enroll_id || '',
      product_type: metadata.product_type || '',
      lw_product_type: metadata.lw_product_type || '',
      title: product?.name || metadata.item_title || '',
      price: parseFloat(metadata.discounted_price || '0'),
      validity_duration: parseInt(metadata.validity_duration || '0'),
      validity_type: metadata.validity_type || '',
    };
  });

  // Step 1: Create order record
  const orderResult = await createOrder(session, clerkId, email, purchasedItems);
  
  if (!orderResult) {
    console.error("Failed to create order");
    return;
  }

  const { orderId, orderNumber } = orderResult;

  // Step 2: Clear user's cart now that the order is saved
  await clearUserCart(clerkId);

  // Step 3: Update user's stripe_customer_id if exists
  if (session.customer) {
    await updateStripeCustomerId(clerkId, session.customer as string);
  }

  // Step 4: Send order confirmation email
  const metadata = session.metadata || {};
  await sendOrderConfirmationEmail({
    orderId,
    orderNumber,
    customerEmail: email,
    customerName: session.customer_details?.name || null,
    subtotal: parseFloat(metadata.subtotal || '0'),
    discount: parseFloat(metadata.discount_amount || '0'),
    total: parseFloat(metadata.total || '0'),
    discountTierName: metadata.discount_tier_name || null,
    purchasedItems: purchasedItems.map(item => ({
      title: item.title,
      price: item.price,
      product_type: item.product_type,
      validity_duration: item.validity_duration,
      validity_type: item.validity_type,
    })),
  });

  // Step 5: Ensure user exists in LearnWorlds
  const learnWorldsUserId = await ensureLearnWorldsUser(clerkId, email);
  
  if (!learnWorldsUserId) {
    console.error("Failed to create/verify LearnWorlds user");
    // Continue anyway, enrollments will fail but we'll track them
  }

  // Step 6: Enroll user in each product
  await enrollUserInProducts(clerkId, email, orderId, purchasedItems);

  // Step 7: Send enrollment complete email
  await sendEnrollmentCompleteEmail(
    email,
    session.customer_details?.name || null,
    purchasedItems.length
  );

  console.log("Checkout processing completed successfully");
}

async function createOrder(
  session: Stripe.Checkout.Session,
  clerkId: string,
  email: string,
  purchasedItems: PurchasedItem[]
) {
  try {
    const metadata = session.metadata || {};
    
    // Extract country from customer details
    const country = session.customer_details?.address?.country || null;
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        clerk_user_id: clerkId,
        order_number: '', // Will be auto-generated by SQL function
        stripe_payment_intent_id: session.payment_intent as string,
        payment_status: 'completed',
        subtotal: parseFloat(metadata.subtotal || '0'),
        discount: parseFloat(metadata.discount_amount || '0'),
        discount_tier_name: metadata.discount_tier_name || null,
        total_amount: parseFloat(metadata.total || '0'),
        customer_email: email,
        customer_name: session.customer_details?.name || null,
        country: country,
        purchased_items: purchasedItems,
        paid_at: new Date().toISOString(),
      })
      .select('id, order_number')
      .single();

    if (error) {
      console.error("Failed to create order:", error);
      return null;
    }

    console.log("Order created:", data.id, "Order number:", data.order_number);
    return { orderId: data.id, orderNumber: data.order_number };
    
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

async function updateStripeCustomerId(clerkId: string, stripeCustomerId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('clerk_user_id', clerkId);

    if (error) {
      console.error("Failed to update stripe_customer_id:", error);
    } else {
      console.log("Updated stripe_customer_id for user:", clerkId);
    }
  } catch (error) {
    console.error("Error updating stripe_customer_id:", error);
  }
}

async function ensureLearnWorldsUser(clerkId: string, email: string): Promise<string | null> {
  try {
    // Check if user already has learnworlds_user_id
    const { data: userData } = await supabase
      .from('users')
      .select('learnworlds_user_id, first_name')
      .eq('clerk_user_id', clerkId)
      .single();

    if (userData?.learnworlds_user_id) {
      console.log("User already has LearnWorlds ID:", userData.learnworlds_user_id);
      return userData.learnworlds_user_id;
    }

    if (!hasLearnWorldsConfig) {
      console.error("LearnWorlds credentials not configured");
      return null;
    }

    // Check if user exists in LearnWorlds
    await wait(400); // Rate limiting
    const existingUser = await findLearnWorldsUser(email);

    if (existingUser) {
      // User exists, store the ID
      await supabase
        .from('users')
        .update({ learnworlds_user_id: existingUser.id })
        .eq('clerk_user_id', clerkId);
      
      return existingUser.id;
    }

    // Create new user in LearnWorlds
    await wait(400); // Rate limiting
    const newUser = await createLearnWorldsUser(email, userData?.first_name || 'User');
    
    if (newUser) {
      // Store the new LearnWorlds user ID
      await supabase
        .from('users')
        .update({ learnworlds_user_id: newUser.id })
        .eq('clerk_user_id', clerkId);
      
      return newUser.id;
    }

    return null;
    
  } catch (error) {
    console.error("Error ensuring LearnWorlds user:", error);
    return null;
  }
}

async function enrollUserInProducts(
  clerkId: string,
  email: string,
  orderId: string,
  purchasedItems: PurchasedItem[]
) {
  for (const item of purchasedItems) {
    try {
      await wait(400); // Rate limiting between API calls
      
      // Call LearnWorlds enroll API with retry tracking
      const enrollmentResult = await enrollInLearnWorlds(email, item);
      
      if (enrollmentResult.success) {
        // Calculate expiry date
        const enrolledAt = new Date();
        const expiresAt = calculateExpiryDate(enrolledAt, item.validity_duration, item.validity_type);
        
        // Save successful enrollment
        await saveEnrollment(
          clerkId, 
          orderId, 
          item, 
          enrolledAt, 
          expiresAt, 
          'success',
          null, // no error
          enrollmentResult.retryCount
        );
        
        console.log(`Successfully enrolled in ${item.title}`);
      } else {
        // Save failed enrollment with error details
        await saveEnrollment(
          clerkId, 
          orderId, 
          item, 
          null, 
          null, 
          'failed',
          enrollmentResult.error,
          enrollmentResult.retryCount
        );
        console.error(`Failed to enroll in ${item.title}:`, enrollmentResult.error);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error enrolling in ${item.title}:`, error);
      await saveEnrollment(
        clerkId, 
        orderId, 
        item, 
        null, 
        null, 
        'failed',
        errorMessage,
        0
      );
    }
  }
}

async function enrollInLearnWorlds(
  email: string, 
  item: PurchasedItem, 
  retryCount = 0
): Promise<{ success: boolean; error: string | null; retryCount: number }> {
  try {
    if (!hasLearnWorldsConfig) {
      return { 
        success: false, 
        error: 'LearnWorlds credentials not configured',
        retryCount: 0
      };
    }

    const payload: LwEnrollmentPayload = {
      productId: item.enroll_id,
      productType: item.lw_product_type,
      price: item.price,
      justification: "Purchase via Immigreat",
      send_enrollment_email: false,
    };

    // ONLY add duration fields for subscription product type
    if (item.lw_product_type === 'subscription' && item.validity_duration && item.validity_type) {
      payload.duration = item.validity_duration;
      payload.duration_type = item.validity_type;
    }

    const response = await fetch(
      `${LEARNWORLDS_BASE_URL}/admin/api/v2/users/${encodeURIComponent(email)}/enrollment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LEARNWORLDS_API_TOKEN}`,
          'Lw-Client': LEARNWORLDS_CLIENT_ID!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    // Handle rate limiting
    if (response.status === 429 || response.status === 503) {
      if (retryCount < 3) {
        console.log(`Rate limited, waiting 10 seconds before retry ${retryCount + 1}/3`);
        await wait(10000); // Wait 10 seconds
        return enrollInLearnWorlds(email, item, retryCount + 1);
      }
      return { 
        success: false, 
        error: `Rate limit exceeded after ${retryCount + 1} retries`,
        retryCount: retryCount + 1
      };
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const errorMessage = errorBody?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error("LearnWorlds enrollment failed:", response.status, errorBody);
      return { 
        success: false, 
        error: errorMessage,
        retryCount
      };
    }

    return { success: true, error: null, retryCount };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during enrollment';
    console.error("Error calling LearnWorlds API:", error);
    return { 
      success: false, 
      error: errorMessage,
      retryCount
    };
  }
}

async function saveEnrollment(
  clerkId: string,
  orderId: string,
  item: PurchasedItem,
  enrolledAt: Date | null,
  expiresAt: Date | null,
  status: 'success' | 'failed',
  errorMessage: string | null,
  retryCount: number
) {
  try {
    const { error } = await supabase
      .from('enrollments')
      .insert({
        clerk_user_id: clerkId,
        order_id: orderId,
        product_id: item.product_id,
        product_type: item.product_type,
        lw_product_type: item.lw_product_type,
        enroll_id: item.enroll_id,
        product_title: item.title,
        validity_duration: item.validity_duration,
        validity_type: item.validity_type,
        enrolled_at: enrolledAt?.toISOString() || null,
        expires_at: expiresAt?.toISOString() || null,
        enrollment_status: status,
        status: status === 'success' ? 'active' : 'pending',
        enrollment_error: errorMessage,
        enrollment_retry_count: retryCount,
      });

    if (error) {
      console.error("Failed to save enrollment:", error);
    }
  } catch (error) {
    console.error("Error saving enrollment:", error);
  }
}

function calculateExpiryDate(enrolledAt: Date, duration: number, durationType: string): Date {
  const expiresAt = new Date(enrolledAt);
  
  switch (durationType.toLowerCase()) {
    case 'days':
      expiresAt.setDate(expiresAt.getDate() + duration);
      break;
    case 'months':
      expiresAt.setMonth(expiresAt.getMonth() + duration);
      break;
    case 'years':
      expiresAt.setFullYear(expiresAt.getFullYear() + duration);
      break;
    default:
      expiresAt.setMonth(expiresAt.getMonth() + duration); // Default to months
  }
  
  return expiresAt;
}

async function findLearnWorldsUser(email: string): Promise<LearnWorldsUser | null> {
  try {
    const response = await fetch(
      `${LEARNWORLDS_BASE_URL}/admin/api/v2/users/${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${LEARNWORLDS_API_TOKEN}`,
          'Lw-Client': LEARNWORLDS_CLIENT_ID!,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error("Failed to find LearnWorlds user:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error finding LearnWorlds user:", error);
    return null;
  }
}

async function createLearnWorldsUser(email: string, firstName: string) {
  try {
    const response = await fetch(
      `${LEARNWORLDS_BASE_URL}/admin/api/v2/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LEARNWORLDS_API_TOKEN}`,
          'Lw-Client': LEARNWORLDS_CLIENT_ID!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          username: firstName,
          send_registration_email: false,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error("Failed to create LearnWorlds user:", response.status, errorBody);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating LearnWorlds user:", error);
    return null;
  }
}

async function clearUserCart(clerkId: string) {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('clerk_user_id', clerkId);

    if (error) {
      console.error("Failed to clear cart:", error);
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}
