// src/lib/data/categories.ts
export interface Category {
  cat_slug: string;
  color: string;
  short_description: string;
  full_description: string;
  title: string;
}

export const categories: Record<string, Category> = {
  "EB1A": {
    title: "EB1A",
    cat_slug: "eb1a",
    color: "#f59e0b", // amber-500
    short_description: "Extraordinary Ability",
    full_description: "Green card petition for individuals with extraordinary ability and sustained acclaim in their field."
  },
  "EB2-NIW": {
    title: "EB2-NIW", 
    cat_slug: "eb2-niw",
    color: "#f97316", // orange-500
    short_description: "National Interest Waiver",
    full_description: "Green card petition for professionals whose work is of substantial merit and national importance."
  },
  "O-1": {
    title: "O-1",
    cat_slug: "o-1", 
    color: "#eab308", // yellow-500
    short_description: "Extraordinary Ability Visa",
    full_description: "Temporary work visa for individuals with extraordinary ability who want to work in the U.S."
  },
  "EB5": {
    title: "EB5",
    cat_slug: "eb5",
    color: "#10b981", // emerald-500  
    short_description: "Investment Green Card",
    full_description: "Green card petition for investors who create U.S. jobs through significant financial investment."
  }
};

export const getCategoryBySlug = (slug: string): Category | null => {
  return Object.values(categories).find(cat => cat.cat_slug === slug) || null;
};

export const getAllCategories = (): Category[] => {
  return Object.values(categories);
};
