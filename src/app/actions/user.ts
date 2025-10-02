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

    // Check if user exists in database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to check user existence:', fetchError);
      return { success: false, error: 'Database error' };
    }

    // User exists, return success
    if (existingUser) {
      return { success: true, userId: existingUser.id };
    }

    // User doesn't exist, create new record
    const email = user.primaryEmailAddress?.emailAddress;
    const firstName = user.firstName || user.username || 'User';
    const lastName = user.lastName || null;

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_user_id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create user:', insertError);
      return { success: false, error: 'Failed to create user account' };
    }

    return { success: true, userId: newUser.id };
    
  } catch (error) {
    console.error('Unexpected error in ensureUserInDatabase:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}