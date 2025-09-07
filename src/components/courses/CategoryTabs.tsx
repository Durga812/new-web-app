// src/components/courses/CategoryTabs.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { categories, type Category } from '@/lib/data/categories';
import { Button } from '@/components/ui/button';

interface CategoryTabsProps {
  activeSlug?: string;
}

export function CategoryTabs({ activeSlug }: CategoryTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isAllActive = pathname === '/courses' || !activeSlug;
  const allCategories = Object.values(categories);

  const handleTabClick = (slug?: string) => {
    if (!slug) {
      router.push('/courses');
    } else {
      router.push(`/courses/${slug}`);
    }
  };

  const getActiveCategory = (): Category | null => {
    if (!activeSlug) return null;
    return Object.values(categories).find(cat => cat.cat_slug === activeSlug) || null;
  };

  const activeCategory = getActiveCategory();

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
          onClick={() => handleTabClick()}
        >
          ALL
        </Button>

        {/* Category Tabs */}
        {allCategories.map((category) => {
          const isActive = activeSlug === category.cat_slug;
          
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
              onClick={() => handleTabClick(category.cat_slug)}
            >
              {category.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}