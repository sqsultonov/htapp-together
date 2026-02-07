import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttachmentPreview, type LessonAttachment } from "@/components/lessons/AttachmentPreview";

type Attachment = LessonAttachment;

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    content: string;
    attachments?: Attachment[] | null;
    created_at: string;
    order_index: number;
  };
}

export function LessonViewer({ lesson }: LessonViewerProps) {
  const attachments = (lesson.attachments as Attachment[]) || [];

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant="secondary">
            Dars {lesson.order_index + 1}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(lesson.created_at).toLocaleDateString("uz-UZ")}
          </span>
        </div>
        <CardTitle className="text-xl">{lesson.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lesson Content */}
        {lesson.content && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{lesson.content}</p>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Qo'shimcha materiallar</h4>
            <div className="grid gap-4">
              {attachments.map((attachment, index) => (
                <AttachmentPreview key={index} attachment={attachment} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
