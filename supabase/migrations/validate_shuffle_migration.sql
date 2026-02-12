-- =====================================================
-- VALIDATION QUERIES AFTER SHUFFLE MIGRATION
-- Run these to ensure everything is correct
-- =====================================================

-- 1. Overall Statistics
-- =====================================================
SELECT 
  '=== MIGRATION STATISTICS ===' as section,
  '' as detail
UNION ALL
SELECT 
  'Total questions in completed quizzes',
  COUNT(*)::TEXT
FROM questions
WHERE quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
UNION ALL
SELECT 
  'Questions shuffled (from log)',
  COUNT(*)::TEXT
FROM shuffle_migration_log WHERE status = 'success'
UNION ALL
SELECT 
  'Failed shuffles',
  COUNT(*)::TEXT
FROM shuffle_migration_log WHERE status != 'success';


-- 2. Correct Answer Distribution
-- =====================================================
SELECT 
  '=== CORRECT ANSWER DISTRIBUTION ===' as header,
  '' as position,
  '' as count,
  '' as percentage
UNION ALL
SELECT 
  'Position',
  correct_answer::TEXT,
  COUNT(*)::TEXT,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2)::TEXT || '%'
FROM questions
WHERE quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
GROUP BY correct_answer
ORDER BY correct_answer;

-- Expected: More balanced distribution across positions


-- 3. Data Integrity Checks
-- =====================================================
SELECT 
  '=== DATA INTEGRITY CHECKS ===' as check_name,
  '' as status,
  '' as details
UNION ALL
SELECT 
  'Questions with no options',
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END,
  COUNT(*)::TEXT || ' found'
FROM questions q
LEFT JOIN question_options qo ON qo.question_id = q.id
WHERE q.quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
GROUP BY q.id
HAVING COUNT(qo.id) = 0
UNION ALL
SELECT 
  'Questions with multiple correct options',
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END,
  COUNT(*)::TEXT || ' found'
FROM (
  SELECT question_id, COUNT(*) as correct_count
  FROM question_options
  WHERE is_correct = true
  GROUP BY question_id
  HAVING COUNT(*) != 1
) multi_correct
UNION ALL
SELECT 
  'Mismatched correct_answer and is_correct',
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END,
  COUNT(*)::TEXT || ' found'
FROM questions q
WHERE q.quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
  AND NOT EXISTS (
    SELECT 1 FROM question_options qo
    WHERE qo.question_id = q.id
      AND qo.option_index = q.correct_answer
      AND qo.is_correct = true
  );


-- 4. Verify Random Sample (20 questions)
-- =====================================================
WITH random_sample AS (
  SELECT id
  FROM questions
  WHERE quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
  ORDER BY random()
  LIMIT 20
)
SELECT 
  '=== RANDOM SAMPLE VALIDATION ===' as header,
  '' as question_id,
  '' as correct_answer,
  '' as is_valid,
  '' as issue
UNION ALL
SELECT 
  'Sample Question',
  LEFT(q.id::TEXT, 8),
  q.correct_answer::TEXT,
  CASE WHEN v.is_valid THEN '✓' ELSE '✗' END,
  v.issue
FROM random_sample rs
JOIN questions q ON q.id = rs.id
CROSS JOIN LATERAL verify_question_options(q.id) v
ORDER BY v.is_valid DESC;


-- 5. Options Count Per Question
-- =====================================================
SELECT 
  '=== OPTIONS PER QUESTION ===' as header,
  '' as option_count,
  '' as num_questions
UNION ALL
SELECT 
  'Questions with',
  option_count::TEXT || ' options',
  COUNT(*)::TEXT
FROM (
  SELECT 
    q.id,
    COUNT(qo.id) as option_count
  FROM questions q
  LEFT JOIN question_options qo ON qo.question_id = q.id
  WHERE q.quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
  GROUP BY q.id
) option_counts
GROUP BY option_count
ORDER BY option_count;


-- 6. Before/After Comparison (using log)
-- =====================================================
SELECT 
  '=== BEFORE/AFTER COMPARISON ===' as metric,
  '' as value
UNION ALL
SELECT 
  'Questions moved from position 0',
  COUNT(*)::TEXT
FROM shuffle_migration_log
WHERE old_correct_answer = 0 AND new_correct_answer != 0 AND status = 'success'
UNION ALL
SELECT 
  'Questions that stayed at position 0',
  COUNT(*)::TEXT
FROM shuffle_migration_log
WHERE old_correct_answer = 0 AND new_correct_answer = 0 AND status = 'success'
UNION ALL
SELECT 
  'Average change in position',
  ROUND(AVG(ABS(new_correct_answer - old_correct_answer)), 2)::TEXT
FROM shuffle_migration_log
WHERE status = 'success';


-- 7. Check for any duplicate option_index per question
-- =====================================================
SELECT 
  '=== DUPLICATE OPTION INDICES ===' as header,
  '' as question_id,
  '' as option_index,
  '' as count
UNION ALL
SELECT 
  'Question ' || LEFT(question_id::TEXT, 8),
  option_index::TEXT,
  COUNT(*)::TEXT
FROM question_options
WHERE question_id IN (
  SELECT id FROM questions 
  WHERE quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
)
GROUP BY question_id, option_index
HAVING COUNT(*) > 1;

-- Expected: No results (no duplicates)


-- 8. Migration Log Summary
-- =====================================================
SELECT 
  '=== MIGRATION LOG DETAILS ===' as detail,
  '' as value
UNION ALL
SELECT 
  'First shuffle',
  MIN(shuffled_at)::TEXT
FROM shuffle_migration_log
UNION ALL
SELECT 
  'Last shuffle',
  MAX(shuffled_at)::TEXT
FROM shuffle_migration_log
UNION ALL
SELECT 
  'Total duration',
  (MAX(shuffled_at) - MIN(shuffled_at))::TEXT
FROM shuffle_migration_log;


-- =====================================================
-- ALL CHECKS SHOULD PASS (✓)
-- If any fail (✗), investigate before proceeding
-- =====================================================

-- 9. Final Summary Query
-- =====================================================
SELECT 
  'VALIDATION COMPLETE' as status,
  now() as completed_at,
  (SELECT COUNT(*) FROM shuffle_migration_log WHERE status = 'success') as successful_shuffles,
  (SELECT COUNT(*) FROM shuffle_migration_log WHERE status != 'success') as failed_shuffles;
