import { reportError } from "@/lib/sentry";
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
    reportError("Error signing out:", error);
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
    reportError("Error getting session:", error);
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
    reportError("Error getting user:", error);
    return null;
  }

  return data.user;
}

/**
 * Send a password-reset link.
 *
 * The redirect lands on /reset-password. Supabase puts the recovery session in
 * the URL, and because the client runs the PKCE flow the SDK exchanges it and
 * strips it from the address bar before ResetPasswordPage renders — so the page
 * only has to check that a session exists.
 */
export async function sendPasswordReset(
  email: string,
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
}

/**
 * Set a new password for the user holding a valid recovery session.
 */
export async function updatePassword(
  password: string,
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({ password });
  return { error };
}
