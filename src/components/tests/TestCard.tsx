import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Test {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_at: string;
  grade: number | null;
  question_count: number;
}

interface TestCardProps {
  test: Test;
  index: number;
  onStart: (test: Test) => void;
}

export function TestCard({ test, index, onStart }: TestCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        "border-0 shadow-card"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge 
            variant="default" 
            className="bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Faol
          </Badge>
        </div>
        <CardTitle className="group-hover:text-primary transition-colors line-clamp-2 mt-2">
          {test.title}
        </CardTitle>
        {test.description && (
          <CardDescription className="line-clamp-2">
            {test.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {test.time_limit_minutes && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>{test.time_limit_minutes} daqiqa</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{test.question_count || 0} savol</span>
          </div>
        </div>
        
        <Button 
          className="w-full group/btn" 
          size="lg" 
          onClick={() => onStart(test)}
        >
          <Play className="w-4 h-4 mr-2 transition-transform group-hover/btn:scale-110" />
          Testni boshlash
        </Button>
      </CardContent>
    </Card>
  );
}
