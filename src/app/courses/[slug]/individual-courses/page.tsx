// src/app/courses/[slug]/individual-courses/page.tsx
import { notFound } from 'next/navigation';
import { getcoursesbyslug } from '@/lib/isr/data-isr';
import { IndividualCoursesContent } from '@/components/courses/IndividualCoursesContent';
import { getCategoryBySlug } from '@/lib/data/categories';

interface IndividualCoursesPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: IndividualCoursesPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found - Immigreat.ai',
    };
  }

  return {
    title: `${category.title} Individual Courses - Immigreat.ai`,
    description: `Browse individual ${category.title} courses by criteria. Master specific aspects of your ${category.title} petition with targeted learning.`,
  };
}

export default async function IndividualCoursesPage({ params }: IndividualCoursesPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const allCourses = await getcoursesbyslug(slug);

  if (!category) {
    notFound();
  }

  // Filter only courses with series (individual courses)
  const individualCourses = allCourses.filter(course => course.series);

  return (
    <IndividualCoursesContent 
      courses={individualCourses}
      category={category}
    />
  );
}