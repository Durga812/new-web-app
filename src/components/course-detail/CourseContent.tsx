// src/components/course-detail/CourseContent.tsx
"use client";

import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { CourseDetail } from "@/types/course-detail";

interface CourseContentProps {
  course: CourseDetail;
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
}

export default function CourseContent({ course, sectionRefs }: CourseContentProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);

  const safeArray = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

  const whoIsFor = safeArray(course.whoIsFor);
  const whoIsNotFor = safeArray(course.whoIsNotFor);
  const highlights = safeArray(course.highlights);
  const requirements = safeArray(course.requirements);
  const learningOutcomes = safeArray(course.learningOutcomes);
  const faqs = safeArray(course.faqs);
  const modules = safeArray(course.modules);
  const reviews = safeArray(course.reviews);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev =>
      prev.includes(faqId)
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <>
      {/* Preview Section */}
      <section ref={(el) => { sectionRefs.current.preview = el; }} id="preview">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">Course Preview</h2>
        <Card className="overflow-hidden">
          <div className="aspect-video w-full bg-black">
            {course.previewVideoUrl ? (
              <video 
                controls 
                className="h-full w-full"
                poster={course.previewThumbnail}
              >
                <source 
                  src={course.previewVideoUrl} 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 text-center">
                <p className="px-4 text-sm text-gray-600">Preview coming soon</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* About Section */}
      <section ref={(el) => { sectionRefs.current.about = el; }} id="about">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">About this course</h2>
        
        <Card className="mb-5 p-6">
          <p className="leading-relaxed text-gray-700">{course.description}</p>
        </Card>

        <Card className="mb-5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Who this course is for</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-green-700">
                <span className="text-lg">✓</span>
                <h4 className="font-medium">Perfect for</h4>
              </div>
              <ul className="space-y-2">
                {whoIsFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-red-700">
                <span className="text-lg">✗</span>
                <h4 className="font-medium">Not for</h4>
              </div>
              <ul className="space-y-2">
                {whoIsNotFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Course highlights</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-700 leading-relaxed">{highlight}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Curriculum Section */}
      <section ref={(el) => { sectionRefs.current.curriculum = el; }} id="curriculum">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Course curriculum</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{course.totalModules} modules</Badge>
            <Badge variant="outline" className="text-xs">{course.totalLessons} lessons</Badge>
            <Badge variant="outline" className="text-xs">{formatDuration(course.totalDuration)}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {modules.map((module) => {
            const moduleLessons = safeArray(module.lessons);

            return (
              <Card key={module.id} className="overflow-hidden">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {moduleLessons.length} lessons • {formatDuration(module.totalDuration)}
                    </p>
                  </div>
                  {expandedModules.includes(module.id) ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>

                {expandedModules.includes(module.id) && (
                  <div className="border-t bg-gray-50/50 p-4">
                    <p className="mb-4 text-sm text-gray-600 leading-relaxed">{module.description}</p>
                    <div className="space-y-2">
                      {moduleLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between rounded-lg bg-white p-3 hover:shadow-sm transition"
                        >
                          <span className="text-sm text-gray-700">{lesson.title}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {lesson.duration}m
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg bg-amber-50 p-3 border border-amber-100">
                      <p className="text-sm font-medium text-amber-900">Learning Outcome</p>
                      <p className="mt-1 text-sm text-amber-800 leading-relaxed">{module.outcome}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Learning Outcomes Section */}
      <section ref={(el) => { sectionRefs.current.outcomes = el; }} id="outcomes">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">What you&apos;ll learn</h2>
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {learningOutcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <span className="text-sm text-green-600 font-semibold">✓</span>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">{outcome}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Requirements Section */}
      <section ref={(el) => { sectionRefs.current.requirements = el; }} id="requirements">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">Requirements</h2>
        <Card className="p-6">
          <ul className="space-y-3">
            {requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                <span className="text-gray-700 leading-relaxed">{req}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* FAQ Section */}
      <section ref={(el) => { sectionRefs.current.faq = el; }} id="faq">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.id} className="overflow-hidden">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                {expandedFAQs.includes(faq.id) ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                )}
              </button>
              {expandedFAQs.includes(faq.id) && (
                <div className="border-t bg-gray-50/50 px-4 pb-4 pt-3">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section ref={(el) => { sectionRefs.current.reviews = el; }} id="reviews">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Student reviews</h2>
          <Badge className="bg-amber-100 text-amber-800 text-sm">
            {course.ratings} / 5 ({course.totalReviews} reviews)
          </Badge>
        </div>
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <Card key={review.id} className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">{review.userName}</span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(review.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">{review.comment}</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
          </Card>
        )}
      </section>
    </>
  );
}
