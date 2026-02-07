-- Fix RLS policies for lessons table to allow instructors (custom auth) to insert
DROP POLICY IF EXISTS "Teachers can create lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers can update own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers can delete own lessons" ON public.lessons;

-- Allow anyone to insert lessons (since we use custom instructor auth, not Supabase Auth)
CREATE POLICY "Anyone can create lessons" 
ON public.lessons 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update lessons
CREATE POLICY "Anyone can update lessons" 
ON public.lessons 
FOR UPDATE 
USING (true);

-- Allow anyone to delete lessons
CREATE POLICY "Anyone can delete lessons" 
ON public.lessons 
FOR DELETE 
USING (true);

-- Fix RLS policies for tests table
DROP POLICY IF EXISTS "Teachers can create tests" ON public.tests;
DROP POLICY IF EXISTS "Teachers can update own tests" ON public.tests;
DROP POLICY IF EXISTS "Teachers can delete own tests" ON public.tests;

-- Allow anyone to manage tests (custom auth)
CREATE POLICY "Anyone can create tests" 
ON public.tests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tests" 
ON public.tests 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tests" 
ON public.tests 
FOR DELETE 
USING (true);

-- Fix questions table policies
DROP POLICY IF EXISTS "Teachers can manage questions" ON public.questions;

CREATE POLICY "Anyone can manage questions" 
ON public.questions 
FOR ALL 
USING (true);

-- Add font settings to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS heading_font_size integer DEFAULT 32,
ADD COLUMN IF NOT EXISTS body_font_size integer DEFAULT 16,
ADD COLUMN IF NOT EXISTS sidebar_font_size integer DEFAULT 14;