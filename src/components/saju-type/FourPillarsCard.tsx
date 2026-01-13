import { forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { FourPillars } from "@/lib/saju-calculator";
import { cn } from "@/lib/utils";

interface FourPillarsCardProps {
  pillars: FourPillars;
  userName?: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  "목": "from-green-500/20 to-emerald-600/20 border-green-500/50",
  "화": "from-red-500/20 to-orange-600/20 border-red-500/50",
  "토": "from-amber-500/20 to-yellow-600/20 border-amber-500/50",
  "금": "from-slate-400/20 to-zinc-500/20 border-slate-400/50",
  "수": "from-blue-500/20 to-cyan-600/20 border-blue-500/50",
};

const ELEMENT_TEXT_COLORS: Record<string, string> = {
  "목": "text-green-400",
  "화": "text-red-400",
  "토": "text-amber-400",
  "금": "text-slate-300",
  "수": "text-blue-400",
};

export const FourPillarsCard = forwardRef<HTMLDivElement, FourPillarsCardProps>(
  ({ pillars, userName }, ref) => {
    const pillarLabels = ["시주", "일주", "월주", "년주"];
    const pillarData = [pillars.hour, pillars.day, pillars.month, pillars.year];

    return (
      <div ref={ref} className="w-full max-w-[340px] mx-auto">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl p-5">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium mb-2">
              SAJU KING · 사주명식
            </div>
            {userName && (
              <h2 className="text-lg font-bold text-foreground">
                {userName}님의 사주
              </h2>
            )}
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-4 gap-2">
            {pillarData.map((pillar, index) => {
              if (!pillar) {
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-2">{pillarLabels[index]}</div>
                    <div className="w-full aspect-[3/4] rounded-lg bg-card/30 border border-border/30 flex items-center justify-center">
                      <span className="text-muted-foreground/50 text-xs">미입력</span>
                    </div>
                  </div>
                );
              }

              const elementColor = ELEMENT_COLORS[pillar.element] || "";
              const textColor = ELEMENT_TEXT_COLORS[pillar.element] || "text-foreground";

              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-2">{pillarLabels[index]}</div>
                  <div 
                    className={cn(
                      "w-full aspect-[3/4] rounded-lg border flex flex-col items-center justify-center gap-1 bg-gradient-to-br",
                      elementColor
                    )}
                  >
                    {/* 천간 */}
                    <div className="text-center">
                      <div className={cn("text-2xl font-bold", textColor)}>
                        {pillar.stemHanja}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pillar.stem}
                      </div>
                    </div>
                    
                    {/* 구분선 */}
                    <div className="w-6 h-px bg-border/50" />
                    
                    {/* 지지 */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground/90">
                        {pillar.branchHanja}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pillar.branch}
                      </div>
                    </div>
                  </div>
                  
                  {/* 오행 태그 */}
                  <div className={cn("text-xs mt-1.5 font-medium", textColor)}>
                    {pillar.element}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 일간 강조 */}
          <div className="mt-5 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <div className="text-xs text-muted-foreground mb-1">나를 상징하는 일간</div>
            <div className="flex items-center justify-center gap-2">
              <span className={cn("text-xl font-bold", ELEMENT_TEXT_COLORS[pillars.day.element])}>
                {pillars.day.stemHanja}
              </span>
              <span className="text-foreground/80">
                ({pillars.day.stem}{pillars.day.element})
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border/30 text-center">
            <div className="text-[10px] text-muted-foreground font-mono">
              saju-king.com
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

FourPillarsCard.displayName = "FourPillarsCard";
