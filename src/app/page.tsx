// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Master Your Immigration Journey
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Expert-guided courses for EB1A, EB2-NIW and more. Get the knowledge and tools you need to succeed.
        </p>
        <div className="space-x-4">
          <Link 
            href="/courses" 
            className="bg-amber-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Browse Courses
          </Link>
          <Link 
            href="/bundles" 
            className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
          >
            View Bundles
          </Link>
        </div>
      </div>

    </div>
  );
}