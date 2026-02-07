import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  Medal,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResultsProps {
  score: number;
  maxScore: number;
  percentage: number;
  onClose: () => void;
}

export function TestResults({
  score,
  maxScore,
  percentage,
  onClose,
}: TestResultsProps) {
  // Determine result level
  const getResultLevel = () => {
    if (percentage >= 90)
      return {
        icon: Trophy,
        title: "A'lo!",
        subtitle: "Siz ajoyib natija ko'rsatdingiz!",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
      };
    if (percentage >= 70)
      return {
        icon: Star,
        title: "Yaxshi!",
        subtitle: "Davom eting, zo'r natija!",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
      };
    if (percentage >= 50)
      return {
        icon: Medal,
        title: "Qoniqarli",
        subtitle: "Yana biroz harakat qiling",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
      };
    return {
      icon: RotateCcw,
      title: "Qayta urinib ko'ring",
      subtitle: "Mavzuni takrorlashni tavsiya etamiz",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
    };
  };

  const result = getResultLevel();
  const ResultIcon = result.icon;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
        {/* Decorative Header */}
        <div
          className={cn(
            "py-12 px-6 text-center relative overflow-hidden",
            result.bgColor
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-current" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-current" />
          </div>

          <div className="relative z-10 space-y-4">
            <div
              className={cn(
                "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
                "bg-background shadow-lg"
              )}
            >
              <ResultIcon className={cn("w-10 h-10", result.color)} />
            </div>

            <div>
              <h1 className={cn("text-3xl font-bold", result.color)}>
                {result.title}
              </h1>
              <p className="text-muted-foreground mt-1">{result.subtitle}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-5xl font-bold tracking-tight">
              {percentage}
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <p className="text-muted-foreground mt-1">
              {score} / {maxScore} ball
            </p>
          </div>

          {/* Progress Visualization */}
          <div className="space-y-2">
            <Progress value={percentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {score}
              </p>
              <p className="text-xs text-muted-foreground">To'g'ri</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {maxScore - score}
              </p>
              <p className="text-xs text-muted-foreground">Noto'g'ri</p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="p-4 rounded-xl bg-muted text-center">
            <p className="text-sm">
              {percentage >= 70
                ? "Sizning bilimingiz mustahkam! Davom eting va yangi cho'qqilarni zabt eting!"
                : "Har bir urinish sizni maqsadga yaqinlashtiradi. Mavzularni takrorlab, qayta sinab ko'ring!"}
            </p>
          </div>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full gap-2" size="lg">
            Testlarga qaytish
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
