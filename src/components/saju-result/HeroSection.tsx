import { Sparkles, TrendingUp, Calendar } from "lucide-react";
import type { SaeunData } from "@/lib/saju-result-normalizer";

interface HeroSectionProps {
  userName: string;
  birthInfo: string;
  yearKeyword?: string;
  overallScore?: number;
  dayMasterElement?: string;
  structureType?: string;
  saeun?: SaeunData;
}

export const HeroSection = ({
  userName,
  birthInfo,
  yearKeyword,
  overallScore,
  dayMasterElement,
  structureType,
  saeun,
}: HeroSectionProps) => {
  const scoreLabel = overallScore 
    ? overallScore >= 8 ? "매우 좋음" 
    : overallScore >= 6 ? "좋음" 
    : overallScore >= 4 ? "보통" 
    : "주의 필요"
    : null;

  return (
    <section className="relative z-10 px-5 py-6">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-accent/10 p-6 shadow-lg backdrop-blur-sm">
        {/* 핵심 정보 */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {userName}님의 사주
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{birthInfo}</p>
          </div>
          {overallScore && (
            <div className="flex flex-col items-center rounded-2xl border border-primary/30 bg-primary/20 px-4 py-2">
              <span className="text-xs text-primary">{saeun?.year || 2026}년 운세</span>
              <span className="font-serif text-2xl font-bold text-primary">{overallScore}</span>
              <span className="text-xs text-primary/80">{scoreLabel}</span>
            </div>
          )}
        </div>

        {/* 핵심 키워드 */}
        <div className="flex flex-wrap gap-2">
          {dayMasterElement && (
            <span className="rounded-full border border-border/30 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground">
              <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
              {dayMasterElement}
            </span>
          )}
          {structureType && (
            <span className="rounded-full border border-border/30 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground">
              {structureType}
            </span>
          )}
          {saeun && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-foreground">
              <Calendar className="mr-1 inline h-3 w-3 text-accent" />
              {saeun.year}년 {saeun.stemHanja}{saeun.branchHanja} ({saeun.stem}{saeun.branch})
            </span>
          )}
          {yearKeyword && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              {yearKeyword}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
