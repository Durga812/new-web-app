// src/lib/data/series-metadata.ts

export type SeriesMetadata = {
  slug: string;
  displayName: string;
  subtitle: string;
  tooltipContent: string;
  order: number;
  bgColor?: string; // For subtle column differentiation
  accentColor?: string; // For badges and highlights
};

export type CategorySeriesConfig = {
  [category: string]: {
    [seriesSlug: string]: SeriesMetadata;
  };
};

export const seriesMetadata: CategorySeriesConfig = {
  "eb1a": {
    "foundation": {
      slug: "foundation",
      displayName: "Foundation",
      subtitle: "Core criteria fundamentals",
      tooltipContent: "Foundation courses cover the essential requirements and documentation needed for each EB1A criterion. These courses provide comprehensive guidance on meeting the basic eligibility requirements.",
      order: 1,
      bgColor: "bg-slate-50/50",
      accentColor: "text-slate-600"
    },
    "final merit": {
      slug: "final merit",
      displayName: "Final Merit",
      subtitle: "Advanced argumentation",
      tooltipContent: "Final Merit courses focus on strengthening your arguments and presenting compelling evidence to establish extraordinary ability. Learn advanced strategies for making your case stand out.",
      order: 2,
      bgColor: "bg-blue-50/30",
      accentColor: "text-blue-600"
    },
    "rfe": {
      slug: "rfe",
      displayName: "RFE Response",
      subtitle: "Evidence request guidance",
      tooltipContent: "RFE courses help you respond effectively to USCIS requests for additional evidence. Get specific strategies and templates for addressing common RFE issues for each criterion.",
      order: 3,
      bgColor: "bg-amber-50/30",
      accentColor: "text-amber-600"
    },
    "comparable evidence": {
      slug: "comparable evidence",
      displayName: "Comparable Evidence",
      subtitle: "Alternative documentation",
      tooltipContent: "Learn how to present comparable evidence when traditional documentation isn't available for your field. Discover creative approaches to meeting USCIS requirements.",
      order: 4,
      bgColor: "bg-emerald-50/30",
      accentColor: "text-emerald-600"
    }
  },
  "eb2-niw": {
    "foundation": {
      slug: "foundation",
      displayName: "NIW Foundation",
      subtitle: "National interest basics",
      tooltipContent: "Foundation courses for EB2-NIW covering the three prongs of national interest waiver requirements and how to build a strong case.",
      order: 1,
      bgColor: "bg-slate-50/50",
      accentColor: "text-slate-600"
    },
    "advanced": {
      slug: "advanced",
      displayName: "Advanced Strategies",
      subtitle: "Complex case scenarios",
      tooltipContent: "Advanced techniques for strengthening your NIW petition with compelling evidence of national importance.",
      order: 2,
      bgColor: "bg-indigo-50/30",
      accentColor: "text-indigo-600"
    }
  },
  "o-1": {
    "foundation": {
      slug: "foundation",
      displayName: "O-1 Essentials",
      subtitle: "Extraordinary ability visa",
      tooltipContent: "Essential courses covering O-1 visa requirements for individuals with extraordinary ability in sciences, arts, education, business, or athletics.",
      order: 1,
      bgColor: "bg-purple-50/30",
      accentColor: "text-purple-600"
    },
    "evidence": {
      slug: "evidence",
      displayName: "Evidence Building",
      subtitle: "Documentation strategies",
      tooltipContent: "Learn how to compile and present evidence effectively for your O-1 petition, including letters of recommendation and proof of achievements.",
      order: 2,
      bgColor: "bg-pink-50/30",
      accentColor: "text-pink-600"
    }
  },
  "eb5": {
    "foundation": {
      slug: "foundation",
      displayName: "EB-5 Fundamentals",
      subtitle: "Investment immigration",
      tooltipContent: "Comprehensive overview of EB-5 investment immigration requirements, including investment amounts, job creation, and regional centers.",
      order: 1,
      bgColor: "bg-green-50/30",
      accentColor: "text-green-600"
    },
    "regional-center": {
      slug: "regional-center",
      displayName: "Regional Centers",
      subtitle: "RC investment guide",
      tooltipContent: "Understanding EB-5 Regional Center investments, due diligence, and selecting the right project for your immigration goals.",
      order: 2,
      bgColor: "bg-teal-50/30",
      accentColor: "text-teal-600"
    }
  }
};