import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverallScoreCardProps {
  score: number;
  comment: string;
  person1Name: string;
  person2Name: string;
  relationType: string;
  relationLabel: string;
}

export const OverallScoreCard = ({
  score,
  comment,
  person1Name,
  person2Name,
  relationType,
  relationLabel,
}: OverallScoreCardProps) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "from-emerald-400 to-emerald-600";
    if (s >= 60) return "from-primary to-gold-dark";
    if (s >= 40) return "from-amber-400 to-amber-600";
    return "from-rose-400 to-rose-600";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return "환상의 궁합";
    if (s >= 80) return "최상의 궁합";
    if (s >= 70) return "좋은 궁합";
    if (s >= 60) return "무난한 궁합";
    if (s >= 50) return "보통 궁합";
    return "노력이 필요한 궁합";
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-b from-card via-card/95 to-secondary/20 p-6 shadow-lg backdrop-blur-sm">
      {/* Decorative Elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-lavender/10 blur-2xl" />
      
      {/* Relation Badge */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
          <Heart className="h-4 w-4 text-primary" fill="currentColor" />
          <span className="text-sm font-medium text-foreground">{relationLabel}</span>
        </div>
      </div>

      {/* Names */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender to-accent text-lg font-semibold text-foreground shadow-md">
          {person1Name[0]}
        </div>
        <div className="flex flex-col items-center">
          <Sparkles className="h-5 w-5 text-primary/60" />
          <div className="h-px w-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/40 to-gold-dark/40 text-lg font-semibold text-foreground shadow-md">
          {person2Name[0]}
        </div>
      </div>

      {/* Score Circle */}
      <div className="relative mx-auto mb-5 h-44 w-44">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="5"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.64} 264`}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(45, 80%, 65%)" />
              <stop offset="100%" stopColor="hsl(35, 80%, 55%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-gradient-gold font-serif text-5xl font-bold tracking-tight">
            {score}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">/ 100점</span>
        </div>
      </div>

      {/* Score Label */}
      <div className="mb-4 text-center">
        <span className={cn(
          "inline-block rounded-full bg-gradient-to-r px-4 py-1.5 text-sm font-semibold text-white shadow-sm",
          getScoreColor(score)
        )}>
          {getScoreLabel(score)}
        </span>
      </div>

      {/* Comment */}
      <p className="text-center font-serif text-base leading-relaxed text-foreground/90 whitespace-pre-line">
        {comment}
      </p>
    </div>
  );
};
