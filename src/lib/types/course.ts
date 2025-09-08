// src/lib/types/course.ts
export interface Course {
  course_id: string;
  name: string;
  course_slug: string;
  category_slug: string;
  series_slug?: string; // optional, since it wasn’t in your JSON
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
    curriculum: {
      module: string;
      summary: string;
      chapters: string[];
    }[];
    what_you_learn: string[];
  };
  price: {
    current: number;
    currency: string;
    original: number;
  };
  highlight: {
    title: string;
    highlights: string[];
  };
  urls: {
    access_url: string;
    thumbnail_url: string;
    video_preview_url: string;
  };
  enroll_ids: {
    primary: string;
    tertiary: string;
    secondary: string;
  };
  metadata: {
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