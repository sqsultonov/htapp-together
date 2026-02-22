/**
 * Grafik test tizimi - yordamchi funksiyalar va tiplar
 * 
 * Bank: Admin rasm + matn juftliklarini kiritadi
 * Generator: Avtomatik test yaratadi (yarmi rasm→matn, yarmi matn→rasm)
 */

export interface GraphicTestBankItem {
  id: string;
  image_data: string; // base64 data URL yoki local-file:// path
  text_label: string; // rasmning matndagi ifodalanishi
  category: string; // kategoriya (masalan: "Bayroqlar", "Hayvonlar")
  class_name: string; // qaysi sinf uchun
  created_by: string; // admin yoki instructor id
  created_at: string;
}

export interface GraphicTestConfig {
  id: string;
  title: string;
  class_name: string;
  category: string; // qaysi kategoriyadan test
  total_questions: number; // umumiy savollar soni
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface GeneratedGraphicQuestion {
  id: string;
  type: 'image_to_text' | 'text_to_image'; // savol turi
  question_content: string; // rasm URL yoki matn
  options: string[]; // variantlar (matn yoki rasm URL)
  correct_answer: string; // to'g'ri javob
  bank_item_id: string; // asl bank element id
  points: number;
}

/**
 * Bank elementlaridan random test generatsiya qilish
 * 
 * @param bankItems - barcha bank elementlari (bitta kategoriya/sinf uchun)
 * @param totalQuestions - umumiy savollar soni
 * @returns generatsiya qilingan savollar
 */
export function generateGraphicTest(
  bankItems: GraphicTestBankItem[],
  totalQuestions: number
): GeneratedGraphicQuestion[] {
  if (bankItems.length < 4) {
    // Kamida 4 ta element kerak (1 to'g'ri + 3 noto'g'ri variant)
    return [];
  }

  // Random aralshtirish
  const shuffled = [...bankItems].sort(() => Math.random() - 0.5);

  // Savollar sonini cheklash
  const count = Math.min(totalQuestions, shuffled.length);

  // Yarmi rasm→matn, yarmi matn→rasm
  const halfCount = Math.ceil(count / 2);
  const questions: GeneratedGraphicQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const item = shuffled[i];
    const isImageToText = i < halfCount;

    // 3 ta noto'g'ri variant tanlash (boshqa elementlardan)
    const wrongItems = bankItems
      .filter((b) => b.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    if (wrongItems.length < 3) continue;

    if (isImageToText) {
      // Savol: RASM → Javoblar: MATN
      const correctAnswer = item.text_label;
      const options = [
        correctAnswer,
        ...wrongItems.map((w) => w.text_label),
      ].sort(() => Math.random() - 0.5);

      questions.push({
        id: crypto.randomUUID(),
        type: 'image_to_text',
        question_content: item.image_data,
        options,
        correct_answer: correctAnswer,
        bank_item_id: item.id,
        points: 1,
      });
    } else {
      // Savol: MATN → Javoblar: RASM
      const correctAnswer = item.image_data;
      const options = [
        correctAnswer,
        ...wrongItems.map((w) => w.image_data),
      ].sort(() => Math.random() - 0.5);

      questions.push({
        id: crypto.randomUUID(),
        type: 'text_to_image',
        question_content: item.text_label,
        options,
        correct_answer: correctAnswer,
        bank_item_id: item.id,
        points: 1,
      });
    }
  }

  return questions;
}

/**
 * Fayl/rasm ni base64 data URL ga aylantirish (brauzer uchun universal)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

/**
 * String rasmmi yoki yo'qligini tekshirish
 */
export function isImageString(str: string): boolean {
  if (!str) return false;
  const lower = str.toLowerCase();
  return (
    lower.startsWith('data:image/') ||
    lower.startsWith('local-file://') ||
    lower.startsWith('file://') ||
    /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(lower)
  );
}
