// src/components/bundles/BundleGrid.tsx
'use client';

import React from 'react';
import { BundleCard } from './BundleCard';
import { Bundle } from '@/lib/types/bundle';
import { categories } from '@/lib/data/categories';

interface BundleGridProps {
  bundles: Bundle[];
}

export function BundleGrid({ bundles }: BundleGridProps) {
  const getCategoryColor = (categorySlug: string) => 
    Object.values(categories).find(cat => cat.cat_slug === categorySlug)?.color || '#f59e0b';

  if (bundles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-8 rounded-2xl border-2 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No bundles found</h2>
          <p className="text-gray-600">Try selecting a different category or check back later for new bundles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {bundles.map((bundle) => (
        <BundleCard
          key={bundle.bundle_id}
          bundle={bundle}
          categoryColor={getCategoryColor(bundle.category || '')}
        />
      ))}
    </div>
  );
}
