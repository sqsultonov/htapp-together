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

/**
 * =====================================================
 * DEFAULT SINFLARNI SEEDING QILISH
 * =====================================================
 * 
 * Agar grade_classes jadvali bo'sh bo'lsa, 1-11 gacha
 * standart sinflarni avtomatik yaratadi.
 * Har ikkala muhitda (Electron va brauzer) ishlaydi.
 * 
 * =====================================================
 */
async function seedDefaultGradeClassesIfEmpty(): Promise<void> {
  try {
    const { data } = await db.from("grade_classes").select("id").limit(1);
    if (data && (data as any[]).length > 0) return;

    const defaults = Array.from({ length: 11 }, (_, i) => {
      const n = i + 1;
      return {
        id: `g${n}`,
        name: `${n}-sinf`,
        display_order: n,
        is_active: 1,
      };
    });

    await db.from("grade_classes").insert(defaults).select();
  } catch {
    // Seed xatoligini jim o'tkazamiz; asosiy fetch baribir ishlaydi
  }
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
  // Agar grade_classes bo'sh bo'lsa, default sinflarni seed qilishga harakat qilamiz
  await seedDefaultGradeClassesIfEmpty();

  const res = await fetchGradeClasses();
  if (res.error) return { data: [], error: res.error };

  const all = res.data.map((c) => c.name).filter(Boolean);
  const active = res.data.filter((c) => isActiveLike(c.is_active)).map((c) => c.name);

  // 1) Aktiv sinflar bo'lsa – faqat aktivlarni qaytaramiz
  if (active.length > 0) {
    return { data: active, error: null };
  }

  // 2) Aks holda – hech bo'lmasa mavjud sinflarni ko'rsatamiz
  return { data: all, error: null };
}
