// src/components/layout/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-amber-200 bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label="Home" className="mb-4 inline-block">
              <Image
                src="https://ehyddwnabgcolqicgouo.supabase.co/storage/v1/object/public/site%20assets/Green%20Card%20Logo.png"
                alt="Immigreat logo"
                width={200}
                height={40}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-600">
              Expert-guided immigration courses to support your journey to the United States.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Discover</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="transition-colors hover:text-amber-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-amber-600">
                  Courses
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Get Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="mailto:hello@immigreat.ai" className="transition-colors hover:text-amber-600">
                  hello@immigreat.ai
                </a>
              </li>
              <li>
                <span className="text-gray-500">Mon–Fri · 9am to 5pm ET</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Stay Updated</h4>
            <p className="text-sm text-gray-600">Get immigration tips and product updates once a month.</p>
            <form className="mt-3 space-y-2">
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-amber-200 pt-6 text-sm text-gray-600">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>© {new Date().getFullYear()} Immigreat.ai. All rights reserved.</p>
            <p>Building clarity and confidence for aspiring immigrants.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
