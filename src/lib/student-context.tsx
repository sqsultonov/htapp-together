import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/database";

interface Student {
  id: string;
  full_name: string;
  grade: number;
  class_name: string;
  created_at: string;
  last_active_at: string;
}

interface StudentContextType {
  student: Student | null;
  loading: boolean;
  login: (fullName: string, className: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STUDENT_STORAGE_KEY = "htapp_student";

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (storedStudent) {
      try {
        const parsed = JSON.parse(storedStudent);
        setStudent(parsed);
        // Update last active
        updateLastActive(parsed.id);
      } catch {
        localStorage.removeItem(STUDENT_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const updateLastActive = async (studentId: string) => {
    await db
      .from("students")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", studentId);
  };

  const login = async (fullName: string, className: string) => {
    setLoading(true);
    
    const { data, error } = await db
      .from("students")
      .insert({
        full_name: fullName,
        class_name: className,
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      throw new Error(error);
    }

    const studentData = {
      ...data,
      grade: data.grade || 0,
      class_name: data.class_name || "Noma'lum",
    } as Student;
    setStudent(studentData);
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(studentData));
    setLoading(false);
  };

  const logout = () => {
    setStudent(null);
    setIsAdmin(false);
    localStorage.removeItem(STUDENT_STORAGE_KEY);
  };

  return (
    <StudentContext.Provider value={{ student, loading, login, logout, isAdmin, setIsAdmin }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
}
