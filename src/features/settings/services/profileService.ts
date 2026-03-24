/**
 * Profile service — direct Supabase queries on user_profiles table.
 */

import { supabase } from "@/lib/supabase";

export interface UserProfile {
  curriculum: string;
}

/**
 * Get user profile (curriculum setting).
 * Returns default "percentage" if no row exists yet.
 */
export async function fetchProfile(userId: string): Promise<UserProfile> {
  const { data } = await supabase
    .from("user_profiles")
    .select("curriculum")
    .eq("user_id", userId)
    .maybeSingle();
  return { curriculum: data?.curriculum ?? "percentage" };
}

/**
 * Create or update user profile (curriculum setting).
 */
export async function updateProfile(
  userId: string,
  update: { curriculum: string },
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, curriculum: update.curriculum }, { onConflict: "user_id" })
    .select("curriculum")
    .single();
  if (error) throw new Error(error.message);
  return { curriculum: data.curriculum };
}
