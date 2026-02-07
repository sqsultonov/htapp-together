import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudent } from "@/lib/student-context";
import { useBranding } from "@/lib/branding-context";
import { fetchActiveGradeClassNames } from "@/lib/grade-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, BookOpen, Users, User } from "lucide-react";
import { AdminPinModal } from "@/components/AdminPinModal";
import { InstructorLoginModal } from "@/components/InstructorLoginModal";

export default function Login() {
  const { student, loading, login, setIsAdmin } = useStudent();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Fetch available classes from grade_classes table
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setClassesLoading(true);
        const { data, error } = await fetchActiveGradeClassNames();
        if (cancelled) return;

        if (error) {
          console.error("Error fetching classes:", error);
          toast.error("Sinflarni yuklashda xatolik");
          setAvailableClasses([]);
          return;
        }

        setAvailableClasses(data);
      } catch (e) {
        if (cancelled) return;
        console.error("Error fetching classes:", e);
        toast.error("Sinflarni yuklashda xatolik");
        setAvailableClasses([]);
      } finally {
        if (!cancelled) setClassesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && student) {
      navigate("/dashboard");
    }
  }, [loading, student, navigate]);

  // =====================================================
  // KEYBOARD SHORTCUTS - Admin va Rahbar kirish uchun
  // Agar keyinchalik ushbu shortcutlarni olib tashlash kerak bo'lsa,
  // quyidagi useEffect blokini o'chiring yoki izohga oling.
  // Admin: Ctrl + Shift + A
  // Rahbar (Instructor): Ctrl + Shift + R
  // =====================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Admin panel uchun: Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setShowAdminModal(true);
      }
      // Rahbar (Instructor) panel uchun: Ctrl + Shift + R
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setShowInstructorModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  // =====================================================
  // KEYBOARD SHORTCUTS OXIRI
  // =====================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("Ism-sharifingizni kiriting");
      return;
    }
    
    if (!selectedClass) {
      toast.error("Sinfingizni tanlang");
      return;
    }

    setIsLoading(true);

    try {
      await login(fullName.trim(), selectedClass);
      toast.success("Muvaffaqiyatli kirdingiz!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding with customizable background */}
      <div 
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: branding.login_bg_image_url ? `url(${branding.login_bg_image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Background overlay layer */}
        <div 
          className="absolute inset-0 bg-sidebar"
          style={{ 
            opacity: branding.login_bg_image_url ? branding.login_bg_overlay_opacity : 1 
          }}
        />
        
        {/* Content (positioned above overlay) */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            {branding.app_logo_url ? (
              <img
                src={branding.app_logo_url}
                alt={branding.app_name}
                className="w-12 h-12 rounded-xl object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
            )}
            <span className="text-2xl font-bold text-sidebar-foreground">{branding.app_name}</span>
          </div>
          <h1 className="text-4xl font-bold text-sidebar-foreground mb-4">
            {branding.app_description || "O'quv platformasiga xush kelibsiz"}
          </h1>
          <p className="text-sidebar-foreground/70 text-lg">
            {branding.app_mission || "Zamonaviy ta'lim tizimi orqali o'quvchilarning bilim va ko'nikmalarini oshirish"}
          </p>
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-4 text-sidebar-foreground/80">
            <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Interaktiv darslar va qo'llanmalar</span>
          </div>
          <div className="flex items-center gap-4 text-sidebar-foreground/80">
            <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Testlar va natijalarni kuzatish</span>
          </div>
          <div className="flex items-center gap-4 text-sidebar-foreground/80">
            <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span>Sinf bo'yicha o'zlashtirish statistikasi</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md shadow-card border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              {branding.app_logo_url ? (
                <img
                  src={branding.app_logo_url}
                  alt={branding.app_name}
                  className="w-10 h-10 rounded-lg object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <span className="text-xl font-bold">{branding.app_name}</span>
            </div>
            <CardTitle className="text-2xl">Tizimga kirish</CardTitle>
            <CardDescription>
              {branding.app_name} platformasidan foydalanish uchun ma'lumotlaringizni kiriting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">To'liq ism-sharif</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Familiya Ism"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class">Sinf</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Sinfingizni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                  {classesLoading ? (
                    <SelectItem value="loading" disabled>
                      Yuklanmoqda...
                    </SelectItem>
                  ) : availableClasses.length > 0 ? (
                    availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Sinflar topilmadi
                    </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Yuklanmoqda..." : "Kirish"}
              </Button>
            </form>
            
            {/* =====================================================
                KEYBOARD SHORTCUTS HAQIDA MA'LUMOT
                Agar shortcutlarni olib tashlasangiz, 
                quyidagi qismni ham o'chiring.
                ===================================================== */}
            <div className="text-xs text-center text-muted-foreground mt-6 space-y-1">
              <p>
                Admin: <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">A</kbd>
              </p>
              <p>
                Rahbar: <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">R</kbd>
              </p>
            </div>
            {/* KEYBOARD SHORTCUTS MA'LUMOTI OXIRI */}
          </CardContent>
        </Card>
      </div>

      <AdminPinModal
        open={showAdminModal}
        onOpenChange={setShowAdminModal}
        onSuccess={handleAdminSuccess}
      />
      
      <InstructorLoginModal
        open={showInstructorModal}
        onOpenChange={setShowInstructorModal}
      />
    </div>
  );
}
