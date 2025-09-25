import type { CartItem } from "@/types/cart";

export type DiscountTier = {
  threshold: number;
  rate: number;
};

export const DISCOUNT_TIERS: DiscountTier[] = [
  { threshold: 40, rate: 0.27 },
  { threshold: 20, rate: 0.16 },
  { threshold: 10, rate: 0.11 },
  { threshold: 5, rate: 0.06 },
];

export const getDiscountRate = (count: number) => {
  const tier = DISCOUNT_TIERS.find(entry => count >= entry.threshold);
  return tier ? tier.rate : 0;
};

export type DiscountSummary = {
  subtotal: number;
  qualifyingCount: number;
  qualifyingSubtotal: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  upcomingTier?: DiscountTier;
};

export const calculateCartDiscounts = (items: ReadonlyArray<CartItem>): DiscountSummary => {
  const subtotal = items.reduce((total, item) => total + item.price, 0);
  const qualifyingCourses = items.filter(
    item => item.type === "course" && item.pricingKey === "price3",
  );
  const qualifyingCount = qualifyingCourses.length;
  const qualifyingSubtotal = qualifyingCourses.reduce((total, item) => total + item.price, 0);
  const discountRate = getDiscountRate(qualifyingCount);
  const discountAmount = qualifyingSubtotal * discountRate;
  const total = Math.max(0, subtotal - discountAmount);
  const upcomingTier = [...DISCOUNT_TIERS]
    .sort((a, b) => a.threshold - b.threshold)
    .find(tier => qualifyingCount < tier.threshold);

  return {
    subtotal,
    qualifyingCount,
    qualifyingSubtotal,
    discountRate,
    discountAmount,
    total,
    upcomingTier,
  };
};

export const getItemDiscountRate = (item: CartItem, globalRate: number) => {
  if (item.type === "course" && item.pricingKey === "price3") {
    return globalRate;
  }
  return 0;
};
