-- =====================================================
-- TEST SHUFFLE MIGRATION ON SMALL SAMPLE
-- Run this BEFORE the full migration
-- =====================================================

-- STEP 1: Select 5 random questions for testing
-- =====================================================
WITH test_questions AS (
  SELECT id, question, correct_answer
  FROM questions
  WHERE quiz_id IN (
    SELECT id FROM quizzes WHERE generation_status = 'completed'
  )
  ORDER BY random()
  LIMIT 5
)
SELECT 
  id as question_id,
  LEFT(question, 60) as question_text,
  correct_answer as old_correct_answer
FROM test_questions;

-- Copy the question IDs from above and save them for later validation


-- STEP 2: Verify options BEFORE shuffle
-- =====================================================
-- Replace the question_id with one from Step 1
SELECT 
  q.id as question_id,
  q.correct_answer,
  qo.option_index,
  qo.is_correct,
  LEFT(qo.option_text, 50) as option_text
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
WHERE q.id = 'REPLACE-WITH-QUESTION-ID'
ORDER BY qo.option_index;


-- STEP 3: Run shuffle on ONE test question
-- =====================================================
-- Replace with actual question ID
SELECT * FROM shuffle_question_options('REPLACE-WITH-QUESTION-ID');


-- STEP 4: Verify options AFTER shuffle
-- =====================================================
-- Replace with the same question ID
SELECT 
  q.id as question_id,
  q.correct_answer as new_correct_answer,
  qo.option_index,
  qo.is_correct,
  LEFT(qo.option_text, 50) as option_text
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
WHERE q.id = 'REPLACE-WITH-QUESTION-ID'
ORDER BY qo.option_index;


-- STEP 5: Verify data integrity
-- =====================================================
-- Replace with the same question ID
SELECT * FROM verify_question_options('REPLACE-WITH-QUESTION-ID');


-- STEP 6: If successful, test all 5 questions
-- =====================================================
-- Replace with your 5 test question IDs
DO $$
DECLARE
  test_ids UUID[] := ARRAY[
    'QUESTION-ID-1'::UUID,
    'QUESTION-ID-2'::UUID,
    'QUESTION-ID-3'::UUID,
    'QUESTION-ID-4'::UUID,
    'QUESTION-ID-5'::UUID
  ];
  q_id UUID;
BEGIN
  FOREACH q_id IN ARRAY test_ids
  LOOP
    PERFORM shuffle_question_options(q_id);
    RAISE NOTICE 'Shuffled question: %', q_id;
  END LOOP;
END $$;


-- STEP 7: Verify all test questions
-- =====================================================
-- Replace with your test question IDs
SELECT 
  q.id,
  LEFT(q.question, 50) as question,
  q.correct_answer,
  v.is_valid,
  v.issue
FROM questions q
CROSS JOIN LATERAL verify_question_options(q.id) v
WHERE q.id IN (
  'QUESTION-ID-1',
  'QUESTION-ID-2',
  'QUESTION-ID-3',
  'QUESTION-ID-4',
  'QUESTION-ID-5'
);


-- STEP 8: Check shuffle log
-- =====================================================
SELECT 
  question_id,
  old_correct_answer,
  new_correct_answer,
  shuffled_at,
  status
FROM shuffle_migration_log
ORDER BY shuffled_at DESC
LIMIT 10;


-- =====================================================
-- EXPECTED RESULTS:
-- - Options should be in different order
-- - questions.correct_answer should match the new position
-- - The option with is_correct=true should be at correct_answer index
-- - All verify_question_options should return is_valid=true
-- =====================================================
