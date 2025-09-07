// src/app/courses/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { CategoryTabs } from '@/components/courses/CategoryTabs';
import { getCategoryBySlug, getAllCategories } from '@/lib/data/categories';
import { getcoursesbyslug } from '@/lib/isr/data-isr';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const courses = await getcoursesbyslug(slug);

  if (!category) {
    notFound();
  }

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

  return (
    
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
        <div className="mb-12">
          <CategoryTabs activeSlug={slug} />
        </div>

        {/* Placeholder for future course content */}
        <div className="text-center py-16">
          <div 
            className="inline-block p-8 rounded-2xl border-2"
            style={{
              backgroundColor: getLightColor(category.color),
              borderColor: getBorderColor(category.color),
            }}
          >
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Course Content Coming Soon
            </h2>
            <p className="text-gray-600">
              We're preparing comprehensive {category.title} courses and resources for you.
              <br />
              Stay tuned for updates!
            </p>
            
          </div>
          <pre>{JSON.stringify(courses, null, 2)}</pre>
        </div>
      </div>
    
  );
}
