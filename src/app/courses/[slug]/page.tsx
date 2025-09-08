// src/app/courses/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { CategoryTabs } from '@/components/courses/CategoryTabs';
import { CourseFilters } from '@/components/courses/CourseFilters';
import { CourseGrid } from '@/components/courses/CourseGrid';
import { getCategoryBySlug, getAllCategories } from '@/lib/data/categories';
import { getcoursesbyslug } from '@/lib/isr/data-isr';
import { FilterState } from '@/lib/types/course';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    series?: string;
    tags?: string;
  }>;
}

// Generate static paths for all categories
export async function generateStaticParams() {
  const categories = getAllCategories();
  
  return categories.map((category) => ({
    slug: category.cat_slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found - Immigreat.ai',
    };
  }

  return {
    title: `${category.title} Courses - Immigreat.ai`,
    description: `${category.full_description} Learn more about ${category.title} immigration path with our expert-guided courses.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const category = getCategoryBySlug(slug);
  const allCourses = await getcoursesbyslug(slug);

  if (!category) {
    notFound();
  }

  // Parse URL parameters into arrays for multiple selection
  const parseFilterArray = (paramValue: string | undefined): string[] => {
    if (!paramValue) return [];
    return paramValue.split(',').filter(item => item.trim().length > 0);
  };

  // Create filters from search params
  const filters: FilterState = {
    series: parseFilterArray(searchParamsResolved.series),
    tags: parseFilterArray(searchParamsResolved.tags),
  };

  // Apply search parameter filters with multiple selection support
  const filteredCourses = allCourses.filter(course => {
    // If series filters are applied, course must match at least one selected series
    if (filters.series.length > 0 && !filters.series.includes(course.series_slug)) {
      return false;
    }
    
    // If tag filters are applied, course must have at least one of the selected tags
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(selectedTag => 
        course.tags.includes(selectedTag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });

  // Sort courses by tags (same tags together)
  const sortedCourses = filteredCourses.sort((a, b) => {
    const aFirstTag = a.tags[0] || '';
    const bFirstTag = b.tags[0] || '';
    return aFirstTag.localeCompare(bFirstTag);
  });

  const getLightColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  const getBorderColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  };

  // Generate filter summary text
  const getFilterSummary = (): string => {
    const parts: string[] = [];
    
    if (filters.series.length > 0) {
      const seriesText = filters.series.length === 1 
        ? filters.series[0].replace('-', ' ')
        : `${filters.series.length} series`;
      parts.push(`in ${seriesText}`);
    }
    
    if (filters.tags.length > 0) {
      const tagsText = filters.tags.length === 1 
        ? filters.tags[0] 
        : `${filters.tags.length} tags`;
      parts.push(`tagged with ${tagsText}`);
    }
    
    return parts.length > 0 ? ` ${parts.join(' and ')}` : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div 
            className="inline-block px-8 py-4 rounded-2xl border-2 mb-6"
            style={{
              backgroundColor: getLightColor(category.color),
              borderColor: getBorderColor(category.color),
            }}
          >
            <h1 
              className="text-4xl sm:text-5xl font-bold mb-2"
              style={{ color: category.color }}
            >
              {category.title} Courses
            </h1>
            <p 
              className="text-lg font-medium"
              style={{ color: category.color }}
            >
              {category.short_description}
            </p>
          </div>
          
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {category.full_description}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <CategoryTabs activeSlug={slug} />
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600 text-center">
            Showing {sortedCourses.length} of {allCourses.length} courses
            {getFilterSummary()}
          </p>
        </div>

        {/* Filter Implementation */}
        <div className="mb-8">
          <CourseFilters 
            courses={allCourses} 
            categoryColor={category.color}
            filters={filters}
          />
        </div>

        {/* Course Cards Render */}
        <CourseGrid 
          courses={sortedCourses} 
          categoryColor={category.color}
        />

        {/* No Results State */}
        {sortedCourses.length === 0 && (
          <div className="text-center py-16">
            <div 
              className="inline-block p-8 rounded-2xl border-2"
              style={{
                backgroundColor: getLightColor(category.color),
                borderColor: getBorderColor(category.color),
              }}
            >
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                No courses found
              </h2>
              <p className="text-gray-600">
                Try adjusting your filters or check back later for new content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}