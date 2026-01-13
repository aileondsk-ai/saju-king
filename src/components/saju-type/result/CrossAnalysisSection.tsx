import { Card } from "@/components/ui/card";
import { IntegratedAnalysisResult } from "@/types/saju-type-analysis";
import { Sparkles, Zap, Star } from "lucide-react";

interface CrossAnalysisSectionProps {
  crossAnalysis: IntegratedAnalysisResult["cross_analysis"];
  mbti: string;
  dayMasterName: string;
}

export function CrossAnalysisSection({ crossAnalysis, mbti, dayMasterName }: CrossAnalysisSectionProps) {
  const { synergy_points, interesting_tensions, hidden_potential } = crossAnalysis;

  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        사주 × MBTI 교차 분석
      </h2>

      <div className="text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-card/50 border border-border/30">
        {dayMasterName}와 {mbti}의 조합에서 발견되는 독특한 패턴을 분석합니다.
      </div>

      {/* 시너지 포인트 */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-green-400">🔗</span> 시너지 포인트 (일치하는 부분)
        </h3>
        <div className="space-y-3">
          {synergy_points.map((synergy, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="font-medium text-foreground mb-3">{synergy.point}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-3 rounded bg-card/50 border border-border/30">
                  <div className="text-muted-foreground mb-1">☯ 사주 근거</div>
                  <span className="text-foreground">{synergy.saju_basis}</span>
                </div>
                <div className="p-3 rounded bg-card/50 border border-border/30">
                  <div className="text-muted-foreground mb-1">🧠 MBTI 근거</div>
                  <span className="text-foreground">{synergy.mbti_basis}</span>
                </div>
              </div>
              <div className="p-3 rounded bg-primary/10 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">💡 통합 해석</div>
                <p className="text-sm text-foreground/80">{synergy.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 흥미로운 긴장 */}
      {interesting_tensions.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            흥미로운 긴장 (다른 부분)
          </h3>
          <div className="text-xs text-muted-foreground mb-3 p-2 rounded bg-amber-500/5">
            "모순"이 아닌 "복잡성"과 "깊이"로 해석됩니다
          </div>
          <div className="space-y-3">
            {interesting_tensions.map((tension, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="font-medium text-foreground mb-2">{tension.tension}</div>
                <p className="text-sm text-foreground/80">{tension.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 숨겨진 잠재력 */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-primary/10 border border-purple-500/30">
        <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          숨겨진 잠재력
        </h3>
        <div className="text-xs text-muted-foreground mb-2">
          사주만으로도, MBTI만으로도 보이지 않던 이 조합만의 특별함
        </div>
        <p className="text-sm text-foreground/80">{hidden_potential}</p>
      </div>
    </Card>
  );
}
