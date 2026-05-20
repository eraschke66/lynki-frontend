-- Fix: attempt results review page rendered an empty body.
--
-- New-flow quizzes set questions.course_quiz_id (-> course_quizzes) and leave
-- the legacy questions.quiz_id NULL. The existing SELECT policy on `questions`
-- only authorizes rows whose quiz_id resolves to a `quizzes` row owned by the
-- requesting user, so authenticated clients received ZERO question rows for
-- course_quizzes-based quizzes. This additive (permissive) policy also allows
-- reading a question when it belongs to a course_quiz owned by the user. It is
-- OR'd with the existing policy, so the legacy `quizzes` path is unaffected.

CREATE POLICY "Users can view questions for their course quizzes"
ON public.questions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.course_quizzes cq
    WHERE cq.id = questions.course_quiz_id
      AND cq.user_id = auth.uid()
  )
);
