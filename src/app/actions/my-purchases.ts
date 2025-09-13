// src/app/actions/my-purchases.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getUserEnrollments,
  getUserOrderHistory,
  getBundleChildCourses,
  getUserCourseRating,
  submitCourseRating,
  createBillingPortalSession
} from '@/lib/data/my-purchases';
import { 
  EnrollmentItem, 
  OrderHistoryItem, 
  CourseChild, 
  CourseRating 
} from '@/lib/types/my-purchases';

/**
 * Get current user's enrollments
 */
export async function getMyEnrollments(): Promise<EnrollmentItem[]> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return getUserEnrollments(userId);
}

/**
 * Get current user's order history
 */
export async function getMyOrderHistory(): Promise<OrderHistoryItem[]> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return getUserOrderHistory(userId);
}

/**
 * Get child courses for a bundle
 */
export async function getBundleCourses(bundleId: string): Promise<CourseChild[]> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return getBundleChildCourses(bundleId);
}

/**
 * Get user's rating for a course
 */
export async function getMyCourseRating(courseId: string): Promise<CourseRating | null> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return getUserCourseRating(userId, courseId);
}

/**
 * Submit course rating
 */
export async function submitRating(
  courseId: string, 
  rating: number, 
  feedback: string
): Promise<CourseRating> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  return submitCourseRating(userId, courseId, rating, feedback);
}

/**
 * Create billing portal session and redirect
 */
export async function goToBillingPortal(): Promise<never> {
  const { userId } = await auth();
  console.log('User ID for billing portal:', userId);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  let url: string;
  try {
    url = await createBillingPortalSession(userId);
    
  } catch (error) {
    console.error('Failed to create billing portal session:', error);
    throw new Error('Failed to access billing portal');
  }
  redirect(url);
}