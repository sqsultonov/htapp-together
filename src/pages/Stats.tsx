import { useEffect, useState } from "react";
import { db } from "@/lib/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, BookOpen, FileText, TrendingUp } from "lucide-react";

interface StatsData {
  totalStudents: number;
  totalClasses: number;
  totalLessons: number;
  totalTests: number;
  averageScore: number;
  completedTests: number;
}

export default function Stats() {
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    totalClasses: 0,
    totalLessons: 0,
    totalTests: 0,
    averageScore: 0,
    completedTests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [classesRes, lessonsRes, testsRes, resultsRes] = await Promise.all([
          db.from("classes").select("id"),
          db.from("lessons").select("id"),
          db.from("tests").select("id"),
          db.from("test_results").select("percentage"),
        ]);

        const results = resultsRes.data || [];
        const avgScore = results.length > 0
          ? results.reduce((acc, r) => acc + Number(r.percentage), 0) / results.length
          : 0;

        setStats({
          totalStudents: 0,
          totalClasses: (classesRes.data as any[] | null)?.length || 0,
          totalLessons: (lessonsRes.data as any[] | null)?.length || 0,
          totalTests: (testsRes.data as any[] | null)?.length || 0,
          averageScore: avgScore,
          completedTests: results.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
        <h1 className="text-3xl font-bold tracking-tight">Statistika</h1>
        <p className="text-muted-foreground">Platforma umumiy ko'rsatkichlari</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card border-0 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sinflar</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Jami sinflar soni</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 animate-scale-in" style={{ animationDelay: "50ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Darslar</CardTitle>
            <BookOpen className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">Yaratilgan darslar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 animate-scale-in" style={{ animationDelay: "100ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Testlar</CardTitle>
            <FileText className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">Mavjud testlar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 animate-scale-in" style={{ animationDelay: "150ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">O'rtacha ball</CardTitle>
            <TrendingUp className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Barcha o'quvchilar</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>O'zlashtirish darajasi</CardTitle>
            <CardDescription>Sinflar bo'yicha o'zlashtirish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                Ma'lumotlar yetarli emas. O'quvchilar test topshirgandan so'ng statistika ko'rsatiladi.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>So'nggi faollik</CardTitle>
            <CardDescription>Oxirgi 7 kun ichidagi faollik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                Hozircha faollik yo'q. O'quvchilar darslarni o'qigandan so'ng statistika ko'rsatiladi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
