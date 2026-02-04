-- =====================================================
-- SAFE MIGRATION: Shuffle Existing Question Options
-- Date: 2026-01-31
-- Purpose: Randomize option order for existing questions
--          to fix the issue where 97% of correct answers
--          were in the first position
-- =====================================================

-- STEP 1: Create backup tables
-- =====================================================
CREATE TABLE IF NOT EXISTS questions_backup_20260131 AS 
SELECT * FROM questions;

CREATE TABLE IF NOT EXISTS question_options_backup_20260131 AS 
SELECT * FROM question_options;

-- Add comment to backups
COMMENT ON TABLE questions_backup_20260131 IS 'Backup before shuffling options on 2026-01-31';
COMMENT ON TABLE question_options_backup_20260131 IS 'Backup before shuffling options on 2026-01-31';


-- STEP 2: Create shuffle tracking table
-- =====================================================
CREATE TABLE IF NOT EXISTS shuffle_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  old_correct_answer INTEGER NOT NULL,
  new_correct_answer INTEGER NOT NULL,
  shuffled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'success'
);


-- STEP 3: Create the shuffle function
-- =====================================================
CREATE OR REPLACE FUNCTION shuffle_question_options(p_question_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  old_correct INTEGER,
  new_correct INTEGER,
  message TEXT
) AS $$
DECLARE
  v_old_correct_answer INTEGER;
  v_new_correct_answer INTEGER;
  v_option_count INTEGER;
  v_new_indices INTEGER[];
  v_option RECORD;
  v_counter INTEGER := 0;
BEGIN
  -- Get current correct answer and option count
  SELECT q.correct_answer, COUNT(qo.id)
  INTO v_old_correct_answer, v_option_count
  FROM questions q
  LEFT JOIN question_options qo ON qo.question_id = q.id
  WHERE q.id = p_question_id
  GROUP BY q.correct_answer;

  -- Validate we have options
  IF v_option_count IS NULL OR v_option_count = 0 THEN
    RETURN QUERY SELECT 
      FALSE, 
      v_old_correct_answer, 
      -1, 
      'No options found for question'::TEXT;
    RETURN;
  END IF;

  -- Generate shuffled indices (Fisher-Yates shuffle)
  v_new_indices := ARRAY(
    SELECT i - 1 
    FROM generate_series(1, v_option_count) i
    ORDER BY random()
  );

  -- Update each option with new index
  FOR v_option IN 
    SELECT id, option_index, is_correct
    FROM question_options
    WHERE question_id = p_question_id
    ORDER BY option_index
  LOOP
    -- Update option_index with shuffled value
    UPDATE question_options
    SET option_index = v_new_indices[v_counter + 1]
    WHERE id = v_option.id;

    -- Track which index the correct answer moved to
    IF v_option.is_correct THEN
      v_new_correct_answer := v_new_indices[v_counter + 1];
    END IF;

    v_counter := v_counter + 1;
  END LOOP;

  -- Update the correct_answer field in questions table
  UPDATE questions
  SET correct_answer = v_new_correct_answer
  WHERE id = p_question_id;

  -- Log the change
  INSERT INTO shuffle_migration_log (
    question_id, 
    old_correct_answer, 
    new_correct_answer,
    status
  ) VALUES (
    p_question_id,
    v_old_correct_answer,
    v_new_correct_answer,
    'success'
  );

  -- Return success
  RETURN QUERY SELECT 
    TRUE, 
    v_old_correct_answer, 
    v_new_correct_answer, 
    'Successfully shuffled'::TEXT;

EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO shuffle_migration_log (
    question_id, 
    old_correct_answer, 
    new_correct_answer,
    status
  ) VALUES (
    p_question_id,
    COALESCE(v_old_correct_answer, -1),
    -1,
    SQLERRM
  );

  RETURN QUERY SELECT 
    FALSE, 
    COALESCE(v_old_correct_answer, -1), 
    -1, 
    ('Error: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql;


-- STEP 4: Verification function
-- =====================================================
CREATE OR REPLACE FUNCTION verify_question_options(p_question_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  issue TEXT
) AS $$
DECLARE
  v_correct_answer INTEGER;
  v_correct_count INTEGER;
  v_has_matching_option BOOLEAN;
BEGIN
  -- Get correct_answer from questions table
  SELECT correct_answer INTO v_correct_answer
  FROM questions WHERE id = p_question_id;

  -- Count how many options are marked as correct
  SELECT COUNT(*) INTO v_correct_count
  FROM question_options
  WHERE question_id = p_question_id AND is_correct = true;

  -- Check if the correct_answer index has is_correct = true
  SELECT EXISTS(
    SELECT 1 FROM question_options
    WHERE question_id = p_question_id 
      AND option_index = v_correct_answer 
      AND is_correct = true
  ) INTO v_has_matching_option;

  -- Validate
  IF v_correct_count != 1 THEN
    RETURN QUERY SELECT FALSE, ('Expected 1 correct option, found ' || v_correct_count)::TEXT;
  ELSIF NOT v_has_matching_option THEN
    RETURN QUERY SELECT FALSE, 'correct_answer index does not match is_correct option'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, 'Valid'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- STEP 5: DO NOT EXECUTE YET - Instructions below
-- =====================================================

-- ============================================================
-- MANUAL EXECUTION INSTRUCTIONS
-- ============================================================
-- This migration has been set up but NOT automatically executed
-- to ensure maximum safety. Follow these steps:
--
-- 1. VERIFY BACKUPS WERE CREATED:
--    SELECT COUNT(*) FROM questions_backup_20260131;
--    SELECT COUNT(*) FROM question_options_backup_20260131;
--
-- 2. TEST ON A SMALL SAMPLE (5 questions):
--    See file: test_shuffle_migration.sql
--
-- 3. IF TEST SUCCESSFUL, RUN FULL MIGRATION:
--    See file: execute_shuffle_migration.sql
--
-- 4. VERIFY RESULTS:
--    See file: validate_shuffle_migration.sql
--
-- 5. IF ANYTHING GOES WRONG:
--    See file: rollback_shuffle_migration.sql
-- ============================================================

COMMENT ON FUNCTION shuffle_question_options IS 'Safely shuffles options for a single question and updates correct_answer';
COMMENT ON FUNCTION verify_question_options IS 'Validates that question and options are properly synchronized';
