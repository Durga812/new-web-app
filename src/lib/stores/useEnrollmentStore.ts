// src/stores/useEnrollmentStore.ts
import { create } from 'zustand';
import { getMyActiveEnrollments } from '@/app/actions/enrollments'; // Import the Server Action
import type { ActiveEnrollmentItem } from '@/lib/data/purchase_data';

interface EnrollmentState {
  enrollments: ActiveEnrollmentItem[];
  isLoading: boolean;
  // Action to fetch data using the server action
  fetchEnrollments: () => Promise<void>;
  // Action to clear data on logout
  clearEnrollments: () => void;
  // A helper/selector to easily check if a product is owned
  hasEnrollment: (productId: string, itemEnrollId?: string) => boolean;
}

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  enrollments: [],
  isLoading: false,

  fetchEnrollments: async () => {
    set({ isLoading: true });
    try {
      // Call the server action directly from the store
      const data = await getMyActiveEnrollments();
      set({ enrollments: data, isLoading: false });
      console.log('✅ Enrollments loaded into global state.');
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
      set({ isLoading: false });
    }
  },

  clearEnrollments: () => {
    set({ enrollments: [] });
    console.log('🗑️ Cleared enrollments from global state.');
  },

  // Check ownership by product id, and optionally by specific item_enroll_id
  hasEnrollment: (productId: string, itemEnrollId?: string) => {
    const enrollments = get().enrollments;
    if (!itemEnrollId) {
      return enrollments.some((item) => item.item_id === productId);
    }
    return enrollments.some(
      (item) => item.item_id === productId && item.item_enroll_id === itemEnrollId
    );
  },
}));
