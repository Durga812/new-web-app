import type { RefundItem } from "./refund";

export type PurchasedOrderItem = {
  product_id: string;
  enroll_id: string;
  product_type: string;
  lw_product_type: string;
  title: string;
  price: number;
  original_price: number;
  validity_duration: number;
  validity_type: string;
};

export type OrderRecord = {
  id: string;
  order_number: string;
  stripe_payment_intent_id: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  discount_tier_name: string | null;
  total_amount: number;
  customer_email: string;
  customer_name: string | null;
  country: string | null;
  purchased_items: PurchasedOrderItem[];
  paid_at: string;
  refund_amount: number | null;
  refunded_items: RefundItem[] | null;
  refund_reason: string | null;
  refund_processed_by: string | null;
};
