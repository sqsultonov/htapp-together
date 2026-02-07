import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudent } from "@/lib/student-context";
import { db } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  BarChart3, 
  BookOpen, 
  FileText, 
  LogOut, 
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  UserCog,
  Eye,
  EyeOff,
  Settings,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { AdminPinModal } from "@/components/AdminPinModal";
import { toast } from "sonner";
import { ClassesTab } from "@/components/admin/ClassesTab";
import { BrandingTab } from "@/components/admin/BrandingTab";
import { InstructorClassesSelect } from "@/components/admin/InstructorClassesSelect";
import { useBranding } from "@/lib/branding-context";

interface Student {
  id: string;
  full_name: string;
  grade: number;
  class_name: string | null;
  created_at: string;
  last_active_at: string;
}

interface ClassStats {
  className: string;
  count: number;
  avgScore: number;
}

interface Instructor {
  id: string;
  full_name: string;
  login: string;
  password_hash: string;
  subject: string;
  is_active: boolean;
  created_at: string;
  assigned_classes: string[];
  can_view_statistics: boolean;
  can_add_lessons: boolean;
  can_add_tests: boolean;
  can_edit_grades: boolean;
  can_view_all_students: boolean;
  can_export_reports: boolean;
  can_manage_own_students: boolean;
  can_compare_with_others: boolean;
  can_send_notifications: boolean;
  can_create_homework: boolean;
  can_grade_homework: boolean;
  can_view_attendance: boolean;
  can_manage_attendance: boolean;
}

const defaultPermissions = {
  can_view_statistics: true,
  can_add_lessons: true,
  can_add_tests: true,
  can_edit_grades: false,
  can_view_all_students: true,
  can_export_reports: false,
  can_manage_own_students: true,
  can_compare_with_others: false,
  can_send_notifications: false,
  can_create_homework: true,
  can_grade_homework: true,
  can_view_attendance: true,
  can_manage_attendance: false,
};

const permissionLabels: Record<string, string> = {
  can_view_statistics: "Statistikani ko'rish",
  can_add_lessons: "Dars qo'shish",
  can_add_tests: "Test qo'shish",
  can_edit_grades: "Baholarni o'zgartirish",
  can_view_all_students: "Barcha o'quvchilarni ko'rish",
  can_export_reports: "Hisobotlarni eksport qilish",
  can_manage_own_students: "O'z o'quvchilarini boshqarish",
  can_compare_with_others: "Boshqalar bilan solishtirish",
  can_send_notifications: "Xabar yuborish",
  can_create_homework: "Uyga vazifa yaratish",
  can_grade_homework: "Uyga vazifani baholash",
  can_view_attendance: "Davomatni ko'rish",
  can_manage_attendance: "Davomatni boshqarish",
};

export default function Admin() {
  const { isAdmin, setIsAdmin } = useStudent();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [showPinModal, setShowPinModal] = useState(!isAdmin);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add instructor form
  const [isAddInstructorOpen, setIsAddInstructorOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [instructorForm, setInstructorForm] = useState({
    full_name: "",
    login: "",
    password_hash: "",
    subject: "",
    assigned_classes: [] as string[],
    ...defaultPermissions,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Keyboard shortcut for admin access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (!isAdmin) {
          setShowPinModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch students
    const { data: studentsData } = await db
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Fetch instructors
    const { data: instructorsData } = await db
      .from("instructors")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Fetch available classes
    const { data: classesData } = await db
      .from("grade_classes")
      .select("name")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    
    if (instructorsData) {
      setInstructors(instructorsData as Instructor[]);
    }
    
    const studentsArr = (studentsData || []) as Student[];
    if (studentsArr.length > 0) {
      setStudents(studentsArr);
      
      // Calculate class stats
      const stats: Record<string, { count: number; totalScore: number; testCount: number }> = {};
      
      // Initialize with available classes
      if (classesData) {
        (classesData as { name: string }[]).forEach(c => {
          stats[c.name] = { count: 0, totalScore: 0, testCount: 0 };
        });
      }
      
      studentsArr.forEach((student) => {
        if (student.class_name && stats[student.class_name]) {
          stats[student.class_name].count++;
        }
      });
      
      // Fetch test results for average scores
      const { data: resultsData } = await db
        .from("test_results")
        .select("student_class, percentage");
      
      if (resultsData) {
        (resultsData as { student_class: string | null; percentage: number }[]).forEach((result) => {
          const classKey = result.student_class;
          if (classKey && stats[classKey]) {
            stats[classKey].totalScore += result.percentage;
            stats[classKey].testCount++;
          }
        });
      }
      
      const classStatsArray: ClassStats[] = Object.entries(stats).map(([className, data]) => ({
        className,
        count: data.count,
        avgScore: data.testCount > 0 ? Math.round(data.totalScore / data.testCount) : 0,
      }));
      
      setClassStats(classStatsArray);
    } else {
      setStudents([]);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    navigate("/");
  };

  const handlePinSuccess = () => {
    setIsAdmin(true);
    setShowPinModal(false);
  };

  const resetInstructorForm = () => {
    setInstructorForm({
      full_name: "",
      login: "",
      password_hash: "",
      subject: "",
      assigned_classes: [],
      ...defaultPermissions,
    });
    setEditingInstructor(null);
  };

  const handleAddInstructor = async () => {
    if (!instructorForm.full_name.trim() || !instructorForm.login.trim() || !instructorForm.password_hash.trim() || !instructorForm.subject.trim()) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    const { error } = await db.from("instructors").insert({
      full_name: instructorForm.full_name,
      login: instructorForm.login,
      password_hash: instructorForm.password_hash,
      subject: instructorForm.subject,
      assigned_classes: instructorForm.assigned_classes,
      can_view_statistics: instructorForm.can_view_statistics,
      can_add_lessons: instructorForm.can_add_lessons,
      can_add_tests: instructorForm.can_add_tests,
      can_edit_grades: instructorForm.can_edit_grades,
      can_view_all_students: instructorForm.can_view_all_students,
      can_export_reports: instructorForm.can_export_reports,
      can_manage_own_students: instructorForm.can_manage_own_students,
      can_compare_with_others: instructorForm.can_compare_with_others,
      can_send_notifications: instructorForm.can_send_notifications,
      can_create_homework: instructorForm.can_create_homework,
      can_grade_homework: instructorForm.can_grade_homework,
      can_view_attendance: instructorForm.can_view_attendance,
      can_manage_attendance: instructorForm.can_manage_attendance,
    });

    if (error) {
      toast.error("Rahbar qo'shishda xatolik: " + error);
      return;
    }

    toast.success("Mashg'ulot rahbari muvaffaqiyatli qo'shildi");
    setIsAddInstructorOpen(false);
    resetInstructorForm();
    fetchData();
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setInstructorForm({
      full_name: instructor.full_name,
      login: instructor.login,
      password_hash: instructor.password_hash,
      subject: instructor.subject,
      assigned_classes: instructor.assigned_classes || [],
      can_view_statistics: instructor.can_view_statistics,
      can_add_lessons: instructor.can_add_lessons,
      can_add_tests: instructor.can_add_tests,
      can_edit_grades: instructor.can_edit_grades,
      can_view_all_students: instructor.can_view_all_students,
      can_export_reports: instructor.can_export_reports,
      can_manage_own_students: instructor.can_manage_own_students,
      can_compare_with_others: instructor.can_compare_with_others,
      can_send_notifications: instructor.can_send_notifications,
      can_create_homework: instructor.can_create_homework,
      can_grade_homework: instructor.can_grade_homework,
      can_view_attendance: instructor.can_view_attendance,
      can_manage_attendance: instructor.can_manage_attendance,
    });
    setIsAddInstructorOpen(true);
  };

  const handleUpdateInstructor = async () => {
    if (!editingInstructor) return;

    const { error } = await db
      .from("instructors")
      .update({
        full_name: instructorForm.full_name,
        login: instructorForm.login,
        password_hash: instructorForm.password_hash,
        subject: instructorForm.subject,
        assigned_classes: instructorForm.assigned_classes,
        can_view_statistics: instructorForm.can_view_statistics,
        can_add_lessons: instructorForm.can_add_lessons,
        can_add_tests: instructorForm.can_add_tests,
        can_edit_grades: instructorForm.can_edit_grades,
        can_view_all_students: instructorForm.can_view_all_students,
        can_export_reports: instructorForm.can_export_reports,
        can_manage_own_students: instructorForm.can_manage_own_students,
        can_compare_with_others: instructorForm.can_compare_with_others,
        can_send_notifications: instructorForm.can_send_notifications,
        can_create_homework: instructorForm.can_create_homework,
        can_grade_homework: instructorForm.can_grade_homework,
        can_view_attendance: instructorForm.can_view_attendance,
        can_manage_attendance: instructorForm.can_manage_attendance,
      })
      .eq("id", editingInstructor.id);

    if (error) {
      toast.error("Yangilashda xatolik: " + error);
      return;
    }

    toast.success("Mashg'ulot rahbari yangilandi");
    setIsAddInstructorOpen(false);
    resetInstructorForm();
    fetchData();
  };

  const handleDeleteInstructor = async (id: string) => {
    if (!confirm("Haqiqatan ham bu rahbarni o'chirmoqchimisiz?")) return;

    const { error } = await db.from("instructors").delete().eq("id", id);

    if (error) {
      toast.error("O'chirishda xatolik");
      return;
    }

    toast.success("Rahbar o'chirildi");
    fetchData();
  };

  const handleToggleActive = async (instructor: Instructor) => {
    const { error } = await db
      .from("instructors")
      .update({ is_active: !instructor.is_active })
      .eq("id", instructor.id);

    if (error) {
      toast.error("Xatolik yuz berdi");
      return;
    }

    toast.success(instructor.is_active ? "Rahbar faolsizlantirildi" : "Rahbar faollashtirildi");
    fetchData();
  };

  if (!isAdmin && !showPinModal) {
    navigate("/");
    return null;
  }

  if (!isAdmin) {
    return (
      <AdminPinModal
        open={showPinModal}
        onOpenChange={(open) => {
          setShowPinModal(open);
          if (!open) navigate("/");
        }}
        onSuccess={handlePinSuccess}
      />
    );
  }

  const totalStudents = students.length;
  const activeToday = students.filter(s => {
    const lastActive = new Date(s.last_active_at);
    const today = new Date();
    return lastActive.toDateString() === today.toDateString();
  }).length;

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
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{branding.app_name} Admin</h1>
              <p className="text-xs text-muted-foreground">Boshqaruv paneli</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Jami o'quvchilar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeToday}</p>
                  <p className="text-sm text-muted-foreground">Bugun faol</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{instructors.length}</p>
                  <p className="text-sm text-muted-foreground">Rahbarlar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">11</p>
                  <p className="text-sm text-muted-foreground">Sinflar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(classStats.reduce((acc, s) => acc + s.avgScore, 0) / (classStats.filter(s => s.avgScore > 0).length || 1))}%
                  </p>
                  <p className="text-sm text-muted-foreground">O'rtacha ball</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="instructors" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="instructors" className="gap-2">
              <UserCog className="w-4 h-4" />
              Rahbarlar
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              O'quvchilar
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <Layers className="w-4 h-4" />
              Sinflar
            </TabsTrigger>
            <TabsTrigger value="grades" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistika
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Mavzular
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2">
              <FileText className="w-4 h-4" />
              Testlar
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Sozlamalar
            </TabsTrigger>
          </TabsList>

          {/* Instructors Tab */}
          <TabsContent value="instructors">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mashg'ulot rahbarlari</CardTitle>
                  <CardDescription>O'qituvchilar va ularning huquqlari</CardDescription>
                </div>
                <Dialog open={isAddInstructorOpen} onOpenChange={(open) => {
                  setIsAddInstructorOpen(open);
                  if (!open) resetInstructorForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Rahbar qo'shish
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingInstructor ? "Rahbarni tahrirlash" : "Yangi rahbar qo'shish"}
                      </DialogTitle>
                      <DialogDescription>
                        Mashg'ulot rahbari ma'lumotlari va huquqlarini kiriting
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>To'liq ism</Label>
                          <Input
                            value={instructorForm.full_name}
                            onChange={(e) => setInstructorForm({ ...instructorForm, full_name: e.target.value })}
                            placeholder="Ism Familiya"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fan nomi</Label>
                          <Input
                            value={instructorForm.subject}
                            onChange={(e) => setInstructorForm({ ...instructorForm, subject: e.target.value })}
                            placeholder="Matematika"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Login</Label>
                          <Input
                            value={instructorForm.login}
                            onChange={(e) => setInstructorForm({ ...instructorForm, login: e.target.value })}
                            placeholder="teacher_math"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Parol</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={instructorForm.password_hash}
                              onChange={(e) => setInstructorForm({ ...instructorForm, password_hash: e.target.value })}
                              placeholder="••••••••"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Classes */}
                      <InstructorClassesSelect
                        selectedClasses={instructorForm.assigned_classes}
                        onChange={(classes) => setInstructorForm({ ...instructorForm, assigned_classes: classes })}
                      />

                      {/* Permissions */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Huquqlar</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(permissionLabels).map(([key, label]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={key}
                                checked={instructorForm[key as keyof typeof instructorForm] as boolean}
                                onCheckedChange={(checked) =>
                                  setInstructorForm({ ...instructorForm, [key]: checked })
                                }
                              />
                              <label
                                htmlFor={key}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={editingInstructor ? handleUpdateInstructor : handleAddInstructor}
                          className="flex-1"
                        >
                          {editingInstructor ? "Saqlash" : "Qo'shish"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddInstructorOpen(false);
                            resetInstructorForm();
                          }}
                        >
                          Bekor qilish
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
                ) : instructors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Hozircha rahbarlar yo'q. Yangi rahbar qo'shing.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ism-sharif</TableHead>
                        <TableHead>Fan</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead>Huquqlar</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instructors.map((instructor) => {
                        const activePermissions = Object.entries(permissionLabels).filter(
                          ([key]) => instructor[key as keyof Instructor]
                        ).length;
                        
                        return (
                          <TableRow key={instructor.id}>
                            <TableCell className="font-medium">{instructor.full_name}</TableCell>
                            <TableCell>{instructor.subject}</TableCell>
                            <TableCell className="font-mono text-sm">{instructor.login}</TableCell>
                            <TableCell>
                              <Badge
                                variant={instructor.is_active ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => handleToggleActive(instructor)}
                              >
                                {instructor.is_active ? "Faol" : "Nofaol"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {activePermissions} / {Object.keys(permissionLabels).length}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditInstructor(instructor)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteInstructor(instructor.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Barcha o'quvchilar</CardTitle>
                <CardDescription>Tizimga kirgan barcha o'quvchilar ro'yxati</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Hozircha o'quvchilar yo'q</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ism-sharif</TableHead>
                        <TableHead>Sinf</TableHead>
                        <TableHead>Ro'yxatdan o'tgan</TableHead>
                        <TableHead>Oxirgi faollik</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.class_name || "Noma'lum"}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(student.created_at), "dd.MM.yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(student.last_active_at), "dd.MM.yyyy HH:mm")}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Sinflar bo'yicha statistika</CardTitle>
                <CardDescription>Har bir sinf uchun o'quvchilar soni va o'rtacha ball</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sinf</TableHead>
                      <TableHead>O'quvchilar soni</TableHead>
                      <TableHead>O'rtacha ball</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStats.map((stat) => (
                      <TableRow key={stat.className}>
                        <TableCell>
                          <Badge>{stat.className}</Badge>
                        </TableCell>
                        <TableCell>{stat.count} ta o'quvchi</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${stat.avgScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{stat.avgScore}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mavzular</CardTitle>
                  <CardDescription>O'quvchilar uchun dars mavzulari</CardDescription>
                </div>
                <Button>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Yangi mavzu
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Mavzular qo'shish imkoniyati tez orada qo'shiladi
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Testlar</CardTitle>
                  <CardDescription>O'quvchilar uchun test savollari</CardDescription>
                </div>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Yangi test
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Testlar qo'shish imkoniyati tez orada qo'shiladi
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <ClassesTab />
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="settings">
            <BrandingTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
