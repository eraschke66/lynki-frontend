-- OPTIONAL. The 7-day trial already works without this.
--
-- The frontend derives the trial from user_profiles.created_at
-- (features/subscription/access.ts), so every existing and future account is
-- entitled correctly the moment that code deploys — no migration, no backfill,
-- no signup-path change. A derived trial is retroactively right by construction.
--
-- Add this column only when you want to do something the derived version can't:
--   * extend a specific student's trial ("their exam is Thursday, give them a week")
--   * revoke a trial for abuse
--   * run a different trial length for a cohort
--
-- access.ts already prefers trial_ends_at over created_at, so the day this runs,
-- explicit values start winning. Nothing else has to change.
--
-- NOT APPLIED BY CLAUDE. No PassAI database access from here — no connection
-- string, no service-role key, and the Supabase MCP returns
-- "You do not have permission". Run it in the SQL editor.

alter table public.user_profiles
  add column if not exists trial_ends_at timestamptz;

comment on column public.user_profiles.trial_ends_at is
  'Explicit end of the free trial. When null, the trial is derived as created_at + 7 days (see features/subscription/access.ts). Set this only to override the default.';


-- ---------------------------------------------------------------------------
-- BACKFILL — READ BEFORE RUNNING. Erik asked to see who is affected first.
--
-- The spec proposed backfilling never-paid accounts with
-- created_at + 7 days. Be aware what that does: for anyone who signed up more
-- than 7 days ago it writes a date in the PAST, i.e. it explicitly marks their
-- trial expired. The derived fallback already treats them that way, so the
-- backfill changes nothing functionally — it just makes it permanent and
-- un-reversible-by-default.
--
-- If instead you want to give real early users a fresh week from today, use the
-- second statement. Decide with the signup numbers in front of you.
-- ---------------------------------------------------------------------------

-- Who is affected. Run these two FIRST — they are the queries Erik asked for.
-- (Claude could not run them: both need service-role. The first aggregates all
-- profiles; the second joins auth.users. RLS blocks both from any client key.)

-- select date_trunc('day', created_at) as day, count(*)
-- from public.user_profiles group by 1 order by 1 desc limit 14;

-- select u.email, p.created_at, p.subscription_tier
-- from public.user_profiles p join auth.users u on u.id = p.user_id
-- order by p.created_at desc limit 20;

-- Option 1 — honest history: trial ran from signup, expired where it expired.
-- update public.user_profiles
--    set trial_ends_at = created_at + interval '7 days'
--  where trial_ends_at is null
--    and stripe_subscription_id is null
--    and subscription_status is null;

-- Option 2 — fresh week from today for everyone who never paid.
-- update public.user_profiles
--    set trial_ends_at = now() + interval '7 days'
--  where trial_ends_at is null
--    and stripe_subscription_id is null
--    and subscription_status is null;
