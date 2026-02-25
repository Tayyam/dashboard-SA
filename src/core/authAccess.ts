import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type AppRole = 'admin' | 'user';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  role: AppRole;
}

export interface ApproveRow {
  id: string;
  user_id: string;
  status: ApprovalStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

function getUserName(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = meta.full_name;
  const name = meta.name;
  const fallback = user.email?.split('@')[0] ?? 'User';
  if (typeof fullName === 'string' && fullName.trim()) return fullName;
  if (typeof name === 'string' && name.trim()) return name;
  return fallback;
}

function getUserAvatar(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const avatar = meta.avatar_url;
  const picture = meta.picture;
  if (typeof avatar === 'string' && avatar.trim()) return avatar;
  if (typeof picture === 'string' && picture.trim()) return picture;
  return null;
}

export async function ensureUserAndApproval(user: User) {
  const db = supabase.schema('publicsv');

  // 1. Try to get existing profile
  const { data: existingProfile } = await db
    .from('users')
    .select('id,email,name,avatar_url,position,role')
    .eq('id', user.id)
    .maybeSingle<UserProfileRow>();

  let profile: UserProfileRow;
  let isNewUser = false;

  if (!existingProfile) {
    // 2. Create new profile if not exists
    isNewUser = true; // Mark as new user
    const isSpecialAdmin = user.email === 'admin@test.com';
    const profilePayload = {
      id: user.id,
      email: user.email ?? '',
      name: getUserName(user),
      avatar_url: getUserAvatar(user),
      role: isSpecialAdmin ? 'admin' : 'user',
    };

    const { data: newProfile, error: insertError } = await db
      .from('users')
      .insert(profilePayload)
      .select()
      .single<UserProfileRow>();

    if (insertError) throw insertError;
    profile = newProfile;
  } else {
    // 3. Update existing profile but KEEP the role
    const updatePayload = {
      email: user.email ?? existingProfile.email,
      name: getUserName(user),
      avatar_url: getUserAvatar(user) || existingProfile.avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: updateError } = await db
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single<UserProfileRow>();

    if (updateError) throw updateError;
    profile = updatedProfile;
  }

  // 4. Handle approval record...
  const { data: existingApproval, error: approvalSelectError } = await db
    .from('approve')
    .select('id,user_id,status,requested_at,approved_at,approved_by')
    .eq('user_id', user.id)
    .maybeSingle<ApproveRow>();
  if (approvalSelectError) throw approvalSelectError;

  // Check for auto_approve setting
  let isAutoApprove = false;
  try {
    const { data: setting } = await db
      .from('settings')
      .select('value')
      .eq('key', 'auto_approve')
      .maybeSingle();
    if (setting && setting.value === true) {
      isAutoApprove = true;
    }
  } catch (e) {
    console.error('Failed to fetch auto_approve setting', e);
  }

  const isSpecialAdmin = user.email === 'admin@test.com';

  if (!existingApproval) {
    const { error: insertApprovalError } = await db.from('approve').insert({
      user_id: user.id,
      status: (isSpecialAdmin || isAutoApprove) ? 'approved' : 'pending',
      requested_at: new Date().toISOString(),
      approved_at: (isSpecialAdmin || isAutoApprove) ? new Date().toISOString() : null,
      approved_by: isSpecialAdmin ? user.id : null,
    });
    if (insertApprovalError) throw insertApprovalError;
  } else if (existingApproval.status === 'pending' && isAutoApprove) {
    // Auto-approve if previously pending but setting is now ON
    const { error: updateApprovalError } = await db.from('approve').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('id', existingApproval.id);
    if (updateApprovalError) throw updateApprovalError;
  }

  const { data: approval, error: approvalError } = await db
    .from('approve')
    .select('id,user_id,status,requested_at,approved_at,approved_by')
    .eq('user_id', user.id)
    .single<ApproveRow>();
  if (approvalError) throw approvalError;

  return { profile, approval, isNewUser };
}

