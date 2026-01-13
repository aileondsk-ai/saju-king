import { CalendarDays, Sun, Cloud } from "lucide-react";
import { YearlyFortune } from "./types";

interface YearlyFortuneSectionProps {
  fortune: YearlyFortune;
  person1Name: string;
  person2Name: string;
}

export const YearlyFortuneSection = ({ fortune, person1Name, person2Name }: YearlyFortuneSectionProps) => {
  const hasOpportunities = fortune.opportunities && fortune.opportunities.length > 0;
  const hasChallenges = fortune.challenges && fortune.challenges.length > 0;

  return (
    <section className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-gold-dark/30 to-primary/20 p-2">
          <CalendarDays className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">{fortune.year}년 두 사람의 운세</h2>
          <p className="text-xs text-muted-foreground">{person1Name} & {person2Name}</p>
        </div>
      </div>

      <div 
        className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
        style={{ animationDelay: "1.15s", animationFillMode: "forwards" }}
      >
        {/* 올해의 테마 */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wide">
            {fortune.year}년 테마
          </span>
          <p className="mt-3 font-serif text-lg font-medium text-foreground leading-relaxed">
            "{fortune.theme}"
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* 기회 & 도전 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {hasOpportunities && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <Sun className="h-4 w-4" />
                함께 누릴 기회
              </h4>
              <ul className="space-y-1.5">
                {fortune.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex gap-2 text-sm text-foreground/85">
                    <span className="text-emerald-400">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasChallenges && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Cloud className="h-4 w-4" />
                함께 주의할 점
              </h4>
              <ul className="space-y-1.5">
                {fortune.challenges.map((challenge, index) => (
                  <li key={index} className="flex gap-2 text-sm text-foreground/85">
                    <span className="text-amber-400">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 조언 */}
        {fortune.advice && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="rounded-xl bg-secondary/30 p-4">
              <p className="text-center text-sm text-foreground/90 leading-relaxed">
                💫 {fortune.advice}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
