// src/app/bundle/[bundle_slug]/IncludedCoursesSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BundleCourseSummary } from "@/types/bundle-detail";

interface IncludedCoursesSectionProps {
  courses: BundleCourseSummary[];
}

const formatPrice = (value?: number) => {
  if (value === undefined) return undefined;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function IncludedCoursesSection({ courses }: IncludedCoursesSectionProps) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Courses inside this bundle</h2>
          <p className="text-sm text-gray-600">Explore each course that makes up this bundle.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => {
          const priceLabel = formatPrice(course.pricing?.price1?.price ?? course.pricing?.price2?.price ?? course.pricing?.price3?.price);

          return (
            <Card key={course.course_id} className="group overflow-hidden border border-amber-100 bg-white/95 transition-shadow hover:shadow-md">
              <Link href={`/course/${course.slug || course.course_id}`}>
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                  {course.image_url ? (
                    <Image
                      src={course.image_url}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-amber-500">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {course.series && (
                      <Badge variant="outline" className="text-xs">
                        {course.series}
                      </Badge>
                    )}
                    {course.tags.slice(0, 1).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs text-gray-600">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="mb-1 text-sm font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                  {course.subtitle && (
                    <p className="mb-3 text-xs text-gray-600 line-clamp-2">{course.subtitle}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                      {priceLabel ? priceLabel : "Included"}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-amber-600 group-hover:underline">
                      View course <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
