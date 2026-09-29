// Frontend admin allowlist.
//
// IMPORTANT: keep this in sync with the server-side gate in
// supabase/migrations/admin_student_outcomes_rpcs.sql (public.is_lynki_admin()).
// The frontend list only controls UI visibility (the /admin route and the
// navbar link). Actual access to per-student data is enforced server-side by
// is_lynki_admin() inside the SECURITY DEFINER RPCs, so both lists must match.
// Adding an address here alone does NOT grant access to student data.
// is_lynki_admin() in the DB is the real gate and has its own copy of this
// list. Change both, or the two disagree and the UI lies.
//
// This list was one address while the live is_lynki_admin() had grown to four,
// so authorized admins (Peter) were refused the navbar link and the /admin
// route while the RPCs behind them would have answered. Mirrored to the live
// function 2026-09-29. Lowercase only: isAdminEmail lowercases before matching.
export const ADMIN_EMAILS = [
  "erik@shryn.ai",
  "erikraschke@gmail.com",
  "erikraschke@me.com",
  "kaninip254@gmail.com",
];

// Mirrors the DB gate, which lowercases the JWT email before comparing.
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
