import type { CartItem } from "@/types/cart";

export type DiscountTier = {
  threshold: number;
  rate: number;
  name: string;
};

export const DISCOUNT_TIERS: DiscountTier[] = [
  { threshold: 40, rate: 0.37, name: "Extraordinary" },
  { threshold: 20, rate: 0.25, name: "Visionary" },
  { threshold: 10, rate: 0.16, name: "Leader" },
  { threshold: 5, rate: 0.06, name: "Foundation" },
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
  currentTier?: DiscountTier;
  upcomingTier?: DiscountTier;
};

export const calculateCartDiscounts = (items: ReadonlyArray<CartItem>): DiscountSummary => {
  const subtotal = items.reduce((total, item) => total + item.price, 0);
  // New rule: any course counts towards thresholds, irrespective of validity
  const qualifyingCourses = items.filter(item => item.type === "course");
  const qualifyingCount = qualifyingCourses.length;
  const qualifyingSubtotal = qualifyingCourses.reduce((total, item) => total + item.price, 0);
  const discountRate = getDiscountRate(qualifyingCount);
  const discountAmount = qualifyingSubtotal * discountRate;
  const total = Math.max(0, subtotal - discountAmount);
  const sortedAscending = [...DISCOUNT_TIERS]
    .sort((a, b) => a.threshold - b.threshold)
  const upcomingTier = sortedAscending.find(tier => qualifyingCount < tier.threshold);
  const currentTier = [...DISCOUNT_TIERS].find(entry => qualifyingCount >= entry.threshold);

  return {
    subtotal,
    qualifyingCount,
    qualifyingSubtotal,
    discountRate,
    discountAmount,
    total,
    currentTier,
    upcomingTier,
  };
};

export const getItemDiscountRate = (item: CartItem, globalRate: number) => {
  // Apply discount to all individual courses; bundles remain excluded
  if (item.type === "course") {
    return globalRate;
  }
  return 0;
};
