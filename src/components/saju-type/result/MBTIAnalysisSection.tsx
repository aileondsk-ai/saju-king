import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MBTIAnalysisResult } from "@/types/saju-type-analysis";
import { Brain, MessageCircle, Zap, Eye, Scale, Calendar, TrendingUp, Lightbulb } from "lucide-react";

interface MBTIAnalysisSectionProps {
  mbti: string;
  mbtiAnalysis: MBTIAnalysisResult;
}

export function MBTIAnalysisSection({ mbti, mbtiAnalysis }: MBTIAnalysisSectionProps) {
  const { type_essence, personality, strengths, growth_points, communication } = mbtiAnalysis;

  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        MBTI 분석: {mbti}
      </h2>

      {/* 유형 본질 (type_essence) */}
      <div className="mb-5 p-4 rounded-lg bg-primary/10 border border-primary/30">
        <div className="text-2xl font-bold text-primary mb-3">{mbti}</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {type_essence.keywords.map((kw, idx) => (
            <Badge key={idx} variant="secondary" className="bg-primary/20">
              {kw}
            </Badge>
          ))}
        </div>
        <div className="text-sm text-foreground/80 mb-3">
          <span className="text-muted-foreground">핵심 동기: </span>
          {type_essence.core_motivation}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-card/50 border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">주기능 (Dominant)</div>
            <div className="text-sm font-medium text-foreground">{type_essence.dominant_function}</div>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">부기능 (Auxiliary)</div>
            <div className="text-sm font-medium text-foreground">{type_essence.auxiliary_function}</div>
          </div>
        </div>
      </div>

      {/* 성격 특성 (personality) - 4가지 축 */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">성격 특성 (4가지 축)</h3>
        <div className="grid gap-2">
          {[
            { label: "에너지 방향", data: personality.energy, badge: personality.energy.direction, icon: <Zap className="w-4 h-4" />, color: "text-yellow-400" },
            { label: "정보 수집", data: personality.perception, badge: personality.perception.preference, icon: <Eye className="w-4 h-4" />, color: "text-blue-400" },
            { label: "의사 결정", data: personality.judgment, badge: personality.judgment.preference, icon: <Scale className="w-4 h-4" />, color: "text-green-400" },
            { label: "생활 방식", data: personality.lifestyle, badge: personality.lifestyle.preference, icon: <Calendar className="w-4 h-4" />, color: "text-purple-400" },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-card/50 border border-border/30 flex items-start gap-3">
              <div className={`mt-0.5 ${item.color}`}>{item.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.badge}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80">{item.data.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MBTI 기반 강점 (strengths) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          인지 기능 기반 강점 (3가지)
        </h3>
        <div className="space-y-3">
          {strengths.map((strength, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="font-medium text-foreground mb-1">{strength.trait}</div>
              <div className="text-xs text-muted-foreground mb-2 p-2 rounded bg-card/50">
                🧠 인지 기반: {strength.cognitive_basis}
              </div>
              <p className="text-sm text-foreground/80">{strength.manifestation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 성장 포인트 (growth_points) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          성장 포인트 (2가지)
        </h3>
        <div className="space-y-3">
          {growth_points.map((point, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="font-medium text-foreground mb-1">{point.area}</div>
              <div className="text-sm text-foreground/80 mb-2">
                🎯 도전: {point.challenge}
              </div>
              <div className="flex items-start gap-2 text-sm text-green-400 p-2 rounded bg-green-500/10">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{point.growth_direction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 소통 스타일 (communication) */}
      <div className="p-4 rounded-lg bg-card/50 border border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          소통 스타일
        </h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded bg-primary/10">
            <span className="text-muted-foreground">💬 선호하는 대화 방식: </span>
            <span className="text-foreground">{communication.preferred_style}</span>
          </div>
          <div className="p-3 rounded bg-amber-500/10">
            <span className="text-muted-foreground">⚠️ 오해받기 쉬운 부분: </span>
            <span className="text-foreground">{communication.often_misunderstood}</span>
          </div>
          <div className="p-3 rounded bg-green-500/10">
            <span className="text-muted-foreground">✅ 효과적 소통법: </span>
            <span className="text-foreground">{communication.effective_approach}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
