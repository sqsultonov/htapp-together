import { useEffect, useState } from "react";
import { useStudent } from "@/lib/student-context";
import { db } from "@/lib/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, TrendingUp, Calendar, Target, Eye, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
  test_id: string;
  answers: unknown;
}

interface TestInfo {
  id: string;
  title: string;
  description: string | null;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
}

export default function Results() {
  const { student } = useStudent();
  const [results, setResults] = useState<TestResult[]>([]);
  const [testsMap, setTestsMap] = useState<Record<string, TestInfo>>({});
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [resultQuestions, setResultQuestions] = useState<Question[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!student) return;

      const { data, error } = await db
        .from("test_results")
        .select("*")
        .eq("student_name", student.full_name)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error fetching results:", error);
      } else {
        const resultsData = (data || []) as TestResult[];
        setResults(resultsData);
        
        // Fetch test info for all results
        if (resultsData.length > 0) {
          const testIds = [...new Set(resultsData.map((r) => r.test_id))];
          const { data: testsData } = await db
            .from("tests")
            .select("id, title, description")
            .in("id", testIds);
          
          if (testsData) {
            const map: Record<string, TestInfo> = {};
            (testsData as TestInfo[]).forEach((t) => {
              map[t.id] = t;
            });
            setTestsMap(map);
          }
        }
      }
      setLoading(false);
    };

    fetchResults();
  }, [student]);

  const handleViewDetails = async (result: TestResult) => {
    setSelectedResult(result);
    setLoadingDetails(true);
    
    const { data: questions } = await db
      .from("questions")
      .select("*")
      .eq("test_id", result.test_id)
      .order("order_index");
    
    if (questions) {
      setResultQuestions(questions.map(q => ({
        ...q,
        options: q.options as string[]
      })));
    }
    setLoadingDetails(false);
  };

  const averageScore =
    results.length > 0
      ? results.reduce((acc, r) => acc + Number(r.percentage), 0) / results.length
      : 0;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { label: "A'lo", variant: "default" as const };
    if (percentage >= 80) return { label: "Yaxshi", variant: "default" as const };
    if (percentage >= 60) return { label: "Qoniqarli", variant: "secondary" as const };
    return { label: "Qoniqarsiz", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Natijalarim</h1>
        <p className="text-muted-foreground">Test natijalaringiz va o'zlashtirish ko'rsatkichlari</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami testlar
            </CardTitle>
            <Trophy className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground">Topshirilgan testlar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              O'rtacha ball
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}%
            </div>
            <Progress value={averageScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eng yaxshi natija
            </CardTitle>
            <Target className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {results.length > 0 ? Math.max(...results.map((r) => Number(r.percentage))).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Eng yuqori ball</p>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>Test natijalari tarixi</CardTitle>
          <CardDescription>Barcha topshirilgan testlar va ularning natijalari</CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Natijalar topilmadi</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Siz hali hech qanday test topshirmagansiz. Testlar bo'limiga o'ting va bilimingizni sinab ko'ring!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => {
                const badge = getScoreBadge(Number(result.percentage));
                const testInfo = testsMap[result.test_id];
                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-slide-in-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Trophy className={`w-6 h-6 ${getScoreColor(Number(result.percentage))}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {testInfo?.title || `Test #${result.test_id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {result.completed_at
                              ? new Date(result.completed_at).toLocaleDateString("uz-UZ")
                              : "Tugallanmagan"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getScoreColor(Number(result.percentage))}`}>
                          {Number(result.percentage).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.score}/{result.max_score} ball
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(result)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Details Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {testsMap[selectedResult?.test_id || ""]?.title || "Test natijasi"}
            </DialogTitle>
            <DialogDescription>
              Batafsil javoblar va to'g'ri javoblar
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="py-8 text-center text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Summary */}
                {selectedResult && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="text-sm text-muted-foreground">Umumiy natija</p>
                      <p className={`text-2xl font-bold ${getScoreColor(Number(selectedResult.percentage))}`}>
                        {Number(selectedResult.percentage).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Ball</p>
                      <p className="text-xl font-semibold">
                        {selectedResult.score}/{selectedResult.max_score}
                      </p>
                    </div>
                  </div>
                )}

                {/* Questions */}
                {resultQuestions.map((question, index) => {
                  const answers = selectedResult?.answers as Record<string, string> | null;
                  const userAnswer = answers?.[question.id] || "";
                  const isCorrect = userAnswer === question.correct_answer;
                  
                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border ${
                        isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCorrect ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <XCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            {index + 1}. {question.question_text}
                          </p>
                          
                          <div className="space-y-1 text-sm">
                            {question.options.map((option, optIndex) => {
                              const optionKey = String.fromCharCode(65 + optIndex);
                              const isUserAnswer = userAnswer === optionKey;
                              const isCorrectAnswer = question.correct_answer === optionKey;
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded ${
                                    isCorrectAnswer
                                      ? "bg-green-500/20 text-green-700"
                                      : isUserAnswer
                                      ? "bg-red-500/20 text-red-700"
                                      : "bg-muted/50"
                                  }`}
                                >
                                  <span className="font-medium">{optionKey}.</span> {option}
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-xs">(To'g'ri javob)</span>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <span className="ml-2 text-xs">(Sizning javobingiz)</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
