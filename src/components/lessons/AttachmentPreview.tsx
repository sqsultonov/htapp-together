import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import mammoth from "mammoth/mammoth.browser";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Image as ImageIcon, File, Download, ExternalLink, Loader2 } from "lucide-react";

export interface LessonAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

const docxHtmlCache = new Map<string, string>();
const textCache = new Map<string, string>();

const getIsElectron = () => {
  if (typeof window === "undefined") return false;
  return !!(window as any).electronAPI?.isElectron;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function FileActions({ hrefUrl, fileName }: { hrefUrl: string; fileName: string }) {
  return (
    <div className="flex gap-1">
      <a href={hrefUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </a>
      <a href={hrefUrl} download={fileName}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="w-4 h-4" />
        </Button>
      </a>
    </div>
  );
}

function FallbackFileCard({ attachment, hrefUrl }: { attachment: LessonAttachment; hrefUrl: string }) {
  const FileIcon = getFileIcon(attachment.type);
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <FileIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
      <FileActions hrefUrl={hrefUrl} fileName={attachment.name} />
    </div>
  );
}

function AttachmentHeader({
  attachment,
  label,
  hrefUrl,
}: {
  attachment: LessonAttachment;
  label?: string;
  hrefUrl: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
      <div className="flex items-center gap-2">
        {label ? (
          <Badge variant="secondary" className="text-xs">
            {label}
          </Badge>
        ) : null}
        <FileActions hrefUrl={hrefUrl} fileName={attachment.name} />
      </div>
    </div>
  );
}

export function AttachmentPreview({ attachment }: { attachment: LessonAttachment }) {
  const nameLower = attachment.name.toLowerCase();
  const typeLower = (attachment.type || "").toLowerCase();
  const isElectron = getIsElectron();

  const kind = useMemo(() => {
    if (typeLower.startsWith("image/") || nameLower.match(/\.(png|jpe?g|gif|webp|svg)$/)) return "image";
    if (typeLower.includes("pdf") || nameLower.endsWith(".pdf")) return "pdf";
    if (
      typeLower === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      nameLower.endsWith(".docx")
    )
      return "docx";
    // DOC/RTF: offlayn preview yo'q (oldin Google Docs viewer ishlatilgan)
    if (typeLower === "application/msword" || nameLower.endsWith(".doc")) return "doc";
    if (typeLower === "application/rtf" || typeLower === "text/rtf" || nameLower.endsWith(".rtf")) return "rtf";
    if (typeLower.startsWith("text/") || nameLower.endsWith(".txt")) return "text";
    if (typeLower.startsWith("audio/")) return "audio";
    if (typeLower.startsWith("video/")) return "video";
    return "file";
  }, [nameLower, typeLower]);

  const [resolvedUrl, setResolvedUrl] = useState(attachment.url);

  // local-file:// → file:// (Electron) resolve
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isElectron) {
        setResolvedUrl(attachment.url);
        return;
      }

      try {
        const url = await storage.resolveUrl(attachment.url);
        if (!cancelled) setResolvedUrl(url || attachment.url);
      } catch {
        if (!cancelled) setResolvedUrl(attachment.url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachment.url, isElectron]);

  // DOCX preview
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);

  useEffect(() => {
    if (kind !== "docx") return;

    const cached = docxHtmlCache.get(attachment.url);
    if (cached) {
      setDocxHtml(cached);
      setDocxError(null);
      setDocxLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setDocxLoading(true);
        setDocxError(null);
        setDocxHtml(null);

        let arrayBuffer: ArrayBuffer;

        if (isElectron && attachment.url.startsWith("local-file://")) {
          const { data, error } = await storage.read("lesson-attachments", attachment.url);
          if (error || !data) throw new Error(error || "Faylni o'qib bo'lmadi");
          arrayBuffer = base64ToUint8Array(data.base64).buffer;
        } else {
          const res = await fetch(resolvedUrl);
          if (!res.ok) throw new Error("Faylni yuklab bo'lmadi");
          arrayBuffer = await res.arrayBuffer();
        }

        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        const safeHtml = DOMPurify.sanitize(value, { USE_PROFILES: { html: true } });

        docxHtmlCache.set(attachment.url, safeHtml);
        if (!cancelled) setDocxHtml(safeHtml);
      } catch {
        if (!cancelled) {
          setDocxError("DOCX preview ishlamadi. Faylni ochib ko'rish yoki yuklab olish mumkin.");
        }
      } finally {
        if (!cancelled) setDocxLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachment.url, kind, isElectron, resolvedUrl]);

  // TEXT preview
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "text") return;

    const cached = textCache.get(attachment.url);
    if (cached) {
      setTextContent(cached);
      setTextError(null);
      setTextLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setTextLoading(true);
        setTextError(null);
        setTextContent(null);

        let text: string;

        if (isElectron && attachment.url.startsWith("local-file://")) {
          const { data, error } = await storage.read("lesson-attachments", attachment.url);
          if (error || !data) throw new Error(error || "Faylni o'qib bo'lmadi");
          const bytes = base64ToUint8Array(data.base64);
          text = new TextDecoder("utf-8").decode(bytes);
        } else {
          const res = await fetch(resolvedUrl);
          if (!res.ok) throw new Error("Faylni yuklab bo'lmadi");
          text = await res.text();
        }

        textCache.set(attachment.url, text);
        if (!cancelled) setTextContent(text);
      } catch {
        if (!cancelled) setTextError("Matn faylini ko'rsatib bo'lmadi.");
      } finally {
        if (!cancelled) setTextLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachment.url, kind, isElectron, resolvedUrl]);

  if (kind === "image") {
    return (
      <div className="space-y-2">
        <img src={resolvedUrl} alt={attachment.name} className="max-w-full rounded-lg border" loading="lazy" />
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label="Rasm" />
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label="PDF" />
        <iframe
          title={attachment.name}
          src={resolvedUrl}
          className="w-full h-[70vh] rounded-lg border bg-background"
          loading="lazy"
        />
      </div>
    );
  }

  if (kind === "docx") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label="DOCX" />
        <div className="rounded-lg border bg-background p-4">
          {docxLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Hujjat yuklanmoqda...
            </div>
          ) : docxError ? (
            <div className="text-sm text-muted-foreground">{docxError}</div>
          ) : docxHtml ? (
            <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: docxHtml }} />
          ) : (
            <div className="text-sm text-muted-foreground">Ko'rsatish uchun ma'lumot yo'q.</div>
          )}
        </div>
      </div>
    );
  }

  // DOC / RTF: internet preview olib tashlandi (offlayn rejim)
  if (kind === "doc" || kind === "rtf") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label={kind.toUpperCase()} />
        <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
          {kind.toUpperCase()} preview offlayn rejimda mavjud emas. Faylni "Ochish" orqali tashqi dasturda ko'ring yoki yuklab oling.
        </div>
      </div>
    );
  }

  if (kind === "text") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label="TXT" />
        <div className="rounded-lg border bg-background p-4">
          {textLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fayl yuklanmoqda...
            </div>
          ) : textError ? (
            <div className="text-sm text-muted-foreground">{textError}</div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{textContent}</pre>
          )}
        </div>
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label="Audio" />
        <audio controls className="w-full">
          <source src={resolvedUrl} />
        </audio>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} hrefUrl={resolvedUrl} label="Video" />
        <video controls className="w-full rounded-lg border bg-background">
          <source src={resolvedUrl} />
        </video>
      </div>
    );
  }

  return <FallbackFileCard attachment={attachment} hrefUrl={resolvedUrl} />;
}

