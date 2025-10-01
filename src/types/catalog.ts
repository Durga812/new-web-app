export type RelatedCourse = {
  course_id: string;
  course_slug?: string;
  title: string;
  image_url?: string;
  series: string;
  category: string;
  tags?: string[];
  pricing: {
    price1: {
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
};

export type RelatedBundle = {
  bundle_id: string;
  title: string;
  image_url?: string;
  category: string;
  included_course_ids: string[];
  pricing: {
    price: number;
    compared_price?: number;
    validity_duration: number;
    validity_type: string;
  };
};
