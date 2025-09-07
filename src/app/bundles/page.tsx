// src/app/bundles/page.tsx
import { Suspense } from 'react';
import { FilterTabs } from '@/components/bundles/FilterTabs';
import { getBundles } from '@/lib/isr/data-isr';

export const metadata = {
  title: 'Course Bundles - Immigreat.ai',
  description: 'Comprehensive immigration course bundles for EB1A, EB2-NIW, O-1, and EB5. Save money with our expertly curated bundle packages.',
};

async function  BundlesContent() {
    const bundles = await getBundles()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-6">
          Bundles
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Comprehensive immigration course bundles designed to give you everything you need for your immigration journey. 
          Save money and get complete guidance with our expertly curated bundle packages.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-16">
        <FilterTabs />
      </div>

      return <pre>{JSON.stringify(bundles, null, 2)}</pre>

     
    </div>
  );
}

export default function BundlesPage() {
  return (
    <Suspense fallback={<div className='justify-center'>Loading...</div>}>
      <BundlesContent />
    </Suspense>
  );
}