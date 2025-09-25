export type CartItemType = "course" | "bundle";

export type CartItem = {
  id: string;
  productId: string;
  type: CartItemType;
  /** Product classification such as subscription or bundle */
  productType?: string;
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
};
