import { Card } from "@/components/ui/card";
import { SajuAnalysisResult, MBTIAnalysisResult, IntegratedAnalysisResult } from "@/types/saju-type-analysis";
import { Heart, Users, AlertCircle, Lightbulb } from "lucide-react";

interface IntegratedRelationshipSectionProps {
  sajuRelationship: SajuAnalysisResult["relationship"];
  mbtiRelationship: MBTIAnalysisResult["relationship"];
  integratedInsight: IntegratedAnalysisResult["integrated_profile"]["relationship_insight"];
}

export function IntegratedRelationshipSection({ 
  sajuRelationship, 
  mbtiRelationship, 
  integratedInsight 
}: IntegratedRelationshipSectionProps) {
  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-400" />
        통합 관계 인사이트
      </h2>

      {/* 통합 관계 조언 (Prompt 3) */}
      <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💕</span>
              <span className="text-sm font-medium text-pink-400">찰떡궁합 유형</span>
            </div>
            <p className="text-sm text-foreground/80 pl-6">{integratedInsight.best_match}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌱</span>
              <span className="text-sm font-medium text-amber-400">성장 파트너 유형</span>
            </div>
            <p className="text-sm text-foreground/80 pl-6">{integratedInsight.growth_partner}</p>
          </div>
          <div className="pt-3 border-t border-pink-500/20">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-primary font-medium">{integratedInsight.tip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 사주 기반 관계 성향 (Prompt 1) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">☯</span> 사주 기반 관계 성향
        </h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-card/50 border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">💘 끌리는 유형</div>
            <p className="text-sm text-foreground">{sajuRelationship.attracted_to}</p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">🤝 시너지 좋은 유형</div>
            <p className="text-sm text-foreground">{sajuRelationship.synergy_with}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              주의할 패턴
            </div>
            <p className="text-sm text-foreground/80">{sajuRelationship.caution_pattern}</p>
          </div>
        </div>
      </div>

      {/* MBTI 기반 관계 성향 (Prompt 2) */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> MBTI 기반 관계 성향
        </h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-card/50 border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">💫 이상적 파트너 유형</div>
            <p className="text-sm text-foreground">{mbtiRelationship.ideal_partners.join(", ")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-green-400 mb-1">🎁 주는 것</div>
              <p className="text-sm text-foreground/80">{mbtiRelationship.gives}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs text-blue-400 mb-1">💝 필요로 하는 것</div>
              <p className="text-sm text-foreground/80">{mbtiRelationship.needs}</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              갈등 패턴
            </div>
            <p className="text-sm text-foreground/80">{mbtiRelationship.conflict_pattern}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
