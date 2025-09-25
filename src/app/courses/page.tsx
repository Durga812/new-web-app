// src/app/courses/page.tsx
import { CategoryTabs, courseCategories } from "@/components/courses/CategoryTabs";
import {
  CourseFilters,
  type CourseSummary,
  type FilterState,
} from "@/components/courses/CourseFilters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const courseCatalog: CourseSummary[] = [
  {
    id: "eb1a-petition-lab",
    title: "EB1A Petition Lab",
    category: "eb1a",
    series: "petition",
    tags: ["petition", "evidence", "strategy"],
  },
  {
    id: "eb1a-criteria-clinic",
    title: "EB1A Criteria Clinic",
    category: "eb1a",
    series: "criteria",
    tags: ["benchmark", "portfolio"],
  },
  {
    id: "eb2-roadmap",
    title: "EB2-NIW Roadmap",
    category: "eb2-niw",
    series: "petition",
    tags: ["impact", "petition"],
  },
  {
    id: "eb2-research",
    title: "Evidence Building for EB2-NIW",
    category: "eb2-niw",
    series: "evidence",
    tags: ["research", "impact"],
  },
  {
    id: "o1-portfolio",
    title: "O-1 Creative Portfolio Workshop",
    category: "o-1",
    series: "portfolio",
    tags: ["portfolio", "press"],
  },
  {
    id: "eb5-essentials",
    title: "EB5 Investor Essentials",
    category: "eb5",
    series: "funding",
    tags: ["investment", "compliance"],
  },
];

const parseQueryParam = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

interface CoursesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const metadata = {
  title: "All Courses - Immigreat.ai",
  description:
    "Explore simplified immigration courses covering EB1A, EB2-NIW, O-1, and EB5 categories.",
};

export default function CoursesPage({ searchParams }: CoursesPageProps) {
  const activeCategory = typeof searchParams?.category === "string" ? searchParams.category : undefined;
  const seriesFilters = parseQueryParam(searchParams?.series);
  const tagFilters = parseQueryParam(searchParams?.tags);

  const filters: FilterState = {
    series: seriesFilters,
    tags: tagFilters,
  };

  const accentColor =
    courseCategories.find((category) => category.cat_slug === activeCategory)?.color ?? "#f97316";

  const filterSource = activeCategory
    ? courseCatalog.filter((course) => course.category === activeCategory)
    : courseCatalog;

  const visibleCourses = courseCatalog.filter((course) => {
    if (activeCategory && course.category !== activeCategory) {
      return false;
    }

    if (filters.series.length > 0 && (!course.series || !filters.series.includes(course.series))) {
      return false;
    }

    if (filters.tags.length > 0 && !filters.tags.every((tag) => course.tags.includes(tag))) {
      return false;
    }

    return true;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16 text-center">
        <h1 className="mb-6 text-4xl font-bold text-transparent lg:text-5xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
          Explore our course library
        </h1>
        <p className="mx-auto max-w-2xl text-base text-gray-600 lg:text-lg">
          A focused collection of lessons covering the immigration categories you care about most.
          Pick a track, adjust filters to match your profile, and bookmark what matters.
        </p>
      </section>

      <div className="mb-12">
        <CategoryTabs activeSlug={activeCategory} />
      </div>

      <div className="mb-10">
        <CourseFilters courses={filterSource} categoryColor={accentColor} filters={filters} />
      </div>

      <section>
        {visibleCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-10 text-center text-gray-600">
            No courses match the selected filters yet. Clear a filter or pick a different category to keep exploring.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => {
              const category = courseCategories.find((cat) => cat.cat_slug === course.category);

              return (
                <Card key={course.id} className="border-amber-100 bg-white/80 shadow-lg">
                  <CardHeader>
                    <Badge variant="outline" className="border-amber-200 text-amber-600">
                      {category?.title ?? course.category.toUpperCase()}
                    </Badge>
                    <CardTitle className="mt-3 text-xl text-gray-900">{course.title}</CardTitle>
                    <CardDescription>
                      {category?.description ?? "Practical lessons to help you move forward with confidence."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      View course outline
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-16 rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-900">Need help picking the right track?</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Start with the petition labs for a structured overview, then add evidence or portfolio boosters tailored to your
          achievements. We are keeping the catalogue intentionally short so you can prototype the perfect learning path fast.
        </p>
      </section>
    </div>
  );
}
