import { db } from "@/lib/database";

export interface GradeClassRow {
  id: string;
  name: string;
  display_order: number;
  is_active: unknown;
  created_at?: string;
}

function isActiveLike(value: unknown): boolean {
  if (value === true) return true;
  if (value === 1 || value === "1") return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "yes" || v === "on") return true;
    if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  }
  return Boolean(value);
}

export async function fetchGradeClasses(): Promise<{ data: GradeClassRow[]; error: string | null }> {
  try {
    const { data, error } = await db
      .from("grade_classes")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) return { data: [], error: String(error) };
    return { data: (data || []) as GradeClassRow[], error: null };
  } catch (e: any) {
    return { data: [], error: e?.message ? String(e.message) : "Unknown error" };
  }
}

export async function fetchActiveGradeClassNames(): Promise<{ data: string[]; error: string | null }> {
  const res = await fetchGradeClasses();
  if (res.error) return { data: [], error: res.error };
  return {
    data: res.data.filter((c) => isActiveLike(c.is_active)).map((c) => c.name),
    error: null,
  };
}
