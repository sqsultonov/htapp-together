-- Fix data visibility for custom (non-auth) sessions by allowing public SELECT
-- NOTE: This app currently uses localStorage-based sessions (anon role). These SELECT policies must include TO public.

-- LESSONS
DROP POLICY IF EXISTS "Students and teachers can view lessons" ON public.lessons;
CREATE POLICY "Public can view lessons"
ON public.lessons
FOR SELECT
TO public
USING (true);

-- TESTS
DROP POLICY IF EXISTS "View tests" ON public.tests;
CREATE POLICY "Public can view tests"
ON public.tests
FOR SELECT
TO public
USING (true);

-- QUESTIONS (required for loading tests)
DROP POLICY IF EXISTS "View questions" ON public.questions;
CREATE POLICY "Public can view questions"
ON public.questions
FOR SELECT
TO public
USING (true);
