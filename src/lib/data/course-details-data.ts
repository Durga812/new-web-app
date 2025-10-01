// src/lib/data/course-details-data.ts

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  lessons: {
    id: string;
    title: string;
    duration: number; // in minutes
    isPreview?: boolean;
  }[];
  totalDuration: number; // in minutes
  outcome: string;
};

export type CourseFAQ = {
  id: string;
  question: string;
  answer: string;
};

export type CourseReview = {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
};

export type CourseDetail = {
  // Basic info (existing fields)
  title: string;
  course_id: string;
  course_slug: string; // NEW: for URL routing
  enroll_id: string;
  type: string;
  category: string;
  series: string;
  tags: string[];
  ratings: number;
  totalReviews: number; // NEW
  position: number;
  pricing: {
    price1: {
      price: number;
      compared_price?: number;
      validity_duration: number;
      validity_type: string;
    };
    price2: {
      price: number;
      compared_price?: number;
      validity_duration: number;
      validity_type: string;
    };
    price3: {
      price: number;
      compared_price?: number;
      validity_duration: number;
      validity_type: string;
    };
  };
  image_url: string;
  
  // NEW: Hero section data
  subtitle: string;
  keyBenefits: string[]; // 3 main benefits
  
  // NEW: Preview
  previewVideoUrl: string;
  previewThumbnail?: string;
  
  // NEW: About section
  description: string; // Full course description
  whoIsFor: string[];
  whoIsNotFor: string[];
  
  // NEW: Course highlights
  highlights: string[];
  
  // NEW: Requirements
  requirements: string[];
  
  // NEW: Learning outcomes
  learningOutcomes: string[];
  
  // NEW: Curriculum
  modules: CourseModule[];
  totalModules: number;
  totalLessons: number;
  totalDuration: number; // in minutes
  
  // NEW: What's included
  includes: {
    icon?: string;
    text: string;
  }[];
  
  // NEW: FAQs
  faqs: CourseFAQ[];
  
  // NEW: Reviews (sample data)
  reviews?: CourseReview[];
  
 relatedCourseIds: string[];
  relatedBundleIds: string[];
  
  // Metadata
  lastUpdated: string;
};

// Sample detailed course data for "EB1A Award Self-petition"
export const courseDetails: Record<string, CourseDetail> = {
  "eb1a-award-self-petition": {
    title: "EB1A Award Self-petition",
    course_id: "c0000001",
    course_slug: "eb1a-award-self-petition",
    enroll_id: "eb1a-award-self-petition",
    type: "subscription",
    category: "eb1a",
    series: "foundation",
    tags: ["award"],
    ratings: 4.5,
    totalReviews: 327,
    position: 1,
    pricing: {
      price1: {
        price: 199,
        compared_price: 249,
        validity_duration: 3,
        validity_type: "months",
      },
      price2: {
        price: 249,
        compared_price: 299,
        validity_duration: 6,
        validity_type: "months",
      },
      price3: {
        price: 349,
        compared_price: 399,
        validity_duration: 12,
        validity_type: "months",
      },
    },
    image_url: "https://uutgcpvxpdgmnfdudods.supabase.co/storage/v1/object/public/Immigreat%20site%20assets/thumbnail.png",
    
    // Hero section
    subtitle: "Master the Art of Presenting Awards for Your EB1A Petition - A Practitioner's Framework",
    keyBenefits: [
      "Evaluate award credibility without academic bias",
      "Transform niche awards into persuasive EB1A evidence",
      "Draft award narratives that survive Final Merits analysis"
    ],
    
    // Preview
    previewVideoUrl: "https://example.com/preview-video.mp4", // Replace with actual URL
    previewThumbnail: "https://example.com/preview-thumb.jpg",
    
    // About
    description: "Are you ready to master one of the most powerful EB1A criteria—awards—without guesswork or wasted effort? This course gives you a clear, evidence-based roadmap to turn your recognitions into persuasive petition material. Many petitioners struggle to understand which awards truly count, why USCIS accepts some but rejects others, and how to present them convincingly. This course solves that problem by distilling 20 years of official AAO decisions, USCIS policy guidance, and real-world outcomes into a practical, step-by-step learning experience.",
    
    whoIsFor: [
      "Researchers and scientists preparing EB1A evidence",
      "Founders and entrepreneurs seeking extraordinary ability classification",
      "Engineers and technical professionals with industry recognitions",
      "Artists, educators, and athletes with field-specific awards",
      "Professionals ready to transform existing awards into compelling evidence"
    ],
    
    whoIsNotFor: [
      "Those seeking legal representation or attorney services",
      "Applicants without any professional achievements to date",
      "Individuals looking for guaranteed approval shortcuts",
      "Those unwilling to invest time in evidence preparation"
    ],
    
    // Highlights
    highlights: [
      "Attorney-grade frameworks based on 20 years of AAO decisions",
      "Step-by-step modules covering all aspects of awards evidence",
      "Real case studies showing approved vs. denied petitions",
      "Ready-to-use templates, checklists, and exhibit guides",
      "RFE response strategies and common objection patterns",
      "Field-specific examples across sciences, arts, business, and athletics"
    ],
    
    // Requirements
    requirements: [
      "Basic familiarity with EB1A criteria and requirements",
      "Your resume and any existing awards/certificates on hand",
      "Commitment to complete all 10 modules thoroughly",
      "Willingness to critically evaluate your current evidence"
    ],
    
    // Learning outcomes
    learningOutcomes: [
      "Understand USCIS regulations and policy on the awards criterion",
      "Identify which awards qualify and which do not under EB1A",
      "Apply strategies to develop credible awards evidence in 1–2 years",
      "Avoid common pitfalls that lead to USCIS denials or weak claims",
      "Analyze real AAO case law to uncover persuasive patterns of success",
      "Use expert letters to validate the prestige and selectivity of awards",
      "Organize exhibits and documentation that stand up to USCIS scrutiny",
      "Frame award achievements effectively in your petition letter",
      "Leverage ready-made templates, checklists, and toolkits for assembly",
      "Anticipate RFEs or NOIDs and respond with stronger evidence",
      "Position awards strategically within the EB1A final merits framework",
      "Gain clarity and confidence to present awards as proof of distinction"
    ],
    
    // Curriculum
    modules: [
      {
        id: "m1",
        title: "Module 1: Mastering USCIS Awards Policy",
        description: "Understanding the statutory and policy foundation of the awards criterion",
        lessons: [
          { id: "l1-1", title: "Breaking Down the EB1A Awards Regulation in Plain English", duration: 15, isPreview: true },
          { id: "l1-2", title: "How USCIS Interprets 'Lesser Nationally or Internationally Recognized Prizes'", duration: 20 },
          { id: "l1-3", title: "Understanding Policy Manual Guidance and Common Misinterpretations", duration: 18 },
          { id: "l1-4", title: "Why Awards Can Strengthen Your Final Merits Analysis", duration: 12 }
        ],
        totalDuration: 65,
        outcome: "By completing this module, you will understand the statutory and policy foundation of the awards criterion and why it is critical to your petition."
      },
      {
        id: "m2",
        title: "Module 2: Recognizing Strong Award Evidence",
        description: "Identifying and assessing qualifying awards across different fields",
        lessons: [
          { id: "l2-1", title: "Core Types of Awards That USCIS Accepts", duration: 22 },
          { id: "l2-2", title: "Field-Specific Examples Across Sciences, Arts, Business, Education, and Athletics", duration: 25 },
          { id: "l2-3", title: "What Makes an Award Strong: Prestige, Scope, Selectivity, and Impact", duration: 20 },
          { id: "l2-4", title: "Real-World Examples of Qualifying Awards", duration: 18 },
          { id: "l2-5", title: "The Adjudicator's Perspective: Why Certain Awards Are Accepted", duration: 15 }
        ],
        totalDuration: 100,
        outcome: "By completing this module, you will be able to identify which awards qualify, assess their strength, and present them as credible evidence."
      },
      {
        id: "m3",
        title: "Module 3: Avoiding Common Pitfalls with Awards",
        description: "Understanding what doesn't work and why",
        lessons: [
          { id: "l3-1", title: "Awards That Fail in Practice: Local, Employer-Only, or Nomination-Based", duration: 18 },
          { id: "l3-2", title: "Common Pitfalls That Lead to Rejections", duration: 20 },
          { id: "l3-3", title: "Real USCIS Denial Examples of Weak Award Evidence", duration: 22 },
          { id: "l3-4", title: "How Officers Phrase Rejections and What It Means for You", duration: 15 }
        ],
        totalDuration: 75,
        outcome: "By completing this module, you will avoid wasting effort on weak evidence and anticipate officer objections before they arise."
      },
      {
        id: "m4",
        title: "Module 4: Building Award Evidence from Scratch",
        description: "Practical strategies for developing qualifying awards",
        lessons: [
          { id: "l4-1", title: "Practical Strategies to Pursue Qualifying Awards in 1–2 Years", duration: 25 },
          { id: "l4-2", title: "Accessible, Low-Barrier Awards That Count", duration: 20 },
          { id: "l4-3", title: "Turning Everyday Work into Award-Quality Recognition", duration: 18 },
          { id: "l4-4", title: "Leveraging Awards That Overlap With Other EB1A Criteria", duration: 15 },
          { id: "l4-5", title: "Action Checklist: What to Start Doing Today", duration: 12 }
        ],
        totalDuration: 90,
        outcome: "By completing this module, you will know exactly how to develop credible awards evidence, even if you're starting with none today."
      },
      {
        id: "m5",
        title: "Module 5: Learning from AAO Case Law",
        description: "Real adjudications and what they teach us",
        lessons: [
          { id: "l5-1", title: "Approved Awards Cases: What Worked and Why", duration: 30 },
          { id: "l5-2", title: "Denied Awards Cases: Where Evidence Fell Short", duration: 28 },
          { id: "l5-3", title: "Key Language from AAO Decisions to Mirror or Avoid", duration: 20 },
          { id: "l5-4", title: "Trends in Awards Interpretation Over Time", duration: 15 },
          { id: "l5-5", title: "Field-Specific Lessons from Science, Arts, Business, Education, and Athletics", duration: 22 }
        ],
        totalDuration: 115,
        outcome: "By completing this module, you will gain insights from real adjudications to strengthen your petition and avoid repeating past mistakes."
      },
      {
        id: "m6",
        title: "Module 6: Using Expert Letters to Validate Awards",
        description: "Securing and presenting convincing expert validation",
        lessons: [
          { id: "l6-1", title: "Who to Ask: Choosing Independent and Credible Experts", duration: 18 },
          { id: "l6-2", title: "What Award Validation Letters Should Contain (and Avoid)", duration: 22 },
          { id: "l6-3", title: "How Many Letters Are Enough for Awards", duration: 12 },
          { id: "l6-4", title: "Presenting Letters Correctly: Templates, Documentation, and USCIS Expectations", duration: 20 },
          { id: "l6-5", title: "Tailoring Letters to Highlight Prestige, Selectivity, and Past Winners", duration: 18 }
        ],
        totalDuration: 90,
        outcome: "By completing this module, you will know how to secure and present expert letters that convincingly explain the significance of your awards."
      },
      {
        id: "m7",
        title: "Module 7: Making Awards Evidence Stand Up to Scrutiny",
        description: "Building bulletproof documentation",
        lessons: [
          { id: "l7-1", title: "Building a Master List of Awards Exhibits and Index Pages", duration: 20 },
          { id: "l7-2", title: "Explaining the Context of Each Award", duration: 18 },
          { id: "l7-3", title: "Showing Competitiveness: Ratios, Jury Standards, and Independence", duration: 22 },
          { id: "l7-4", title: "Supporting Claims with Analytics, Media Coverage, and Past Winners", duration: 25 },
          { id: "l7-5", title: "Demonstrating Broader Recognition of Awards in Your Field", duration: 20 }
        ],
        totalDuration: 105,
        outcome: "By completing this module, you will be able to present awards in a verifiable, persuasive way that satisfies officer scrutiny."
      },
      {
        id: "m8",
        title: "Module 8: Framing Awards in Your Petition Letter",
        description: "Writing compelling petition narratives",
        lessons: [
          { id: "l8-1", title: "Writing the Petition Section for Awards Clearly and Persuasively", duration: 25 },
          { id: "l8-2", title: "Organizing Awards Paragraphs for Maximum Impact", duration: 18 },
          { id: "l8-3", title: "Plug-and-Play Templates and Example Paragraphs", duration: 20 },
          { id: "l8-4", title: "Cross-Referencing Awards with Exhibits and Expert Letters", duration: 15 }
        ],
        totalDuration: 78,
        outcome: "By completing this module, you will be able to frame awards evidence seamlessly within your petition letter to meet USCIS standards."
      },
      {
        id: "m9",
        title: "Module 9: Templates, Tools, and Checklists for Awards",
        description: "Ready-to-use resources for immediate application",
        lessons: [
          { id: "l9-1", title: "Templates: Award Lists, Exhibit Indexes, Petition Paragraphs", duration: 30 },
          { id: "l9-2", title: "Tools: Prestige Ranking Charts, Evidence Mapping", duration: 22 },
          { id: "l9-3", title: "Checklists: Validating Competitiveness, Verifying Recognition", duration: 18 }
        ],
        totalDuration: 70,
        outcome: "By completing this module, you will have ready-to-use resources to organize, validate, and strengthen your awards evidence."
      },
      {
        id: "m10",
        title: "Module 10: Connecting Awards to Final Merits Success",
        description: "Strategic positioning for maximum impact",
        lessons: [
          { id: "l10-1", title: "How USCIS Weighs Awards in Final Merits Analysis", duration: 20 },
          { id: "l10-2", title: "Why One Prestigious Award Can Outweigh Many Minor Ones", duration: 15 },
          { id: "l10-3", title: "RFEs and NOIDs on Awards: Common Triggers and How to Respond", duration: 25 },
          { id: "l10-4", title: "Comparable Evidence: Substitutes When Awards Are Lacking", duration: 18 },
          { id: "l10-5", title: "Petition Strategy: When to Lead With Awards vs. Use as Support", duration: 17 }
        ],
        totalDuration: 95,
        outcome: "By completing this module, you will understand how awards fit into the overall EB1A strategy and how to position them for maximum impact."
      }
    ],
    totalModules: 10,
    totalLessons: 47,
    totalDuration: 883, // Total minutes (about 14.7 hours)
    
    // What's included
    includes: [
      { text: "14+ hours of on-demand video content" },
      { text: "47 comprehensive lessons across 10 modules" },
      { text: "Downloadable templates and checklists" },
      { text: "Real AAO case studies and examples" },
      { text: "Editable petition letter templates" },
      { text: "Expert letter templates and guides" },
      { text: "RFE response frameworks" },
      { text: "Lifetime updates to course materials" },
      { text: "Certificate of completion" },
      { text: "Community access for Q&A" }
    ],
    
    // FAQs
    faqs: [
      {
        id: "faq1",
        question: "How long will I have access to the course?",
        answer: "You'll have access to the entire course for the duration you select (3, 6, or 12 months). During this time, you can revisit the modules, examples, and templates anytime—even when you're ready to file your EB1A petition."
      },
      {
        id: "faq2",
        question: "Do I need to already have awards before taking this course?",
        answer: "Not at all. The course includes a dedicated module on building awards evidence from scratch in 1–2 years, with practical strategies, low-barrier opportunities, and checklists you can follow to start building credibility today."
      },
      {
        id: "faq3",
        question: "How is this course different from just reading USCIS policy?",
        answer: "This course goes beyond the regulations. It distills 20 years of AAO case decisions, USCIS policy guidance, and real-world petition outcomes into actionable strategies. You'll see exactly what works, what doesn't, and how to frame your awards for success."
      },
      {
        id: "faq4",
        question: "What if my awards are small or local?",
        answer: "That's a common concern. We'll show you how USCIS distinguishes strong awards from weak ones, explain which types don't qualify, and teach you how to avoid wasting time with evidence that won't count."
      },
      {
        id: "faq5",
        question: "Do I get templates or resources I can actually use?",
        answer: "Yes. The course comes with ready-to-use templates, checklists, and tools—including an award exhibit index, petition paragraph templates, and an RFE-proofing checklist—so you can immediately apply what you learn."
      },
      {
        id: "faq6",
        question: "Is this course only for academics or researchers?",
        answer: "No. While examples from science and academia are included, the course is designed for professionals across arts, business, education, and athletics as well. You'll learn how to tailor award evidence to your specific field."
      },
      {
        id: "faq7",
        question: "How will this course help me in the EB1A process overall?",
        answer: "By the end, you'll know how to evaluate, strengthen, and present your awards evidence in a way that meets USCIS standards and supports the 3/10 rule. More importantly, you'll understand how awards influence the final merits analysis, making your petition more persuasive and harder to deny."
      }
    ],
    
    // Sample reviews (optional)
    reviews: [
      {
        id: "r1",
        userName: "Dr. Sarah Chen",
        rating: 5,
        date: "2024-01-15",
        comment: "This course transformed my understanding of how to present awards. The AAO case examples were particularly valuable.",
        verified: true
      },
      {
        id: "r2",
        userName: "Michael R.",
        rating: 4.5,
        date: "2024-01-10",
        comment: "Comprehensive coverage of awards criterion. The templates alone are worth the price of admission.",
        verified: true
      },
      {
        id: "r3",
        userName: "Priya Sharma",
        rating: 5,
        date: "2024-01-05",
        comment: "Module 4 on building awards from scratch gave me a clear roadmap. Already started implementing the strategies!",
        verified: true
      }
    ],
    
    // Related content
    relatedCourseIds: ["c0000002", "c0000003", "c0000004"], // Related courses
    relatedBundleIds: ["b0000001"], // Related bundles
    
    // Metadata
    lastUpdated: "2024-01-20",
  }
};

// Helper function to get course details by slug
export function getCourseDetailBySlug(slug: string): CourseDetail | undefined {
  return courseDetails[slug];
}

// Helper function to get all course slugs (for static generation)
export function getAllCourseSlugs(): string[] {
  return Object.keys(courseDetails);
}