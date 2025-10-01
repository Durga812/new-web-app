// src/app/courses/[course_slug]/CourseDetailClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseDetail } from "@/lib/data/course-details-data";
import CourseHero from "@/components/course-detail/CourseHero";
import PricingSidebar from "@/components/course-detail/PricingSidebar";
import CourseTabs from "@/components/course-detail/CourseTabs";
import CourseContent from "@/components/course-detail/CourseContent";
import RelatedSection, {
  type RelatedBundle,
  type RelatedCourse,
} from "@/components/course-detail/RelatedSection";

interface CourseDetailClientProps {
  course: CourseDetail;
  relatedCourses: RelatedCourse[];
  relatedBundles: RelatedBundle[];
}

export default function CourseDetailClient({ 
  course, 
  relatedCourses, 
  relatedBundles 
}: CourseDetailClientProps) {
  const [selectedPriceKey, setSelectedPriceKey] = useState<"price1" | "price2" | "price3">("price3");
  const [activeTab, setActiveTab] = useState("preview");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [navOffset, setNavOffset] = useState(80);

  const tabsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const updateNavOffset = () => {
      if (typeof window === "undefined") {
        return;
      }

      const rawValue = getComputedStyle(document.documentElement).getPropertyValue("--nav-offset").trim();
      const parsedOffset = parseFloat(rawValue);

      if (!Number.isNaN(parsedOffset)) {
        setNavOffset(parsedOffset);
      }
    };

    updateNavOffset();
    window.addEventListener("resize", updateNavOffset);
    window.addEventListener("immigreat:nav-resize", updateNavOffset);

    return () => {
      window.removeEventListener("resize", updateNavOffset);
      window.removeEventListener("immigreat:nav-resize", updateNavOffset);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const tabsTop = tabsRef.current.getBoundingClientRect().top;
        setIsTabsSticky(tabsTop <= navOffset);
      }

      const scrollPosition = window.scrollY + navOffset + 24;
      const sections = ["preview", "about", "curriculum", "outcomes", "requirements", "faq", "reviews"];
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sectionRefs.current[sections[i]];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveTab(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navOffset]);

  const scrollToSection = (sectionId: string) => {
    const section = sectionRefs.current[sectionId];
    if (section) {
      const offsetBuffer = navOffset + 24;
      const top = section.offsetTop - offsetBuffer;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Container - 70/30 Grid starts here */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Side - Hero + Content (70%) */}
          <div className="flex-1 lg:max-w-[70%]">
            {/* Hero Section */}
            <CourseHero course={course} />
            
            {/* Sticky Navigation Tabs */}
            <div 
              ref={tabsRef}
              className={`mb-8 transition-all ${
                isTabsSticky 
                  ? "sticky top-[var(--nav-offset,4rem)] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm -mx-4 px-4 py-3 sm:-mx-6 sm:px-6" 
                  : "mt-8"
              }`}
            >
              <CourseTabs 
                activeTab={activeTab} 
                onTabChange={scrollToSection}
                isSticky={isTabsSticky}
              />
            </div>

            {/* All Content Sections */}
            <div className="space-y-12">
              <CourseContent 
                course={course}
                sectionRefs={sectionRefs}
              />
            </div>
          </div>
          
          {/* Right Side - Sticky Pricing Sidebar (30%) */}
          <div className="w-full lg:w-[30%]">
            <div className="sticky top-[calc(var(--nav-offset,4rem)+2rem)]">
              <PricingSidebar 
                course={course}
                selectedPriceKey={selectedPriceKey}
                onPriceSelect={setSelectedPriceKey}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Content */}
      <RelatedSection 
        relatedCourses={relatedCourses}
        relatedBundles={relatedBundles}
        currentCourseCategory={course.category}
      />
    </div>
  );
}
