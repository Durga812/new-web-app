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

    // Fast-path: if user already exists, return immediately
    const { data: existingUser, error: existingErr } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (existingErr) {
      console.error('Failed to check user existence:', existingErr);
      return { success: false, error: 'Database error' };
    }

    if (existingUser?.id) {
      return { success: true, userId: existingUser.id };
    }

    // Create-if-missing: also reconcile by email if a row exists with same email
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
    const firstName = user.firstName || user.username || 'User';
    const lastName = user.lastName || null;

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // 1) Try to find by email (in case a row was created by webhook or older flow)
    const { data: emailUser, error: emailFetchErr } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .eq('email', email)
      .maybeSingle();

    if (emailFetchErr) {
      console.error('Failed to check user by email:', emailFetchErr);
      return { success: false, error: 'Database error' };
    }

    if (emailUser?.id) {
      // If the row exists but has a different/missing clerk id, attach the current one
      if (emailUser.clerk_user_id !== userId) {
        const { error: attachErr } = await supabase
          .from('users')
          .update({ clerk_user_id: userId, first_name: firstName, last_name: lastName })
          .eq('id', emailUser.id);

        if (attachErr) {
          console.error('Failed to attach clerk_user_id to existing email user:', attachErr);
          // Even if update fails, attempt to proceed with the found user id
        }
      }

      return { success: true, userId: emailUser.id };
    }

    // 2) No row by email; insert a fresh one
    const { data: insertedUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        clerk_user_id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Failed to create user (insert):', insertErr);
      // Fallback: try to fetch again by clerk id or email in case of race conditions
      const { data: refetchByClerk } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .maybeSingle();
      if (refetchByClerk?.id) {
        return { success: true, userId: refetchByClerk.id };
      }
      const { data: refetchByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (refetchByEmail?.id) {
        return { success: true, userId: refetchByEmail.id };
      }

      return { success: false, error: 'Failed to verify user account' };
    }

    return { success: true, userId: insertedUser.id };
    
  } catch (error) {
    console.error('Unexpected error in ensureUserInDatabase:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}