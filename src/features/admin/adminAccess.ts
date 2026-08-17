// Frontend admin allowlist.
//
// IMPORTANT: keep this in sync with the server-side gate in
// supabase/migrations/admin_student_outcomes_rpcs.sql (public.is_lynki_admin()).
// The frontend list only controls UI visibility (the /admin route and the
// navbar link). Actual access to per-student data is enforced server-side by
// is_lynki_admin() inside the SECURITY DEFINER RPCs, so both lists must match.
// One admin, deliberately. Adding an address here alone does NOT grant access
// to student data — is_lynki_admin() in the DB is the real gate and has its own
// copy of this list. Change both, or the two disagree and the UI lies.
export const ADMIN_EMAILS = ["erikraschke@gmail.com"];

// Mirrors the DB gate, which lowercases the JWT email before comparing.
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
