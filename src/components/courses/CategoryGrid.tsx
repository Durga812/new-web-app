// src/components/courses/CategoryGrid.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { categories, type Category } from '@/lib/data/categories';

export function CategoryGrid() {
  const router = useRouter();
  const allCategories = Object.values(categories);

  const handleCategoryClick = (slug: string) => {
    router.push(`/courses/${slug}`);
  };

  const getLightColor = (color: string): string => {
    // Convert hex to rgba with low opacity for light background
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);  
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  const getBorderColor = (color: string): string => {
    // Convert hex to rgba with medium opacity for border
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Categories</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {allCategories.map((category) => (
          <Card
            key={category.cat_slug}
            className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-gray-200/50 bg-white/80 backdrop-blur-sm"
            onClick={() => handleCategoryClick(category.cat_slug)}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="text-center">
                <div 
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-full mx-auto mb-3 lg:mb-4 flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                  }}
                >
                  <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h3 
                  className="text-lg lg:text-xl font-bold mb-2"
                  style={{ color: category.color }}
                >
                  {category.title}
                </h3>
                <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">
                  {category.short_description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}