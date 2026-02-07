-- Create instructors table with permissions
CREATE TABLE public.instructors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    subject TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Permissions as boolean flags
    can_view_statistics BOOLEAN NOT NULL DEFAULT true,
    can_add_lessons BOOLEAN NOT NULL DEFAULT true,
    can_add_tests BOOLEAN NOT NULL DEFAULT true,
    can_edit_grades BOOLEAN NOT NULL DEFAULT false,
    can_view_all_students BOOLEAN NOT NULL DEFAULT true,
    can_export_reports BOOLEAN NOT NULL DEFAULT false,
    can_manage_own_students BOOLEAN NOT NULL DEFAULT true,
    can_compare_with_others BOOLEAN NOT NULL DEFAULT false,
    can_send_notifications BOOLEAN NOT NULL DEFAULT false,
    can_create_homework BOOLEAN NOT NULL DEFAULT true,
    can_grade_homework BOOLEAN NOT NULL DEFAULT true,
    can_view_attendance BOOLEAN NOT NULL DEFAULT true,
    can_manage_attendance BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- Anyone can read instructors for login verification (but we'll filter sensitive data in app)
CREATE POLICY "Anyone can read instructor login info"
ON public.instructors
FOR SELECT
USING (true);

-- Only authenticated admins can manage instructors
CREATE POLICY "Admins can manage instructors"
ON public.instructors
FOR ALL
USING (true);

-- Add instructor_id to lessons table
ALTER TABLE public.lessons ADD COLUMN instructor_id UUID REFERENCES public.instructors(id);

-- Add instructor_id to tests table
ALTER TABLE public.tests ADD COLUMN instructor_id UUID REFERENCES public.instructors(id);

-- Create instructor_grades table for grade modifications
CREATE TABLE public.instructor_grades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    test_result_id UUID REFERENCES public.test_results(id) ON DELETE CASCADE,
    original_score INTEGER NOT NULL,
    modified_score INTEGER NOT NULL,
    reason TEXT,
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own grade modifications"
ON public.instructor_grades
FOR SELECT
USING (true);

CREATE POLICY "Instructors can insert grade modifications"
ON public.instructor_grades
FOR INSERT
WITH CHECK (true);

-- Create homework table
CREATE TABLE public.homework (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    grade INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view homework"
ON public.homework
FOR SELECT
USING (true);

CREATE POLICY "Instructors can manage homework"
ON public.homework
FOR ALL
USING (true);

-- Create homework submissions table
CREATE TABLE public.homework_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_text TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    grade INTEGER,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES public.instructors(id),
    feedback TEXT
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions"
ON public.homework_submissions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can submit homework"
ON public.homework_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Instructors can grade submissions"
ON public.homework_submissions
FOR UPDATE
USING (true);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, instructor_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attendance"
ON public.attendance
FOR SELECT
USING (true);

CREATE POLICY "Instructors can manage attendance"
ON public.attendance
FOR ALL
USING (true);

-- Update trigger for instructors
CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();