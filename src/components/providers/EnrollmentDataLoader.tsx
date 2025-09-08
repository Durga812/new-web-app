// src/components/providers/EnrollmentDataLoader.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore';

export function EnrollmentDataLoader() {
  const { isLoaded, isSignedIn } = useAuth();
  const { fetchEnrollments, clearEnrollments } = useEnrollmentStore();

  useEffect(() => {
    // Only run logic once Clerk has loaded its state
    if (!isLoaded) return;

    if (isSignedIn) {
      // User is signed in, fetch their data
      fetchEnrollments();
    } else {
      // User is not signed in, ensure the store is clear
      clearEnrollments();
    }
    
    // The dependency array ensures this effect re-runs if the sign-in state changes
  }, [isLoaded, isSignedIn, fetchEnrollments, clearEnrollments]);

  return null; // This component renders nothing
}