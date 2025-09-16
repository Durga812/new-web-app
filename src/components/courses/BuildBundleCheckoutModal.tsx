// src/components/courses/BuildBundleCheckoutModal.tsx
'use client';

import React from 'react';
import { Package, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
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

interface BuildBundleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourses: CourseWithTwelveMonthOption[];
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
  'comparable-evidence': 'Comparable',
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
  pricing,
  category
}: BuildBundleCheckoutModalProps) {
  const [expandedSeries, setExpandedSeries] = React.useState<string | null>(null);

  // Group courses by series
  const coursesBySeries = selectedCourses.reduce((acc, course) => {
    const series = course.series || 'other';
    if (!acc[series]) acc[series] = [];
    acc[series].push(course);
    return acc;
  }, {} as Record<string, CourseWithTwelveMonthOption[]>);

  const handleCheckout = () => {
    // TODO: Implement checkout
    console.log('Checkout with:', {
      courses: selectedCourses.length,
      total: pricing.total,
      tier: pricing.tier
    });
    alert('Checkout functionality coming soon!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 lg:p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <DialogTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <Package className="w-5 h-5 text-amber-500" />
            Review Your Bundle
          </DialogTitle>
        </DialogHeader>

        {/* Mobile-optimized content */}
        <div className="overflow-y-auto max-h-[60vh] p-4 lg:p-6 space-y-4">
          
          {/* Pricing Summary - Always visible */}
          <Card className="bg-gradient-to-r p-0 from-amber-50/50 to-orange-50/50 border-amber-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bundle Tier</span>
                  <Badge className="font-semibold">{pricing.tier}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Courses</span>
                  <span className="font-semibold">{selectedCourses.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Original Price</span>
                  <span className="text-sm text-gray-500 line-through">
                    ${pricing.rackSubtotal.toLocaleString()}
                  </span>
                </div>
                
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Discount ({Math.round(pricing.discountPct)}%)</span>
                    <span className="text-sm font-semibold">
                      -${pricing.discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">
                      ${pricing.total.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      ≈${Math.round(pricing.perCourse)}/course
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course List by Series - Collapsible on mobile */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Selected Courses</h3>
            
            {Object.entries(coursesBySeries).map(([series, courses]) => (
              <Card key={series} className="overflow-hidden p-1">
                <button
                  onClick={() => setExpandedSeries(expandedSeries === series ? null : series)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: seriesColors[series] || '#6b7280' }}
                    />
                    <span className="font-medium text-sm">
                      {seriesNames[series] || series}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {courses.length}
                    </Badge>
                  </div>
                  {expandedSeries === series ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSeries === series && (
                  <div className="border-t bg-gray-50/50 p-3 space-y-2 max-h-48 overflow-y-auto">
                    {courses.map((course, idx) => (
                      <div key={course.course_id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{idx + 1}.</span>
                        <span className="flex-1 truncate">{course.title}</span>
                        <span className="text-xs text-gray-500">
                          ${course.twelveMonthOption.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Bundle Benefits */}
          <Card className="bg-blue-50/50 border-blue-200 p-0">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Bundle Benefits</h4>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>✓ 12 months access to all courses</li>
                <li>✓ Volume discount applied automatically</li>
                <li>✓ Learn at your own pace</li>
                <li>✓ Comprehensive {category.title} preparation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions - Sticky */}
        <div className="border-t bg-white p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            {selectedCourses.length} courses • ${pricing.total.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Back
            </Button>
            <Button 
              onClick={handleCheckout}
              className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
