// src/app/courses/[course_slug]/CourseDetailClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CourseDetail } from "@/types/course-detail";
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
  const [tabsDimensions, setTabsDimensions] = useState({ width: 0, left: 0, height: 0 });

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabsContentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const updateTabsDimensions = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!tabsContainerRef.current || !tabsContentRef.current) {
      return;
    }

    const containerRect = tabsContainerRef.current.getBoundingClientRect();
    const nextDimensions = {
      width: containerRect.width,
      left: containerRect.left,
      height: tabsContentRef.current.offsetHeight,
    };

    setTabsDimensions(prev => {
      if (
        prev.width === nextDimensions.width &&
        prev.left === nextDimensions.left &&
        prev.height === nextDimensions.height
      ) {
        return prev;
      }

      return nextDimensions;
    });
  }, []);

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
    updateTabsDimensions();

    if (typeof window === "undefined") {
      return;
    }

    const resizeObserverSupported = "ResizeObserver" in window;
    const observers: ResizeObserver[] = [];

    if (resizeObserverSupported) {
      if (tabsContainerRef.current) {
        const containerObserver = new ResizeObserver(() => updateTabsDimensions());
        containerObserver.observe(tabsContainerRef.current);
        observers.push(containerObserver);
      }

      if (tabsContentRef.current) {
        const contentObserver = new ResizeObserver(() => updateTabsDimensions());
        contentObserver.observe(tabsContentRef.current);
        observers.push(contentObserver);
      }
    } else {
      window.addEventListener("resize", updateTabsDimensions);
    }

    return () => {
      if (!resizeObserverSupported) {
        window.removeEventListener("resize", updateTabsDimensions);
        return;
      }

      observers.forEach(observer => observer.disconnect());
    };
  }, [updateTabsDimensions]);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsContainerRef.current) {
        const tabsTop = tabsContainerRef.current.getBoundingClientRect().top;
        const shouldStick = tabsTop <= navOffset;

        setIsTabsSticky(prev => {
          if (prev !== shouldStick) {
            updateTabsDimensions();
            return shouldStick;
          }
          return prev;
        });
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [navOffset, updateTabsDimensions]);

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
            
            {/* Mobile Pricing Card - Shows below hero on mobile only */}
            <div className="mt-6 lg:hidden">
              <PricingSidebar 
                course={course}
                selectedPriceKey={selectedPriceKey}
                onPriceSelect={setSelectedPriceKey}
              />
            </div>
            
            {/* Sticky Navigation Tabs */}
            <div
              ref={tabsContainerRef}
              className={isTabsSticky ? "mb-8" : "mt-8 mb-8"}
              style={isTabsSticky ? { height: tabsDimensions.height } : undefined}
            >
              <div
                ref={tabsContentRef}
                className={`transition-all ${
                  isTabsSticky
                    ? "fixed z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
                    : ""
                }`}
                style={
                  isTabsSticky
                    ? {
                        top: navOffset,
                        left: tabsDimensions.left,
                        width: tabsDimensions.width,
                      }
                    : undefined
                }
              >
                <CourseTabs 
                  activeTab={activeTab} 
                  onTabChange={scrollToSection}
                />
              </div>
            </div>

            {/* All Content Sections */}
            <div className="space-y-12">
              <CourseContent 
                course={course}
                sectionRefs={sectionRefs}
              />
            </div>
          </div>
          
          {/* Right Side - Sticky Pricing Sidebar (30%) - Desktop only */}
          <div className="hidden lg:block lg:w-[30%]">
            <div className="sticky top-[calc(var(--nav-offset,4rem)+1rem)] z-30">
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
