// src/components/courses/CourseGrid.tsx
'use client';

import React from 'react';
import { CourseCard } from './CourseCard';
import { Course } from '@/lib/types/course';

interface CourseGridProps {
  courses: Course[];
  categoryColor: string;
}

export function CourseGrid({ courses, categoryColor }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-8 rounded-2xl border-2 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            No courses found
          </h2>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.course_id}
          course={course}
          categoryColor={categoryColor}
        />
      ))}
    </div>
  );
}