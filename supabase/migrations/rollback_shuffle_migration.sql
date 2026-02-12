-- =====================================================
-- ROLLBACK SHUFFLE MIGRATION
-- ⚠️ EMERGENCY USE ONLY ⚠️
-- This restores from backup tables created before migration
-- =====================================================

-- ⚠️ WARNING: This will DELETE current data and restore backups
-- Only run if something went seriously wrong

-- STEP 1: Verify backups exist
-- =====================================================
SELECT 
  'questions_backup' as table_name,
  COUNT(*) as row_count
FROM questions_backup_20260131
UNION ALL
SELECT 
  'question_options_backup' as table_name,
  COUNT(*) as row_count
FROM question_options_backup_20260131
UNION ALL
SELECT 
  'current_questions' as table_name,
  COUNT(*) as row_count
FROM questions
UNION ALL
SELECT 
  'current_question_options' as table_name,
  COUNT(*) as row_count
FROM question_options;

-- Verify the backup counts match or are close to current counts


-- STEP 2: Create a backup of the "broken" state (just in case)
-- =====================================================
CREATE TABLE IF NOT EXISTS questions_broken_20260131 AS 
SELECT * FROM questions;

CREATE TABLE IF NOT EXISTS question_options_broken_20260131 AS 
SELECT * FROM question_options;


-- STEP 3: Restore questions table
-- =====================================================
BEGIN;

-- Delete current data for questions that were in the backup
DELETE FROM questions
WHERE id IN (SELECT id FROM questions_backup_20260131);

-- Restore from backup
INSERT INTO questions
SELECT * FROM questions_backup_20260131;

-- Verify count
DO $$
DECLARE
  backup_count INTEGER;
  restored_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM questions_backup_20260131;
  SELECT COUNT(*) INTO restored_count FROM questions WHERE id IN (SELECT id FROM questions_backup_20260131);
  
  IF backup_count != restored_count THEN
    RAISE EXCEPTION 'Restore failed: backup has % rows but restored %', backup_count, restored_count;
  END IF;
  
  RAISE NOTICE 'Questions restored: % rows', restored_count;
END $$;

COMMIT;


-- STEP 4: Restore question_options table
-- =====================================================
BEGIN;

-- Delete current data for options that were in the backup
DELETE FROM question_options
WHERE id IN (SELECT id FROM question_options_backup_20260131);

-- Restore from backup
INSERT INTO question_options
SELECT * FROM question_options_backup_20260131;

-- Verify count
DO $$
DECLARE
  backup_count INTEGER;
  restored_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM question_options_backup_20260131;
  SELECT COUNT(*) INTO restored_count FROM question_options WHERE id IN (SELECT id FROM question_options_backup_20260131);
  
  IF backup_count != restored_count THEN
    RAISE EXCEPTION 'Restore failed: backup has % rows but restored %', backup_count, restored_count;
  END IF;
  
  RAISE NOTICE 'Question options restored: % rows', restored_count;
END $$;

COMMIT;


-- STEP 5: Verify restoration
-- =====================================================
SELECT 
  correct_answer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM questions
WHERE quiz_id IN (SELECT id FROM quizzes WHERE generation_status = 'completed')
GROUP BY correct_answer
ORDER BY correct_answer;

-- This should show ~97% at position 0 again (back to original state)


-- STEP 6: Clear migration log (optional)
-- =====================================================
-- Uncomment to clear the log after rollback
-- DELETE FROM shuffle_migration_log;


-- =====================================================
-- POST-ROLLBACK VERIFICATION
-- =====================================================
SELECT 
  'Rollback completed at' as status,
  now() as timestamp,
  (SELECT COUNT(*) FROM questions WHERE id IN (SELECT id FROM questions_backup_20260131)) as questions_restored,
  (SELECT COUNT(*) FROM question_options WHERE id IN (SELECT id FROM question_options_backup_20260131)) as options_restored;


-- =====================================================
-- CLEANUP (Optional - after confirming rollback worked)
-- =====================================================
-- DO NOT RUN IMMEDIATELY - wait a few days to ensure rollback was successful

-- DROP TABLE IF EXISTS questions_broken_20260131;
-- DROP TABLE IF EXISTS question_options_broken_20260131;
