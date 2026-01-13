import { TrendingUp } from "lucide-react";
import { DetailScore } from "./types";
import { cn } from "@/lib/utils";

interface DetailScoresSectionProps {
  details: DetailScore[];
}

const getScoreEmoji = (score: number) => {
  if (score >= 4) return "💫";
  if (score >= 3) return "✨";
  if (score >= 2) return "💡";
  return "🌱";
};

const getScoreBarColor = (score: number) => {
  if (score >= 4) return "from-emerald-400 to-emerald-500";
  if (score >= 3) return "from-primary to-primary/70";
  if (score >= 2) return "from-amber-400 to-amber-500";
  return "from-rose-400 to-rose-500";
};

export const DetailScoresSection = ({ details }: DetailScoresSectionProps) => {
  if (!details || details.length === 0) return null;

  return (
    <section className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-foreground">궁합 세부 점수</h2>
      </div>

      <div className="grid gap-3">
        {details.map((detail, index) => (
          <div
            key={detail.label}
            className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.4 + index * 0.1}s`, animationFillMode: "forwards" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getScoreEmoji(detail.score)}</span>
                <span className="font-medium text-foreground">{detail.label}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      star <= detail.score
                        ? "bg-primary shadow-sm"
                        : "bg-secondary/50"
                    )}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-primary">{detail.score}/5</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-secondary/30">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                  getScoreBarColor(detail.score)
                )}
                style={{ width: `${(detail.score / 5) * 100}%` }}
              />
            </div>
            
            {detail.description && (
              <p className="text-sm text-foreground/70">{detail.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
