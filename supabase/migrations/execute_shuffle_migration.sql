-- =====================================================
-- EXECUTE FULL SHUFFLE MIGRATION
-- Only run this AFTER testing is successful
-- =====================================================

-- STEP 1: Final verification before execution
-- =====================================================
SELECT 
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE correct_answer = 0) as correct_at_position_0,
  ROUND(COUNT(*) FILTER (WHERE correct_answer = 0) * 100.0 / COUNT(*), 2) as percentage_at_zero
FROM questions
WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE generation_status = 'completed'
);

-- This should show ~97% at position 0


-- STEP 2: Count questions to be shuffled
-- =====================================================
WITH questions_to_shuffle AS (
  SELECT q.id
  FROM questions q
  WHERE q.quiz_id IN (
    SELECT id FROM quizzes WHERE generation_status = 'completed'
  )
  -- Optional: Only shuffle questions where correct_answer = 0
  -- Remove this line to shuffle ALL questions
  AND q.correct_answer = 0
)
SELECT COUNT(*) as questions_to_shuffle FROM questions_to_shuffle;


-- STEP 3: Execute the migration (BATCHED for safety)
-- =====================================================
-- This processes questions in batches of 50 with a short delay
-- to avoid overwhelming the database

DO $$
DECLARE
  batch_size INTEGER := 50;
  total_processed INTEGER := 0;
  batch_count INTEGER := 0;
  q_record RECORD;
  result RECORD;
BEGIN
  RAISE NOTICE 'Starting shuffle migration at %', now();
  
  FOR q_record IN (
    SELECT q.id, q.correct_answer
    FROM questions q
    WHERE q.quiz_id IN (
      SELECT id FROM quizzes WHERE generation_status = 'completed'
    )
    -- Optional: Only shuffle questions where correct_answer = 0
    -- Comment out to shuffle ALL questions regardless of current position
    AND q.correct_answer = 0
    ORDER BY q.created_at
  )
  LOOP
    -- Shuffle this question
    SELECT * INTO result FROM shuffle_question_options(q_record.id);
    
    total_processed := total_processed + 1;
    
    -- Log progress every 50 questions
    IF total_processed % batch_size = 0 THEN
      batch_count := batch_count + 1;
      RAISE NOTICE 'Processed % questions (batch %)', total_processed, batch_count;
      
      -- Small delay between batches (optional, for very large datasets)
      PERFORM pg_sleep(0.1);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete! Processed % questions at %', total_processed, now();
END $$;


-- STEP 4: Immediate validation
-- =====================================================
SELECT 
  'Total questions processed' as metric,
  COUNT(*) as value
FROM shuffle_migration_log
UNION ALL
SELECT 
  'Successful shuffles' as metric,
  COUNT(*) as value
FROM shuffle_migration_log
WHERE status = 'success'
UNION ALL
SELECT 
  'Failed shuffles' as metric,
  COUNT(*) as value
FROM shuffle_migration_log
WHERE status != 'success';


-- STEP 5: Check new distribution
-- =====================================================
SELECT 
  correct_answer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM questions
WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE generation_status = 'completed'
)
GROUP BY correct_answer
ORDER BY correct_answer;

-- Expected: More even distribution (not 97% at position 0)


-- STEP 6: Sample verification of random questions
-- =====================================================
WITH random_sample AS (
  SELECT id
  FROM questions
  WHERE quiz_id IN (
    SELECT id FROM quizzes WHERE generation_status = 'completed'
  )
  ORDER BY random()
  LIMIT 20
)
SELECT 
  q.id,
  LEFT(q.question, 60) as question_text,
  q.correct_answer,
  v.is_valid,
  v.issue
FROM random_sample rs
JOIN questions q ON q.id = rs.id
CROSS JOIN LATERAL verify_question_options(q.id) v
ORDER BY v.is_valid, q.id;

-- All should show is_valid = true


-- =====================================================
-- POST-MIGRATION CHECKLIST
-- =====================================================
-- ✓ Check shuffle_migration_log for any failures
-- ✓ Verify correct_answer distribution is now more random
-- ✓ Run validation queries (see validate_shuffle_migration.sql)
-- ✓ Test quiz taking in the frontend application
-- ✓ Keep backups for at least 30 days before dropping
-- =====================================================
