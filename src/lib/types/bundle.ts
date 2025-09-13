// src/lib/types/bundle.ts
export interface BundleDescription {
  long?: string;
  short?: string;
}

export interface BundleHighlights {
  title?: string;
  courses?: string[];
}

export interface BundleContent {
  about?: string;
  included?: string[];
  what_you_learn?: string[];
}

export interface BundleMetadata {
  level?: string;
  validity_label?: string;
  course_count?: number;
  [key: string]: unknown;
}

export interface Bundle {
  bundle_id: string;
  bundle_slug: string;

  title: string;
  category?: string;
  series?: string;
  tags: string[];
  child_course_ids: string[]; // course_id[]

  description: BundleDescription;
  highlights?: BundleHighlights;
  content?: BundleContent;
  bundle_metadata?: BundleMetadata;

  price: number | null; // smallest unit integer
  original_price: number | null;
  bundle_enroll_id: string | null;

  validity: number | null;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}
