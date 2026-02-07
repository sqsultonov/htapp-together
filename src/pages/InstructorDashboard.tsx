import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructor } from "@/lib/instructor-context";
import { useBranding } from "@/lib/branding-context";
import { db } from "@/lib/database";
import { fetchActiveGradeClassNames } from "@/lib/grade-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LessonEditor } from "@/components/lessons/LessonEditor";
import { TestBulkUpload } from "@/components/tests/TestBulkUpload";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { AttendanceManager } from "@/components/attendance/AttendanceManager";
import {
  LogOut,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  ClipboardList,
  Download,
  Trash2,
  Eye,
  GraduationCap,
  FileSpreadsheet,
  Printer,
} from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  class_name: string | null;
  last_active_at: string | null;
}

interface TestResult {
  id: string;
  student_name: string | null;
  student_class: string | null;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string | null;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  class_name: string | null;
  created_at: string;
  order_index: number;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  class_name: string | null;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_at: string;
  question_count: number;
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { instructor, logout, hasPermission, isLoading } = useInstructor();
  const { branding } = useBranding();
  const [students, setStudents] = useState<Student[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    totalLessons: 0,
    totalTests: 0,
  });
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !instructor) {
      navigate("/");
    }
  }, [instructor, isLoading, navigate]);

  useEffect(() => {
    if (instructor) {
      fetchData();
      fetchAvailableClasses();
    }
  }, [instructor, selectedClass]);

  const fetchAvailableClasses = async () => {
    try {
      const { data, error } = await fetchActiveGradeClassNames();
      if (error) {
        console.error("Error fetching classes:", error);
        return;
      }
      setAvailableClasses(data);
    } catch (e) {
      console.error("Error fetching classes:", e);
    }
  };

  const fetchData = async () => {
    // Fetch students
    let studentsQuery = db.from("students").select("id, full_name, class_name, last_active_at").order("full_name");
    if (selectedClass !== "all") {
      studentsQuery = studentsQuery.eq("class_name", selectedClass);
    }
    const { data: studentsData } = await studentsQuery;
    setStudents((studentsData || []) as Student[]);

    // Fetch test results
    let resultsQuery = db.from("test_results").select("id, student_name, student_class, score, max_score, percentage, completed_at").order("completed_at", { ascending: false });
    if (selectedClass !== "all") {
      resultsQuery = resultsQuery.eq("student_class", selectedClass);
    }
    const { data: resultsData } = await resultsQuery;
    const resultsArr = (resultsData || []) as TestResult[];
    setTestResults(resultsArr);

    // Fetch lessons - show all lessons for instructor's assigned classes OR created by this instructor
    let lessonsQuery = db
      .from("lessons")
      .select("id, title, content, class_name, created_at, order_index")
      .order("created_at", { ascending: false });
    
    // Filter by selected class if not "all"
    if (selectedClass !== "all") {
      lessonsQuery = lessonsQuery.eq("class_name", selectedClass);
    } else if (instructor?.assigned_classes && instructor.assigned_classes.length > 0 && !instructor.permissions.can_view_all_students) {
      // If instructor has limited access, show only lessons for their assigned classes
      lessonsQuery = lessonsQuery.in("class_name", instructor.assigned_classes);
    }
    
    const { data: lessonsData } = await lessonsQuery;
    const lessonsArr = (lessonsData || []) as Lesson[];
    setLessons(lessonsArr);

    // Fetch tests - show all tests for instructor's assigned classes OR created by this instructor
    let testsQuery = db
      .from("tests")
      .select("id, title, description, class_name, time_limit_minutes, is_active, created_at, question_count")
      .order("created_at", { ascending: false });
    
    // Filter by selected class if not "all"
    if (selectedClass !== "all") {
      testsQuery = testsQuery.eq("class_name", selectedClass);
    } else if (instructor?.assigned_classes && instructor.assigned_classes.length > 0 && !instructor.permissions.can_view_all_students) {
      // If instructor has limited access, show only tests for their assigned classes
      testsQuery = testsQuery.in("class_name", instructor.assigned_classes);
    }
    
    const { data: testsData } = await testsQuery;
    const testsArr = (testsData || []) as Test[];
    setTests(testsArr);

    // Calculate stats
    const avgScore = resultsArr.length
      ? resultsArr.reduce((sum, r) => sum + (r.percentage || 0), 0) / resultsArr.length
      : 0;

    setStats({
      totalStudents: (studentsData || []).length,
      averageScore: Math.round(avgScore),
      totalLessons: lessonsArr.length,
      totalTests: testsArr.length,
    });
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Mavzuni o'chirmoqchimisiz?")) return;
    
    const { error } = await db.from("lessons").delete().eq("id", id);
    if (error) {
      toast.error("O'chirishda xatolik");
      return;
    }
    toast.success("Mavzu o'chirildi");
    fetchData();
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Testni o'chirmoqchimisiz?")) return;
    
    // Delete questions first
    await db.from("questions").delete().eq("test_id", id);
    
    const { error } = await db.from("tests").delete().eq("id", id);
    if (error) {
      toast.error("O'chirishda xatolik");
      return;
    }
    toast.success("Test o'chirildi");
    fetchData();
  };

  const handleToggleTestActive = async (id: string, isActive: boolean) => {
    const { error } = await db
      .from("tests")
      .update({ is_active: !isActive })
      .eq("id", id);
    
    if (error) {
      toast.error("Xatolik yuz berdi");
      return;
    }
    toast.success(isActive ? "Test o'chirildi" : "Test faollashtirildi");
    fetchData();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Tizimdan chiqdingiz");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!instructor) {
    return null;
  }

  // Filter classes based on instructor's assigned classes
  const instructorClasses = instructor.permissions.can_view_all_students
    ? availableClasses
    : (instructor.assigned_classes?.length > 0 ? instructor.assigned_classes : availableClasses);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.app_logo_url ? (
              <img
                src={branding.app_logo_url}
                alt={branding.app_name}
                className="w-10 h-10 rounded-xl object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg">{instructor.full_name}</h1>
              <p className="text-sm text-muted-foreground">{instructor.subject} • Mashg'ulot rahbari</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Chiqish
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">O'quvchilar</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">O'rtacha ball</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Darslarim</p>
                  <p className="text-2xl font-bold">{stats.totalLessons}</p>
                </div>
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Testlarim</p>
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Filter */}
        <div className="mb-6">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sinfni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha sinflar</SelectItem>
              {instructorClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {hasPermission("can_view_all_students") && (
              <TabsTrigger value="students">
                <Users className="w-4 h-4 mr-2" />
                O'quvchilar
              </TabsTrigger>
            )}
            {hasPermission("can_view_statistics") && (
              <TabsTrigger value="results">
                <BarChart3 className="w-4 h-4 mr-2" />
                Natijalar
              </TabsTrigger>
            )}
            {hasPermission("can_add_lessons") && (
              <TabsTrigger value="lessons">
                <BookOpen className="w-4 h-4 mr-2" />
                Darslar
              </TabsTrigger>
            )}
            {hasPermission("can_add_tests") && (
              <TabsTrigger value="tests">
                <FileText className="w-4 h-4 mr-2" />
                Testlar
              </TabsTrigger>
            )}
            {hasPermission("can_view_attendance") && (
              <TabsTrigger value="attendance">
                <Calendar className="w-4 h-4 mr-2" />
                Davomat
              </TabsTrigger>
            )}
            {hasPermission("can_create_homework") && (
              <TabsTrigger value="homework">
                <ClipboardList className="w-4 h-4 mr-2" />
                Uyga vazifa
              </TabsTrigger>
            )}
          </TabsList>

          {/* Students Tab */}
          {hasPermission("can_view_all_students") && (
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>O'quvchilar ro'yxati</CardTitle>
                  <CardDescription>
                    {selectedClass === "all" ? "Barcha" : selectedClass} o'quvchilar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ism-sharif</TableHead>
                        <TableHead>Sinf</TableHead>
                        <TableHead>Oxirgi faollik</TableHead>
                        <TableHead>Holat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.class_name || "—"}</TableCell>
                          <TableCell>
                            {student.last_active_at
                              ? new Date(student.last_active_at).toLocaleDateString("uz-UZ")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {student.last_active_at &&
                            new Date(student.last_active_at).toDateString() === new Date().toDateString() ? (
                              <Badge variant="default">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Faol
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                Nofaol
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {students.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            O'quvchilar topilmadi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Results Tab */}
          {hasPermission("can_view_statistics") && (
            <TabsContent value="results">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Test natijalari</CardTitle>
                    <CardDescription>O'quvchilarning test natijalari</CardDescription>
                  </div>
                  {hasPermission("can_export_reports") && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          exportToExcel(
                            testResults.map((r) => ({
                              student_name: r.student_name || "—",
                              student_class: r.student_class || "—",
                              score: `${r.score}/${r.max_score}`,
                              percentage: `${r.percentage}%`,
                              completed_at: r.completed_at
                                ? new Date(r.completed_at).toLocaleDateString("uz-UZ")
                                : "—",
                            })),
                            [
                              { header: "O'quvchi", key: "student_name", width: 25 },
                              { header: "Sinf", key: "student_class", width: 10 },
                              { header: "Ball", key: "score", width: 10 },
                              { header: "Foiz", key: "percentage", width: 10 },
                              { header: "Sana", key: "completed_at", width: 15 },
                            ],
                            "test_natijalari"
                          );
                          toast.success("Excel fayl yuklab olindi");
                        }}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          exportToPDF(
                            testResults.map((r) => ({
                              student_name: r.student_name || "—",
                              student_class: r.student_class || "—",
                              score: `${r.score}/${r.max_score}`,
                              percentage: `${r.percentage}%`,
                              completed_at: r.completed_at
                                ? new Date(r.completed_at).toLocaleDateString("uz-UZ")
                                : "—",
                            })),
                            [
                              { header: "O'quvchi", key: "student_name" },
                              { header: "Sinf", key: "student_class" },
                              { header: "Ball", key: "score" },
                              { header: "Foiz", key: "percentage" },
                              { header: "Sana", key: "completed_at" },
                            ],
                            "Test natijalari",
                            "test_natijalari"
                          );
                        }}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>O'quvchi</TableHead>
                        <TableHead>Sinf</TableHead>
                        <TableHead>Ball</TableHead>
                        <TableHead>Foiz</TableHead>
                        <TableHead>Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.student_name || "—"}</TableCell>
                          <TableCell>{result.student_class || "—"}</TableCell>
                          <TableCell>
                            {result.score}/{result.max_score}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={result.percentage >= 70 ? "default" : result.percentage >= 50 ? "secondary" : "destructive"}
                            >
                              {result.percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.completed_at
                              ? new Date(result.completed_at).toLocaleDateString("uz-UZ")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {testResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Natijalar topilmadi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Lessons Tab */}
          {hasPermission("can_add_lessons") && (
            <TabsContent value="lessons">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Darslar</CardTitle>
                    <CardDescription>Mavzular va dars materiallari</CardDescription>
                  </div>
                  <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Mavzu qo'shish
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Yangi mavzu qo'shish</DialogTitle>
                        <DialogDescription>
                          PDF, Word, Excel, rasm va boshqa fayllarni yuklashingiz mumkin
                        </DialogDescription>
                      </DialogHeader>
                      <LessonEditor
                        instructorId={instructor.id}
                        availableClasses={instructorClasses}
                        onSuccess={() => {
                          setIsAddLessonOpen(false);
                          fetchData();
                        }}
                        onCancel={() => setIsAddLessonOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mavzu</TableHead>
                        <TableHead>Sinf</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell className="font-medium">{lesson.title}</TableCell>
                          <TableCell>{lesson.class_name || "—"}</TableCell>
                          <TableCell>
                            {new Date(lesson.created_at).toLocaleDateString("uz-UZ")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {lessons.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Mavzular topilmadi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Tests Tab */}
          {hasPermission("can_add_tests") && (
            <TabsContent value="tests">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Testlar</CardTitle>
                    <CardDescription>Excel orqali savollarni avtomatik yuklang</CardDescription>
                  </div>
                  <Dialog open={isAddTestOpen} onOpenChange={setIsAddTestOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Test qo'shish
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Yangi test qo'shish</DialogTitle>
                        <DialogDescription>
                          Excel fayl orqali savollarni avtomatik yuklang (Bulk upload)
                        </DialogDescription>
                      </DialogHeader>
                      <TestBulkUpload
                        instructorId={instructor.id}
                        availableClasses={instructorClasses}
                        onSuccess={() => {
                          setIsAddTestOpen(false);
                          fetchData();
                        }}
                        onCancel={() => setIsAddTestOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test nomi</TableHead>
                        <TableHead>Sinf</TableHead>
                        <TableHead>Savollar</TableHead>
                        <TableHead>Vaqt</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell className="font-medium">{test.title}</TableCell>
                          <TableCell>{test.class_name || "—"}</TableCell>
                          <TableCell>{test.question_count || 0} ta</TableCell>
                          <TableCell>
                            {test.time_limit_minutes ? `${test.time_limit_minutes} daqiqa` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={test.is_active ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => handleToggleTestActive(test.id, test.is_active)}
                            >
                              {test.is_active ? "Faol" : "Nofaol"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteTest(test.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Testlar topilmadi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Attendance Tab */}
          {hasPermission("can_view_attendance") && (
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Davomat</CardTitle>
                  <CardDescription>O'quvchilar davomatini belgilash va ko'rish</CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceManager
                    instructorId={instructor.id}
                    availableClasses={instructorClasses}
                    canManage={hasPermission("can_manage_attendance")}
                    canExport={hasPermission("can_export_reports")}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Homework Tab */}
          {hasPermission("can_create_homework") && (
            <TabsContent value="homework">
              <Card>
                <CardHeader>
                  <CardTitle>Uyga vazifalar</CardTitle>
                  <CardDescription>Uyga vazifalar boshqaruvi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Uyga vazifa tizimi tez orada ishga tushiriladi
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
