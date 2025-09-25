"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShoppingCart, Star, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

type CoursePricing = {
  price: number;
  compared_price?: number;
  validity_duration: number;
  validity_type: string;
};

type Course = {
  title: string;
  course_id: string;
  enroll_id: string;
  type: string;
  category: string;
  series?: string;
  tags?: string[];
  ratings?: number;
  position?: number;
  pricing?: {
    price1?: CoursePricing;
    price2?: CoursePricing;
    price3?: CoursePricing;
  };
  image_url?: string;
};
interface IndividualCoursesSectionProps {
  category: string;
  courseTypeLabel: string;
  courses: Course[];
}

export function IndividualCoursesSection({
  category,
  courseTypeLabel,
  courses,
}: IndividualCoursesSectionProps) {
  const seriesOptions = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(course => {
      if (course.series) {
        set.add(course.series);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    courses.forEach(course => {
      const tag = course.tags?.[0];
      if (tag) tags.add(tag);
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const [activeSeries, setActiveSeries] = useState<string[]>(() => [...seriesOptions]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setActiveSeries(prev => {
      if (seriesOptions.length === 0) return [];
      if (prev.length === 0) return [...seriesOptions];
      const valid = prev.filter(series => seriesOptions.includes(series));
      const missing = seriesOptions.filter(series => !valid.includes(series));
      return [...valid, ...missing];
    });
  }, [seriesOptions]);

  const toggleSeries = (series: string) => {
    setActiveSeries(prev =>
      prev.includes(series) ? prev.filter(item => item !== series) : [...prev, series]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]
    );
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSeries =
        seriesOptions.length === 0 || (course.series ? activeSeries.includes(course.series) : true);
      const primaryTag = course.tags?.[0];
      const matchesTag = selectedTags.length === 0 || (primaryTag && selectedTags.includes(primaryTag));
      return matchesSeries && matchesTag;
    });
  }, [courses, activeSeries, selectedTags, seriesOptions]);

  const hasActiveFilters =
    (seriesOptions.length > 0 && activeSeries.length !== seriesOptions.length) || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">Filter courses</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setActiveSeries([...seriesOptions]);
                setSelectedTags([]);
              }}
              className="text-xs font-medium text-orange-600 hover:text-orange-500"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">By series</p>
            <div className="flex flex-wrap gap-2 md:flex-nowrap">
              {seriesOptions.length === 0 ? (
                <span className="text-sm text-gray-500">No series available</span>
              ) : (
                seriesOptions.map(series => {
                  const isActive = activeSeries.includes(series);
                  return (
                    <button
                      key={series}
                      type="button"
                      onClick={() => toggleSeries(series)}
                      aria-pressed={isActive}
                      className={`flex h-9 flex-1 items-center justify-between rounded-full border px-4 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 md:flex-none md:w-auto ${
                        isActive
                          ? "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="pr-2 text-sm font-medium">{series}</span>
                      <span
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                          isActive ? "bg-white/80" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            isActive ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">By tags</p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.length === 0 ? (
                <span className="text-sm text-gray-500">No tags available</span>
              ) : (
                tagOptions.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-orange-500 bg-orange-100 text-orange-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              {formatCategoryName(category)} · {courseTypeLabel}
            </p>
            <p className="text-base font-semibold text-gray-900">
              {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"} available now
            </p>
          </div>
          {hasActiveFilters && (
            <p className="text-xs text-gray-500">
              Filters applied: {activeSeries.length} series / {selectedTags.length} tags
            </p>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-gray-800">No courses match the current filters</p>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting the series or tag filters to discover more learning paths.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map(course => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const formatLabel = (value?: string) => {
  if (!value) return "";
  return value
    .split("-")
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatCategoryName = (value: string) => value.replace(/-/g, " ").toUpperCase();

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

type PricingKey = keyof NonNullable<Course["pricing"]>;

type CoursePricingOption = {
  key: PricingKey;
  price: number;
  compared_price: number | undefined;
  validity_duration: number;
  validity_type: string;
};

const pricingKeys: PricingKey[] = ["price1", "price2", "price3"];

function CourseCard({ course }: { course: Course }) {
  const pricingOptions = useMemo(() => {
    return pricingKeys
      .map(key => {
        const pricing = course.pricing?.[key];
        if (!pricing) return undefined;
        return {
          key,
          price: pricing.price,
          compared_price: pricing.compared_price,
          validity_duration: pricing.validity_duration,
          validity_type: pricing.validity_type,
        } satisfies CoursePricingOption;
      })
      .filter((option): option is CoursePricingOption => Boolean(option));
  }, [course.pricing]);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  useEffect(() => {
    if (selectedOptionIndex >= pricingOptions.length) {
      setSelectedOptionIndex(0);
    }
  }, [pricingOptions, selectedOptionIndex]);

  const selectedOption = pricingOptions[selectedOptionIndex];
  const hasDiscount =
    selectedOption && selectedOption.compared_price && selectedOption.compared_price > selectedOption.price;

  const cartItem = useCartStore(state =>
    state.items.find(item => item.productId === course.course_id && item.type === "course"),
  );
  const addItemToCart = useCartStore(state => state.addItem);
  const isInCart = Boolean(cartItem);
  const cartPricingKey = cartItem?.pricingKey;

  useEffect(() => {
    if (cartPricingKey) {
      const cartIndex = pricingOptions.findIndex(option => option.key === cartPricingKey);
      if (cartIndex >= 0 && cartIndex !== selectedOptionIndex) {
        setSelectedOptionIndex(cartIndex);
      }
    }
  }, [cartPricingKey, pricingOptions, selectedOptionIndex]);

  const handleAddToCart = () => {
    if (!selectedOption || isInCart) return;

    addItemToCart({
      id: course.course_id,
      productId: course.course_id,
      type: "course",
      productType: course.type,
      title: course.title,
      price: selectedOption.price,
      currency: "USD",
      comparedPrice: selectedOption.compared_price,
      imageUrl: course.image_url,
      accessPeriodLabel: `${selectedOption.validity_duration} ${formatLabel(selectedOption.validity_type)} access`,
      validityDuration: selectedOption.validity_duration,
      validityType: selectedOption.validity_type,
      category: course.category,
      pricingKey: selectedOption.key,
      enrollId: course.enroll_id,
    });
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-2 p-4">
        {course.series && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            {formatLabel(course.series)} Series
          </Badge>
        )}
        {course.tags?.slice(0, 2).map(tag => (
          <Badge key={tag} variant="outline" className="border-gray-200 text-gray-600">
            #{formatLabel(tag)}
          </Badge>
        ))}
      </div>

      <div className="relative mx-4 h-40 overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 via-white to-orange-100 text-amber-600">
            <span className="text-sm font-semibold">Immigreat Course</span>
          </div>
        )}

        {course.ratings && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-600 shadow">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {course.ratings.toFixed(1)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Select access period
          </p>
          {pricingOptions.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {pricingOptions.map((option, index) => {
                const isSelected = index === selectedOptionIndex;
                const isOptionInCart = option.key === cartPricingKey;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedOptionIndex(index)}
                    aria-pressed={isSelected}
                    disabled={isInCart && !isOptionInCart}
                    className={`relative rounded-lg border px-3 py-2 text-left text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                      isOptionInCart
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : isSelected
                          ? "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow"
                          : "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    }`}
                  >
                    {isOptionInCart && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 shadow">
                        <Check className="h-3 w-3" /> In cart
                      </span>
                    )}
                    <span className="block text-sm font-semibold">
                      {option.validity_duration} {formatLabel(option.validity_type)}
                    </span>
                    <span className={isOptionInCart ? "text-emerald-600" : isSelected ? "text-white/80" : "text-gray-400"}>
                      {formatPrice(option.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
              Pricing coming soon
            </div>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between">
          {selectedOption ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Current plan</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(selectedOption.price)}</span>
                {selectedOption.compared_price && (
                  <span className="text-sm font-medium text-gray-400 line-through">
                    {formatPrice(selectedOption.compared_price)}
                  </span>
                )}
              </div>
              {hasDiscount && selectedOption.compared_price && (
                <p className="text-xs font-semibold text-emerald-600">
                  You save {formatPrice(selectedOption.compared_price - selectedOption.price)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select an access option to see pricing.</p>
          )}

          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedOption || isInCart}
            className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-5 text-white shadow-lg shadow-orange-200/50 hover:from-amber-500 hover:to-orange-500"
          >
            {isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {isInCart ? "In cart" : "Add to cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}
