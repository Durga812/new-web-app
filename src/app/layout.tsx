// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Immigreat - Immigration Course Platform",
  description: "Master your immigration petition with expert-guided courses for EB1A, EB2-NIW and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Navigation />
          <main className="min-h-screen bg-gradient-to-b from-amber-50/80 to-white pt-16">
            {children}
          </main>
          <Toaster 
            position="top-right" 
            expand={true}
            richColors
            closeButton
          />
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}