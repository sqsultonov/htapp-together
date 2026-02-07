import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/database";

interface UseLessonProgressOptions {
  studentId: string | undefined;
  className: string | undefined;
}

export function useLessonProgress({ studentId, className }: UseLessonProgressOptions) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [totalLessonsCount, setTotalLessonsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch total lessons count for the class (not just loaded ones)
  const fetchTotalCount = useCallback(async () => {
    if (!className) return;

    const { data, error } = await db
      .from("lessons")
      .select("id")
      .eq("class_name", className);

    if (!error && data) {
      setTotalLessonsCount((data as { id: string }[]).length);
    }
  }, [className]);

  // Fetch completed lessons for this student
  const fetchProgress = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await db
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .eq("completed", true);

    if (!error && data) {
      setCompletedLessons(new Set((data as { lesson_id: string }[]).map((p) => p.lesson_id)));
    }

    setLoading(false);
  }, [studentId]);

  // Mark a lesson as completed
  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      if (!studentId) return false;

      // Optimistic update
      setCompletedLessons((prev) => new Set([...prev, lessonId]));

      // Check if record exists
      const { data: existing } = await db
        .from("lesson_progress")
        .select("id")
        .eq("student_id", studentId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await db
          .from("lesson_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("student_id", studentId)
          .eq("lesson_id", lessonId);
        error = result.error;
      } else {
        // Insert new
        const result = await db.from("lesson_progress").insert({
          student_id: studentId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
        error = result.error;
      }

      if (error) {
        // Rollback on error
        setCompletedLessons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
        console.error("Error marking lesson complete:", error);
        return false;
      }

      return true;
    },
    [studentId]
  );

  useEffect(() => {
    fetchProgress();
    fetchTotalCount();
  }, [fetchProgress, fetchTotalCount]);

  return {
    completedLessons,
    totalLessonsCount,
    loading,
    markLessonComplete,
    isLessonCompleted: (lessonId: string) => completedLessons.has(lessonId),
    progressPercentage:
      totalLessonsCount > 0
        ? Math.round((completedLessons.size / totalLessonsCount) * 100)
        : 0,
  };
}
