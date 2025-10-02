export type BundlePricing = {
  price: number;
  compared_price?: number;
  validity_duration: number;
  validity_type: string;
};

export type BundleCourseSummary = {
  course_id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  series?: string;
  tags: string[];
  image_url?: string;
  pricing?: {
    price1?: {
      price: number;
      compared_price?: number;
      validity_duration?: number;
      validity_type?: string;
    };
    price2?: {
      price: number;
      compared_price?: number;
      validity_duration?: number;
      validity_type?: string;
    };
    price3?: {
      price: number;
      compared_price?: number;
      validity_duration?: number;
      validity_type?: string;
    };
  };
  ratings?: number;
};

export type BundleDetail = {
  bundle_id: string;
  enroll_id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  category: string;
  series?: string;
  tags: string[];
  pricing: BundlePricing;
  includedCourseIds: string[];
  includedCourses: BundleCourseSummary[];
  lastUpdated: string;
};
