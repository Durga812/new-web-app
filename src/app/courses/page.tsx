// src/app/courses/page.tsx
import { CategoryTabs } from '@/components/courses/CategoryTabs';
import { CategoryGrid } from '@/components/courses/CategoryGrid';
import { GuidanceTable } from '@/components/courses/GuidanceTable';

export const metadata = {
  title: 'All Courses - Immigreat.ai',
  description: 'Expert-guided immigration courses for EB1A, EB2-NIW, O-1, and EB5. Choose the right path for your American dream.',
};

export default function CoursesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-6">
          All Courses
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Expert-guided immigration courses designed to help you navigate your path to the American dream. 
          Choose from EB1A, EB2-NIW, O-1, and EB5 programs with comprehensive guidance and support.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-16">
        <CategoryTabs />
      </div>

      {/* Category Cards */}
      <div className="mb-20">
        <CategoryGrid />
      </div>

      {/* Guidance Table */}
      <GuidanceTable />
    </div>
  );
}