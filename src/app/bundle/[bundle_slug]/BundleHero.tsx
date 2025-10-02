// src/app/bundle/[bundle_slug]/BundleHero.tsx
"use client";

import { useMemo, useState } from "react";
import { BookOpen, Check, Clock, Link2, Share2, Star, Users, Twitter, Linkedin, Facebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnrollmentStore } from "@/stores/enrollment-store";
import type { BundleDetail } from "@/types/bundle-detail";

interface BundleHeroProps {
  bundle: BundleDetail;
}

export default function BundleHero({ bundle }: BundleHeroProps) {
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [copied, setCopied] = useState(false);
  const isProductPurchased = useEnrollmentStore((state) => state.isProductPurchased);
  const isEnrollPurchased = useEnrollmentStore((state) => state.isEnrollPurchased);

  const isPurchased = useMemo(() => {
    return isProductPurchased(bundle.bundle_id) || isEnrollPurchased(bundle.enroll_id);
  }, [bundle.bundle_id, bundle.enroll_id, isEnrollPurchased, isProductPurchased]);

  const tags = Array.isArray(bundle.tags) ? bundle.tags : [];
  const courseCount = bundle.includedCourseIds.length;

  const bundleUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=Check out: ${bundle.title}&url=${encodeURIComponent(bundleUrl)}`,
      color: "text-blue-400 hover:text-blue-600",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(bundleUrl)}`,
      color: "text-blue-700 hover:text-blue-900",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bundleUrl)}`,
      color: "text-blue-600 hover:text-blue-800",
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bundleUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowSharePopover(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  const formatDurationLabel = () => {
    const months = bundle.pricing.validity_duration;
    if (!months) return "Flexible access";
    if (months % 12 === 0) {
      const years = Math.round(months / 12);
      return `${years} year${years > 1 ? "s" : ""} access`;
    }
    return `${months} ${bundle.pricing.validity_type}`;
  };

  return (
    <section className="relative overflow-hidden rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/30 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-orange-100/20" />

      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
            {bundle.category.toUpperCase()}
          </Badge>
          {bundle.series && (
            <Badge variant="outline" className="border-gray-300 text-xs">
              {bundle.series.charAt(0).toUpperCase() + bundle.series.slice(1)} Series
            </Badge>
          )}
          {isPurchased && (
            <Badge className="border-0 bg-emerald-500/90 text-xs text-white">
              <Check className="mr-1 h-3 w-3" /> Owned
            </Badge>
          )}
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="border-gray-200 text-gray-600 text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="mb-3 flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {bundle.title}
          </h1>

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
                <div className="fixed inset-0 z-40" onClick={() => setShowSharePopover(false)} />
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

        {bundle.subtitle && (
          <p className="mb-5 text-base text-gray-600">{bundle.subtitle}</p>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white/70 px-4 py-3 shadow-sm">
            <BookOpen className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Courses included</p>
              <p className="text-sm font-semibold text-gray-900">{courseCount} courses</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white/70 px-4 py-3 shadow-sm">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Access period</p>
              <p className="text-sm font-semibold text-gray-900">{formatDurationLabel()}</p>
            </div>
          </div>
        </div>

        {bundle.includedCourses.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Star className="h-4 w-4 text-amber-500" />
            <span>Top course highlights bundled together to maximise value.</span>
          </div>
        )}
      </div>
    </section>
  );
}
