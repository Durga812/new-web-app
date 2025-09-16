// src/app/courses/[slug]/build-your-bundle/page.tsx
import { notFound } from 'next/navigation';
import { getcoursesbyslug } from '@/lib/isr/data-isr';
import { getCategoryBySlug } from '@/lib/data/categories';
import { BuildYourBundleContent } from '@/components/test/BuildYourBundleContent';

interface BuildYourBundlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BuildYourBundlePageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found - Immigreat.ai',
    };
  }

  return {
    title: `Build Your ${category.title} Bundle - Immigreat.ai`,
    description: `Create a custom ${category.title} course bundle with volume discounts. Mix and match courses across different series to build your perfect learning path.`,
  };
}

export default async function BuildYourBundlePage({ params }: BuildYourBundlePageProps) {
  const { slug } = params;
  const category = getCategoryBySlug(slug);
  const allCourses = await getcoursesbyslug(slug);

  if (!category) {
    notFound();
  }

  // Filter only courses with series (individual courses) and have 12-month options
  const individualCourses = allCourses.filter(course => {
    if (!course.series) return false;
    
    // Check if course has 12-month option
    const has12MonthOption = course.course_options?.some(option => 
      option.validity === 12
    );
    
    return has12MonthOption;
  });

  return (
    <BuildYourBundleContent 
      courses={individualCourses}
      category={category}
    />
  );
}
