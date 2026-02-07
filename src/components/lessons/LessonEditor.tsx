import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiClassSelect } from "@/components/ui/multi-class-select";
import { db } from "@/lib/database";
import { storage } from "@/lib/storage";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Loader2,
} from "lucide-react";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface LessonEditorProps {
  instructorId?: string;
  availableClasses: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export function LessonEditor({ instructorId, availableClasses, onSuccess, onCancel }: LessonEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Be more permissive with file types - only check size
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: Fayl 50MB dan katta`);
        continue;
      }

      try {
        const result = await storage.upload("lesson-attachments", file, "lessons");

        if (result.error) {
          toast.error(`${file.name}: Yuklashda xatolik`);
          continue;
        }

        if (result.data) {
          newAttachments.push({
            name: file.name,
            url: result.data.path,
            type: file.type || "application/octet-stream",
            size: file.size,
          });
        }
      } catch (err) {
        toast.error(`${file.name}: Yuklashda xatolik`);
        console.error(err);
      }
    }

    setAttachments([...attachments, ...newAttachments]);
    setUploading(false);

    if (newAttachments.length > 0) {
      toast.success(`${newAttachments.length} ta fayl yuklandi`);
    }
  };

  const removeAttachment = async (index: number) => {
    const attachment = attachments[index];
    if (attachment) {
      await storage.delete(attachment.url);
    }
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Mavzu nomini kiriting");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("Kamida bitta sinfni tanlang");
      return;
    }

    if (!content.trim() && attachments.length === 0) {
      toast.error("Mavzu matnini kiriting yoki fayl yuklang");
      return;
    }

    setSaving(true);

    try {
      // Insert a lesson for each selected class
      const lessonsToInsert = selectedClasses.map((className) => ({
        title: title.trim(),
        content: content.trim() || " ",
        class_name: className,
        instructor_id: instructorId || null,
        attachments: attachments as unknown as never,
      }));

      const { error } = await db.from("lessons").insert(lessonsToInsert);

      if (error) {
        console.error("Lesson insert error:", error);
        toast.error("Mavzu saqlashda xatolik: " + error);
        return;
      }

      toast.success(`Mavzu ${selectedClasses.length} ta sinfga muvaffaqiyatli qo'shildi`);
      onSuccess();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Kutilmagan xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

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
          <Label>Mavzu nomi *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mavzu nomini kiriting"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mavzu matni</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mavzu matnini kiriting (ixtiyoriy agar fayl yuklasangiz)"
          rows={8}
        />
      </div>

      {/* File Upload Area */}
      <div className="space-y-2">
        <Label>Qo'shimcha fayllar (barcha formatlar qo'llab-quvvatlanadi)</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {uploading ? "Yuklanmoqda..." : "Fayllarni yuklash uchun bosing yoki sudrab tashlang"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Barcha formatlar qo'llab-quvvatlanadi (max 50MB)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label>Yuklangan fayllar</Label>
          <div className="space-y-2">
            {attachments.map((attachment, index) => {
              const FileIcon = getFileIcon(attachment.type);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {attachment.type.split("/")[1]?.toUpperCase() || "FILE"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Saqlash
        </Button>
      </div>
    </div>
  );
}
