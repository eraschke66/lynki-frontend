-- Migration: 20260510000001_topic_tending_sessions.sql
-- Creates the topic_tending_sessions table for the new Tending Flow feature.
-- Each row represents one guided study session for a single topic.

CREATE TABLE topic_tending_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,

  -- Session lifecycle
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,                 -- null until finished
  abandoned_at TIMESTAMPTZ,                 -- null unless user bailed
  current_step TEXT,                        -- 'recall_cards' | 'active_recall' | 'mnemonic' | 'concept_pairs' | 'visual' | 'quiz' | 'complete'

  -- Generated content (JSON, comes from /topic-tending/generate endpoint)
  generated_content JSONB NOT NULL DEFAULT '{}',
  -- Schema:
  -- {
  --   "recall_cards": [{ "id": "rc1", "front": "...", "back": "..." }, ...],
  --   "active_recall": { "prompt": "Type everything you remember about X", "source_paragraph": "..." },
  --   "mnemonics": [{ "id": "m1", "hook": "...", "explanation": "..." }, ...],
  --   "connections": { "pairs": [{ "id": "...", "left": "...", "right": "..." }, ...], "type": "term_to_definition" },
  --   "focus_kc_ids": ["kc-uuid", ...]   -- which knowledge components to test in the quiz
  -- }

  -- Student work (built up step by step)
  recall_card_results JSONB DEFAULT '[]',   -- [{ id, got_it: bool }, ...]
  active_recall_input TEXT,                 -- what the student typed
  active_recall_evaluation JSONB,           -- { got_right: [...], missed: [...], source_paragraph: "..." }
  concept_pair_results JSONB DEFAULT '{}',  -- { correct: int, incorrect: int }
  quiz_attempt_id UUID REFERENCES quiz_attempts(id),  -- FK to topic-scoped quiz that ran inside this session (nullable)
  stages_skipped JSONB DEFAULT '[]',        -- ["recall_cards", "mnemonics", ...]

  -- BKT integration
  mastery_before NUMERIC,                   -- BKT mastery for this topic at session start (average across KCs)
  mastery_after NUMERIC,                    -- BKT mastery after session completes

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_topic_tending_user_course ON topic_tending_sessions(user_id, course_id);
CREATE INDEX idx_topic_tending_user_topic_completed ON topic_tending_sessions(user_id, topic_id, completed_at);

-- Enable Row Level Security
ALTER TABLE topic_tending_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see/modify their own sessions
CREATE POLICY "Users read own tending sessions" ON topic_tending_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tending sessions" ON topic_tending_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tending sessions" ON topic_tending_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role (backend) bypasses RLS automatically via the service role key.
-- No additional policy needed for the backend to read/write all rows.
