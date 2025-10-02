// src/components/layout/Navigation.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser, useClerk, SignInButton } from "@clerk/nextjs";
import {
  BookOpen,
  ChevronDown,
  Home as HomeIcon,
  LifeBuoy,
  LogOut,
  Menu,
  ShoppingCart,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CartDrawer } from "./CartDrawer";
import { useCartStore } from "@/stores/cart-store";

export function Navigation() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const items = useCartStore(state => state.items);
  const openCart = useCartStore(state => state.openCart);
  const cartCount = items.length;

  const getInitials = () => {
    const fullName = user?.fullName?.trim();
    if (!fullName) return "U";
    const parts = fullName.split(" ");
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  };

  const updateNavOffset = useCallback(() => {
    if (typeof window === "undefined" || !navContainerRef.current) {
      return;
    }

    const height = navContainerRef.current.offsetHeight;
    document.documentElement.style.setProperty("--nav-offset", `${height}px`);
    window.dispatchEvent(new CustomEvent("immigreat:nav-resize"));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    updateNavOffset();
  }, [updateNavOffset, isMobileMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    updateNavOffset();
    window.addEventListener("resize", updateNavOffset);

    return () => {
      window.removeEventListener("resize", updateNavOffset);
    };
  }, [updateNavOffset]);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const handleViewEnrollments = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/my-enrollments");
  };

  const bannerMessages = [
    "Add 5 courses and save 6% (Foundation)",
    "Pick 10 courses for an easy 11% off (Leader)",
    "Grab 20 and the discount jumps to 16% (Visionary)",
    "Build a 40-course stack and lock in 27% off (Extraordinary)",
    "All savings apply automatically to eligible courses",
  ];

  return (
    <>
      <div ref={navContainerRef} className="fixed inset-x-0 top-0 z-40">
        <div className="bg-gradient-to-r from-amber-600/90 via-amber-700/90 to-orange-600/90 text-amber-50">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2 text-xs font-semibold sm:px-6 sm:text-sm lg:px-8">
            <div className="relative flex-1 overflow-hidden whitespace-nowrap">
              <div className="banner-marquee">
                {[0, 1].map(track => (
                  <div key={track} className="banner-marquee-track">
                    {bannerMessages.map((message, index) => (
                      <span key={`${track}-${index}`} className="banner-marquee-item text-amber-50">
                        <span className="dot" aria-hidden="true" />
                        {message}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <header className="border-b border-amber-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Home" className="flex items-center">
            <Image
              src="https://ehyddwnabgcolqicgouo.supabase.co/storage/v1/object/public/site%20assets/Green%20Card%20Logo.png"
              alt="Immigreat logo"
              width={180}
              height={36}
              priority
              className="h-8 sm:h-9 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost" className="text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                <BookOpen className="mr-2 h-4 w-4" />
                Courses
              </Button>
            </Link>
            <a
              href="mailto:hello@immigreat.ai"
              className="rounded-lg"
            >
              <Button variant="ghost" className="text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Support
              </Button>
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Open cart"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Button>

            {!isLoaded ? (
              <div className="hidden h-10 w-24 animate-pulse rounded-full bg-gray-200 sm:block" />
            ) : isSignedIn ? (
              <div className="hidden sm:block" ref={profileRef}>
                <Button
                  variant="ghost"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="flex items-center gap-2"
                  aria-expanded={isProfileOpen}
                >
                  <Avatar className="h-9 w-9">
                    {user?.imageUrl ? (
                      <AvatarImage src={user.imageUrl} alt={user.fullName ?? "Your avatar"} />
                    ) : (
                      <AvatarFallback initials={getInitials()} />
                    )}
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>

                {isProfileOpen && (
                  <div className="absolute right-6 mt-3 w-72 overflow-hidden rounded-lg border border-amber-100 bg-white shadow-xl">
                    <div className="bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleViewEnrollments}
                      >
                        <UserIcon className="mr-3 h-4 w-4" />
                        My enrollments
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <SignInButton mode="modal">
                <Button className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Sign in
                </Button>
              </SignInButton>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-amber-100 bg-white/95 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HomeIcon className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/courses"
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              Courses
            </Link>
            <a
              href="mailto:hello@immigreat.ai"
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </a>
            {!isLoaded ? (
              <div className="mt-3 h-10 w-full animate-pulse rounded-lg bg-gray-200" />
            ) : isSignedIn ? (
              <div className="mt-3 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleViewEnrollments}
                >
                  <UserIcon className="mr-3 h-4 w-4" />
                  My Enrollments  {/* Update this text */}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <SignInButton mode="modal">
                <Button className="mt-3 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Sign in
                </Button>
              </SignInButton>
            )}
          </div>
        )}
        </header>
      </div>

      <CartDrawer />
    </>
  );
}
