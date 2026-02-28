-- =====================================================
-- Test Sessions Table
-- Persists quiz sessions so they survive page refreshes
-- and can be viewed in quiz history.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  answered_count INTEGER NOT NULL DEFAULT 0,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  pass_chance DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_course
  ON public.test_sessions(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_test_sessions_created
  ON public.test_sessions(created_at DESC);

-- RLS (backend uses service role, but good practice)
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own test sessions"
  ON public.test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test sessions"
  ON public.test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions"
  ON public.test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.test_sessions IS 'Stores quiz/test sessions with status, score, and question history';
