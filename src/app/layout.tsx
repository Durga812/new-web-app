// src/app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CartSyncProvider } from "@/components/providers/cart-sync-provider";
import { CartAuthProvider } from "@/components/providers/cart-auth-provider";

export const metadata: Metadata = {
  title: "Immigreat - Immigration Course Platform",
  description:
    "Master your immigration petition with expert-guided courses for EB1A, EB2-NIW and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className="antialiased font-sans">
          <CartAuthProvider />
          <CartSyncProvider />
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
