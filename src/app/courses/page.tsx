// src/app/courses/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryTabs } from "@/components/courses/CategoryTabs";

const featuredCategories = [
  { label: "EB1A", slug: "eb1a" },
  { label: "EB2-NIW", slug: "eb2-niw" },
  { label: "O-1", slug: "o-1" },
  { label: "EB-5", slug: "eb5" },
];

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

      <div className="mb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/courses/${category.slug}`}
              className="group flex h-full items-center justify-between rounded-2xl border border-gray-200 bg-white/80 px-6 py-8 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
            >
              <span className="text-lg font-semibold text-gray-900">
                {category.label}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500 transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
