// src/components/courses/IndividualCoursesContent.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Sparkles, Search, X } from 'lucide-react';
import { IndividualCourseCard } from './IndividualCourseCard';
import { SeriesFilterCard } from './SeriesFilterCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Course } from '@/lib/types/course';
import type { Category } from '@/lib/data/categories';

interface IndividualCoursesContentProps {
  courses: Course[];
  category: Category;
}

// Series metadata with descriptions
const seriesMetadata: Record<string, { title: string; description: string; color: string }> = {
  'criteria': {
    title: 'Criteria',
    description: 'Master EB1A eligibility criteria',
    color: '#f59e0b', // amber
  },
  'rfe': {
    title: 'RFE',
    description: 'Handle Request for Evidence',
    color: '#3b82f6', // blue
  },
  'final-merit': {
    title: 'Final Merit',
    description: 'Build compelling final merits',
    color: '#10b981', // emerald
  },
  'comparable-evidence': {
    title: 'Comparable Evidence',
    description: 'Present alternative evidence',
    color: '#8b5cf6', // violet
  }
};

export function IndividualCoursesContent({ courses, category }: IndividualCoursesContentProps) {
  // State for active series filters - all active by default
  const [activeSeries, setActiveSeries] = useState<Set<string>>(
    new Set(['criteria', 'rfe', 'final-merit', 'comparable-evidence'])
  );

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    
    const query = searchQuery.toLowerCase().trim();
    
    return courses.filter(course => {
      // Search in title
      if (course.title?.toLowerCase().includes(query)) return true;
      
      // Search in series
      if (course.series?.toLowerCase().includes(query)) return true;
      
      // Search in tags
      if (course.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      
      // Search in short description
      if (course.description?.short?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [courses, searchQuery]);

  // Group filtered courses by series
  const coursesBySeries = useMemo(() => {
    const grouped: Record<string, Course[]> = {};
    
    filteredCourses.forEach(course => {
      const series = course.series || 'uncategorized';
      if (!grouped[series]) {
        grouped[series] = [];
      }
      grouped[series].push(course);
    });

    // Sort courses within each series
    Object.keys(grouped).forEach(series => {
      grouped[series].sort((a, b) => {
        const aTag = a.tags?.[0] || '';
        const bTag = b.tags?.[0] || '';
        return aTag.localeCompare(bTag) || (a.title || '').localeCompare(b.title || '');
      });
    });

    return grouped;
  }, [filteredCourses]);

  // Get available series from actual data
  const availableSeries = Object.keys(coursesBySeries);

  // Toggle series filter
  const toggleSeries = (series: string) => {
    setActiveSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(series)) {
        newSet.delete(series);
      } else {
        newSet.add(series);
      }
      return newSet;
    });
  };

  // Get active series in order
  const activeSeriesList = availableSeries.filter(s => activeSeries.has(s));
  
  // Calculate grid columns based on active series count
  const getContainerClass = () => {
    const count = activeSeriesList.length;
    switch(count) {
      case 1: 
        // Single series shows cards in responsive grid
        return '';
      case 2: 
        // Two columns for two series
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8';
      case 3: 
        // Three columns for three series
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
      case 4: 
      default: 
        // Four columns for four series
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8';
    }
  };

  const getLightColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Count total filtered courses in active series
  const totalFilteredCourses = activeSeriesList.reduce((acc, s) => 
    acc + (coursesBySeries[s]?.length || 0), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-100/30 via-orange-50/20 to-transparent">
        <div className="absolute inset-0 bg-grid-gray-100/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <Link href="/courses" className="text-gray-600 hover:text-amber-600 transition-colors">
              Courses
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              href={`/courses/${category.cat_slug}`}
              className="hover:text-amber-600 transition-colors"
              style={{ color: category.color }}
            >
              {category.title}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">Individual Courses</span>
          </div>

          {/* Page Title */}
          <div className="text-center mb-8">
            <Badge 
              className="mb-4 px-4 py-1.5 text-white font-medium"
              style={{ backgroundColor: category.color }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              INDIVIDUAL COURSES
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              {category.title} Individual Courses
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Master specific aspects of your {category.title} petition with targeted, in-depth courses
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Search Bar */}
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, series, tags, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 bg-white border-gray-300 focus:border-amber-400 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Search: <span>&quot;{searchQuery}&quot;</span>
              </Badge>
              <span className="text-sm text-gray-600">
                Found {totalFilteredCourses} {totalFilteredCourses === 1 ? 'course' : 'courses'}
              </span>
            </div>
          )}
        </Card>

        {/* Series Filter */}
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" style={{ color: category.color }} />
            <h2 className="text-lg font-semibold text-gray-900">Filter by Series</h2>
            <Badge variant="outline" className="ml-auto">
              {activeSeriesList.length} of {availableSeries.length} selected
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.keys(seriesMetadata).map(series => {
              const metadata = seriesMetadata[series];
              const courseCount = coursesBySeries[series]?.length || 0;
              
              return (
                <SeriesFilterCard
                  key={series}
                  series={series}
                  title={metadata.title}
                  description={metadata.description}
                  color={metadata.color}
                  isActive={activeSeries.has(series)}
                  courseCount={courseCount}
                  onToggle={() => toggleSeries(series)}
                />
              );
            })}
          </div>
        </Card>

        {/* Results Summary */}
        <div className="text-center">
          <p className="text-gray-600">
            Showing {totalFilteredCourses} courses 
            {activeSeriesList.length < availableSeries.length && ` in ${activeSeriesList.length} series`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {totalFilteredCourses === 0 && searchQuery ? (
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-4">
                No courses found matching <span>&quot;{searchQuery}&quot;</span> in the selected series
              </p>
              <Button 
                variant="outline" 
                onClick={clearSearch}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Clear Search
              </Button>
            </div>
          </Card>
        ) : activeSeriesList.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Series Selected</h3>
              <p className="text-gray-600">
                Please select at least one series from the filters above to view courses
              </p>
            </div>
          </Card>
        ) : activeSeriesList.length === 1 ? (
          // Single series - show cards in responsive grid
          <div className="space-y-4">
            {activeSeriesList.map(series => {
              const seriesCourses = coursesBySeries[series] || [];
              const metadata = seriesMetadata[series] || {
                title: series.replace(/-/g, ' ').toUpperCase(),
                color: '#6b7280'
              };
              
              if (seriesCourses.length === 0) return null;
              
              return (
                <div key={series}>
                  {/* Series Header */}
                  <div 
                    className="bg-white/90 backdrop-blur-md rounded-lg p-3 mb-4 border shadow-sm"
                    style={{ 
                      borderColor: `${metadata.color}40`,
                      backgroundColor: getLightColor(metadata.color)
                    }}
                  >
                    <h3 
                      className="font-bold text-lg"
                      style={{ color: metadata.color }}
                    >
                      {metadata.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {seriesCourses.length} {seriesCourses.length === 1 ? 'course' : 'courses'}
                    </p>
                  </div>
                  
                  {/* Course Cards in responsive grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {seriesCourses.map(course => (
                      <IndividualCourseCard
                        key={course.course_id}
                        course={course}
                        categoryColor={category.color}
                        seriesColor={metadata.color}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Multiple series - show in columns
          <div className={getContainerClass()}>
            {activeSeriesList.map(series => {
              const seriesCourses = coursesBySeries[series] || [];
              const metadata = seriesMetadata[series] || {
                title: series.replace(/-/g, ' ').toUpperCase(),
                color: '#6b7280'
              };
              
              if (seriesCourses.length === 0) return null;
              
              return (
                <div key={series} className="space-y-4">
                  {/* Series Header */}
                  <div 
                    className="sticky top-16 z-10 bg-white/90 backdrop-blur-md rounded-lg p-3 border shadow-sm"
                    style={{ 
                      borderColor: `${metadata.color}40`,
                      backgroundColor: getLightColor(metadata.color)
                    }}
                  >
                    <h3 
                      className="font-bold text-base lg:text-lg"
                      style={{ color: metadata.color }}
                    >
                      {metadata.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {seriesCourses.length} {seriesCourses.length === 1 ? 'course' : 'courses'}
                    </p>
                  </div>
                  
                  {/* Course Cards - responsive grid within column */}
                  <div className={`grid gap-4 ${
                    activeSeriesList.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                  }`}>
                    {seriesCourses.map(course => (
                      <IndividualCourseCard
                        key={course.course_id}
                        course={course}
                        categoryColor={category.color}
                        seriesColor={metadata.color}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default IndividualCoursesContent;
