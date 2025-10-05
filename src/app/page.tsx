// src/app/page.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Package,
  ChevronDown,
  Sparkles,
  Zap,
  Star,
  Crown,
  ChartBar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DISCOUNT_TIERS as discountTiers } from "@/lib/pricing/discounts";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // const discountTiers = [
  //   { threshold: 40, rate: 0.27, name: "Extraordinary" },
  //   { threshold: 20, rate: 0.16, name: "Visionary" },
  //   { threshold: 10, rate: 0.11, name: "Leader" },
  //   { threshold: 5, rate: 0.06, name: "Foundation" }
  // ];

  const bundleCategories = [
    { name: "EB-1A", path: "/courses/eb1a" },
    { name: "EB2-NIW", path: "/courses/eb2-niw" },
    { name: "EB-5", path: "/courses/eb5" },
    { name: "O-1", path: "/courses/o1" }
  ];

  const faqs = [
    {
      question: "How long do I have access to the courses?",
      answer: "You'll have access to your purchased courses for the duration specified with each package - ranging from 3 months for individual courses to 12 months for comprehensive bundles."
    },
    {
      question: "Can I upgrade from an individual course to a bundle?",
      answer: "No! You can not upgrade to a bundle. However, you can purchase additional courses or bundles at any time to expand your learning."
    },
    {
      question: "Are the courses updated with latest immigration policies?",
      answer: "Absolutely. Our courses are regularly updated to reflect the latest USCIS policies, procedures, and requirements to ensure you have the most current information."
    },
    {
      question: "Do I need legal background to understand the courses?",
      answer: "Not at all! Our courses are designed for everyone, with clear explanations and practical examples that make complex immigration concepts easy to understand."
    },
    {
      question: "Can I access courses on mobile devices?",
      answer: "Yes, our platform is fully responsive and optimized for all devices - desktop, tablet, and mobile - so you can learn anywhere, anytime."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Hero Section with increased padding */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-orange-100/20 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md border border-amber-200/50 rounded-full mb-8 shadow-lg animate-pulse">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Trusted by 10,000+ immigrants</span>
            </div>
            
            {/* Main Heading with better spacing */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-300%">
                Your Path to
              </span>
              <span className="block bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent animate-gradient bg-300% mt-2">
                Immigration Success
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Expert-curated courses designed to guide you through your green card journey with confidence and clarity.
            </p>
            
            {/* CTA Buttons with glassmorphism */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                  Browse Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/courses?category=eb1a">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/60 backdrop-blur-md border-amber-300 text-amber-700 hover:bg-amber-50/80 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  Explore EB1A Track
                  <Package className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Offerings Section - Updated with Two Cards */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Our Offerings
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Choose the perfect learning path for your immigration journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Individual Course Card */}
            <Card className="relative bg-white/80 backdrop-blur-lg border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-3 group">
              <CardContent className="p-5 sm:p-6 lg:p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Individual Course</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Perfect for focused learning</p>
                  
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700">$299</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">per course</p>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 text-left">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">Single course access</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">Multiple validity options (3, 6, 9 months)</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">Self-paced learning</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">Auto discounts at checkout (5+ courses)</span>
                    </div>
                  </div>

                  {/* Discount Tiers */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 border border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 sm:mb-4">Volume Discounts</p>
                    <div className="space-y-2">
                      {discountTiers.map((tier) => (
                        <div key={tier.threshold} className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{tier.threshold}+ courses</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-green-600 font-bold">{(tier.rate * 100).toFixed(0)}% OFF</span>
                            <span className="text-xs text-gray-500 hidden sm:inline">({tier.name})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href="/courses" className="block">
                    <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-base">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Curated Bundles Card - MOST VALUED */}
            <Card className="relative bg-gradient-to-br from-amber-50/90 via-orange-50/90 to-amber-50/90 backdrop-blur-lg border-2 border-amber-400 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-3 group">
              {/* Best Value Badge */}
              <div className="absolute -top-4 sm:-top-5 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white border-0 shadow-lg animate-pulse text-xs sm:text-sm">
                  <Crown className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  BEST VALUE
                </Badge>
              </div>
              
              <CardContent className="p-5 sm:p-6 lg:p-8 pt-8 sm:pt-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Star className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Curated Bundles</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Expert-designed complete paths</p>
                  
                  {/* Discount Highlight */}
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 border border-amber-300/50 shadow-inner">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-2">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      <p className="text-base sm:text-lg text-green-700 font-bold">Save up to 33%</p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">On complete pathway bundles</p>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 text-left">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium">Complete pathway coverage</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium">Expert-curated sequence</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium">Maximum savings (33%)</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium">12-month validity</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium">Premium support included</span>
                    </div>
                  </div>

                  {/* Category CTAs */}
                  <div className="space-y-2.5 sm:space-y-3">
                    {bundleCategories.map((category) => (
                      <Link key={category.name} href={category.path} className="block">
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center text-sm sm:text-base">
                          Explore {category.name} Bundles
                          <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section with more spacing */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-white via-amber-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Why Choose immigreat.ai?
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              We make immigration education accessible, practical, and effective for your self-paced journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Self-Paced */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-lg border border-amber-200/50 rounded-3xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-3xl" />
                <Clock className="relative h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Self-Paced</h3>
              <p className="text-sm lg:text-base text-gray-600">
                Learn at your own pace with flexible scheduling that fits your busy lifestyle.
              </p>
            </div>

            {/* In-Depth & Detailed */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-lg border border-amber-200/50 rounded-3xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-3xl" />
                <BookOpen className="relative h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">In-Depth & Detailed</h3>
              <p className="text-sm lg:text-base text-gray-600">
                Comprehensive coverage of every aspect with detailed explanations and practical examples.
              </p>
            </div>

            {/* Data-Backed */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-lg border border-amber-200/50 rounded-3xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-3xl" />
                <ChartBar className="relative h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Data-Backed</h3>
              <p className="text-sm lg:text-base text-gray-600">
                Content based on real success stories and current immigration data and trends.
              </p>
            </div>

            {/* Curated Bundles */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-lg border border-amber-200/50 rounded-3xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-3xl" />
                <Package className="relative h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Curated Bundles</h3>
              <p className="text-sm lg:text-base text-gray-600">
                Expert-curated learning paths for different immigration categories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with improved design */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-300">FAQs</Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 lg:p-8 text-left hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-300 group"
                >
                  <span className="font-semibold text-gray-900 text-base lg:text-lg pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 lg:h-6 lg:w-6 text-amber-500 transition-all duration-300 flex-shrink-0 ${
                      openFaq === index ? 'rotate-180' : ''
                    } group-hover:text-amber-600`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 lg:px-8 pb-6 lg:pb-8">
                    <div className="pt-2 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-amber-100">
                      <p className="pt-4">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-300\% {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
}