// src/components/courses/BuildBundleCheckoutModal.tsx
'use client';

import React from 'react';
import { Package, CreditCard, X, Check, ShoppingCart } from 'lucide-react';
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

const seriesInfo: Record<string, { name: string; color: string }> = {
  'criteria': { name: 'Criteria', color: '#f59e0b' },
  'final-merit': { name: 'Final Merits', color: '#10b981' },
  'rfe': { name: 'RFE', color: '#3b82f6' },
  'comparable-evidence': { name: 'Comparable Evidence', color: '#8b5cf6' },
};

export function BuildBundleCheckoutModal({
  isOpen,
  onClose,
  selectedCourses,
  pricing,
  category
}: BuildBundleCheckoutModalProps) {
  // Group courses by series
  const coursesBySeries = selectedCourses.reduce((acc, course) => {
    const series = course.series || 'other';
    if (!acc[series]) acc[series] = [];
    acc[series].push(course);
    return acc;
  }, {} as Record<string, CourseWithTwelveMonthOption[]>);

  const handleCheckout = () => {
    console.log('Processing checkout for:', {
      courses: selectedCourses.length,
      total: pricing.total,
      tier: pricing.tier
    });
    alert('Checkout functionality will be implemented in the next phase.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-white overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Review Your {category.title} Bundle
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Left Column - Course List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                Selected Courses ({selectedCourses.length})
              </h3>
              
              <div className="space-y-3">
                {Object.entries(coursesBySeries).map(([series, courses]) => {
                  const info = seriesInfo[series] || { name: series, color: '#6b7280' };
                  return (
                    <div key={series} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {info.name} ({courses.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {courses.map((course) => (
                          <div key={course.course_id} className="flex items-start gap-2 text-sm">
                            <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 line-clamp-1 flex-1">
                              {course.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Pricing Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Tier Badge */}
                    <div className="text-center">
                      <Badge className="text-sm px-3 py-1 bg-blue-600 text-white">
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
                      
                      <div className="pt-3 border-t border-blue-200">
                        <div className="flex justify-between items-end">
                          <span className="text-gray-700 font-medium">Total</span>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">
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
                    <div className="pt-3 border-t border-blue-200">
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Secure checkout powered by Stripe
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              Back to Selection
            </Button>
            <Button 
              onClick={handleCheckout}
              className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
