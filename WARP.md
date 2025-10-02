# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Immigreat is a Next.js 15 immigration course platform built with React 19, TypeScript, and Tailwind CSS. The application allows users to browse and purchase individual courses or curated bundles to help with immigration processes like EB1A and EB2-NIW petitions.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components (New York variant)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Course Delivery**: LearnWorlds API integration
- **State Management**: Zustand (cart, enrollment state)
- **Package Manager**: Bun (uses bun.lock)

### Key Integrations
- **Clerk**: Handles authentication and user management
- **Supabase**: Stores course catalogs, user enrollments, and application data
- **Stripe**: Processes payments with webhook handling
- **LearnWorlds**: External course platform for content delivery

## Development Commands

```bash
# Development server (uses Turbopack)
bun dev

# Production build
bun run build

# Start production server
bun start

# Linting
bun run lint

# Install dependencies
bun install
```

## Project Structure

### Core Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components organized by domain
- `src/lib/` - Utility functions, API clients, and business logic
- `src/stores/` - Zustand stores for global state
- `src/types/` - TypeScript type definitions

### Key Components
- **Course Pages**: Dynamic routes for individual courses (`/course/[course_slug]`) and bundles (`/bundle/[bundle_slug]`)
- **Shopping Cart**: Persistent cart using Zustand with localStorage
- **Payment Flow**: Stripe checkout with webhook processing for LearnWorlds enrollment
- **Authentication**: Protected routes using Clerk middleware

### API Architecture
- **Catalog API**: Course and bundle data fetching from Supabase
- **Stripe Webhook**: Handles payment completion and automatic LearnWorlds enrollment
- **Revalidation API**: ISR endpoints for content updates

## Environment Variables

The application requires several environment variables. Key ones include:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase database
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` - Payment processing
- `LEARNWORLDS_API_TOKEN` and `LEARNWORLDS_CLIENT_ID` - Course platform integration

## Data Flow

1. **Course Browsing**: Data fetched from Supabase using ISR for performance
2. **Cart Management**: Items stored in Zustand with localStorage persistence
3. **Checkout**: Creates Stripe session with metadata for LearnWorlds enrollment
4. **Payment Completion**: Webhook automatically enrolls users in LearnWorlds courses
5. **Enrollment Tracking**: Success/failure status stored in Supabase

## Development Patterns

### Component Organization
- UI components in `src/components/ui/` (shadcn/ui)
- Domain-specific components in subdirectories (e.g., `course-detail/`, `layout/`)
- Client components marked with `'use client'` directive

### Data Fetching
- Server components fetch data directly from Supabase
- Client components use browser Supabase client
- ISR used for course catalogs with revalidation endpoints

### State Management
- Cart state: Zustand store with localStorage persistence
- Enrollment state: Zustand store for user course access
- Authentication state: Handled by Clerk

### Error Handling
- Comprehensive error normalization in webhook processing
- Graceful fallbacks for missing environment variables
- Console logging for debugging payment and enrollment flows

## Testing and Quality

### Linting
- ESLint configured with Next.js rules
- TypeScript strict mode enabled
- Excludes Next.js build artifacts and generated types

### Type Safety
- Comprehensive TypeScript types for all data models
- Strict typing for API responses and component props
- Type definitions organized by domain (cart, catalog, course details)

## Deployment Considerations

- Built for Vercel deployment (uses VERCEL_URL for webhook URLs)
- Image optimization configured for Supabase storage
- Webhook endpoints require proper secret validation
- LearnWorlds API has rate limiting with configurable delays

## Key Files to Understand

- `src/middleware.ts` - Route protection and user context
- `src/app/api/webhooks/stripe/route.ts` - Payment processing and enrollment
- `src/lib/stripe/create-checkout-session.ts` - Checkout flow with discount calculations
- `src/stores/cart-store.ts` - Shopping cart state management
- `src/components/layout/Navigation.tsx` - Main navigation with auth integration