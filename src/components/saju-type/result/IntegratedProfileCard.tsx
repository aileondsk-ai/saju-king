import { forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegratedAnalysisResult } from "@/types/saju-type-analysis";
import { cn } from "@/lib/utils";

interface IntegratedProfileCardProps {
  profile: IntegratedAnalysisResult["integrated_profile"];
  cardContents: IntegratedAnalysisResult["card_contents"];
  mbti: string;
  dayMasterName: string;
}

export const IntegratedProfileCard = forwardRef<HTMLDivElement, IntegratedProfileCardProps>(
  ({ profile, cardContents, mbti, dayMasterName }, ref) => {
    return (
      <div ref={ref} className="w-full max-w-[360px] mx-auto">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-card to-secondary/10 shadow-2xl">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />

          <div className="relative z-10 p-6 flex flex-col items-center text-center space-y-5">
            {/* Header */}
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium">
              SAJU × MBTI ANALYSIS
            </div>

            {/* Emoji & Type Name */}
            <div className="space-y-2">
              <div className="text-6xl animate-in zoom-in duration-500">
                {profile.emoji}
              </div>
              <div className="text-xs text-muted-foreground">
                {dayMasterName} × {mbti}
              </div>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {profile.type_name}
              </h2>
            </div>

            {/* Core Sentence */}
            <div className="px-4 py-3 rounded-lg bg-card/50 border border-border/30">
              <p className="text-sm font-medium text-primary">
                "{profile.core_sentence}"
              </p>
            </div>

            {/* Hashtags */}
            <div className="flex flex-wrap justify-center gap-2">
              {cardContents.main_card.hashtags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="bg-primary/20 text-foreground/90 text-xs"
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-foreground/80 leading-relaxed px-2">
              {profile.description}
            </p>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Strengths */}
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-2">핵심 강점</div>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.strengths.map((s, idx) => (
                  <Badge key={idx} className="bg-green-500/20 text-green-400 border-green-500/30">
                    {s.hashtag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 2026 Fortune */}
            <div className="w-full p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">2026년 키워드</div>
              <div className="text-lg font-bold text-primary mb-1">
                "{cardContents.fortune_card.keyword}"
              </div>
              <div className="text-sm text-foreground/80">
                {cardContents.fortune_card.message}
              </div>
              <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>🗓️ {cardContents.fortune_card.lucky_month}</span>
                <span>🎨 {cardContents.fortune_card.lucky_color}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 text-[10px] text-muted-foreground font-mono">
              saju-king.com
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

IntegratedProfileCard.displayName = "IntegratedProfileCard";
