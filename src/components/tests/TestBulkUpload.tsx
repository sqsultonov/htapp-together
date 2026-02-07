import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MultiClassSelect } from "@/components/ui/multi-class-select";
import { db } from "@/lib/database";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";

interface ParsedQuestion {
  question: string;
  options: string[];
  answer: string;
  valid: boolean;
  error?: string;
}

interface TestBulkUploadProps {
  instructorId?: string;
  availableClasses: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

// Column name patterns for auto-detection (supports multiple languages)
const QUESTION_PATTERNS = ["savol", "question", "№", "no", "savollar"];
const OPTION_PATTERNS = ["variant", "option", "javob", "a", "b", "c", "d", "e"];
const ANSWER_PATTERNS = ["to'g'ri javob", "javob", "answer", "correct", "to'g'ri"];

export function TestBulkUpload({ instructorId, availableClasses, onSuccess, onCancel }: TestBulkUploadProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectColumnType = (header: string): "question" | "option" | "answer" | null => {
    const normalizedHeader = header.toLowerCase().trim();
    
    if (QUESTION_PATTERNS.some(p => normalizedHeader.includes(p))) return "question";
    if (ANSWER_PATTERNS.some(p => normalizedHeader.includes(p))) return "answer";
    if (OPTION_PATTERNS.some(p => normalizedHeader.includes(p) || normalizedHeader === p)) return "option";
    
    return null;
  };

  const parseExcelFile = async (file: File) => {
    setParsing(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length < 2) {
        toast.error("Faylda yetarli ma'lumot yo'q");
        setParsing(false);
        return;
      }

      const headers = jsonData[0].map(h => String(h || ""));
      
      // Auto-detect columns
      let questionColIndex = -1;
      let answerColIndex = -1;
      const optionColIndices: number[] = [];

      headers.forEach((header, index) => {
        const type = detectColumnType(header);
        if (type === "question" && questionColIndex === -1) {
          questionColIndex = index;
        } else if (type === "answer" && answerColIndex === -1) {
          answerColIndex = index;
        } else if (type === "option") {
          optionColIndices.push(index);
        }
      });

      // If no option columns found, look for columns after question column
      if (optionColIndices.length === 0 && questionColIndex !== -1) {
        for (let i = questionColIndex + 1; i < headers.length; i++) {
          if (i !== answerColIndex) {
            optionColIndices.push(i);
          }
        }
      }

      if (questionColIndex === -1) {
        toast.error("Savol ustunini topa olmadim. Birinchi ustun 'Savol' deb nomlangan bo'lishi kerak.");
        setParsing(false);
        return;
      }

      if (answerColIndex === -1) {
        toast.error("Javob ustunini topa olmadim. 'To'g'ri javob' yoki 'Javob' ustuni bo'lishi kerak.");
        setParsing(false);
        return;
      }

      if (optionColIndices.length < 2) {
        toast.error("Kamida 2 ta variant ustuni bo'lishi kerak.");
        setParsing(false);
        return;
      }

      // Parse questions
      const questions: ParsedQuestion[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const question = String(row[questionColIndex] || "").trim();
        const answer = String(row[answerColIndex] || "").trim().toUpperCase();
        const options = optionColIndices.map(idx => String(row[idx] || "").trim()).filter(o => o);

        if (!question) continue;

        // Validate answer
        let valid = true;
        let error = "";

        if (options.length < 2) {
          valid = false;
          error = "Kamida 2 ta variant bo'lishi kerak";
        } else if (!answer) {
          valid = false;
          error = "To'g'ri javob ko'rsatilmagan";
        } else {
          // Check if answer is a letter (A, B, C, D...) or exact match
          const answerLetterIndex = answer.charCodeAt(0) - 65; // A=0, B=1, C=2...
          if (answerLetterIndex >= 0 && answerLetterIndex < options.length) {
            // Valid letter answer
          } else if (!options.some(o => o.toUpperCase() === answer)) {
            valid = false;
            error = `Javob "${answer}" variantlarda topilmadi`;
          }
        }

        questions.push({
          question,
          options,
          answer,
          valid,
          error,
        });
      }

      if (questions.length === 0) {
        toast.error("Faylda hech qanday savol topilmadi");
        setParsing(false);
        return;
      }

      setParsedQuestions(questions);
      toast.success(`${questions.length} ta savol topildi`);
    } catch (error) {
      console.error("Excel parse error:", error);
      toast.error("Faylni o'qishda xatolik yuz berdi");
    }

    setParsing(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      toast.error("Faqat Excel (.xlsx, .xls) yoki CSV fayllarni yuklang");
      return;
    }

    parseExcelFile(file);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Test nomini kiriting");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("Kamida bitta sinfni tanlang");
      return;
    }

    const validQuestions = parsedQuestions.filter(q => q.valid);
    if (validQuestions.length === 0) {
      toast.error("Kamida bitta to'g'ri savol bo'lishi kerak");
      return;
    }

    setSaving(true);

    try {
      // Create a test for each selected class
      for (const className of selectedClasses) {
        const { data: testData, error: testError } = await db
          .from("tests")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            class_name: className,
            time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
            instructor_id: instructorId || null,
            question_count: validQuestions.length,
          })
          .select()
          .single();

        if (testError || !testData) {
          toast.error(`${className} uchun test yaratishda xatolik`);
          continue;
        }

        // Create questions
        const questionsToInsert = validQuestions.map((q, index) => {
          let correctAnswer = q.answer;
          const answerLetterIndex = q.answer.charCodeAt(0) - 65;
          if (answerLetterIndex >= 0 && answerLetterIndex < q.options.length) {
            correctAnswer = q.options[answerLetterIndex];
          }

          return {
            test_id: (testData as any).id,
            question_text: q.question,
            options: q.options,
            correct_answer: correctAnswer,
            order_index: index,
            points: 1,
          };
        });

        await db.from("questions").insert(questionsToInsert);
      }

      toast.success(`Test ${selectedClasses.length} ta sinfga ${validQuestions.length} ta savol bilan yaratildi`);
      onSuccess();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Saqlashda xatolik yuz berdi");
    }

    setSaving(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Savol", "A variant", "B variant", "C variant", "D variant", "To'g'ri javob"],
      ["Quyidagilardan qaysi biri to'g'ri?", "1+1=2", "1+1=3", "1+1=4", "1+1=5", "A"],
      ["Poytaxtimiz qayer?", "Samarqand", "Buxoro", "Toshkent", "Andijon", "C"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test");
    XLSX.writeFile(wb, "test-shablon.xlsx");
    toast.success("Shablon yuklandi");
  };

  const validCount = parsedQuestions.filter(q => q.valid).length;
  const invalidCount = parsedQuestions.filter(q => !q.valid).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sinflar * (bir yoki bir nechta)</Label>
          <MultiClassSelect
            availableClasses={availableClasses}
            selectedClasses={selectedClasses}
            onChange={setSelectedClasses}
            placeholder="Sinflarni tanlang"
          />
        </div>
        <div className="space-y-2">
          <Label>Vaqt chegarasi (daqiqa)</Label>
          <Input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Test nomi *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test nomini kiriting"
        />
      </div>

      <div className="space-y-2">
        <Label>Tavsif (ixtiyoriy)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Test tavsifi"
          rows={2}
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Excel fayl orqali savollarni yuklang</Label>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Shablon
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            {parsing ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {parsing ? "Tahlil qilinmoqda..." : fileName || "Excel faylni yuklash uchun bosing"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .xlsx, .xls yoki .csv formatida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-detect info */}
      <Card className="bg-muted/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Avtomatik aniqlash
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 text-sm text-muted-foreground">
          <p>Excel ustunlari avtomatik aniqlanadi:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Savol</strong> - "Savol", "Question", "№" yoki birinchi ustun</li>
            <li><strong>Variantlar</strong> - "A", "B", "C", "D" yoki "Variant" so'zi</li>
            <li><strong>Javob</strong> - "To'g'ri javob", "Javob" yoki "Answer"</li>
          </ul>
        </CardContent>
      </Card>

      {/* Parsed Questions Preview */}
      {parsedQuestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Topilgan savollar</Label>
            <div className="flex gap-2">
              {validCount > 0 && (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {validCount} to'g'ri
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  {invalidCount} xato
                </Badge>
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Savol</TableHead>
                  <TableHead className="w-24">Variantlar</TableHead>
                  <TableHead className="w-16">Javob</TableHead>
                  <TableHead className="w-16">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedQuestions.map((q, i) => (
                  <TableRow key={i} className={!q.valid ? "bg-destructive/10" : ""}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="max-w-xs truncate">{q.question}</TableCell>
                    <TableCell>{q.options.length} ta</TableCell>
                    <TableCell>{q.answer}</TableCell>
                    <TableCell>
                      {q.valid ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <span className="text-xs text-destructive">{q.error}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button onClick={handleSave} disabled={saving || validCount === 0}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Saqlash ({validCount} savol)
        </Button>
      </div>
    </div>
  );
}
