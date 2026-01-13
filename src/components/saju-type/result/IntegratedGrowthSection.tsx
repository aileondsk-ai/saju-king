import { Card } from "@/components/ui/card";
import { SajuAnalysisResult, MBTIAnalysisResult, IntegratedAnalysisResult } from "@/types/saju-type-analysis";
import { TrendingUp, Target, Lightbulb, Rocket } from "lucide-react";

interface IntegratedGrowthSectionProps {
  sajuWeaknesses: SajuAnalysisResult["weaknesses"];
  mbtiGrowth: MBTIAnalysisResult["growth_points"];
  integratedGrowth: IntegratedAnalysisResult["integrated_profile"]["growth_points"];
}

export function IntegratedGrowthSection({ sajuWeaknesses, mbtiGrowth, integratedGrowth }: IntegratedGrowthSectionProps) {
  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        통합 성장 로드맵
      </h2>

      {/* 통합 성장 포인트 (Prompt 3 - 가장 중요) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          통합 성장 포인트
        </h3>
        <div className="text-xs text-muted-foreground mb-3 p-2 rounded bg-primary/5">
          사주와 MBTI를 통합하여 도출된 핵심 성장 방향
        </div>
        <div className="space-y-3">
          {integratedGrowth.map((point, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
              <div className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {point.area}
              </div>
              <div className="flex items-start gap-2 text-sm text-primary p-3 rounded bg-primary/10">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{point.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 사주 기반 성장 포인트 (Prompt 1 - weaknesses) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">☯</span> 사주 기반 성장 방향
        </h3>
        <div className="space-y-2">
          {sajuWeaknesses.slice(0, 2).map((weakness, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="font-medium text-foreground text-sm mb-1">{weakness.trait}</div>
              <div className="flex items-start gap-2 text-xs text-green-400">
                <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{weakness.growth_tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MBTI 성장 포인트 (Prompt 2 - growth_points) */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          MBTI 성장 과제
        </h3>
        <div className="space-y-2">
          {mbtiGrowth.map((point, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="font-medium text-foreground text-sm mb-1">{point.area}</div>
              <div className="text-xs text-foreground/70 mb-2">
                도전: {point.challenge}
              </div>
              <div className="flex items-start gap-2 text-xs text-green-400">
                <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{point.growth_direction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
