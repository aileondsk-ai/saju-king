import { forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SajuType, getMBTIRelation } from "@/data/sajuTypes";
import { cn } from "@/lib/utils";

interface TypeCardProps {
  sajuType: SajuType;
  mbti: string | null;
  userName?: string;
}

export const TypeCard = forwardRef<HTMLDivElement, TypeCardProps>(({ sajuType, mbti, userName }, ref) => {
  const mbtiData = mbti ? getMBTIRelation(sajuType.ilgan, mbti) : null;

  return (
    <div ref={ref} className="w-full max-w-[320px] mx-auto bg-background p-1">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl">
        {/* Background Decorative overlay */}
        <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", sajuType.color)} />

        {/* Border Glow */}
        <div className="absolute inset-0 border border-border/50 rounded-xl" />

        <div className="relative z-10 p-6 flex flex-col items-center text-center space-y-6">

          {/* Header / Brand */}
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium">
            SAJU KING ANALYSIS
          </div>

          {/* Main Icon */}
          <div className="relative">
            <div className={cn("absolute inset-0 blur-2xl opacity-40 bg-gradient-to-br", sajuType.color)} />
            <div className="relative text-7xl filter drop-shadow-lg animate-in zoom-in duration-700">
              {sajuType.icon}
            </div>
          </div>

          {/* Type Name */}
          <div className="space-y-1">
            <div className="text-sm text-primary font-medium tracking-wide">
              {userName ? `${userName}님의 유형` : "나의 사주 유형"}
            </div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              {sajuType.name}
            </h2>
            <div className="text-sm text-muted-foreground font-serif">
              {sajuType.ilgan}({sajuType.ilganKo}) 일간
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap justify-center gap-2">
            {sajuType.keywords.map((kw) => (
              <Badge key={kw.label} variant="secondary" className="bg-card/50 hover:bg-card text-foreground/80 border-border">
                #{kw.label}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground/80 leading-relaxed px-2">
            "{sajuType.description}"
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* MBTI Section (Optional) */}
          {mbti && mbtiData ? (
            <div className="w-full bg-card/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xs text-primary font-bold">⚡ {mbti}와 만나면?</span>
              </div>
              <div className="text-sm text-foreground font-medium">"{mbtiData.message}"</div>
              <div className="text-xs text-muted-foreground mt-1">{mbtiData.relation}</div>
            </div>
          ) : (
            <div className="w-full py-2">
              <div className="text-xs text-muted-foreground">
                사주킹에서 더 자세한 분석을 받아보세요
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 text-[10px] text-muted-foreground font-mono">
            saju-king.com
          </div>
        </div>
      </Card>
    </div>
  );
});

TypeCard.displayName = "TypeCard";
