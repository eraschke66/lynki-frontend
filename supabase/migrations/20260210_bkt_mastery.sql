-- 20260210_bkt_mastery.sql
-- Adds Bayesian Knowledge Tracing (BKT) mastery state per user per knowledge component (KC).
-- Note: In the current Lynki implementation, the "KC" corresponds most closely to concept_id.

create table if not exists public.bkt_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  knowledge_component_id uuid not null,
  p_mastery double precision not null default 0.3,
  p_learn double precision not null default 0.1,
  p_slip double precision not null default 0.1,
  p_guess double precision not null default 0.25,
  total_attempts integer not null default 0,
  last_updated timestamptz not null default now(),
  constraint bkt_mastery_unique unique (user_id, knowledge_component_id)
);

create index if not exists idx_bkt_mastery_user on public.bkt_mastery(user_id);
create index if not exists idx_bkt_mastery_kc on public.bkt_mastery(knowledge_component_id);

-- Enable RLS. Backend uses SERVICE ROLE key, so it can write regardless of RLS.
alter table public.bkt_mastery enable row level security;

-- Allow a signed-in user to read only their own mastery rows (optional but useful for debugging).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='bkt_mastery' and policyname='bkt_mastery_select_own'
  ) then
    create policy bkt_mastery_select_own
      on public.bkt_mastery
      for select
      using (auth.uid() = user_id);
  end if;
end $$;
