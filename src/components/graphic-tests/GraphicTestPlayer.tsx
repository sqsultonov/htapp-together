import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/database";
import { useStudent } from "@/lib/student-context";
import {
  GraphicTestBankItem,
  GraphicTestConfig,
  GeneratedGraphicQuestion,
  generateGraphicTest,
  isImageString,
} from "@/lib/graphic-test-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Image,
  Play,
  Search,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
  Clock,
  Trophy,
  Star,
  Medal,
  RotateCcw,
  ArrowRight,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function GraphicTestPlayer() {
  const { student } = useStudent();
  const [configs, setConfigs] = useState<GraphicTestConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Active test session
  const [session, setSession] = useState<{
    config: GraphicTestConfig;
    questions: GeneratedGraphicQuestion[];
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if (!student) return;
    const fetchConfigs = async () => {
      const { data } = await db
        .from("graphic_test_configs")
        .select("*")
        .eq("class_name", student.class_name)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setConfigs((data || []) as GraphicTestConfig[]);
      setLoading(false);
    };
    fetchConfigs();
  }, [student]);

  const startTest = async (config: GraphicTestConfig) => {
    // Fetch bank items for this category and class
    const { data } = await db
      .from("graphic_test_bank")
      .select("*")
      .eq("class_name", config.class_name)
      .eq("category", config.category);

    const items = (data || []) as GraphicTestBankItem[];

    if (items.length < 4) {
      toast.error("Bu test uchun yetarli ma'lumot yo'q");
      return;
    }

    const questions = generateGraphicTest(items, config.total_questions);

    if (questions.length === 0) {
      toast.error("Test yaratishda xatolik");
      return;
    }

    setSession({ config, questions });
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const goToQuestion = useCallback(
    (index: number) => {
      if (session && index >= 0 && index < session.questions.length) {
        setCurrentIndex(index);
      }
    },
    [session]
  );

  const handleSubmit = async () => {
    if (!session || !student) return;
    setSubmitting(true);

    let score = 0;
    let maxScore = 0;

    session.questions.forEach((q) => {
      maxScore += q.points;
      if (answers[q.id] === q.correct_answer) {
        score += q.points;
      }
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Save to test_results
    await db.from("test_results").insert({
      test_id: session.config.id,
      student_id: student.id,
      student_name: student.full_name,
      student_class: student.class_name,
      score,
      max_score: maxScore,
      percentage,
      answers,
      completed_at: new Date().toISOString(),
    });

    setResults({ score, maxScore, percentage });
    setSession(null);
    setSubmitting(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!session) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") goToQuestion(currentIndex - 1);
      else if (e.key === "ArrowRight") goToQuestion(currentIndex + 1);
      else if (e.key >= "1" && e.key <= "9") {
        const q = session.questions[currentIndex];
        const idx = parseInt(e.key) - 1;
        if (idx < q.options.length) handleAnswer(q.id, q.options[idx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, currentIndex, goToQuestion]);

  // Results screen
  if (results) {
    const getResultLevel = () => {
      if (results.percentage >= 90) return { icon: Trophy, title: "A'lo!", subtitle: "Ajoyib natija!", color: "text-amber-500", bgColor: "bg-amber-500/10" };
      if (results.percentage >= 70) return { icon: Star, title: "Yaxshi!", subtitle: "Zo'r natija!", color: "text-emerald-500", bgColor: "bg-emerald-500/10" };
      if (results.percentage >= 50) return { icon: Medal, title: "Qoniqarli", subtitle: "Yana harakat qiling", color: "text-blue-500", bgColor: "bg-blue-500/10" };
      return { icon: RotateCcw, title: "Qayta urinib ko'ring", subtitle: "Mavzuni takrorlang", color: "text-rose-500", bgColor: "bg-rose-500/10" };
    };
    const result = getResultLevel();
    const ResultIcon = result.icon;

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
          <div className={cn("py-12 px-6 text-center relative overflow-hidden", result.bgColor)}>
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-background shadow-lg">
                <ResultIcon className={cn("w-10 h-10", result.color)} />
              </div>
              <div>
                <h1 className={cn("text-3xl font-bold", result.color)}>{result.title}</h1>
                <p className="text-muted-foreground mt-1">{result.subtitle}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold tracking-tight">
                {results.percentage}<span className="text-2xl text-muted-foreground">%</span>
              </div>
              <p className="text-muted-foreground mt-1">{results.score} / {results.maxScore} ball</p>
            </div>
            <Progress value={results.percentage} className="h-3" />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{results.score}</p>
                <p className="text-xs text-muted-foreground">To'g'ri</p>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{results.maxScore - results.score}</p>
                <p className="text-xs text-muted-foreground">Noto'g'ri</p>
              </div>
            </div>
            <Button onClick={() => setResults(null)} className="w-full gap-2" size="lg">
              Testlarga qaytish
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test session
  if (session) {
    const question = session.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / session.questions.length) * 100;
    const isLastQuestion = currentIndex === session.questions.length - 1;
    const isImageQuestion = question.type === 'image_to_text';

    return (
      <div className="min-h-[80vh] flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold line-clamp-1">{session.config.title}</h1>
              <p className="text-sm text-muted-foreground">
                {answeredCount} / {session.questions.length} javob berildi
                <Badge variant="outline" className="ml-2 text-xs">
                  {isImageQuestion ? "Rasm → Matn" : "Matn → Rasm"}
                </Badge>
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Savol {currentIndex + 1} / {session.questions.length}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="flex-1 shadow-lg border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-muted-foreground">
                {question.points} ball •{" "}
                {isImageQuestion ? "Rasmni aniqlang" : "To'g'ri rasmni tanlang"}
              </span>
            </div>

            {/* Question Content */}
            {isImageQuestion ? (
              <div className="flex justify-center">
                <img
                  src={question.question_content}
                  alt={`Savol ${currentIndex + 1}`}
                  className="max-w-full max-h-[300px] rounded-lg border object-contain"
                />
              </div>
            ) : (
              <p className="text-xl font-semibold text-center py-4">
                {question.question_content}
              </p>
            )}
          </CardHeader>

          <CardContent>
            <div className={cn(
              "gap-3",
              isImageQuestion
                ? "space-y-3"
                : "grid grid-cols-2"
            )}>
              {question.options.map((option, i) => {
                const isSelected = answers[question.id] === option;
                const letter = String.fromCharCode(65 + i);
                const optionIsImage = isImageString(option);

                return (
                  <div
                    key={i}
                    onClick={() => handleAnswer(question.id, option)}
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
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {letter}
                    </div>

                    {optionIsImage ? (
                      <img
                        src={option}
                        alt={`Variant ${letter}`}
                        className="max-h-24 max-w-[200px] rounded-lg object-contain flex-1"
                      />
                    ) : (
                      <span className={cn("flex-1 text-base", isSelected && "font-medium")}>
                        {option}
                      </span>
                    )}

                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
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

          <span className="text-sm text-muted-foreground hidden sm:inline">
            Klaviatura: ← → yoki 1-4
          </span>

          {isLastQuestion ? (
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 min-w-[120px]"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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

        {answeredCount < session.questions.length && isLastQuestion && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-300">Diqqat!</p>
              <p className="text-sm text-muted-foreground">
                {session.questions.length - answeredCount} ta savolga javob berilmagan.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Test list
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  const filteredConfigs = configs.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header removed - shown in parent Tests page */}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Testlarni qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredConfigs.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Grafik testlar topilmadi</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Hozircha {student?.class_name || ""} uchun faol grafik testlar mavjud emas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConfigs.map((config, index) => (
            <Card
              key={config.id}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
              <CardHeader className="pb-3">
                <Badge variant="default" className="w-fit bg-primary/10 text-primary hover:bg-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Grafik test
                </Badge>
                <CardTitle className="group-hover:text-primary transition-colors mt-2">
                  {config.title}
                </CardTitle>
                <CardDescription>
                  Kategoriya: {config.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                    <Image className="w-3.5 h-3.5" />
                    <span>{config.total_questions} savol</span>
                  </div>
                </div>
                <Button className="w-full group/btn" size="lg" onClick={() => startTest(config)}>
                  <Play className="w-4 h-4 mr-2 transition-transform group-hover/btn:scale-110" />
                  Testni boshlash
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
