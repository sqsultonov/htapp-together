import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

export function FileUpload({
  value,
  onChange,
  bucket,
  folder = "",
  accept = "image/*",
  maxSize = 5,
  placeholder = "Fayl tanlang yoki sudrab tashlang",
  className,
  showPreview = true,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve URL for display
  const resolveDisplayUrl = async (url: string | null) => {
    if (!url) {
      setResolvedUrl(null);
      return;
    }
    const resolved = await storage.resolveUrl(url);
    setResolvedUrl(resolved);
  };

  // Resolve URL when value changes
  useState(() => {
    resolveDisplayUrl(value ?? null);
  });

  const handleFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Fayl ${maxSize}MB dan katta bo'lmasligi kerak`);
      return;
    }

    setUploading(true);

    try {
      const result = await storage.upload(bucket, file, folder);

      if (result.error) {
        toast.error("Yuklashda xatolik: " + result.error);
        setUploading(false);
        return;
      }

      if (result.data) {
        onChange(result.data.path);
        await resolveDisplayUrl(result.data.path);
        toast.success("Fayl yuklandi");
      }
    } catch (err) {
      toast.error("Yuklashda xatolik");
      console.error(err);
    }
    
    setUploading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (value) {
      await storage.delete(value);
    }
    onChange(null);
    setResolvedUrl(null);
  };

  const displayUrl = resolvedUrl || value;

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {displayUrl && showPreview ? (
        <div className="relative group">
          {accept.includes("image") ? (
            <div className="relative h-32 rounded-lg overflow-hidden border bg-muted">
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  O'zgartirish
                </Button>
                <Button variant="destructive" size="sm" onClick={handleRemove}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted">
              <span className="flex-1 truncate text-sm">{value}</span>
              <Button variant="ghost" size="icon" onClick={handleRemove}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            uploading && "pointer-events-none opacity-50"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {accept.includes("image") ? (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground">
                Maksimum hajm: {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
