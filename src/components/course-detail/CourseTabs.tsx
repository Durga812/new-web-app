// src/components/course-detail/CourseTabs.tsx
"use client";

import { Button } from "@/components/ui/button";

interface CourseTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSticky?: boolean;
}

const tabs = [
  { id: "preview", label: "Preview" },
  { id: "about", label: "About" },
  { id: "curriculum", label: "Curriculum" },
  { id: "outcomes", label: "What You'll Learn" },
  { id: "requirements", label: "Requirements" },
  { id: "faq", label: "FAQ" },
  { id: "reviews", label: "Reviews" },
];

export default function CourseTabs({ activeTab, onTabChange, isSticky }: CourseTabsProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative whitespace-nowrap px-5 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "text-amber-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}