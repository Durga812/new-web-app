// src/components/courses/CourseFilters.tsx
"use client";

import { useState, type CSSProperties } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type CourseSummary = {
  id: string;
  title: string;
  category: string;
  series?: string;
  tags: string[];
};

export type FilterState = {
  series: string[];
  tags: string[];
};

interface CourseFiltersProps {
  courses: CourseSummary[];
  categoryColor: string;
  filters: FilterState;
}

export function CourseFilters({ courses, categoryColor, filters }: CourseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const availableSeries = Array.from(
    new Set(courses.map((course) => course.series).filter((series): series is string => Boolean(series))),
  ).sort();

  const availableTags = Array.from(new Set(courses.flatMap((course) => course.tags))).sort();

  const toggleFilterValue = (key: "series" | "tags", value: string) => {
    const params = new URLSearchParams(searchParams);
    const current = params.get(key) ?? "";
    const list = current
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const nextValues = list.includes(value)
      ? list.filter((entry) => entry !== value)
      : [...list, value];

    if (nextValues.length === 0) {
      params.delete(key);
    } else {
      params.set(key, nextValues.join(","));
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl);
  };

  const clearFilterKey = (key: "series" | "tags") => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = (filters.series?.length ?? 0) > 0 || (filters.tags?.length ?? 0) > 0;

  const formatLabel = (value: string) =>
    value
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

  const activeButtonStyles: CSSProperties = {
    background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
    color: "#fff",
  };

  const baseButtonClasses =
    "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium transition-colors hover:bg-gray-50";

  return (
    <Card className="bg-white/80 backdrop-blur border border-gray-200/70 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between" onClick={() => setIsFilterOpen((open) => !open)}>
          <div className="flex cursor-pointer items-center gap-2">
            <Filter className="h-5 w-5" style={{ color: categoryColor }} />
            <h3 className="text-lg font-semibold text-gray-900">Filter courses</h3>
            {isFilterOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                clearAllFilters();
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="mr-1 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>

        {isFilterOpen && (
          <div className="mt-6 space-y-6">
            <div className="h-1 w-16 rounded-full" style={{ backgroundColor: categoryColor }} />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">Series</h4>
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  {availableSeries.length} options
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => clearFilterKey("series")}
                  className={baseButtonClasses}
                  style={filters.series.length === 0 ? activeButtonStyles : undefined}
                >
                  All series
                </button>

                {availableSeries.map((series) => {
                  const isActive = filters.series.includes(series);
                  return (
                    <button
                      key={series}
                      type="button"
                      onClick={() => toggleFilterValue("series", series)}
                      className={baseButtonClasses}
                      style={isActive ? activeButtonStyles : undefined}
                    >
                      {formatLabel(series)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">Tags</h4>
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  {availableTags.length} tags
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => clearFilterKey("tags")}
                  className={baseButtonClasses}
                  style={filters.tags.length === 0 ? activeButtonStyles : undefined}
                >
                  All tags
                </button>

                {availableTags.map((tag) => {
                  const isActive = filters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFilterValue("tags", tag)}
                      className={baseButtonClasses}
                      style={isActive ? activeButtonStyles : undefined}
                    >
                      {formatLabel(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
