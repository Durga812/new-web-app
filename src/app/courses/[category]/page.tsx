// src/app/courses/[category]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { Search } from "lucide-react";

import { courses, bundles } from "@/lib/data/courses-data";
import { IndividualCoursesSection } from "@/components/courses/IndividualCoursesSection";
import { CuratedBundlesSection } from "@/components/courses/CuratedBundlesSection";
import { supabase } from "@/lib/supabase/server";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
  searchParams?: Promise<{
    "course-type"?: string;
  }>;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/20 to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        {/* Header Section - More compact */}
        <section className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-transparent lg:text-4xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
            Explore {category.toUpperCase()} courses
          </h1>
          <p className="text-sm text-gray-600">
            Master your immigration journey with comprehensive courses
          </p>
        </section>

        {/* Course Type Tabs - Refined design */}
        <div className="mb-6 flex justify-center">
          <CoursTypeTabs category={category} activeType={courseType} />
        </div>

        {/* Search Bar - Client Component Wrapper */}
        {/* <SearchBarWrapper /> */}

        {/* Content Section */}
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
            courses={individualCourses}
            purchasedProductIds={purchasedProductIds}
            purchasedEnrollIds={purchasedEnrollIds}
          />
        )}
      </div>
    </div>
  );
}

// Course Type Tabs Component - Improved design
function CoursTypeTabs({ category, activeType }: { category: string; activeType: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-sm">
      <a
        href={`/courses/${category}`}
        className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
          activeType === "individual-courses"
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Individual Courses
      </a>
      <a
        href={`/courses/${category}?course-type=curated-bundle-courses`}
        className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
          activeType === "curated-bundle-courses"
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Curated Bundles
      </a>
    </div>
  );
}

// Client-side search component wrapper
function SearchBarWrapper() {
  return (
    <div className="mx-auto mb-6 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search courses by title, series, or tags..."
          className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
        />
      </div>
    </div>
  );
}
