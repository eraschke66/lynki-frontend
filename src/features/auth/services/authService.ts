import { supabase } from "@/lib/supabase";
import type {
  SignUpCredentials,
  SignInCredentials,
  AuthResponse,
} from "../types";
import type { AuthError } from "@supabase/supabase-js";
import { posthog } from "@/lib/posthog";

/**
 * Sign up a new user with email and password.
 * Sends verification email automatically.
 * @param credentials - Email and password
 * @returns Promise with user data or error
 */
export async function signUp(
  credentials: SignUpCredentials,
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (!error && data.user) {
    posthog.capture("sign_up_completed", { method: "email" });
  }

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in an existing user with email and password.
 * @param credentials - Email and password
 * @returns Promise with session data or error
 */
export async function signIn(
  credentials: SignInCredentials,
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (!error && data.user) {
    posthog.capture("sign_in", { method: "email" });
  }

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign out the current user.
 * @returns Promise that resolves when sign out is complete
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

/**
 * Resend verification email to user.
 * @param email - User's email address
 * @returns Promise with error if any
 */
export async function resendVerificationEmail(
  email: string,
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { error };
}

/**
 * Sign in with Google OAuth.
 * Redirects to Google for authentication.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (!error) {
    posthog.capture("sign_in", { method: "google" });
  }
  return { error: error as AuthError | null };
}

/**
 * Get the current session.
 * @returns Promise with session data or null
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  return data.session;
}

/**
 * Get the current user.
 * @returns Promise with user data or null
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);
    return null;
  }

  return data.user;
}
