// src/components/courses/CategoryTabs.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export type CourseCategory = {
  title: string;
  cat_slug: string;
  color: string;
  description: string;
};

export const courseCategories: CourseCategory[] = [
  {
    title: "EB1A",
    cat_slug: "eb1a",
    color: "#f97316",
    description: "Strategies for extraordinary ability petitions.",
  },
  {
    title: "EB2-NIW",
    cat_slug: "eb2-niw",
    color: "#fbbf24",
    description: "Plan a compelling national interest waiver case.",
  },
  {
    title: "O-1",
    cat_slug: "o-1",
    color: "#fb7185",
    description: "Temporary visas for artists, founders, and researchers.",
  },
  {
    title: "EB5",
    cat_slug: "eb5",
    color: "#34d399",
    description: "Investment-based green card pathways explained.",
  },
];

interface CategoryTabsProps {
  activeSlug?: string;
}

export function CategoryTabs({ activeSlug }: CategoryTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isAllActive = pathname === "/courses" || !activeSlug;

  const handleTabClick = (slug?: string) => {
    if (!slug) {
      router.push("/courses");
      return;
    }

    router.push(`/courses?category=${slug}`);
  };

  return (
    <div className="flex w-full justify-center">
      <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1 shadow-lg">
        <Button
          variant={isAllActive ? "default" : "ghost"}
          size="sm"
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
            isAllActive
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600"
              : "text-gray-600 hover:bg-gray-50 hover:text-amber-700"
          }`}
          onClick={() => handleTabClick()}
        >
          All
        </Button>

        {courseCategories.map((category) => {
          const isActive = activeSlug === category.cat_slug;
          const activeStyles = isActive
            ? {
                background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                color: "#fff",
              }
            : {};

          return (
            <Button
              key={category.cat_slug}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              style={activeStyles}
              className="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg text-gray-600 hover:bg-gray-50"
              onClick={() => handleTabClick(category.cat_slug)}
            >
              {category.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
