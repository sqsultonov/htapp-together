/**
 * Offlayn rejimda boshlang'ich ma'lumotlarni yaratish.
 * Agar admin_settings va boshqa kerakli jadvallar bo'sh bo'lsa,
 * standart qiymatlar bilan to'ldiradi.
 */

const SEED_KEY = "offlinedb_seed_done_v2";

function getTable(table: string): any[] {
  try {
    const raw = localStorage.getItem(`offlinedb_${table}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTable(table: string, data: any[]): void {
  localStorage.setItem(`offlinedb_${table}`, JSON.stringify(data));
}

export function seedOfflineData(): void {
  // Skip if already seeded
  if (localStorage.getItem(SEED_KEY)) return;

  // 1. Admin settings - default PIN: 1234
  const adminSettings = getTable("admin_settings");
  if (adminSettings.length === 0) {
    setTable("admin_settings", [
      {
        id: crypto.randomUUID(),
        pin_hash: "1234",
        created_at: new Date().toISOString(),
      },
    ]);
  }

  // 2. App settings - default branding
  const appSettings = getTable("app_settings");
  if (appSettings.length === 0) {
    setTable("app_settings", [
      {
        id: crypto.randomUUID(),
        app_name: "HTApp",
        app_description: "O'quv platformasiga xush kelibsiz",
        app_mission: "Zamonaviy ta'lim tizimi orqali o'quvchilarning bilim va ko'nikmalarini oshirish",
        app_logo_url: null,
        login_bg_image_url: null,
        login_bg_overlay_opacity: 0.85,
        available_classes: [],
        available_grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        body_font_size: null,
        heading_font_size: null,
        sidebar_font_size: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  // 3. Default instructor (login: admin, password: admin123)
  const instructors = getTable("instructors");
  if (instructors.length === 0) {
    setTable("instructors", [
      {
        id: crypto.randomUUID(),
        full_name: "Administrator",
        login: "admin",
        password_hash: "admin123",
        subject: "Umumiy",
        is_active: true,
        assigned_classes: [],
        assigned_grades: [],
        can_view_statistics: true,
        can_add_lessons: true,
        can_add_tests: true,
        can_edit_grades: true,
        can_view_all_students: true,
        can_export_reports: true,
        can_manage_own_students: true,
        can_compare_with_others: true,
        can_send_notifications: true,
        can_create_homework: true,
        can_grade_homework: true,
        can_view_attendance: true,
        can_manage_attendance: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  // 4. Default grade classes
  const gradeClasses = getTable("grade_classes");
  if (gradeClasses.length === 0) {
    const defaultClasses = ["1-A", "1-B", "2-A", "2-B", "3-A", "3-B", "4-A", "4-B", "5-A", "5-B"];
    setTable(
      "grade_classes",
      defaultClasses.map((name, i) => ({
        id: crypto.randomUUID(),
        name,
        is_active: true,
        display_order: i,
        created_at: new Date().toISOString(),
      }))
    );
  }

  localStorage.setItem(SEED_KEY, "true");
}
