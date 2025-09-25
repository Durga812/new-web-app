// src/app/courses/[category]/page.tsx
import { auth } from "@clerk/nextjs/server";

import { courses, bundles } from "@/lib/data/courses-data";
import { IndividualCoursesSection } from "@/components/courses/IndividualCoursesSection";
import { CuratedBundlesSection } from "@/components/courses/CuratedBundlesSection";
import { supabase } from "@/lib/supabase/server";

interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams?: {
    "course-type"?: string;
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const courseType = resolvedSearchParams?.["course-type"] || "individual-courses";
  const { userId } = await auth();

  let purchasedProductIds: string[] = [];
  let purchasedEnrollIds: string[] = [];

  if (userId) {
    const { data, error } = await supabase
      .from("user_enrollments_test")
      .select("product_id,enroll_id,enrollment_status")
      .eq("clerk_id", userId);

    if (error) {
      console.error("Failed to load purchased enrollments for catalog", { userId, error });
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

  // Validate category exists
  const validCategories = ['eb1a', 'eb2-niw', 'o-1', 'eb5'];
  if (!validCategories.includes(category)) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-center text-red-600">Category not found</p>
      </div>
    );
  }

  const individualCourses = courses.filter(course => course.category === category);
  const curatedBundles = bundles.filter(bundle => bundle.category === category);

  const courseTypeLabel =
    courseType === "curated-bundle-courses" ? "Curated Bundles" : "Individual Courses";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-8 text-center">
        <h1 className="mb-6 text-4xl font-bold text-transparent lg:text-5xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
          Explore {category} courses
        </h1>
      </section>

      {/* Category Tabs */}
      {/* <div className="mb-12">
        <CategoryTabs activeSlug={category} />
      </div> */}

      {/* Course Type Tabs */}
      <div className="mb-8">
        <CoursTypeTabs category={category} activeType={courseType} />
      </div>

      {courseType === "curated-bundle-courses" ? (
        <CuratedBundlesSection
          category={category}
          bundles={curatedBundles}
          purchasedProductIds={purchasedProductIds}
          purchasedEnrollIds={purchasedEnrollIds}
        />
      ) : (
        <IndividualCoursesSection
          category={category}
          courseTypeLabel={courseTypeLabel}
          courses={individualCourses}
          purchasedProductIds={purchasedProductIds}
          purchasedEnrollIds={purchasedEnrollIds}
        />
      )}
    </div>
  );
}

// Simple Course Type Tabs Component
function CoursTypeTabs({ category, activeType }: { category: string; activeType: string }) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1 shadow-lg">
        <a
          href={`/courses/${category}`}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeType === "individual-courses"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Individual Courses
        </a>
        <a
          href={`/courses/${category}?course-type=curated-bundle-courses`}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeType === "curated-bundle-courses"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
        Curated Bundle Courses
        </a>
      </div>
    </div>
  );
}
