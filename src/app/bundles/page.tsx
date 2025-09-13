// src/app/bundles/page.tsx
import { Suspense } from 'react';
import { FilterTabs } from '@/components/bundles/FilterTabs';
import { BundleGrid } from '@/components/bundles/BundleGrid';
import { getBundles } from '@/lib/isr/data-isr';

export const metadata = {
  title: 'Course Bundles - Immigreat.ai',
  description: 'Comprehensive immigration course bundles for EB1A, EB2-NIW, O-1, and EB5. Save money with our expertly curated bundle packages.',
};

interface BundlesPageProps {
  searchParams: Promise<{ category?: string }>;
}

async function BundlesContent({ searchParams }: BundlesPageProps) {
  const { category } = await searchParams;
  const allBundles = await getBundles();
  const filteredBundles = category 
    ? allBundles.filter(bundle => (bundle.category || '') === category)
    : allBundles;

  const filterSummary = category ? ` in ${category.toUpperCase().replace('-', '-')}` : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-6">
          Course Bundles
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Comprehensive immigration course bundles designed to give you everything you need for your immigration journey. 
          Save money and get complete guidance with our expertly curated bundle packages.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-12">
        <FilterTabs />
      </div>

      {/* Results */}
      <div className="mb-8">
        <p className="text-gray-600 text-center">
          Showing {filteredBundles.length} of {allBundles.length} bundles{filterSummary}
        </p>
      </div>

      <BundleGrid bundles={filteredBundles} />
    </div>
  );
}

export default function BundlesPage(props: BundlesPageProps) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bundles...</p>
        </div>
      </div>
    }>
      <BundlesContent {...props} />
    </Suspense>
  );
}
