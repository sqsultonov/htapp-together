import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { StudentProvider } from "@/lib/student-context";
import { InstructorProvider } from "@/lib/instructor-context";
import { BrandingProvider } from "@/lib/branding-context";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Tests from "./pages/Tests";
import Results from "./pages/Results";
import Admin from "./pages/Admin";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentLayout from "./components/layout/StudentLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrandingProvider>
      <StudentProvider>
        <InstructorProvider>
          <TooltipProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/instructor" element={<InstructorDashboard />} />
                <Route element={<StudentLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/lessons" element={<Lessons />} />
                  <Route path="/tests" element={<Tests />} />
                  <Route path="/results" element={<Results />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </InstructorProvider>
      </StudentProvider>
    </BrandingProvider>
  </QueryClientProvider>
);

export default App;
