import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SajuAnalysisResult } from "@/types/saju-type-analysis";
import { Eye, EyeOff, Zap, User } from "lucide-react";

interface SajuPersonalitySectionProps {
  personality: SajuAnalysisResult["personality"];
}

export function SajuPersonalitySection({ personality }: SajuPersonalitySectionProps) {
  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        사주 기반 성격 특성
      </h2>

      <div className="space-y-4">
        {/* 겉으로 드러나는 성격 */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">겉으로 드러나는 모습</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {personality.visible.map((trait, idx) => (
              <Badge key={idx} variant="secondary" className="bg-primary/20 text-foreground">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* 내면의 성격 */}
        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <EyeOff className="w-4 h-4 text-secondary-foreground" />
            <span className="text-sm font-medium text-secondary-foreground">내면에 숨겨진 모습</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {personality.hidden.map((trait, idx) => (
              <Badge key={idx} variant="outline" className="text-foreground/80">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* 스트레스 반응 */}
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">스트레스 상황에서</span>
          </div>
          <p className="text-sm text-foreground/80">
            {personality.under_stress}
          </p>
        </div>
      </div>
    </Card>
  );
}
