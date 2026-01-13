import { Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { Interaction } from "./types";

interface InteractionSectionProps {
  interaction: Interaction;
}

export const InteractionSection = ({ interaction }: InteractionSectionProps) => {
  const { synergies, conflictTriggers, adjustmentTips } = interaction;
  
  const hasSynergies = synergies && synergies.length > 0;
  const hasConflicts = conflictTriggers && conflictTriggers.length > 0;
  const hasTips = adjustmentTips && adjustmentTips.length > 0;
  
  if (!hasSynergies && !hasConflicts && !hasTips) return null;

  return (
    <section className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 p-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-foreground">둘만의 상호작용</h2>
      </div>

      <div className="space-y-3">
        {/* 시너지 */}
        {hasSynergies && (
          <div 
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <Sparkles className="h-4 w-4" />
              시너지가 빛나는 순간
            </h3>
            <ul className="space-y-2">
              {synergies.map((synergy, index) => (
                <li key={index} className="flex gap-2 text-sm text-foreground/85">
                  <span className="mt-0.5 text-emerald-400">✦</span>
                  <span>{synergy}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 갈등 트리거 */}
        {hasConflicts && (
          <div 
            className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              주의가 필요한 순간
            </h3>
            <ul className="space-y-2">
              {conflictTriggers.map((trigger, index) => (
                <li key={index} className="flex gap-2 text-sm text-foreground/85">
                  <span className="mt-0.5 text-amber-400">◆</span>
                  <span>{trigger}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 조정 포인트 */}
        {hasTips && (
          <div 
            className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Lightbulb className="h-4 w-4" />
              이렇게 조율해보세요
            </h3>
            <ul className="space-y-2">
              {adjustmentTips.map((tip, index) => (
                <li key={index} className="flex gap-2 text-sm text-foreground/85">
                  <span className="mt-0.5 text-primary">→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
