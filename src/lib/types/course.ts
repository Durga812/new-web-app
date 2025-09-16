// src/lib/types/course.ts
export interface CourseOption {
  course_enroll_id?: string;
  variant_code?: string;
  price: number;
  original_price?: number;
  validity: number;  // in months
  currency?: string;
  // Legacy fields for backward compatibility
  validity_months?: number;
  enroll_id?: string;
}

export interface CourseHighlights {
  title: string;
  highlights: string[];
}

export interface Course {
  course_id: string;
  title: string;  // Added based on new data structure
  name?: string;   // Keep for backward compatibility
  course_slug: string;
  category?: string;  // Added based on new data structure
  category_slug?: string;  // Keep for backward compatibility
  series?: string;  // Changed to optional since not all courses have it
  series_slug?: string; // Keep for backward compatibility
  rating: number;
  rating_count?: number;  // Added based on new data structure
  is_active: boolean;
  validity?: number;
  tags: string[];
  description: {
    long: string;
    short: string;
  };
  content: {
    about: string;
    included: string[];
    curriculum: Array<{
      module: string;
      summary: string;
      chapters: string[];
    }> | Array<Array<{
      module: string;
      summary: string;
      chapters: string[];
    }>>; // Support both formats
    what_you_learn: string[];
  };
  price?: {
    current: number;
    currency: string;
    original: number;
  };
  highlights?: CourseHighlights;  // Made optional with new structure
  highlight?: {  // Keep for backward compatibility
    title: string;
    highlights: string[];
  };
  urls: {
    access_url?: string;
    thumbnail_url?: string;
    preview_video_url?: string;  // Added based on new data
    video_preview_url?: string;  // Keep for backward compatibility
  };
  enroll_ids?: {
    primary: string;
    tertiary: string;
    secondary: string;
  };
  course_options?: CourseOption[];  // Added for multiple pricing options
  course_metadata?: { validity_label?: string; [key: string]: unknown };  // Added based on new data
  metadata?: {
    level: string;
    duration_hours: number;
    validity_label: string;
  };
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  series: string[];
  tags: string[];
}

export type CourseWithTwelveMonthOption = Course & { twelveMonthOption: CourseOption };
