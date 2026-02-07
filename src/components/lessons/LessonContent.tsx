import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AttachmentPreview, type LessonAttachment } from "./AttachmentPreview";
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  attachments?: LessonAttachment[] | null;
}

interface LessonContentProps {
  lesson: Lesson | null;
  currentIndex: number;
  totalCount: number;
  isCompleted: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function LessonContent({
  lesson,
  currentIndex,
  totalCount,
  isCompleted,
  onPrevious,
  onNext,
  onMarkComplete,
  hasPrevious,
  hasNext,
}: LessonContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  // Track scroll progress
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollable = scrollHeight - clientHeight;
      
      if (scrollable <= 0) {
        setScrollProgress(100);
        setHasScrolledToEnd(true);
        return;
      }

      const progress = Math.min(100, (scrollTop / scrollable) * 100);
      setScrollProgress(progress);
      
      if (progress >= 95) {
        setHasScrolledToEnd(true);
      }
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    
    return () => container.removeEventListener("scroll", handleScroll);
  }, [lesson?.id]);

  // Reset scroll when lesson changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      setScrollProgress(0);
      setHasScrolledToEnd(false);
    }
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Darsni tanlang</h3>
            <p className="text-muted-foreground mt-1">
              Chap paneldan darsni tanlang va o'rganishni boshlang
            </p>
          </div>
        </div>
      </div>
    );
  }

  const attachments = (lesson.attachments as LessonAttachment[]) || [];
  const progressPercent = Math.round(((currentIndex + 1) / totalCount) * 100);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="shrink-0">
                Dars {lesson.order_index + 1}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-500 hover:bg-green-600 shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  O'zlashtirildi
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight line-clamp-2">
              {lesson.title}
            </h1>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
            <Clock className="w-4 h-4" />
            {new Date(lesson.created_at).toLocaleDateString("uz-UZ")}
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>O'qish jarayoni</span>
              <span>{Math.round(scrollProgress)}%</span>
            </div>
            <Progress value={scrollProgress} className="h-1" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {totalCount}
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Lesson Text Content */}
          {lesson.content && (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {lesson.content}
              </p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Qo'shimcha materiallar
              </h3>
              <div className="space-y-6">
                {attachments.map((attachment, index) => (
                  <AttachmentPreview key={index} attachment={attachment} />
                ))}
              </div>
            </div>
          )}

          {/* End of Lesson Actions */}
          <div className="pt-8 border-t space-y-4">
            {!isCompleted && hasScrolledToEnd && (
              <Button
                onClick={onMarkComplete}
                className="w-full gap-2"
                size="lg"
              >
                <CheckCircle className="w-5 h-5" />
                Darsni o'zlashtirdim deb belgilash
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="flex-1 gap-2"
                size="lg"
              >
                <ChevronLeft className="w-4 h-4" />
                Oldingi dars
              </Button>
              <Button
                onClick={onNext}
                disabled={!hasNext}
                className="flex-1 gap-2"
                size="lg"
              >
                Keyingi dars
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
