// src/app/courses/page.tsx
import { CategoryTabs, courseCategories } from "@/components/courses/CategoryTabs";

export const metadata = {
  title: "All Courses - Immigreat.ai",
  description: "Explore simplified immigration courses covering EB1A, EB2-NIW, O-1, and EB5 categories.",
};

export default function CoursesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16 text-center">
        <h1 className="mb-6 text-4xl font-bold text-transparent lg:text-5xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
          Explore our course library
        </h1>
      </section>

      <div className="mb-12">
        <CategoryTabs activeSlug={undefined} />
      </div>
    </div>
  );
}