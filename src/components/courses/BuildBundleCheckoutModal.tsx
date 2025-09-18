// src/components/courses/BuildBundleCheckoutModal.tsx
'use client';

import React from 'react';
import { Package, CreditCard, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CourseWithTwelveMonthOption } from '@/lib/types/course';
import type { Category } from '@/lib/data/categories';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore';
import {
  createBuildYourBundleSession,
  type BundleCourseSelectionInput,
} from '@/app/actions/build_bundle_checkout';
import { OwnedItemsDialog, OwnedItemSummary } from '@/components/dialogs/OwnedItemsDialog';

interface BuildBundleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourses: CourseWithTwelveMonthOption[];
  onRemoveCourses: (courseIds: string[]) => void;
  pricing: {
    tier: string;
    tierDescription: string;
    pricePerCourseEffective: number;
    rackSubtotal: number;
    discountAmount: number;
    discountPct: number;
    total: number;
    perCourse: number;
  };
  category: Category;
}

const seriesNames: Record<string, string> = {
  'criteria': 'Criteria',
  'final-merit': 'Final Merits',
  'rfe': 'RFE',
  'comparable-evidence': 'Comparable Evidence',
};

const seriesColors: Record<string, string> = {
  'criteria': '#f59e0b',
  'final-merit': '#10b981',
  'rfe': '#3b82f6',
  'comparable-evidence': '#8b5cf6',
};

export function BuildBundleCheckoutModal({
  isOpen,
  onClose,
  selectedCourses,
  onRemoveCourses,
  pricing,
  category
}: BuildBundleCheckoutModalProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const hasEnrollment = useEnrollmentStore((state) => state.hasEnrollment);
  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const [expandedSeries, setExpandedSeries] = React.useState<Set<string>>(() => new Set());
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [checkoutLabel, setCheckoutLabel] = React.useState('Proceed to Checkout');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [ownedDialogOpen, setOwnedDialogOpen] = React.useState(false);
  const [ownedItems, setOwnedItems] = React.useState<OwnedItemSummary[]>([]);
  const [ownedDuplicateIds, setOwnedDuplicateIds] = React.useState<string[]>([]);
  const [isRemovingOwned, setIsRemovingOwned] = React.useState(false);
  const [ownedReturnPath, setOwnedReturnPath] = React.useState<string | null>(null);

  // Group courses by series; memoize to avoid effect thrashing
  const coursesBySeries = React.useMemo(() => {
    return selectedCourses.reduce((acc, course) => {
      const seriesKey = course.series || 'other';
      if (!acc[seriesKey]) acc[seriesKey] = [];
      acc[seriesKey].push(course);
      return acc;
    }, {} as Record<string, CourseWithTwelveMonthOption[]>);
  }, [selectedCourses]);

  // Auto-expand if only one series, collapse all for multiple series
  React.useEffect(() => {
    const seriesKeys = Object.keys(coursesBySeries);
    if (seriesKeys.length === 1) {
      setExpandedSeries(new Set([seriesKeys[0]]));
    } else {
      // For multiple series, start with all collapsed
      setExpandedSeries(new Set());
    }
  }, [coursesBySeries]);

  const toggleSeries = (series: string) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(series)) {
      newExpanded.delete(series);
    } else {
      newExpanded.add(series);
    }
    setExpandedSeries(newExpanded);
  };

  const handleCheckout = async () => {
    if (isProcessing) return;
    setErrorMessage(null);

    if (!selectedCourses.length) {
      setErrorMessage('Select at least 5 courses to continue.');
      return;
    }

    if (!isSignedIn) {
      try {
        openSignIn();
      } catch {
        window.location.href = '/sign-in';
      }
      return;
    }

    setIsProcessing(true);
    setCheckoutLabel('Validating selection...');

    const workingSelection = selectedCourses;

    const duplicates = selectedCourses.filter((course) =>
      hasEnrollment(
        course.course_id,
        course.twelveMonthOption.course_enroll_id ?? course.twelveMonthOption.variant_code
      )
    );

    if (duplicates.length > 0) {
      const duplicateSummaries: OwnedItemSummary[] = duplicates.map((course) => {
        const enrollmentMatch = enrollments.find((enrollment) => {
          if (enrollment.item_id !== course.course_id) return false;
          const enrollId = course.twelveMonthOption.course_enroll_id ?? course.twelveMonthOption.variant_code;
          if (!enrollId) return true;
          return enrollment.item_enroll_id === enrollId;
        });

        const validity = course.twelveMonthOption.validity;
        let variantLabel: string | null = null;
        if (typeof validity === 'number') {
          if (validity === 12) variantLabel = '12 months access';
          else if (validity === 6) variantLabel = '6 months access';
          else if (validity === 3) variantLabel = '3 months access';
          else if (validity === 1) variantLabel = '1 month access';
          else variantLabel = `${validity} months access`;
        } else if (enrollmentMatch?.item_enroll_id) {
          variantLabel = 'Existing access plan';
        }

        return {
          id: course.course_id,
          title: course.title,
          type: 'course' as const,
          slug: course.course_slug,
          thumbnailUrl: course.urls?.thumbnail_url,
          variantLabel,
          note: 'This course is already in your purchases.',
        };
      });

      setOwnedItems(duplicateSummaries);
      setOwnedDuplicateIds(duplicates.map((course) => course.course_id));
      setOwnedReturnPath(`/courses/${category.cat_slug}/build-your-bundle`);
      setOwnedDialogOpen(true);
      setIsProcessing(false);
      setCheckoutLabel('Proceed to Checkout');
      return;
    }

    if (workingSelection.length < 5) {
      setErrorMessage('Select at least 5 courses to access bundle pricing.');
      setIsProcessing(false);
      setCheckoutLabel('Proceed to Checkout');
      return;
    }

    setCheckoutLabel('Creating checkout...');

    const payload: BundleCourseSelectionInput[] = workingSelection.map((course) => ({
      course_id: course.course_id,
      course_slug: course.course_slug,
      title: course.title,
      thumbnail_url: course.urls?.thumbnail_url,
      variant_code: course.twelveMonthOption.variant_code ?? null,
      course_enroll_id: course.twelveMonthOption.course_enroll_id ?? null,
    }));

    const purchaseIntentId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());

    try {
      await createBuildYourBundleSession(payload, purchaseIntentId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Checkout failed. Please try again.';
      console.error('Bundle checkout failed:', error);
      setErrorMessage(message);
      setIsProcessing(false);
      setCheckoutLabel('Proceed to Checkout');
    }
  };

  const handleOwnedDialogCancel = () => {
    setOwnedDialogOpen(false);
    setOwnedItems([]);
    setOwnedDuplicateIds([]);
    setOwnedReturnPath(null);
    setIsProcessing(false);
    setCheckoutLabel('Proceed to Checkout');
  };

  const handleOwnedDialogConfirm = async () => {
    if (!ownedItems.length) {
      handleOwnedDialogCancel();
      return;
    }

    setIsRemovingOwned(true);
    try {
      await Promise.resolve(onRemoveCourses(ownedDuplicateIds));
      setErrorMessage('Owned courses were removed. Add new courses before checking out.');
      setOwnedDialogOpen(false);
      setOwnedItems([]);
      setOwnedDuplicateIds([]);
      setIsProcessing(false);
      setCheckoutLabel('Proceed to Checkout');
      const target = ownedReturnPath ?? `/courses/${category.cat_slug}/build-your-bundle`;
      setOwnedReturnPath(null);
      onClose();
      if (target) {
        router.push(target);
      }
    } finally {
      setIsRemovingOwned(false);
    }
  };

  return (
    <>
      <OwnedItemsDialog
        open={ownedDialogOpen}
        items={ownedItems}
        onCancel={handleOwnedDialogCancel}
        onConfirm={handleOwnedDialogConfirm}
        isConfirming={isRemovingOwned}
        confirmLabel="Remove and review"
        cancelLabel="Keep selection"
        description="Confirm removal to return to the bundle builder and update your selection before checking out."
      />
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 lg:p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <DialogTitle className="flex items-center gap-3 text-lg lg:text-xl">
            <Package className="w-5 h-5 text-amber-600" />
            Review Your {category.title} Bundle
          </DialogTitle>
        </DialogHeader>

        {/* Responsive Content Layout */}
        <div className="overflow-y-auto max-h-[60vh] p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Course List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                Selected Courses ({selectedCourses.length})
              </h3>
              
              <div className="space-y-3">
                {Object.entries(coursesBySeries).map(([series, courses]) => (
                  <Card key={series} className="overflow-hidden border-gray-200">
                    {/* Collapsible header for all screen sizes */}
                    <button
                      onClick={() => toggleSeries(series)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: seriesColors[series] || '#6b7280' }}
                        />
                        <span className="font-medium text-sm">
                          {seriesNames[series] || series}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {courses.length}
                        </Badge>
                      </div>
                      {expandedSeries.has(series) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {/* Course list - collapsible on all screen sizes */}
                    <div
                      className={`bg-white p-3 space-y-2 ${expandedSeries.has(series) ? 'block' : 'hidden'}`}
                    >
                      {courses.map((course) => (
                        <div key={course.course_id} className="flex items-start gap-2 text-sm">
                          <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span className="text-gray-600 line-clamp-2 flex-1">
                              {course.title}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              ${course.twelveMonthOption.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column - Pricing Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Tier Badge */}
                    <div className="text-center">
                      <Badge className="text-sm px-3 py-1 bg-amber-600 text-white">
                        {pricing.tier} Tier
                      </Badge>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Courses Selected</span>
                        <span className="font-medium">{selectedCourses.length}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Original Price</span>
                        <span className="text-gray-500 line-through">
                          ${pricing.rackSubtotal.toLocaleString()}
                        </span>
                      </div>
                      
                      {pricing.discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Bundle Discount</span>
                          <span className="text-green-600 font-medium">
                            -${Math.round(pricing.discountAmount).toLocaleString()} ({Math.round(pricing.discountPct)}%)
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-amber-200">
                        <div className="flex justify-between items-end">
                          <span className="text-gray-700 font-medium">Total</span>
                          <div className="text-right">
                            <div className="text-2xl lg:text-3xl font-bold text-amber-600">
                              ${pricing.total.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ≈${Math.round(pricing.perCourse)} per course
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="pt-3 border-t border-amber-200">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>12 months access to all courses</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Learn at your own pace</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Certificate of completion</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Comprehensive {category.title} preparation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
            <div className="text-sm text-gray-600">
              <span className="hidden sm:inline">Secure checkout powered by Stripe</span>
              <span className="sm:hidden">{selectedCourses.length} courses • ${pricing.total.toLocaleString()}</span>
            </div>
            {errorMessage && (
              <div className="text-sm text-red-600">
                {errorMessage}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6"
            >
              Back to Selection
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {checkoutLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
