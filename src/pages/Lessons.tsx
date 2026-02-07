import { useEffect, useState, useCallback, useMemo } from "react";
import { useStudent } from "@/lib/student-context";
import { db } from "@/lib/database";
import { LessonSidebar } from "@/components/lessons/LessonSidebar";
import { LessonContent } from "@/components/lessons/LessonContent";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { toast } from "sonner";
import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LessonAttachment } from "@/components/lessons/AttachmentPreview";

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  grade: number | null;
  attachments: LessonAttachment[] | null;
}

export default function Lessons() {
  const { student } = useStudent();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    completedLessons,
    totalLessonsCount,
    markLessonComplete,
    isLessonCompleted,
  } = useLessonProgress({
    studentId: student?.id,
    className: student?.class_name ?? undefined,
  });

  const fetchLessons = useCallback(async () => {
    if (!student?.class_name) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await db
      .from("lessons")
      .select("*")
      .eq("class_name", student.class_name)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching lessons:", error);
      setLessons([]);
    } else {
      const lessonsData = (data || []).map((lesson) => ({
        ...lesson,
        attachments: (lesson.attachments as unknown as LessonAttachment[]) || null,
      }));
      setLessons(lessonsData);

      // Auto-select first lesson if none selected
      if (lessonsData.length > 0 && !currentLessonId) {
        setCurrentLessonId(lessonsData[0].id);
      }
    }
    setLoading(false);
  }, [student?.class_name, currentLessonId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const currentLesson = useMemo(
    () => lessons.find((l) => l.id === currentLessonId) || null,
    [lessons, currentLessonId]
  );

  const currentIndex = useMemo(
    () => lessons.findIndex((l) => l.id === currentLessonId),
    [lessons, currentLessonId]
  );

  const handleSelectLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentLessonId(lessons[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLessonId) return;

    const success = await markLessonComplete(currentLessonId);
    if (success) {
      toast.success("Dars o'zlashtirildi deb belgilandi!");
    } else {
      toast.error("Xatolik yuz berdi");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Darslar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Darslar topilmadi</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Hozircha {student?.class_name} uchun darslar mavjud emas. Tez orada
              qo'shiladi!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex relative">
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-20 left-4 z-50 shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-40 h-full transition-transform duration-300",
          "w-80 shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0"
        )}
      >
        <LessonSidebar
          lessons={lessons}
          currentLessonId={currentLessonId}
          completedLessons={completedLessons}
          totalLessonsCount={totalLessonsCount}
          onSelectLesson={handleSelectLesson}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <LessonContent
        lesson={currentLesson}
        currentIndex={currentIndex}
        totalCount={lessons.length}
        isCompleted={currentLessonId ? isLessonCompleted(currentLessonId) : false}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onMarkComplete={handleMarkComplete}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < lessons.length - 1}
      />
    </div>
  );
}
