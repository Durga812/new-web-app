// src/types/cart.ts
export type CartItemType = "course" | "bundle";

export type CartItem = {
  id: string;
  productId: string;
  type: CartItemType;
  productType?: string;
  lwProductType?: string; // Add this field
  title: string;
  price: number;
  currency?: string;
  comparedPrice?: number;
  imageUrl?: string;
  accessPeriodLabel?: string;
  validityDuration?: number;
  validityType?: string;
  includedCourseIds?: string[];
  category?: string;
  pricingKey?: string;
  enrollId?: string;
  originalPrice?: number;
};
