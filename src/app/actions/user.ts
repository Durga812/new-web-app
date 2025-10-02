// src/app/actions/user.ts
'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function ensureUserInDatabase() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await currentUser();
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Idempotent upsert by clerk_user_id to avoid duplicate-user errors
    const email = user.primaryEmailAddress?.emailAddress;
    const firstName = user.firstName || user.username || 'User';
    const lastName = user.lastName || null;

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert(
        {
          clerk_user_id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
        },
        { onConflict: 'clerk_user_id' }
      )
      .select('id')
      .single();

    if (upsertError) {
      console.error('Failed to upsert user:', upsertError);
      return { success: false, error: 'Failed to verify user account' };
    }

    return { success: true, userId: upsertedUser.id };
    
  } catch (error) {
    console.error('Unexpected error in ensureUserInDatabase:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}