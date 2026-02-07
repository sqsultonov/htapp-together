-- Create students table for simple name+grade login
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 11),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for login)
CREATE POLICY "Anyone can create student session"
ON public.students
FOR INSERT
WITH CHECK (true);

-- Allow reading all students (for admin)
CREATE POLICY "Anyone can view students"
ON public.students
FOR SELECT
USING (true);

-- Allow updates (for tracking activity)
CREATE POLICY "Anyone can update students"
ON public.students
FOR UPDATE
USING (true);

-- Create admin_settings table for PIN storage
CREATE TABLE public.admin_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_hash TEXT NOT NULL DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only allow reading (no direct manipulation)
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Insert default PIN
INSERT INTO public.admin_settings (pin_hash) VALUES ('1234');

-- Modify lessons to work with grades instead of class_id
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS grade INTEGER CHECK (grade >= 1 AND grade <= 11);

-- Modify tests to work with grades
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS grade INTEGER CHECK (grade >= 1 AND grade <= 11);

-- Modify test_results to reference students table
ALTER TABLE public.test_results
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS student_grade INTEGER;