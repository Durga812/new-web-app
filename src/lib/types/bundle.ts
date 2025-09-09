// src/lib/types/bundle.ts
export interface Bundle {
  bundle_id: string;
  course_ids: string[]; // ids of courses it consists of
  name: string;
  bundle_slug: string;
  category_slug: string;
  rating: number;
  is_active: boolean;
  validity: number;
  tags: string[];
  description: {
    long: string;
    short: string;
  };
  content: {
    about: string;
    included: string[];
    what_you_learn: string[];
    // Capitalized key matches provided payload example
    Courses?: {
      summary: string;
      // Support keys like "course-A", "course-B", etc.
      [k: string]: string;
    }[];
  };
  price: {
    current: number;
    currency: string;
    original: number;
  };
  highlight: {
    title: string;
    courses: string[]; // course names included in bundle
  };
  urls: {
    access_url: string;
    thumbnail_url: string;
    video_preview_url: string;
  };
  bundle_enroll_id: string;
  metadata: {
    level: string;
    validity_label: string;
    course_count: number;
  };
  created_at: string;
  updated_at: string;
}
