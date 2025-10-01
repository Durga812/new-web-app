// src/components/course-detail/RelatedSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, BookOpen, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type RelatedCourse = {
  course_id: string;
  course_slug?: string;
  title: string;
  image_url?: string;
  series: string;
  ratings?: number;
  pricing: {
    price1: {
      price: number;
    };
  };
};

export type RelatedBundle = {
  bundle_id: string;
  bundle_slug?: string;
  title: string;
  image_url?: string;
  included_course_ids: string[];
  pricing: {
    price: number;
    compared_price?: number;
  };
};

interface RelatedSectionProps {
  relatedCourses: RelatedCourse[];
  relatedBundles: RelatedBundle[];
  currentCourseCategory: string;
}

export default function RelatedSection({ 
  relatedCourses, 
  relatedBundles,
  currentCourseCategory 
}: RelatedSectionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="border-t border-gray-100 bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Related Bundles */}
        {relatedBundles.length > 0 && (
          <div className="mb-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Related Bundles
              </h2>
              <Link href={`/courses/${currentCourseCategory}?course-type=curated-bundle-courses`}>
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedBundles.slice(0, 3).map((bundle) => (
                <Card key={bundle.bundle_id} className="group overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/bundles/${bundle.bundle_slug || bundle.bundle_id}`}>
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                      {bundle.image_url ? (
                        <Image
                          src={bundle.image_url}
                          alt={bundle.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-10 w-10 text-amber-500" />
                        </div>
                      )}
                      <Badge className="absolute right-2 top-2 bg-amber-500 text-white text-xs">
                        Bundle
                      </Badge>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="mb-1 text-sm font-semibold text-gray-900 line-clamp-2">
                        {bundle.title}
                      </h3>
                      <p className="mb-3 text-xs text-gray-500">
                        {bundle.included_course_ids.length} courses
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(bundle.pricing.price)}
                          </span>
                          {bundle.pricing.compared_price && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(bundle.pricing.compared_price)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-amber-600 group-hover:underline">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Related Courses
              </h2>
              <Link href={`/courses/${currentCourseCategory}`}>
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedCourses.slice(0, 3).map((course) => (
                <Card key={course.course_id} className="group overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/courses/${course.course_slug || course.course_id}`}>
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                      {course.image_url ? (
                        <Image
                          src={course.image_url}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-10 w-10 text-amber-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {course.series}
                        </Badge>
                        {course.ratings && (
                          <div className="flex items-center gap-0.5 text-xs text-gray-600">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{course.ratings}</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="mb-3 text-sm font-semibold text-gray-900 line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900">
                          {formatPrice(course.pricing.price1.price)}
                        </span>
                        <span className="text-xs text-amber-600 group-hover:underline">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
