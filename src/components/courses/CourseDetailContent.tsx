
// src/components/course/CourseDetailContent.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Star, 
  ShoppingCart, 
  CreditCard, 
  CheckCircle2, 
  PlayCircle,
  Clock,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  Sparkles,
  Lock,
  Video,
  Target,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { categories } from '@/lib/data/categories'
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore';
import type { Course } from '@/lib/types/course'
interface CourseDetailContentProps {
  course: Course
}

export function CourseDetailContent({ course }: CourseDetailContentProps) {
  const [expandedModules, setExpandedModules] = useState<number[]>([])
  
  // Get category details
  const categoryDetails = Object.values(categories).find(
    cat => cat.cat_slug === course.category_slug
  )
  
  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }
  const hasEnrollment = useEnrollmentStore((state) => state.hasEnrollment);
  const isEnrolled = hasEnrollment(course.course_id);
  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Adding to cart:', course.course_id)
  }

  const handleBuyNow = () => {
    // Buy now logic
    console.log('Buy now:', course.course_id)
  }

  const discountPercentage = Math.round(
    ((course.price.original - course.price.current) / course.price.original) * 100
  )

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
                <Link href="/courses" className="text-gray-600 hover:text-amber-600 transition-colors">
                  Courses
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
                <span className="text-gray-700 font-medium truncate">{course.name}</span>
              </div>

              {/* Title & Category Badge */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
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
                  {course.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="border-amber-300 text-amber-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {course.name}
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  {course.description.short}
                </p>
              </div>

              {/* Rating & Duration */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(course.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">{course.rating}</span>
                </div>
                
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{course.metadata.duration_hours} hours of content</span>
                </div>
              </div>

              {/* Highlights Card */}
              <Card className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 backdrop-blur-sm border-amber-200/50">
                <CardContent className="p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{course.highlight.title}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {course.highlight.highlights.map((highlight: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{highlight}</span>
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
                    {/* Price Section */}
                    <div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${course.price.current}
                        </span>
                        <span className="text-xl text-gray-400 line-through">
                          ${course.price.original}
                        </span>
                        <Badge className="bg-red-500 text-white">
                          {discountPercentage}% OFF
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Limited time offer
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
                        Buy Now
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                        size="lg"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </Button>
                    </div>)}

                    {/* Course Access Info */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Access Duration</p>
                          <p className="text-sm text-gray-600">{course.metadata.validity_label} access</p>
                        </div>
                      </div>
                    </div>

                    {/* What's Included */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">This course includes:</h4>
                      <ul className="space-y-2">
                        {course.content.included.map((item: string, index: number) => (
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

      {/* Video Preview Section - Smaller */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlayCircle className="w-5 h-5 text-amber-500" />
              Course Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 shadow-xl max-w-3xl mx-auto">
              {/* YouTube embed as requested */}
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Course Preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Content Sections - No Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        
        {/* About This Course Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              About This Course
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">Course Overview</h3>
              <p className="text-gray-700 leading-relaxed">
                {course.description.long}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">What&apos;s Covered</h3>
              <p className="text-gray-700 leading-relaxed">
                {course.content.about}
              </p>
            </div>

            {/* <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{course.metadata.duration_hours} Hours</p>
                  <p className="text-sm text-gray-600">of Video Content</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                  <Video className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Lifetime Access</p>
                  <p className="text-sm text-gray-600">Learn at your own pace</p>
                </div>
              </div>
            </div> */}
          </CardContent>
        </Card>

        {/* What You'll Learn Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-500" />
              What You&apos;ll Learn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {course.content.what_you_learn.map((item: string, index: number) => (
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

        {/* Course Curriculum Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-500" />
              Course Curriculum
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-600 mb-4">
              {course.content.curriculum.length} modules • {course.metadata.duration_hours} hours of content
            </p>
            
            {course.content.curriculum.map((module: Course['content']['curriculum'][number], moduleIndex: number) => (
              <div key={moduleIndex} className="border border-amber-200/50 rounded-xl overflow-hidden bg-white/50 hover:shadow-md transition-all duration-200">
                <button
                  onClick={() => toggleModule(moduleIndex)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-orange-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                      {moduleIndex + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{module.module}</h3>
                      <p className="text-sm text-gray-600 mt-1">{module.summary}</p>
                    </div>
                  </div>
                  {expandedModules.includes(moduleIndex) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedModules.includes(moduleIndex) && (
                  <div className="px-5 pb-4 border-t border-amber-100 bg-gradient-to-b from-white/50 to-amber-50/20">
                    <ul className="space-y-3 mt-4">
                      {module.chapters.map((chapter: string, chapterIndex: number) => (
                        <li key={chapterIndex} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
                          <div className="flex items-center gap-2 min-w-fit">
                            <PlayCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-gray-500">
                              {moduleIndex + 1}.{chapterIndex + 1}
                            </span>
                          </div>
                          <span className="text-gray-700 flex-1">{chapter}</span>
                          {/* <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" /> */}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
