// src/components/bundles/FilterTabs.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { categories } from '@/lib/data/categories';
import { Button } from '@/components/ui/button';

export function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');
  
  const isAllActive = !activeCategory;
  const allCategories = Object.values(categories);

  const handleFilterClick = (catSlug?: string) => {
    if (!catSlug) {
      router.push('/bundles');
    } else {
      router.push(`/bundles?category=${catSlug}`);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="inline-flex gap-1 p-1 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
        {/* ALL Tab */}
        <Button
          variant={isAllActive ? "default" : "ghost"}
          size="sm"
          className={`
            px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg
            ${isAllActive 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600' 
              : 'text-gray-600 hover:text-amber-700 hover:bg-gray-50'
            }
          `}
          onClick={() => handleFilterClick()}
        >
          ALL
        </Button>

        {/* Category Filter Tabs */}
        {allCategories.map((category) => {
          const isActive = activeCategory === category.cat_slug;
          
          return (
            <Button
              key={category.cat_slug}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={`
                px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg
                ${isActive 
                  ? 'text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
              style={isActive ? {
                background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
              } : {}}
              onClick={() => handleFilterClick(category.cat_slug)}
            >
              {category.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}