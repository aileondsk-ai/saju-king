import { CheckCircle, XCircle, Calendar } from "lucide-react";
import { RelationshipAdvice } from "./types";

interface RelationshipAdviceSectionProps {
  advice: RelationshipAdvice;
}

export const RelationshipAdviceSection = ({ advice }: RelationshipAdviceSectionProps) => {
  const { goodPatterns, avoidPatterns, twoWeekPlan } = advice;
  
  const hasGood = goodPatterns && goodPatterns.length > 0;
  const hasAvoid = avoidPatterns && avoidPatterns.length > 0;
  const hasPlan = twoWeekPlan && twoWeekPlan.length > 0;
  
  if (!hasGood && !hasAvoid && !hasPlan) return null;

  return (
    <section className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-gold-dark/10 p-2">
          <CheckCircle className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-foreground">맞춤 관계 가이드</h2>
      </div>

      <div className="space-y-3">
        {/* 잘 맞는 운영방식 */}
        {hasGood && (
          <div 
            className="rounded-2xl border border-emerald-500/20 bg-card/80 p-4 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
            style={{ animationDelay: "1s", animationFillMode: "forwards" }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              이런 방식이 잘 맞아요
            </h3>
            <ul className="space-y-2">
              {goodPatterns.map((pattern, index) => (
                <li key={index} className="flex gap-2 text-sm text-foreground/85">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 피해야 할 패턴 */}
        {hasAvoid && (
          <div 
            className="rounded-2xl border border-rose-500/20 bg-card/80 p-4 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
            style={{ animationDelay: "1.05s", animationFillMode: "forwards" }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-400">
              <XCircle className="h-4 w-4" />
              이런 패턴은 피해주세요
            </h3>
            <ul className="space-y-2">
              {avoidPatterns.map((pattern, index) => (
                <li key={index} className="flex gap-2 text-sm text-foreground/85">
                  <span className="mt-0.5 text-rose-400">✗</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2주 실천 플랜 */}
        {hasPlan && (
          <div 
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 to-primary/5 p-4 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
            style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Calendar className="h-4 w-4" />
              2주 실천 플랜
            </h3>
            <div className="space-y-2">
              {twoWeekPlan.map((plan, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <span className="text-foreground/85 pt-0.5">{plan}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
