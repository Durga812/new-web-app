// src/components/courses/BuildYourBundleContent.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Package, ArrowLeft, X, Sparkles, ShoppingCart, Check } from 'lucide-react';
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

const PRICE_PER_COURSE = 299;
const MIN_BUNDLE = 5;

const STEP_TIERS = [
  { name: "Extraordinary", min: 40, baseTotal: 7499, perCourse: 187.48, save: 37 },
  { name: "Visionary", min: 20, baseTotal: 4499, perCourse: 224.95, save: 25 },
  { name: "Leader", min: 10, baseTotal: 2499, perCourse: 249.90, save: 16 },
  { name: "Foundation", min: 5, baseTotal: 1399, perCourse: 279.80, save: 6 }
];

const SERIES_CONFIG = [
  { key: 'criteria', label: 'Criteria', color: '#f59e0b' },
  { key: 'final-merit', label: 'Final Merits', color: '#10b981' },
  { key: 'rfe', label: 'RFE', color: '#3b82f6' },
  { key: 'comparable-evidence', label: 'Comparable Evidence', color: '#8b5cf6' },
];

const findTier = (n: number) => STEP_TIERS.find((t) => n >= t.min) || null;

export function BuildYourBundleContent({ courses, category }: BuildYourBundleContentProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [activeSeries, setActiveSeries] = useState<string>('criteria');

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
    total = totalSelected * PRICE_PER_COURSE;
  } else if (tier) {
    if (totalSelected === 5) total = 1399;
    else if (totalSelected === 10) total = 2499;
    else if (totalSelected === 20) total = 4499;
    else if (totalSelected === 40) total = 7499;
    else total = Math.round(totalSelected * tier.perCourse * 100) / 100;
    perCourse = tier.perCourse;
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

  const selectAllInSeries = (seriesKey: string) => {
    const seriesCourses = filteredCoursesBySeries[seriesKey] || [];
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      seriesCourses.forEach(course => newSet.add(course.course_id));
      return newSet;
    });
  };

  const clearAll = () => setSelectedCourses(new Set());

  const getSeriesCount = (seriesKey: string) => {
    const seriesCourses = coursesBySeries[seriesKey] || [];
    return seriesCourses.filter(course => selectedCourses.has(course.course_id)).length;
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
  const currentSeriesCourses = filteredCoursesBySeries[activeSeries] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        
        {/* Clean Header */}
        <div className="mb-8 lg:mb-12">
          <Link 
            href={`/courses/${category.cat_slug}`} 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {category.title}
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Build Your Bundle
              </h1>
              <p className="text-gray-600 mt-2">
                Select {MIN_BUNDLE} or more courses to unlock bundle pricing
              </p>
            </div>
            
            {/* Summary Stats - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              {tier && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Current Tier</div>
                  <div className="font-semibold text-gray-900">{tier.name}</div>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-500">Selected</div>
                <div className="font-semibold text-gray-900">{totalSelected} courses</div>
              </div>
              {discountPct > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">You Save</div>
                  <div className="font-semibold text-green-600">{Math.round(discountPct)}%</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search courses by title or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {totalSelected > 0 && (
              <Button
                variant="outline"
                onClick={clearAll}
                className="border-gray-300 text-gray-700"
              >
                Clear All ({totalSelected})
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Series Navigation - Sidebar on Desktop, Tabs on Mobile */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Course Series
              </h2>
              
              {/* Mobile Tabs */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
                {SERIES_CONFIG.map((series) => {
                  const count = getSeriesCount(series.key);
                  const total = (coursesBySeries[series.key] || []).length;
                  const isActive = activeSeries === series.key;
                  
                  return (
                    <button
                      key={series.key}
                      onClick={() => setActiveSeries(series.key)}
                      className={`
                        flex items-center justify-between
                        px-4 py-3 rounded-lg
                        transition-all duration-200
                        min-w-[140px] lg:w-full
                        ${isActive 
                          ? 'bg-white shadow-md border-2' 
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                        }
                      `}
                      style={{
                        borderColor: isActive ? series.color : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: series.color }}
                        />
                        <div className="text-left">
                          <div className="font-medium text-sm">{series.label}</div>
                          <div className="text-xs text-gray-500">{total} courses</div>
                        </div>
                      </div>
                      {count > 0 && (
                        <Badge 
                          className="ml-2 text-xs"
                          style={{ 
                            backgroundColor: `${series.color}20`,
                            color: series.color,
                            border: `1px solid ${series.color}40`
                          }}
                        >
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Select All Button for Current Series */}
              {currentSeriesCourses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectAllInSeries(activeSeries)}
                  className="w-full mt-4 hidden lg:flex"
                >
                  Select All in {SERIES_CONFIG.find(s => s.key === activeSeries)?.label}
                </Button>
              )}
            </div>
          </div>

          {/* Course Grid - Clean and Spacious */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Series Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: SERIES_CONFIG.find(s => s.key === activeSeries)?.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {SERIES_CONFIG.find(s => s.key === activeSeries)?.label} Series
                  </h3>
                  <Badge variant="outline">
                    {currentSeriesCourses.length} courses
                  </Badge>
                </div>
                
                {currentSeriesCourses.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllInSeries(activeSeries)}
                    className="lg:hidden"
                  >
                    Select All
                  </Button>
                )}
              </div>
              
              {/* Course List */}
              {currentSeriesCourses.length > 0 ? (
                <div className="grid gap-3 max-h-[600px] lg:max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentSeriesCourses.map((course) => (
                    <BundleCourseCard
                      key={course.course_id}
                      course={course}
                      twelveMonthOption={course.twelveMonthOption}
                      selected={selectedCourses.has(course.course_id)}
                      onToggle={() => toggleCourse(course.course_id)}
                      effectivePrice={perCourse}
                      discountPct={discountPct}
                      hasDiscount={totalSelected >= 5}
                      seriesColor={SERIES_CONFIG.find(s => s.key === activeSeries)?.color || '#6b7280'}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No courses match your search' : 'No courses in this series'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Tiers - Clean Display */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STEP_TIERS.map((t) => {
            const isActive = tier?.name === t.name;
            return (
              <div
                key={t.name}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all
                  ${isActive 
                    ? 'bg-blue-50 border-blue-500 shadow-lg scale-105' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-sm font-medium text-gray-600 mb-1">{t.name}</div>
                <div className="text-2xl font-bold text-gray-900">${t.baseTotal.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">{t.min}+ courses</div>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                  Save {t.save}%
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Fixed Checkout Bar - Clean and Minimal */}
        <div className="fixed bottom-0 left-0 right-0 lg:sticky lg:bottom-6 lg:mt-12 z-20">
          <div className="bg-white border-t lg:border lg:rounded-xl shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
              <div className="py-4 lg:p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
                
                {/* Summary */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Selected</div>
                    <div className="text-xl font-bold text-gray-900">{totalSelected} courses</div>
                  </div>
                  
                  {totalSelected > 0 && (
                    <>
                      <div className="h-10 w-px bg-gray-200" />
                      <div>
                        <div className="text-sm text-gray-500">Total Price</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            ${total.toLocaleString()}
                          </span>
                          {discountPct > 0 && (
                            <Badge className="bg-green-100 text-green-700">
                              {Math.round(discountPct)}% off
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <Button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={!meetsMin}
                  size="lg"
                  className={`
                    px-8 font-medium
                    ${meetsMin
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {meetsMin ? (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Continue to Checkout
                    </>
                  ) : (
                    `Select ${MIN_BUNDLE - totalSelected} more to continue`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <BuildBundleCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        selectedCourses={getSelectedCoursesData()}
        pricing={{
          tier: tier?.name || 'No Tier',
          tierDescription: '',
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
