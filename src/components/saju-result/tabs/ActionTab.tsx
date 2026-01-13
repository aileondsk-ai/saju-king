import { CheckSquare, AlertTriangle, Quote, Sparkles } from "lucide-react";
import type { OverallAdvice } from "@/lib/saju-result-normalizer";

interface CoreInsight {
  title: string;
  description: string;
}

interface ActionItem {
  category?: string;
  emoji?: string;
  title: string;
  description: string;
  frequency?: string;
  purpose?: string;
}

interface CautionItem {
  emoji?: string;
  title: string;
  description: string;
  prevention?: string;
}

interface ActionTabProps {
  overallAdvice?: OverallAdvice;
  coreInsights?: {
    topStrengths?: CoreInsight[];
    growthAreas?: CoreInsight[];
    yearKeyword?: string;
  };
  actionItems?: ActionItem[];
  cautions?: CautionItem[];
  coreMessage?: {
    quote: string;
    elaboration: string;
  };
  closing?: string;
}

export const ActionTab = ({ 
  overallAdvice, 
  coreInsights, 
  actionItems: detailedActions, 
  cautions: detailedCautions,
  coreMessage,
  closing 
}: ActionTabProps) => {
  // 기존 overallAdvice 또는 새로운 구조 지원
  const actionItems: ActionItem[] = detailedActions || overallAdvice?.actionItems?.map(item => ({ title: item, description: "" })) || [];
  const cautions: CautionItem[] = detailedCautions || overallAdvice?.cautions?.map(item => ({ title: item, description: "" })) || [];
  const message = coreMessage?.quote || overallAdvice?.coreMessage || "";

  return (
    <div className="space-y-6 px-5 py-5">
      {/* 핵심 메시지 - 맨 위에 배치하여 사용자가 먼저 볼 수 있도록 */}
      {message && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Quote className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">핵심 메시지</h3>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-accent/10 p-6 text-center shadow-lg backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <p className="font-serif text-lg leading-relaxed text-foreground">"{message}"</p>
            {coreMessage?.elaboration && (
              <p className="mt-3 text-sm text-muted-foreground">{coreMessage.elaboration}</p>
            )}
            {closing && (
              <p className="mt-4 text-sm font-medium text-primary">{closing}</p>
            )}
          </div>
        </section>
      )}

      {/* 핵심 인사이트 */}
      {coreInsights && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">핵심 인사이트</h3>
          </div>
          
          {/* 3대 강점 */}
          {coreInsights.topStrengths && coreInsights.topStrengths.length > 0 && (
            <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
              <p className="mb-3 text-xs font-medium text-emerald-400">💪 나의 3대 강점</p>
              <div className="space-y-2">
                {coreInsights.topStrengths.map((strength, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{strength.title}</p>
                    <p className="text-xs text-muted-foreground">{strength.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 성장 포인트 */}
          {coreInsights.growthAreas && coreInsights.growthAreas.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
              <p className="mb-3 text-xs font-medium text-amber-400">🌱 성장 포인트</p>
              <div className="space-y-2">
                {coreInsights.growthAreas.map((area, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{area.title}</p>
                    <p className="text-xs text-muted-foreground">{area.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 실천 과제 체크리스트 */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <CheckSquare className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">실천 과제</h3>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
          <div className="space-y-4">
            {actionItems.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs text-primary">
                  {item.emoji || (i + 1)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                  {item.frequency && (
                    <span className="mt-1 inline-block rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.frequency}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 주의사항 */}
      {cautions.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">주의사항</h3>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <div className="space-y-3">
              {cautions.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-amber-400">{item.emoji || "⚠️"}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                    {item.prevention && (
                      <p className="mt-1 text-xs text-amber-200/80">💡 {item.prevention}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
