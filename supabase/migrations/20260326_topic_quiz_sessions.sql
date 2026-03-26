CREATE TABLE topic_quiz_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  topic_name      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed')),
  questions       JSONB NOT NULL DEFAULT '[]',
  answers         JSONB NOT NULL DEFAULT '[]',
  current_index   INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE topic_quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their topic quiz sessions"
  ON topic_quiz_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_topic_quiz_sessions_user_topic
  ON topic_quiz_sessions (user_id, topic_id, status);
