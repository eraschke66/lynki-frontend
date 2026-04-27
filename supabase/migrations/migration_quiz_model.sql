-- Migration: New quiz model (course_quizzes, quiz_attempts, question_attempts)
-- Apply in Supabase SQL editor.

-- 1. course_quizzes: a named quiz generated for a user+course
CREATE TABLE course_quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    total_questions integer NOT NULL DEFAULT 0,
    question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quizzes" ON course_quizzes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quizzes" ON course_quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Add course_quiz_id to questions (new FK — old quiz_id column untouched)
ALTER TABLE questions ADD COLUMN course_quiz_id uuid REFERENCES course_quizzes(id) ON DELETE CASCADE;

-- 3. quiz_attempts: each time a user attempts a quiz
CREATE TABLE quiz_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    answered_count integer NOT NULL DEFAULT 0,
    correct_count integer NOT NULL DEFAULT 0,
    pass_chance float,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz attempts" ON quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. question_attempts: each answer within a quiz attempt
CREATE TABLE question_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    selected_option_index integer NOT NULL,
    is_correct boolean NOT NULL,
    answered_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own question attempts" ON question_attempts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own question attempts" ON question_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
