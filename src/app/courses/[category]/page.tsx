// src/app/courses/[category]/page.tsx
import { CategoryTabs, courseCategories } from "@/components/courses/CategoryTabs";
import { courses, bundles } from "@/lib/data/courses-data";

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
  
  // Validate category exists
  const validCategories = ['eb1a', 'eb2-niw', 'o-1', 'eb5'];
  if (!validCategories.includes(category)) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-center text-red-600">Category not found</p>
      </div>
    );
  }

  // Filter data based on category and type
  let filteredData: any[] = [];
  
  if (courseType === "curated-bundle-courses") {
    // Get bundles for this category
    filteredData = bundles.filter(bundle => bundle.category === category);
  } else {
    // Get individual courses for this category
    filteredData = courses.filter(course => course.category === category);
  }

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

      {/* Display JSON Data for now */}
      <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
        <p className="mb-2 font-semibold">
          Category: {category} | Type: {courseType} | Count: {filteredData.length}
        </p>
        <pre className="text-xs">
          {JSON.stringify(filteredData, null, 2)}
        </pre>
      </div>
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