-- =============================================================================
-- Admin student-outcomes RPCs (SECURITY DEFINER, server-side admin gate)
--
-- WHY: every table the admin per-student view needs (quiz_attempts,
-- topic_quiz_sessions, bkt_mastery, documents, courses, concepts, topics) is
-- RLS self-only (auth.uid()). A frontend client therefore can only read the
-- admin's OWN rows. These two RPCs run as SECURITY DEFINER (bypassing RLS) but
-- ONLY after verifying, server-side, that the caller's email is on the admin
-- allowlist. The gate lives in the DB, not the client -- flipping a frontend
-- isAdmin flag cannot reach this data.
--
-- SAFETY: read-only (SELECT only). No writes. Returns aggregated outcome data,
-- not raw PII dumps. search_path is pinned to '' and every object is fully
-- schema-qualified to prevent search_path hijacking of a SECURITY DEFINER func.
--
-- REVIEW BEFORE APPLYING. This touches prod (uvvcniogunfacurkhyid) and grants
-- admins read access to all students' study data. Intended for backend-owner
-- (Peter) review before it runs.
-- =============================================================================

-- Server-side admin check. STABLE, reads only the request JWT. Keep the
-- allowlist in sync with ADMIN_EMAILS in src/features/admin/AdminPage.tsx.
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
    'erikraschke@me.com'
  );
$$;

revoke all on function public.is_lynki_admin() from public;
grant execute on function public.is_lynki_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Cohort: one row per user, sorted by derived last-active. last_active is the
-- latest of any quiz attempt / topic quiz / document timestamp (user_profiles
-- has no last_active column). Counts are completed quizzes + total documents.
-- ---------------------------------------------------------------------------
create or replace function public.admin_student_cohort()
returns table (
  user_id uuid,
  email text,
  last_active timestamptz,
  quizzes bigint,
  documents bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_lynki_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with qa as (
    select q.user_id,
           max(coalesce(q.completed_at, q.started_at)) as la,
           count(*) filter (where q.completed_at is not null) as c
    from public.quiz_attempts q
    group by q.user_id
  ),
  tqs as (
    select t.user_id,
           max(coalesce(t.completed_at, t.created_at)) as la,
           count(*) filter (where t.completed_at is not null) as c
    from public.topic_quiz_sessions t
    group by t.user_id
  ),
  docs as (
    select d.user_id, max(d.created_at) as la, count(*) as c
    from public.documents d
    group by d.user_id
  )
  select
    u.id,
    u.email::text,
    greatest(qa.la, tqs.la, docs.la) as last_active,
    coalesce(qa.c, 0) + coalesce(tqs.c, 0) as quizzes,
    coalesce(docs.c, 0) as documents
  from auth.users u
  left join qa  on qa.user_id  = u.id
  left join tqs on tqs.user_id = u.id
  left join docs on docs.user_id = u.id
  order by greatest(qa.la, tqs.la, docs.la) desc nulls last;
end;
$$;

revoke all on function public.admin_student_cohort() from public;
grant execute on function public.admin_student_cohort() to authenticated;

-- ---------------------------------------------------------------------------
-- Per-student detail, bundled as one jsonb payload:
--   courses:       per course -> mastery_values (raw p_mastery list) + target
--                  grade + has_activity + progress_percent + document_count.
--                  The frontend feeds mastery_values into computePassProbability
--                  (the SAME lib the dashboard uses) so pass probability matches
--                  the dashboard exactly. pass probability / mastery are CURRENT
--                  values -- no history table exists, so the UI shows them as
--                  single numbers and never charts them as a trend.
--   quiz_history:  completed quiz_attempts + topic_quiz_sessions with a real
--                  timestamp and score % (the only thing charted over time).
--   topic_mastery: current p_mastery per concept (the Knowledge Garden source,
--                  bkt_mastery), with concept / topic / course names.
--   activity:      last_active, document_count, quiz_count.
-- ---------------------------------------------------------------------------
create or replace function public.admin_student_detail(target_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_lynki_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'user_id', target_user_id,
    'email', (select u.email::text from auth.users u where u.id = target_user_id),

    'courses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'target_grade', coalesce(c.target_grade, 1.0),
          'document_count', (
            select count(*) from public.documents d
            where d.course_id = c.id and d.user_id = target_user_id
          ),
          'mastery_values', coalesce((
            select jsonb_agg(m.p_mastery)
            from public.bkt_mastery m
            where m.user_id = target_user_id and m.course_id = c.id
          ), '[]'::jsonb),
          'has_activity', exists(
            select 1 from public.bkt_mastery m
            where m.user_id = target_user_id and m.course_id = c.id and m.n_attempts > 0
          ),
          'progress_percent', coalesce((
            select round(avg(m.p_mastery) * 100)::int
            from public.bkt_mastery m
            where m.user_id = target_user_id and m.course_id = c.id
          ), 0)
        )
        order by c.updated_at desc nulls last
      )
      from public.courses c
      where c.user_id = target_user_id
    ), '[]'::jsonb),

    'quiz_history', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', sub.id, 'source', sub.source, 'label', sub.label,
          'topic', sub.topic, 'score_pct', sub.score_pct, 'ts', sub.ts
        )
        order by sub.ts
      )
      from (
        select q.id::text as id,
               'course'::text as source,
               coalesce(c.title, 'Course quiz') as label,
               null::text as topic,
               round(q.correct_count::numeric / q.answered_count * 100)::int as score_pct,
               q.completed_at as ts
        from public.quiz_attempts q
        left join public.courses c on c.id = q.course_id
        where q.user_id = target_user_id
          and q.completed_at is not null
          and coalesce(q.answered_count, 0) > 0
        union all
        select t.id::text,
               'topic'::text,
               coalesce(t.topic_name, 'Topic quiz'),
               t.topic_name,
               round(t.correct_count::numeric / t.total_questions * 100)::int,
               t.completed_at
        from public.topic_quiz_sessions t
        where t.user_id = target_user_id
          and t.completed_at is not null
          and coalesce(t.total_questions, 0) > 0
      ) sub
    ), '[]'::jsonb),

    'topic_mastery', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'concept', cn.name,
          'topic', tp.name,
          'course', co.title,
          'p_mastery', m.p_mastery
        )
        order by tp.name nulls last, cn.name nulls last
      )
      from public.bkt_mastery m
      join public.concepts cn on cn.id = m.knowledge_component_id
      left join public.topics tp on tp.id = cn.topic_id
      left join public.courses co on co.id = m.course_id
      where m.user_id = target_user_id
    ), '[]'::jsonb),

    'activity', jsonb_build_object(
      'document_count', (
        select count(*) from public.documents d where d.user_id = target_user_id
      ),
      'quiz_count', (
        (select count(*) from public.quiz_attempts q
           where q.user_id = target_user_id and q.completed_at is not null
             and coalesce(q.answered_count, 0) > 0)
        +
        (select count(*) from public.topic_quiz_sessions t
           where t.user_id = target_user_id and t.completed_at is not null
             and coalesce(t.total_questions, 0) > 0)
      ),
      'last_active', greatest(
        (select max(q.completed_at) from public.quiz_attempts q where q.user_id = target_user_id),
        (select max(t.completed_at) from public.topic_quiz_sessions t where t.user_id = target_user_id),
        (select max(d.created_at) from public.documents d where d.user_id = target_user_id)
      )
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.admin_student_detail(uuid) from public;
grant execute on function public.admin_student_detail(uuid) to authenticated;
