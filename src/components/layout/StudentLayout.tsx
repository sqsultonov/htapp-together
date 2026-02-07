import { Navigate, Outlet } from "react-router-dom";
import { useStudent } from "@/lib/student-context";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StudentSidebar } from "./StudentSidebar";
// =====================================================
// TUN/KUN REJIMI TOGGLE IMPORT
// Olib tashlash uchun quyidagi importni o'chiring
// =====================================================
import { ThemeToggle } from "@/components/ui/theme-toggle";
// =====================================================

export default function StudentLayout() {
  const { student, loading } = useStudent();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />
        <SidebarInset className="flex-1">
          <header className="h-14 border-b flex items-center px-4 bg-card sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            {/* =====================================================
                TUN/KUN REJIMI TOGGLE
                Olib tashlash uchun quyidagi qatorni o'chiring
                ===================================================== */}
            <ThemeToggle />
            {/* ===================================================== */}
          </header>
          <main className="p-6 animate-fade-in">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
