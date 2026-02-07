import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import mammoth from "mammoth/mammoth.browser";
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

function FileActions({ attachment }: { attachment: LessonAttachment }) {
  return (
    <div className="flex gap-1">
      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </a>
      <a href={attachment.url} download={attachment.name}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="w-4 h-4" />
        </Button>
      </a>
    </div>
  );
}

function FallbackFileCard({ attachment }: { attachment: LessonAttachment }) {
  const FileIcon = getFileIcon(attachment.type);
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <FileIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
      <FileActions attachment={attachment} />
    </div>
  );
}

function AttachmentHeader({ attachment, label }: { attachment: LessonAttachment; label?: string }) {
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
        <FileActions attachment={attachment} />
      </div>
    </div>
  );
}

export function AttachmentPreview({ attachment }: { attachment: LessonAttachment }) {
  const nameLower = attachment.name.toLowerCase();
  const typeLower = (attachment.type || "").toLowerCase();

  const kind = useMemo(() => {
    if (typeLower.startsWith("image/") || nameLower.match(/\.(png|jpe?g|gif|webp|svg)$/)) return "image";
    if (typeLower.includes("pdf") || nameLower.endsWith(".pdf")) return "pdf";
    if (
      typeLower === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      nameLower.endsWith(".docx")
    )
      return "docx";
    // DOC (legacy Word) - show Google Docs Viewer preview
    if (typeLower === "application/msword" || nameLower.endsWith(".doc")) return "doc";
    // RTF - show Google Docs Viewer preview
    if (typeLower === "application/rtf" || typeLower === "text/rtf" || nameLower.endsWith(".rtf")) return "rtf";
    if (typeLower.startsWith("text/") || nameLower.endsWith(".txt")) return "text";
    if (typeLower.startsWith("audio/")) return "audio";
    if (typeLower.startsWith("video/")) return "video";
    return "file";
  }, [nameLower, typeLower]);

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

        const res = await fetch(attachment.url);
        if (!res.ok) throw new Error("Faylni yuklab bo'lmadi");
        const arrayBuffer = await res.arrayBuffer();

        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        const safeHtml = DOMPurify.sanitize(value, { USE_PROFILES: { html: true } });

        docxHtmlCache.set(attachment.url, safeHtml);
        if (!cancelled) setDocxHtml(safeHtml);
      } catch (e) {
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
  }, [attachment.url, kind]);

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

        const res = await fetch(attachment.url);
        if (!res.ok) throw new Error("Faylni yuklab bo'lmadi");
        const text = await res.text();

        textCache.set(attachment.url, text);
        if (!cancelled) setTextContent(text);
      } catch (e) {
        if (!cancelled) setTextError("Matn faylini ko'rsatib bo'lmadi.");
      } finally {
        if (!cancelled) setTextLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachment.url, kind]);

  if (kind === "image") {
    return (
      <div className="space-y-2">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-full rounded-lg border"
          loading="lazy"
        />
        <AttachmentHeader attachment={attachment} label="Rasm" />
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} label="PDF" />
        <iframe
          title={attachment.name}
          src={attachment.url}
          className="w-full h-[70vh] rounded-lg border bg-background"
          loading="lazy"
        />
      </div>
    );
  }

  if (kind === "docx") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} label="DOCX" />
        <div className="rounded-lg border bg-background p-4">
          {docxLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Hujjat yuklanmoqda...
            </div>
          ) : docxError ? (
            <div className="text-sm text-muted-foreground">{docxError}</div>
          ) : docxHtml ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Ko'rsatish uchun ma'lumot yo'q.</div>
          )}
        </div>
      </div>
    );
  }

  // DOC / RTF via Google Docs Viewer
  if (kind === "doc" || kind === "rtf") {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(attachment.url)}&embedded=true`;
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} label={kind.toUpperCase()} />
        <iframe
          title={attachment.name}
          src={viewerUrl}
          className="w-full h-[70vh] rounded-lg border bg-background"
          loading="lazy"
        />
      </div>
    );
  }

  if (kind === "text") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} label="TXT" />
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
        <AttachmentHeader attachment={attachment} label="Audio" />
        <audio controls className="w-full">
          <source src={attachment.url} />
        </audio>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="space-y-2">
        <AttachmentHeader attachment={attachment} label="Video" />
        <video controls className="w-full rounded-lg border bg-background">
          <source src={attachment.url} />
        </video>
      </div>
    );
  }

  return <FallbackFileCard attachment={attachment} />;
}
