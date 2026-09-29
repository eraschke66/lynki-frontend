-- Bring the repo's is_lynki_admin() into line with the database.
--
-- ALREADY LIVE. This migration is a record, not a change. The function below
-- is byte-for-byte what production has been running; it was applied directly
-- to the database at some point after admin_student_outcomes_rpcs.sql, and the
-- repo was never caught up. Read back from production on 2026-09-29:
--
--   select pg_get_functiondef(oid) from pg_proc
--   where proname = 'is_lynki_admin' and pronamespace = 'public'::regnamespace;
--
-- returned the four addresses below. admin_student_outcomes_rpcs.sql still
-- declares one ('erikraschke@gmail.com', "narrowed to a single admin on
-- 2026-08-09"), so anyone reading the repo would have concluded that Peter has
-- no admin access, when in fact the database grants it. That older file is
-- left untouched on purpose: it is the record of what was true then.
--
-- The drift had a visible symptom. ADMIN_EMAILS in
-- src/features/admin/adminAccess.ts was kept in sync with the OLD migration,
-- so it held one address while the gate held four: authorized admins were
-- refused the navbar link and the /admin route while the SECURITY DEFINER RPCs
-- behind them would have answered. The frontend list was mirrored onto the
-- live four in the same change that added this file.
--
-- Do not apply this to the production database. Running it is a no-op that
-- rewrites the function to what it already is, but there is no reason to take
-- the write. It exists so a fresh environment built from these migrations, and
-- anyone reading them, gets the same gate production has.
--
-- The frontend list only decides whether the link and the page render. This is
-- the gate that matters. Keep the two in sync.

create or replace function public.is_lynki_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in (
    'erik@shryn.ai',
    'erikraschke@gmail.com',
    'erikraschke@me.com',
    'kaninip254@gmail.com'
  );
$$;

revoke all on function public.is_lynki_admin() from public;
grant execute on function public.is_lynki_admin() to authenticated;
