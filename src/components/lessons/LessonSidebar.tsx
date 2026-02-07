import { ChevronDown, ChevronRight, BookOpen, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
}

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string | null;
  completedLessons: Set<string>;
  totalLessonsCount: number;
  onSelectLesson: (lessonId: string) => void;
}

export function LessonSidebar({
  lessons,
  currentLessonId,
  completedLessons,
  totalLessonsCount,
  onSelectLesson,
}: LessonSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessonsCount > 0 
    ? Math.round((completedCount / totalLessonsCount) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Progress Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">O'zlashtirish</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount} / {totalLessonsCount} dars
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right font-medium">
            {progressPercentage}%
          </p>
        </div>
      </div>

      {/* Lessons List */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex-1 flex flex-col min-h-0">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto rounded-none border-b"
          >
            <span className="font-medium text-sm">Darslar ro'yxati</span>
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {lessons.map((lesson) => {
                const isActive = lesson.id === currentLessonId;
                const isCompleted = completedLessons.has(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                      "hover:bg-accent/50",
                      isActive && "bg-primary/10 border border-primary/20",
                      !isActive && "border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        lesson.order_index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium line-clamp-2",
                          isActive && "text-primary",
                          isCompleted && !isActive && "text-muted-foreground"
                        )}
                      >
                        {lesson.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
