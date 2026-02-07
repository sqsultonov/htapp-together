import { useEffect, useState } from "react";
import { useStudent } from "@/lib/student-context";
import { useBranding } from "@/lib/branding-context";
import { db } from "@/lib/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, Trophy, TrendingUp, Calendar, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalLessons: number;
  totalTests: number;
  completedTests: number;
  averageScore: number;
  recentResults: { date: string; score: number }[];
}

export default function Dashboard() {
  const { student } = useStudent();
  const { branding } = useBranding();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    recentResults: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!student) return;
      
      try {
        // Fetch lessons and tests for student's class_name
        const [lessonsRes, testsRes, resultsRes] = await Promise.all([
          db.from("lessons").select("id").eq("class_name", student.class_name),
          db.from("tests").select("id").eq("class_name", student.class_name).eq("is_active", true),
          db.from("test_results").select("percentage, completed_at").eq("student_name", student.full_name).order("completed_at", { ascending: false }).limit(10),
        ]);

        const lessonsData = (lessonsRes.data || []) as { id: string }[];
        const testsData = (testsRes.data || []) as { id: string }[];
        const resultsData = (resultsRes.data || []) as { percentage: number; completed_at: string | null }[];

        const completedTests = resultsData.length;
        const avgScore = completedTests > 0 
          ? resultsData.reduce((acc, r) => acc + Number(r.percentage), 0) / completedTests 
          : 0;

        // Format recent results for chart
        const recentResults = resultsData
          .filter((r) => r.completed_at)
          .map((r) => ({
            date: new Date(r.completed_at!).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }),
            score: Number(r.percentage),
          }))
          .reverse();

        setStats({
          totalLessons: lessonsData.length,
          totalTests: testsData.length,
          completedTests,
          averageScore: Math.round(avgScore),
          recentResults,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [student]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Xayrli tong";
    if (hour < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    color,
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    description?: string;
    color: string;
  }) => (
    <Card className="shadow-card border-0 hover:shadow-lg transition-shadow animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {student?.full_name?.split(" ")[0] || "O'quvchi"}! 👋
        </h1>
        <p className="text-muted-foreground">
          {student?.class_name || "Noma'lum"} o'quvchisi • {branding.app_name} platformasida o'qishni davom eting
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Jami darslar"
          value={stats.totalLessons}
          icon={BookOpen}
          description={`${student?.class_name || "Noma'lum"} uchun`}
          color="bg-primary"
        />
        <StatCard
          title="Faol testlar"
          value={stats.totalTests}
          icon={FileText}
          description="Mavjud testlar"
          color="bg-secondary"
        />
        <StatCard
          title="O'tilgan testlar"
          value={stats.completedTests}
          icon={Trophy}
          description="Muvaffaqiyatli topshirilgan"
          color="bg-accent"
        />
        <StatCard
          title="O'rtacha ball"
          value={`${stats.averageScore}%`}
          icon={TrendingUp}
          description="Umumiy natija"
          color="bg-primary"
        />
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Progress Chart */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              O'zlashtirish dinamikasi
            </CardTitle>
            <CardDescription>So'nggi test natijalari</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentResults.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.recentResults}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Ball"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Hali test topshirilmagan</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Progress */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>O'zlashtirish darajasi</CardTitle>
            <CardDescription>Umumiy ko'rsatkichlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Test natijalari</span>
                <span className="text-muted-foreground">{stats.averageScore}%</span>
              </div>
              <Progress value={stats.averageScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>O'tilgan testlar</span>
                <span className="text-muted-foreground">
                  {stats.totalTests > 0 ? Math.round((stats.completedTests / stats.totalTests) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={stats.totalTests > 0 ? (stats.completedTests / stats.totalTests) * 100 : 0} 
                className="h-2" 
              />
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium mb-3">Tez harakatlar</p>
              <QuickAction icon={BookOpen} label="Darslarni ko'rish" href="/lessons" />
              <QuickAction icon={FileText} label="Testlarni boshlash" href="/tests" />
              <QuickAction icon={Trophy} label="Natijalarni ko'rish" href="/results" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
