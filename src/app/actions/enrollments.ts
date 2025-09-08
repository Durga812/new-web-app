// src/app/actions/enrollments.ts
'use server'; // This marks all functions in this file as Server Actions

import { auth } from '@clerk/nextjs/server';
import { getActiveEnrollmentsByClerkId, ActiveEnrollmentItem } from '@/lib/data/purchase_data';

/**
 * A Server Action that securely fetches enrollments for the currently logged-in user.
 * It can be called from client components.
 */
export async function getMyActiveEnrollments(): Promise<ActiveEnrollmentItem[]> {
  // auth() securely gets the session details on the server
  const { userId } = await auth();

  if (!userId) {
    // If there's no user, there are no enrollments
    return [];
  }

  try {
    const enrollments = await getActiveEnrollmentsByClerkId(userId);
    return enrollments;
  } catch (error) {
    console.error("Server Action error fetching enrollments:", error);
    // In a real app, you might want better error handling
    return [];
  }
}