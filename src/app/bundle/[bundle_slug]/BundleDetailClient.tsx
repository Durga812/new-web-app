// src/app/bundle/[bundle_slug]/BundleDetailClient.tsx
"use client";

import BundleHero from "./BundleHero";
import BundlePricingSidebar from "./BundlePricingSidebar";
import IncludedCoursesSection from "./IncludedCoursesSection";
import type { BundleDetail } from "@/types/bundle-detail";

interface BundleDetailClientProps {
  bundle: BundleDetail;
}

export default function BundleDetailClient({ bundle }: BundleDetailClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 lg:max-w-[70%]">
            <BundleHero bundle={bundle} />

            <div className="mt-8 space-y-10">
              {bundle.description && (
                <section>
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">About this bundle</h2>
                  <p className="leading-relaxed text-gray-700">{bundle.description}</p>
                </section>
              )}

              <IncludedCoursesSection courses={bundle.includedCourses} />
            </div>
          </div>

          <div className="w-full lg:w-[30%]">
            <div className="sticky top-[calc(var(--nav-offset,4rem)+2rem)]">
              <BundlePricingSidebar bundle={bundle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
