import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
  points: number;
}

interface TestSessionProps {
  testTitle: string;
  questions: Question[];
  timeLimit: number | null;
  onSubmit: (answers: Record<string, string>) => void;
  submitting: boolean;
}

// Check if a string is an image URL
const isImageUrl = (str: string): boolean => {
  if (!str) return false;
  const lower = str.toLowerCase();
  return (
    lower.match(/\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/) !== null ||
    lower.startsWith("data:image/") ||
    lower.includes("/storage/v1/object/") // Supabase storage
  );
};

export function TestSession({
  testTitle,
  questions,
  timeLimit,
  onSubmit,
  submitting,
}: TestSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(() => new Date());
  const [timeLeft, setTimeLeft] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  );

  // Memoized submit handler to prevent issues
  const handleSubmitInternal = useCallback(() => {
    onSubmit(answers);
  }, [answers, onSubmit]);

  // Timer effect
  useEffect(() => {
    if (timeLimit === null) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );
      const remaining = timeLimit * 60 - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmitInternal();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, startTime, handleSubmitInternal]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentIndex(index);
      }
    },
    [questions.length]
  );

  const isLowTime = timeLeft !== null && timeLeft < 60;
  const isLastQuestion = currentIndex === questions.length - 1;

  // Check if question has image
  const questionHasImage = isImageUrl(currentQuestion.question_text);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        goToQuestion(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        goToQuestion(currentIndex + 1);
      } else if (e.key >= "1" && e.key <= "9") {
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleAnswer(currentQuestion.id, currentQuestion.options[optionIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, currentQuestion, goToQuestion]);

  return (
    <div className="min-h-[80vh] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold line-clamp-1">{testTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {answeredCount} / {questions.length} javob berildi
            </p>
          </div>
          {timeLeft !== null && (
            <div
              className={cn(
                "flex items-center gap-2 text-base font-semibold px-4 py-2 rounded-full transition-all",
                isLowTime
                  ? "bg-destructive/10 text-destructive animate-pulse"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Savol {currentIndex + 1} / {questions.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <Card className="flex-1 shadow-lg border bg-card">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Question Number */}
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentQuestion.points} ball
              </span>
            </div>

            {/* Question Content */}
            {questionHasImage ? (
              <div className="space-y-3">
                <img
                  src={currentQuestion.question_text}
                  alt={`Savol ${currentIndex + 1}`}
                  className="max-w-full max-h-[300px] rounded-lg border object-contain mx-auto"
                />
              </div>
            ) : (
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.question_text}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, i) => {
              const isSelected = answers[currentQuestion.id] === option;
              const letter = String.fromCharCode(65 + i);
              const optionIsImage = isImageUrl(option);

              return (
                <div
                  key={i}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {letter}
                  </div>
                  <RadioGroupItem
                    value={option}
                    id={`option-${i}`}
                    className="sr-only"
                  />
                  
                  {optionIsImage ? (
                    <img
                      src={option}
                      alt={`Variant ${letter}`}
                      className="max-h-24 max-w-[200px] rounded-lg object-contain"
                    />
                  ) : (
                    <Label
                      htmlFor={`option-${i}`}
                      className={cn(
                        "flex-1 cursor-pointer text-base",
                        isSelected && "font-medium"
                      )}
                    >
                      {option}
                    </Label>
                  )}

                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          size="lg"
          onClick={() => goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Oldingi</span>
        </Button>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Klaviatura: ← → yoki 1-9</span>
        </div>

        {isLastQuestion ? (
          <Button
            size="lg"
            onClick={handleSubmitInternal}
            disabled={submitting}
            className="gap-2 min-w-[120px]"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Yuborilmoqda...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Yakunlash
              </>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => goToQuestion(currentIndex + 1)}
            className="gap-2"
          >
            <span className="hidden sm:inline">Keyingi</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Unanswered Warning */}
      {answeredCount < questions.length && isLastQuestion && (
        <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-300">Diqqat!</p>
            <p className="text-sm text-muted-foreground">
              {questions.length - answeredCount} ta savolga javob berilmagan.
              Yakunlashdan oldin barcha savollarga javob berishni tavsiya qilamiz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
