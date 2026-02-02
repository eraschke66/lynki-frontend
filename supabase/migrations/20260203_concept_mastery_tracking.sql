-- Migration: Add concept mastery tracking tables
-- This enables tracking user progress per concept for mastery-based learning

-- Track mastery per concept per user
CREATE TABLE IF NOT EXISTS user_concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,

  -- Mastery tracking
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  correct_count INT NOT NULL DEFAULT 0,
  attempt_count INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,

  -- For spaced repetition / review scheduling
  mastered_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_interval_days INT DEFAULT 1,
  review_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only have one mastery record per concept
  UNIQUE(user_id, concept_id)
);

-- Track individual question attempts for analytics and avoiding repeats
CREATE TABLE IF NOT EXISTS user_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,

  -- Attempt details
  selected_option INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INT, -- Time spent on this question in milliseconds

  -- Session tracking (which study session this was part of)
  session_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_concept_mastery_user_id ON user_concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_concept_mastery_concept_id ON user_concept_mastery(concept_id);
CREATE INDEX IF NOT EXISTS idx_user_concept_mastery_status ON user_concept_mastery(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_concept_mastery_review ON user_concept_mastery(user_id, next_review_at)
  WHERE status = 'mastered' AND next_review_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_question_attempts_user_id ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_question_id ON user_question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_session ON user_question_attempts(session_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_concept_mastery_updated_at ON user_concept_mastery;
CREATE TRIGGER update_user_concept_mastery_updated_at
  BEFORE UPDATE ON user_concept_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own data
CREATE POLICY "Users can view own concept mastery"
  ON user_concept_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concept mastery"
  ON user_concept_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concept mastery"
  ON user_concept_mastery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own question attempts"
  ON user_question_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question attempts"
  ON user_question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- View to get concept mastery with related info (for easier querying)
CREATE OR REPLACE VIEW user_concept_progress AS
SELECT
  ucm.id,
  ucm.user_id,
  ucm.concept_id,
  c.name as concept_name,
  c.explanation as concept_explanation,
  t.id as topic_id,
  t.name as topic_name,
  t.document_id,
  ucm.status,
  ucm.correct_count,
  ucm.attempt_count,
  ucm.current_streak,
  ucm.mastered_at,
  ucm.next_review_at,
  ucm.review_interval_days,
  ucm.review_count,
  CASE
    WHEN ucm.attempt_count > 0 THEN ROUND((ucm.correct_count::DECIMAL / ucm.attempt_count) * 100, 1)
    ELSE 0
  END as accuracy_percent,
  (SELECT COUNT(*) FROM questions q WHERE q.concept_id = c.id) as question_count
FROM user_concept_mastery ucm
JOIN concepts c ON c.id = ucm.concept_id
JOIN topics t ON t.id = c.topic_id;

-- Grant access to the view
GRANT SELECT ON user_concept_progress TO authenticated;
