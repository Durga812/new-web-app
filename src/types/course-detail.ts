export type CourseModuleLesson = {
  id: string;
  title: string;
  duration: number; // minutes
  isPreview?: boolean;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  lessons: CourseModuleLesson[];
  totalDuration: number; // minutes
  outcome: string;
};

export type CourseFAQ = {
  id: string;
  question: string;
  answer: string;
};

export type CourseReview = {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
};

export type CourseDetail = {
  title: string;
  course_id: string;
  course_slug: string;
  enroll_id: string;
  type: string;
  category: string;
  series: string;
  tags: string[];
  ratings: number;
  totalReviews: number;
  position: number;
  pricing: {
    price1: {
      price: number;
      compared_price?: number;
      validity_duration: number;
      validity_type: string;
    };
    price2: {
      price: number;
      compared_price?: number;
      validity_duration: number;
      validity_type: string;
    };
    price3: {
      price: number;
      compared_price?: number;
      validity_duration: number;
      validity_type: string;
    };
  };
  image_url: string;
  subtitle: string;
  keyBenefits: string[];
  previewVideoUrl: string;
  previewThumbnail?: string;
  description: string;
  whoIsFor: string[];
  whoIsNotFor: string[];
  highlights: string[];
  requirements: string[];
  learningOutcomes: string[];
  modules: CourseModule[];
  totalModules: number;
  totalLessons: number;
  totalDuration: number;
  includes: {
    icon?: string;
    text: string;
  }[];
  faqs: CourseFAQ[];
  reviews: CourseReview[];
  relatedCourseIds: string[];
  relatedBundleIds: string[];
  lastUpdated: string;
};
