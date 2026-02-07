export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          pin_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_hash?: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_hash?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          app_description: string | null
          app_logo_url: string | null
          app_mission: string | null
          app_name: string
          available_classes: string[] | null
          available_grades: Json
          body_font_size: number | null
          created_at: string
          heading_font_size: number | null
          id: string
          login_bg_image_url: string | null
          login_bg_overlay_opacity: number
          sidebar_font_size: number | null
          updated_at: string
        }
        Insert: {
          app_description?: string | null
          app_logo_url?: string | null
          app_mission?: string | null
          app_name?: string
          available_classes?: string[] | null
          available_grades?: Json
          body_font_size?: number | null
          created_at?: string
          heading_font_size?: number | null
          id?: string
          login_bg_image_url?: string | null
          login_bg_overlay_opacity?: number
          sidebar_font_size?: number | null
          updated_at?: string
        }
        Update: {
          app_description?: string | null
          app_logo_url?: string | null
          app_mission?: string | null
          app_name?: string
          available_classes?: string[] | null
          available_grades?: Json
          body_font_size?: number | null
          created_at?: string
          heading_font_size?: number | null
          id?: string
          login_bg_image_url?: string | null
          login_bg_overlay_opacity?: number
          sidebar_font_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          instructor_id: string
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          instructor_id: string
          notes?: string | null
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      grade_classes: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      homework: {
        Row: {
          class_name: string | null
          created_at: string
          description: string | null
          due_date: string | null
          grade: number
          id: string
          instructor_id: string
          is_active: boolean
          title: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade: number
          id?: string
          instructor_id: string
          is_active?: boolean
          title: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade?: number
          id?: string
          instructor_id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          feedback: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          homework_id: string
          id: string
          student_id: string
          submission_text: string | null
          submitted_at: string
        }
        Insert: {
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          homework_id: string
          id?: string
          student_id: string
          submission_text?: string | null
          submitted_at?: string
        }
        Update: {
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          homework_id?: string
          id?: string
          student_id?: string
          submission_text?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_grades: {
        Row: {
          id: string
          instructor_id: string
          modified_at: string
          modified_score: number
          original_score: number
          reason: string | null
          student_id: string
          test_result_id: string | null
        }
        Insert: {
          id?: string
          instructor_id: string
          modified_at?: string
          modified_score: number
          original_score: number
          reason?: string | null
          student_id: string
          test_result_id?: string | null
        }
        Update: {
          id?: string
          instructor_id?: string
          modified_at?: string
          modified_score?: number
          original_score?: number
          reason?: string | null
          student_id?: string
          test_result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_grades_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_grades_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          assigned_classes: string[] | null
          assigned_grades: number[] | null
          can_add_lessons: boolean
          can_add_tests: boolean
          can_compare_with_others: boolean
          can_create_homework: boolean
          can_edit_grades: boolean
          can_export_reports: boolean
          can_grade_homework: boolean
          can_manage_attendance: boolean
          can_manage_own_students: boolean
          can_send_notifications: boolean
          can_view_all_students: boolean
          can_view_attendance: boolean
          can_view_statistics: boolean
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          login: string
          password_hash: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_classes?: string[] | null
          assigned_grades?: number[] | null
          can_add_lessons?: boolean
          can_add_tests?: boolean
          can_compare_with_others?: boolean
          can_create_homework?: boolean
          can_edit_grades?: boolean
          can_export_reports?: boolean
          can_grade_homework?: boolean
          can_manage_attendance?: boolean
          can_manage_own_students?: boolean
          can_send_notifications?: boolean
          can_view_all_students?: boolean
          can_view_attendance?: boolean
          can_view_statistics?: boolean
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          login: string
          password_hash: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_classes?: string[] | null
          assigned_grades?: number[] | null
          can_add_lessons?: boolean
          can_add_tests?: boolean
          can_compare_with_others?: boolean
          can_create_homework?: boolean
          can_edit_grades?: boolean
          can_export_reports?: boolean
          can_grade_homework?: boolean
          can_manage_attendance?: boolean
          can_manage_own_students?: boolean
          can_send_notifications?: boolean
          can_view_all_students?: boolean
          can_view_attendance?: boolean
          can_view_statistics?: boolean
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          login?: string
          password_hash?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: Json | null
          class_id: string | null
          class_name: string | null
          content: string
          created_at: string
          created_by: string | null
          grade: number | null
          id: string
          instructor_id: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          class_id?: string | null
          class_name?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          grade?: number | null
          id?: string
          instructor_id?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          class_id?: string | null
          class_name?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          grade?: number | null
          id?: string
          instructor_id?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          id: string
          options: Json
          order_index: number
          points: number
          question_text: string
          test_id: string
        }
        Insert: {
          correct_answer: string
          id?: string
          options: Json
          order_index?: number
          points?: number
          question_text: string
          test_id: string
        }
        Update: {
          correct_answer?: string
          id?: string
          options?: Json
          order_index?: number
          points?: number
          question_text?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_name: string | null
          created_at: string
          full_name: string
          grade: number | null
          id: string
          last_active_at: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          full_name: string
          grade?: number | null
          id?: string
          last_active_at?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string
          full_name?: string
          grade?: number | null
          id?: string
          last_active_at?: string | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          max_score: number
          percentage: number
          score: number
          started_at: string
          student_class: string | null
          student_grade: number | null
          student_id: string
          student_name: string | null
          test_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          max_score?: number
          percentage?: number
          score?: number
          started_at?: string
          student_class?: string | null
          student_grade?: number | null
          student_id: string
          student_name?: string | null
          test_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          max_score?: number
          percentage?: number
          score?: number
          started_at?: string
          student_class?: string | null
          student_grade?: number | null
          student_id?: string
          student_name?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          class_id: string | null
          class_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          grade: number | null
          id: string
          instructor_id: string | null
          is_active: boolean
          lesson_id: string | null
          question_count: number | null
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          lesson_id?: string | null
          question_count?: number | null
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          lesson_id?: string | null
          question_count?: number | null
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
