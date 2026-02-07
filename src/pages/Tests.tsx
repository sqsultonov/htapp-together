import { useEffect, useState } from "react";
import { useStudent } from "@/lib/student-context";
import { db } from "@/lib/database";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Search, BookOpen } from "lucide-react";

import { TestCard } from "@/components/tests/TestCard";
import { TestSession } from "@/components/tests/TestSession";
import { TestResults } from "@/components/tests/TestResults";

interface Test {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_at: string;
  grade: number | null;
  question_count: number;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
  points: number;
}

interface ActiveSession {
  testId: string;
  testTitle: string;
  questions: Question[];
  timeLimit: number | null;
}

interface Results {
  score: number;
  maxScore: number;
  percentage: number;
}

export default function Tests() {
  const { student } = useStudent();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      if (!student) return;

      const { data, error } = await db
        .from("tests")
        .select("*")
        .eq("class_name", student.class_name)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tests:", error);
      } else {
        setTests((data || []) as Test[]);
      }
      setLoading(false);
    };

    fetchTests();
  }, [student]);

  const startTest = async (test: Test) => {
    const { data: questions, error } = await db
      .from("questions")
      .select("*")
      .eq("test_id", test.id)
      .order("order_index", { ascending: true });

    const questionsData = (questions || []) as { id: string; question_text: string; options: unknown; correct_answer: string; order_index: number; points: number }[];
    if (error || questionsData.length === 0) {
      toast.error("Testda savollar topilmadi");
      return;
    }

    const parsedQuestions: Question[] = questionsData.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
    }));

    setSession({
      testId: test.id,
      testTitle: test.title,
      questions: parsedQuestions,
      timeLimit: test.time_limit_minutes,
    });
  };

  const handleSubmitTest = async (answers: Record<string, string>) => {
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

    const percentage = Math.round((score / maxScore) * 100);

    const { error } = await db.from("test_results").insert({
      test_id: session.testId,
      student_id: student.id,
      student_name: student.full_name,
      student_class: student.class_name,
      score,
      max_score: maxScore,
      percentage,
      answers,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      toast.error("Natijani saqlashda xatolik");
      setSubmitting(false);
      return;
    }

    setResults({ score, maxScore, percentage });
    setSession(null);
    setSubmitting(false);
  };

  const handleCloseResults = () => {
    setResults(null);
  };

  const filteredTests = tests.filter((test) =>
    test.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  // Show results screen
  if (results) {
    return (
      <TestResults
        score={results.score}
        maxScore={results.maxScore}
        percentage={results.percentage}
        onClose={handleCloseResults}
      />
    );
  }

  // Show test session
  if (session) {
    return (
      <TestSession
        testTitle={session.testTitle}
        questions={session.questions}
        timeLimit={session.timeLimit}
        onSubmit={handleSubmitTest}
        submitting={submitting}
      />
    );
  }

  // Show test list
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testlar</h1>
          <p className="text-muted-foreground">
            {student?.class_name || "Noma'lum"} uchun mavjud testlarni topshiring
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Testlarni qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Testlar topilmadi</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Hozircha {student?.class_name || "Noma'lum"} uchun faol testlar
              mavjud emas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test, index) => (
            <TestCard key={test.id} test={test} index={index} onStart={startTest} />
          ))}
        </div>
      )}
    </div>
  );
}
