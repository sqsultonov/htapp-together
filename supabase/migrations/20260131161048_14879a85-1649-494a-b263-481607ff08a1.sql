-- Fix RLS policy for test_results to allow INSERT for anon users (since we use custom auth)
DROP POLICY IF EXISTS "Allow public select on test_results" ON public.test_results;
DROP POLICY IF EXISTS "Allow public insert on test_results" ON public.test_results;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.test_results;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.test_results;

-- Allow anyone to read test results
CREATE POLICY "Allow public select on test_results" 
ON public.test_results 
FOR SELECT 
TO public
USING (true);

-- Allow anyone to insert test results (students taking tests)
CREATE POLICY "Allow public insert on test_results" 
ON public.test_results 
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow updates (for grade modifications)
DROP POLICY IF EXISTS "Allow public update on test_results" ON public.test_results;
CREATE POLICY "Allow public update on test_results" 
ON public.test_results 
FOR UPDATE 
TO public
USING (true);

-- Create lesson_progress table to track student progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS on lesson_progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_progress
CREATE POLICY "Allow public select on lesson_progress" 
ON public.lesson_progress 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Allow public insert on lesson_progress" 
ON public.lesson_progress 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update on lesson_progress" 
ON public.lesson_progress 
FOR UPDATE 
TO public
USING (true);