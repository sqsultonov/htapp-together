import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/database";

export interface InstructorPermissions {
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

export interface Instructor {
  id: string;
  full_name: string;
  login: string;
  subject: string;
  is_active: boolean;
  permissions: InstructorPermissions;
  assigned_classes: string[];
}

interface InstructorContextType {
  instructor: Instructor | null;
  isLoading: boolean;
  login: (loginName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: keyof InstructorPermissions) => boolean;
}

const InstructorContext = createContext<InstructorContextType | undefined>(undefined);

const INSTRUCTOR_STORAGE_KEY = "htapp_instructor";

export function InstructorProvider({ children }: { children: ReactNode }) {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load instructor from localStorage on mount
    const savedInstructor = localStorage.getItem(INSTRUCTOR_STORAGE_KEY);
    if (savedInstructor) {
      try {
        const parsed = JSON.parse(savedInstructor);
        setInstructor(parsed);
      } catch (e) {
        localStorage.removeItem(INSTRUCTOR_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (loginName: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await db
        .from("instructors")
        .select("*")
        .eq("login", loginName)
        .eq("password_hash", password)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return { success: false, error: "Login yoki parol noto'g'ri" };
      }

      // Handle assigned_classes which might be a string in SQLite
      let assignedClasses = data.assigned_classes || [];
      if (typeof assignedClasses === 'string') {
        try {
          assignedClasses = JSON.parse(assignedClasses);
        } catch {
          assignedClasses = [];
        }
      }

      const instructorData: Instructor = {
        id: data.id,
        full_name: data.full_name,
        login: data.login,
        subject: data.subject,
        is_active: Boolean(data.is_active),
        assigned_classes: assignedClasses,
        permissions: {
          can_view_statistics: Boolean(data.can_view_statistics),
          can_add_lessons: Boolean(data.can_add_lessons),
          can_add_tests: Boolean(data.can_add_tests),
          can_edit_grades: Boolean(data.can_edit_grades),
          can_view_all_students: Boolean(data.can_view_all_students),
          can_export_reports: Boolean(data.can_export_reports),
          can_manage_own_students: Boolean(data.can_manage_own_students),
          can_compare_with_others: Boolean(data.can_compare_with_others),
          can_send_notifications: Boolean(data.can_send_notifications),
          can_create_homework: Boolean(data.can_create_homework),
          can_grade_homework: Boolean(data.can_grade_homework),
          can_view_attendance: Boolean(data.can_view_attendance),
          can_manage_attendance: Boolean(data.can_manage_attendance),
        },
      };

      setInstructor(instructorData);
      localStorage.setItem(INSTRUCTOR_STORAGE_KEY, JSON.stringify(instructorData));
      return { success: true };
    } catch (e) {
      return { success: false, error: "Xatolik yuz berdi" };
    }
  };

  const logout = () => {
    setInstructor(null);
    localStorage.removeItem(INSTRUCTOR_STORAGE_KEY);
  };

  const hasPermission = (permission: keyof InstructorPermissions): boolean => {
    if (!instructor) return false;
    return instructor.permissions[permission];
  };

  return (
    <InstructorContext.Provider value={{ instructor, isLoading, login, logout, hasPermission }}>
      {children}
    </InstructorContext.Provider>
  );
}

export function useInstructor() {
  const context = useContext(InstructorContext);
  if (context === undefined) {
    throw new Error("useInstructor must be used within an InstructorProvider");
  }
  return context;
}
