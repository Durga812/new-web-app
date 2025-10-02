// src/components/course-detail/CourseHero.tsx
"use client";

import { useMemo, useState } from "react";
import { Star, Share2, Clock, BookOpen, Award, Check, Twitter, Linkedin, Facebook, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnrollmentStore } from "@/stores/enrollment-store";
import type { CourseDetail } from "@/types/course-detail";

interface CourseHeroProps {
  course: CourseDetail;
}

export default function CourseHero({ course }: CourseHeroProps) {
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [copied, setCopied] = useState(false);
  const isProductPurchased = useEnrollmentStore(state => state.isProductPurchased);
  const isEnrollPurchased = useEnrollmentStore(state => state.isEnrollPurchased);

  const isPurchased = useMemo(() => {
    return isProductPurchased(course.course_id) || isEnrollPurchased(course.enroll_id);
  }, [course.course_id, course.enroll_id, isEnrollPurchased, isProductPurchased]);

  const tags = Array.isArray(course.tags) ? course.tags : [];
  const keyBenefits = Array.isArray(course.keyBenefits) ? course.keyBenefits : [];

  const courseUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=Check out: ${course.title}&url=${encodeURIComponent(courseUrl)}`,
      color: "text-blue-400 hover:text-blue-600",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`,
      color: "text-blue-700 hover:text-blue-900",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}`,
      color: "text-blue-600 hover:text-blue-800",
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(courseUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowSharePopover(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <section className="relative overflow-hidden rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/30 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-orange-100/20" />
      
      <div className="relative">
        {/* Category & Series Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
            {course.category.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="border-gray-300 text-xs">
            {course.series.charAt(0).toUpperCase() + course.series.slice(1)} Series
          </Badge>
          {isPurchased && (
            <Badge className="border-0 bg-emerald-500/90 text-xs text-white">
              <Check className="mr-1 h-3 w-3" /> Owned
            </Badge>
          )}
        {tags.slice(0, 2).map((tag: string) => (
          <Badge key={tag} variant="outline" className="border-gray-200 text-gray-600 text-xs">
            #{tag}
          </Badge>
        ))}
        </div>

        {/* Title Section with Share */}
        <div className="mb-3 flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {course.title}
          </h1>
          
          {/* Share Button with Popover */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSharePopover(!showSharePopover)}
              className="h-9 w-9 flex-shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            {showSharePopover && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSharePopover(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-around gap-2">
                    {shareLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-gray-50 ${link.color}`}
                        title={`Share on ${link.name}`}
                      >
                        <link.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-sm transition hover:bg-gray-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        <span>Copy link</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mb-5 text-base text-gray-600">
          {course.subtitle}
        </p>
        
        {/* Key Benefits */}
        <ul className="mb-5 space-y-2">
          {keyBenefits.slice(0, 3).map((benefit: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2 text-gray-700">
              <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(course.ratings)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-gray-900">{course.ratings}</span>
            <span>({course.totalReviews})</span>
          </div>
          
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span>{course.totalLessons} lessons</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
