// src/components/courses/BuildYourBundleContent.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Package, ArrowLeft, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BundleCourseCard } from './BundleCourseCard';
import { BuildBundleCheckoutModal } from './BuildBundleCheckoutModal';
import type { Course, CourseOption, CourseWithTwelveMonthOption } from '@/lib/types/course';
import type { Category } from '@/lib/data/categories';

interface BuildYourBundleContentProps {
  courses: Course[];
  category: Category;
}

// Pricing Configuration
const PRICE_PER_COURSE = 299;
const MIN_BUNDLE = 5;

// Pricing tiers
const STEP_TIERS = [
  {
    name: "Extraordinary",
    desc: "Complete EB1A mastery",
    min: 40,
    bundlePrice: 7499,
    color: "#7c3aed",
    emoji: "🚀"
  },
  {
    name: "Visionary", 
    desc: "RFE-proof strategies",
    min: 20,
    bundlePrice: 4499,
    color: "#2563eb",
    emoji: "💡"
  },
  {
    name: "Leader",
    desc: "Complete case building",
    min: 10,
    bundlePrice: 2499,
    color: "#059669",
    emoji: "🎯"
  },
  {
    name: "Foundation",
    desc: "Essential criteria mastery",
    min: 5,
    bundlePrice: 1399,
    color: "#f59e0b",
    emoji: "🏗️"
  }
];

// Series configuration
const SERIES_CONFIG = [
  { key: 'criteria', label: 'Criteria', color: '#f59e0b', emoji: '📋' },
  { key: 'final-merit', label: 'Final Merits', color: '#10b981', emoji: '⭐' },
  { key: 'rfe', label: 'RFE', color: '#3b82f6', emoji: '📝' },
  { key: 'comparable-evidence', label: 'Comparable', color: '#8b5cf6', emoji: '🔍' },
];

const findTier = (n: number) => STEP_TIERS.find((t) => n >= t.min) || null;
type StepTier = (typeof STEP_TIERS)[number];

const roundToCurrency = (value: number) => Math.round(value * 100) / 100;
const getTierPerCourse = (tier: StepTier) => tier.bundlePrice / tier.min;
const getTierDiscountPercent = (tier: StepTier) =>
  ((PRICE_PER_COURSE - getTierPerCourse(tier)) / PRICE_PER_COURSE) * 100;

export function BuildYourBundleContent({ courses, category }: BuildYourBundleContentProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  // Default to first series on mobile
  const [activeSeries, setActiveSeries] = useState<string | null>('criteria');

  // Group courses by series
  const coursesBySeries = useMemo(() => {
    const grouped: Record<string, CourseWithTwelveMonthOption[]> = {
      criteria: [],
      'final-merit': [],
      rfe: [],
      'comparable-evidence': [],
    };

    courses.forEach(course => {
      const series = course.series || 'uncategorized';
      if (!grouped[series]) return;

      const twelveMonthOption = course.course_options?.find(
        (option): option is CourseOption => option.validity === 12
      );
      if (twelveMonthOption) {
        const courseWithOption: CourseWithTwelveMonthOption = {
          ...course,
          twelveMonthOption,
        };
        grouped[series].push(courseWithOption);
      }
    });

    Object.keys(grouped).forEach(series => {
      grouped[series].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    });

    return grouped;
  }, [courses]);

  // Filter courses by search
  const filteredCoursesBySeries = useMemo(() => {
    if (!searchQuery.trim()) return coursesBySeries;
    const query = searchQuery.toLowerCase().trim();
    const filtered: typeof coursesBySeries = {};

    Object.keys(coursesBySeries).forEach(series => {
      filtered[series] = coursesBySeries[series].filter(course =>
        course.title?.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });

    return filtered;
  }, [coursesBySeries, searchQuery]);

  // Calculate pricing
  const totalSelected = selectedCourses.size;
  const tier = findTier(totalSelected);
  
  let total = 0;
  let perCourse = PRICE_PER_COURSE;
  
  if (totalSelected === 0) {
    total = 0;
  } else if (totalSelected < MIN_BUNDLE) {
    total = roundToCurrency(totalSelected * PRICE_PER_COURSE);
  } else if (tier) {
    const tierPerCourse = getTierPerCourse(tier);
    const calculatedTotal = roundToCurrency(totalSelected * tierPerCourse);
    total = calculatedTotal;
    perCourse = roundToCurrency(calculatedTotal / totalSelected);
  } else {
    total = roundToCurrency(totalSelected * PRICE_PER_COURSE);
  }

  const rack = totalSelected * PRICE_PER_COURSE;
  const discountAmount = Math.max(0, rack - total);
  const discountPct = rack ? (discountAmount / rack) * 100 : 0;

  // Selection handlers
  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const removeSelectedCourses = React.useCallback((courseIds: string[]) => {
    if (!courseIds.length) return;
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      courseIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const selectAllInSeries = (seriesKey: string) => {
    const seriesCourses = filteredCoursesBySeries[seriesKey] || [];
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      seriesCourses.forEach(course => newSet.add(course.course_id));
      return newSet;
    });
  };

  const clearSeries = (seriesKey: string) => {
    const seriesCourses = coursesBySeries[seriesKey] || [];
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      seriesCourses.forEach(course => newSet.delete(course.course_id));
      return newSet;
    });
  };

  const getSeriesCount = (seriesKey: string) => {
    const seriesCourses = coursesBySeries[seriesKey] || [];
    return seriesCourses.filter(course => selectedCourses.has(course.course_id)).length;
  };

  // Check if all courses in series are selected
  const isAllSelected = (seriesKey: string) => {
    const seriesCourses = filteredCoursesBySeries[seriesKey] || [];
    if (seriesCourses.length === 0) return false;
    return seriesCourses.every(course => selectedCourses.has(course.course_id));
  };

  const getSelectedCoursesData = () => {
    const selected: CourseWithTwelveMonthOption[] = [];
    Object.values(coursesBySeries).flat().forEach(course => {
      if (selectedCourses.has(course.course_id)) {
        selected.push(course);
      }
    });
    return selected;
  };

  const meetsMin = totalSelected >= MIN_BUNDLE;

  const scrollToBundleOffering = () => {
    document.getElementById('bundle-offering')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20 pb-32 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        
        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <Link href={`/courses/${category.cat_slug}`} className="inline-flex items-center text-sm text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {category.title}
          </Link>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-sm mb-6">
          <Link href="/courses" className="text-gray-600 hover:text-amber-600">Courses</Link>
          <span className="text-gray-400">/</span>
          <Link href={`/courses/${category.cat_slug}`} className="hover:text-amber-600" style={{ color: category.color }}>
            {category.title}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">Build Bundle</span>
        </div>

        {/* Header - Simplified */}
        <div className="text-center mb-6 lg:mb-8">
          <Badge 
                        className="mb-4 px-4 py-1.5 text-white font-medium"
                        style={{ backgroundColor: category.color }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        BUILD YOUR OWN BUNDLE
                      </Badge>
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-2">
            Build Your {category.title} Bundle
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Select {MIN_BUNDLE}+ courses for bundle pricing • 12 months access each •
            <button 
              onClick={scrollToBundleOffering}
              className='font-medium text-blue-600 hover:text-blue-700 ml-1 transition-colors'
            >
              View Bundle Package Offering
            </button>
          </p>
        </div>

        {/* Search Bar - Mobile Optimized */}
        <div className="mb-4 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 lg:h-12 text-sm lg:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Series Tabs - More prominent */}
        <div className="lg:hidden mb-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-2 rounded-lg border border-amber-200 mb-2">
            <p className="text-xs text-center text-amber-700 font-medium">👇 Select a series to view courses</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {SERIES_CONFIG.map((series) => {
              const count = getSeriesCount(series.key);
              const total = (coursesBySeries[series.key] || []).length;
              return (
                <button
                  key={series.key}
                  onClick={() => setActiveSeries(series.key)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    activeSeries === series.key 
                      ? 'shadow-lg transform scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: activeSeries === series.key ? series.color : undefined,
                    backgroundColor: activeSeries === series.key ? `${series.color}10` : 'white',
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>{series.emoji}</span>
                    <span>{series.label}</span>
                    {count > 0 && (
                      <Badge className="ml-1 px-1 py-0 text-xs" style={{ backgroundColor: series.color, color: 'white' }}>
                        {count}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{total} courses</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Series Content - Always show active series */}
        <div className="lg:hidden mb-6">
          {activeSeries && (
            <Card className="bg-white/80 backdrop-blur-sm ">
              <CardContent className="p-4">
                {(() => {
                  const series = SERIES_CONFIG.find(s => s.key === activeSeries);
                  const seriesCourses = filteredCoursesBySeries[activeSeries] || [];
                  if (!series) return null;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold flex items-center gap-2" style={{ color: series.color }}>
                          <span>{series.emoji}</span>
                          {series.label}
                        </h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => selectAllInSeries(activeSeries)}
                            className={`text-xs h-7 ${isAllSelected(activeSeries) ? 'bg-green-100 border-green-400' : ''}`}
                          >
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => clearSeries(activeSeries)}
                            className="text-xs h-7"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {seriesCourses.map((course) => (
                          <BundleCourseCard
                            key={course.course_id}
                            course={course}
                            twelveMonthOption={course.twelveMonthOption}
                            selected={selectedCourses.has(course.course_id)}
                            onToggle={() => toggleCourse(course.course_id)}
                            effectivePrice={perCourse}
                            discountPct={discountPct}
                            hasDiscount={totalSelected >= 5}
                            seriesColor={series.color}
                          />
                        ))}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {SERIES_CONFIG.map((series) => {
            const seriesCourses = filteredCoursesBySeries[series.key] || [];
            const selectedCount = getSeriesCount(series.key);
            const allSelected = isAllSelected(series.key);
            
            return (
              <Card key={series.key} className="bg-white/80 backdrop-blur-sm p-0.5 border border-gray-200/50">
                <CardContent className="p-4">
                  {/* Series Header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold flex items-center gap-1" style={{ color: series.color }}>
                        <span>{series.emoji}</span>
                        <span>{series.label}</span>
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {selectedCount}/{seriesCourses.length}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectAllInSeries(series.key)}
                        className={`flex-1 text-xs h-7 ${allSelected ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearSeries(series.key)}
                        className="flex-1 text-xs h-7"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Course List - No scroll */}
                  <div className="space-y-2">
                    {seriesCourses.map((course) => (
                      <BundleCourseCard
                        key={course.course_id}
                        course={course}
                        twelveMonthOption={course.twelveMonthOption}
                        selected={selectedCourses.has(course.course_id)}
                        onToggle={() => toggleCourse(course.course_id)}
                        effectivePrice={perCourse}
                        discountPct={discountPct}
                        hasDiscount={totalSelected >= 5}
                        seriesColor={series.color}
                      />
                    ))}
                    
                    {seriesCourses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No courses found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bundle Package Offering - Improved */}
        <div className='p-4 lg:p-8 max-w-7xl mx-auto' id='bundle-offering'>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 lg:p-8 border border-amber-200 shadow-lg">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Bundle Package Offering
                </h2>
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-gray-600">Save more with larger bundles</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {STEP_TIERS.map((t) => (
                <div
                  key={t.name}
                  className={`p-3 lg:p-4 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                    tier?.name === t.name ? 'border-2 shadow-xl' : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: tier?.name === t.name ? t.color : undefined,
                    backgroundColor: tier?.name === t.name ? `${t.color}10` : 'white',
                  }}
                >
                  <div className="text-sm lg:text-base font-bold flex items-center justify-center gap-1 mb-1">
                    <span className="text-2xl">{t.emoji}</span>
                    <span>{t.name}</span>
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600 mb-2">
                    {t.min}+ courses
                  </div>
                  <div className="text-lg lg:text-xl font-bold mb-1" style={{ color: t.color }}>
                    ${t.bundlePrice.toLocaleString()}
                  </div>
                  <div className="text-xs lg:text-sm font-bold text-green-600">
                    Save {Math.round(getTierDiscountPercent(t))}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Bar - Mobile Optimized */}
        <div className="fixed bottom-0 left-0 right-0 z-20 lg:sticky lg:bottom-4 ">
          <Card className="rounded-none lg:rounded-lg bg-white/95 backdrop-blur-xl border-t lg:border shadow-2xl lg:shadow-xl py-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                {/* Stats */}
                <div className="flex items-center gap-3 text-sm lg:text-base">
                  <Badge className="bg-blue-500 text-white">
                    {totalSelected} Selected
                  </Badge>
                  <div className="font-bold">
                    ${total.toLocaleString()}
                  </div>
                  {tier && (
                    <Badge variant="outline" style={{ borderColor: tier.color, color: tier.color }}>
                      {tier.emoji} {tier.name}
                    </Badge>
                  )}
                  {discountPct > 0 && (
                    <Badge className="bg-green-500 text-white">
                      {Math.round(discountPct)}% OFF
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <Button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={!meetsMin}
                  className={`w-full lg:w-auto ${
                    meetsMin
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {meetsMin ? 'Review Bundle & Checkout' : `Select ${MIN_BUNDLE - totalSelected} more`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Checkout Modal */}
      <BuildBundleCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        selectedCourses={getSelectedCoursesData()}
        onRemoveCourses={removeSelectedCourses}
        pricing={{
          tier: tier?.name || 'No Tier',
          tierDescription: tier?.desc || '',
          pricePerCourseEffective: perCourse,
          rackSubtotal: rack,
          discountAmount,
          discountPct,
          total,
          perCourse: total / Math.max(1, totalSelected),
        }}
        category={category}
      />
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
