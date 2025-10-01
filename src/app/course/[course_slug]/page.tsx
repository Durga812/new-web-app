// src/app/course/[course_slug]/page.tsx
import { notFound } from "next/navigation";
import { getCourseDetailBySlug } from "@/lib/data/course-details-data";
import { courses, bundles } from "@/lib/data/courses-data";
import CourseDetailClient from "./CourseDetailClient";

interface CourseDetailPageProps {
  params: Promise<{
    course_slug: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { course_slug } = await params;
  const courseDetail = getCourseDetailBySlug(course_slug);
  
  if (!courseDetail) {
    notFound();
  }

  // Get related courses and bundles
  const relatedCourses = courses.filter(c => 
    courseDetail.relatedCourseIds.includes(c.course_id)
  );
  const relatedBundles = bundles.filter(b => 
    courseDetail.relatedBundleIds.includes(b.bundle_id)
  );

  return (
    <CourseDetailClient 
      course={courseDetail} 
      relatedCourses={relatedCourses}
      relatedBundles={relatedBundles}
    />
  );
}
