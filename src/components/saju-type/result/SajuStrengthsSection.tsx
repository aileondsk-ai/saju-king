import { Card } from "@/components/ui/card";
import { SajuAnalysisResult } from "@/types/saju-type-analysis";
import { TrendingUp, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";

interface SajuStrengthsSectionProps {
  strengths: SajuAnalysisResult["strengths"];
  weaknesses: SajuAnalysisResult["weaknesses"];
}

export function SajuStrengthsSection({ strengths, weaknesses }: SajuStrengthsSectionProps) {
  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        사주 기반 강점 & 약점
      </h2>

      {/* 강점 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="font-medium text-green-400">강점 (3가지)</span>
        </div>
        <div className="space-y-3">
          {strengths.map((strength, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="font-medium text-foreground mb-1">{strength.trait}</div>
              <div className="text-xs text-muted-foreground mb-2 p-2 rounded bg-card/50">
                📖 명리학적 근거: {strength.basis}
              </div>
              <div className="text-sm text-foreground/80">
                💡 {strength.manifestation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 약점 및 주의점 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="font-medium text-amber-400">주의점 & 성장 방향 (2가지)</span>
        </div>
        <div className="space-y-3">
          {weaknesses.map((weakness, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="font-medium text-foreground mb-1">{weakness.trait}</div>
              <div className="text-sm text-foreground/80 mb-2">
                ⚠️ {weakness.caution}
              </div>
              <div className="flex items-start gap-2 text-sm text-green-400 p-2 rounded bg-green-500/10">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{weakness.growth_tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
