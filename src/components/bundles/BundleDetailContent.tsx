// src/components/bundle/BundleDetailContent.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  CreditCard, 
  CheckCircle2, 
  BookOpen,
  Tag,
  Calendar,
  Sparkles,
  Package,
  Target,
  ArrowRight,
  Layers,
  Zap,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { categories } from '@/lib/data/categories'
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore';

interface Course {
  course_id: string
  name: string
  course_slug: string
  rating: number
  description: {
    long: string
    short: string
  }
}

interface BundleDetailContentProps {
  bundle: any // Replace with proper type
  courses: Course[]
}

export function BundleDetailContent({ bundle, courses }: BundleDetailContentProps) {
  const router = useRouter()
  
  // Get category details
  const categoryDetails = Object.values(categories).find(
    cat => cat.cat_slug === bundle.category_slug
  )

  const hasEnrollment = useEnrollmentStore((state) => state.hasEnrollment);
      const isEnrolled = hasEnrollment(bundle.bundle_id);
  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Adding bundle to cart:', bundle.bundle_id)
  }

  const handleBuyNow = () => {
    // Buy now logic
    console.log('Buy bundle now:', bundle.bundle_id)
  }

  const handleCourseClick = (courseSlug: string) => {
    router.push(`/course/${courseSlug}`)
  }

  const discountPercentage = Math.round(
    ((bundle.price.original - bundle.price.current) / bundle.price.original) * 100
  )

  const totalSavings = bundle.price.original - bundle.price.current

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-orange-50/30 to-transparent" />
        <div className="absolute inset-0 bg-grid-gray-100/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-5">
              {/* Breadcrumb & Tags */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href="/bundles" className="text-gray-600 hover:text-amber-600 transition-colors">
                  Bundles
                </Link>
                <span className="text-gray-400">/</span>
                {categoryDetails && (
                  <>
                    <Link 
                      href={`/courses/${categoryDetails.cat_slug}`}
                      className="hover:text-amber-600 transition-colors"
                      style={{ color: categoryDetails.color }}
                    >
                      {categoryDetails.title}
                    </Link>
                    <span className="text-gray-400">/</span>
                  </>
                )}
                <span className="text-gray-700 font-medium truncate">{bundle.name}</span>
              </div>

              {/* Title & Category Badge */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge 
                    className="px-3 py-1 text-white font-medium flex items-center gap-1"
                    style={{ 
                      backgroundColor: '#10b981',
                      borderColor: '#10b981' 
                    }}
                  >
                    <Package className="w-3 h-3" />
                    BUNDLE
                  </Badge>
                  {categoryDetails && (
                    <Badge 
                      className="px-3 py-1 text-white font-medium"
                      style={{ 
                        backgroundColor: categoryDetails.color,
                        borderColor: categoryDetails.color 
                      }}
                    >
                      {categoryDetails.title}
                    </Badge>
                  )}
                  {bundle.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="border-amber-300 text-amber-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {bundle.name}
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  {bundle.description.short}
                </p>
              </div>

              {/* Bundle Stats */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100/50 rounded-lg">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-gray-900">{courses.length} Courses</span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100/50 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Save ${totalSavings}</span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100/50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Best Value</span>
                </div>
              </div>

              {/* Highlights Card */}
              <Card className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 backdrop-blur-sm border-amber-200/50">
                <CardContent className="p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{bundle.highlight.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {bundle.highlight.courses?.map((course: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{course}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sticky Sidebar - 1 column */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <Card className="bg-white/80 backdrop-blur-xl border-amber-200/50 shadow-xl">
                  <CardContent className="p-5 lg:p-6 space-y-5">
                    {/* Bundle Savings Banner */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-sm font-semibold text-green-800">
                        🎉 Bundle Deal: Save {discountPercentage}%
                      </p>
                    </div>

                    {/* Price Section */}
                    <div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${bundle.price.current}
                        </span>
                        <span className="text-xl text-gray-400 line-through">
                          ${bundle.price.original}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        You save ${totalSavings} with this bundle!
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {isEnrolled ? (
                <Link href="/my-purchases" passHref>
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 bg-green-50 hover:bg-green-100 font-medium shadow-none hover:shadow-none transition-all duration-300 text-xs py-1.5 h-8"
                  >
                    Go to Course
                  </Button>
                </Link>
              ) : 
                    (<div className="space-y-3">
                      <Button 
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                        onClick={handleBuyNow}
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Buy Bundle Now
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                        size="lg"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add Bundle to Cart
                      </Button>
                    </div>)}

                    {/* Bundle Access Info */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Bundle Access</p>
                          <p className="text-sm text-gray-600">{bundle.metadata.validity_label} access to all courses</p>
                        </div>
                      </div>
                    </div>

                    {/* What's Included */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">This bundle includes:</h4>
                      <ul className="space-y-2">
                        {bundle.content.included?.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        
        {/* About This Bundle Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-500" />
              About This Bundle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">Bundle Overview</h3>
              <p className="text-gray-700 leading-relaxed">
                {bundle.description.long}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">What's Covered</h3>
              <p className="text-gray-700 leading-relaxed">
                {bundle.content.about}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{courses.length} Courses</p>
                  <p className="text-sm text-gray-600">Full Access</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">${totalSavings} Saved</p>
                  <p className="text-sm text-gray-600">Bundle Discount</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{bundle.metadata.validity_label}</p>
                  <p className="text-sm text-gray-600">Full Access</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Learn Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-500" />
              What You'll Learn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {bundle.content.what_you_learn?.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-50/30 to-orange-50/30 border border-amber-200/30 hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-200">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Included Courses Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              Courses Included in This Bundle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              Get instant access to all {courses.length} courses with this bundle. Click on any course to learn more.
            </p>
            
            <div className="space-y-4">
              {courses.map((course, index) => (
                <div 
                  key={course.course_id}
                  className="group cursor-pointer"
                  onClick={() => handleCourseClick(course.course_slug)}
                >
                  <Card className="border border-amber-200/50 hover:border-amber-300 bg-white/60 hover:bg-white/80 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                                {course.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {course.rating && (
                                  <div className="flex items-center gap-1">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < Math.floor(course.rating)
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'fill-gray-200 text-gray-200'
                                          }`}
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-600">{course.rating}</span>
                                  </div>
                                )}
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                  Course {index + 1}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm pl-[52px]">
                            {course.description.short}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-lg border border-amber-200/30">
              <p className="text-xs sm:text-sm text-gray-700 text-center">
                <span className="font-semibold">💡 Pro Tip:</span> Complete courses in order for the best learning experience
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}