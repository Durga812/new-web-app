// src/app/course/[course_slug]/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCourseDetailBySlug } from "@/lib/data/course-details-data";
import { courses, bundles } from "@/lib/data/courses-data";
import { supabase } from "@/lib/supabase/server";
import { EnrollmentProvider } from "@/components/providers/EnrollmentProvider";
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

  const { userId } = await auth();

  let purchasedProductIds: string[] = [];
  let purchasedEnrollIds: string[] = [];

  if (userId) {
    const { data, error } = await supabase
      .from("user_enrollments_test")
      .select("product_id,enroll_id,enrollment_status")
      .eq("clerk_id", userId);

    if (error) {
      console.error("Failed to load purchased enrollments for course detail", { userId, error });
    } else if (data) {
      const successful = data.filter(record => record.enrollment_status === "success");
      purchasedProductIds = Array.from(
        new Set(
          successful
            .map(record => record.product_id)
            .filter((value): value is string => Boolean(value && value.trim())),
        ),
      );
      purchasedEnrollIds = Array.from(
        new Set(
          successful
            .map(record => record.enroll_id)
            .filter((value): value is string => Boolean(value && value.trim())),
        ),
      );
    }
  }

  // Get related courses and bundles
  const relatedCourses = courses.filter(c => 
    courseDetail.relatedCourseIds.includes(c.course_id)
  );
  const relatedBundles = bundles.filter(b => 
    courseDetail.relatedBundleIds.includes(b.bundle_id)
  );

  return (
    <EnrollmentProvider
      productIds={purchasedProductIds}
      enrollIds={purchasedEnrollIds}
    >
      <CourseDetailClient 
        course={courseDetail} 
        relatedCourses={relatedCourses}
        relatedBundles={relatedBundles}
      />
    </EnrollmentProvider>
  );
}
