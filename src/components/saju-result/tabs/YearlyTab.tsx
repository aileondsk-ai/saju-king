import { forwardRef } from "react";
import { Calendar, Star, Briefcase, Activity, Heart, Sparkles, TrendingUp } from "lucide-react";
import type { 
  YearlyFortune, 
  AreaFortunes, 
  LuckyElements, 
  SaeunData 
} from "@/lib/saju-result-normalizer";

interface YearlyTabProps {
  yearlyFortune?: YearlyFortune;
  areaFortunes?: AreaFortunes;
  luckyElements?: LuckyElements;
  saeun?: SaeunData;
}

const GradeStars = ({ grade }: { grade: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= grade ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const gradeColors: Record<number, string> = {
  5: "border-emerald-500/30 bg-emerald-500/10",
  4: "border-primary/30 bg-primary/10",
  3: "border-amber-500/30 bg-amber-500/10",
  2: "border-orange-500/30 bg-orange-500/10",
  1: "border-red-500/30 bg-red-500/10",
};

const elementColors: Record<string, string> = {
  "목": "text-emerald-400 bg-emerald-500/20",
  "화": "text-red-400 bg-red-500/20",
  "토": "text-amber-400 bg-amber-500/20",
  "금": "text-slate-300 bg-slate-500/20",
  "수": "text-blue-400 bg-blue-500/20",
};

export const YearlyTab = forwardRef<HTMLDivElement, YearlyTabProps>(({ yearlyFortune, areaFortunes, luckyElements, saeun }, ref) => {
  const year = saeun?.year || yearlyFortune?.year || 2026;

  // luckyElements 정규화 (이미 정규화됨)
  const normalizedColors = luckyElements?.colors || [];
  const normalizedNumbers = luckyElements?.numbers || [];
  const normalizedDirections = luckyElements?.directions || [];
  const normalizedSeasons = luckyElements?.seasons || [];

  return (
    <div ref={ref} className="space-y-6 px-5 py-5">
      {/* 세운 정보 카드 (새로 추가) */}
      {saeun && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">{year}년 세운</h3>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card/90 to-primary/10 p-5 shadow-lg backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-serif text-3xl font-bold text-foreground">
                    {saeun.stemHanja}{saeun.branchHanja}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    ({saeun.stem}{saeun.branch})
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{year}년의 천간과 지지</p>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${elementColors[saeun.element] || "bg-primary/20"}`}>
                <span className="font-serif text-xl font-bold">{saeun.element}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 올해 테마 카드 */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">{year}년 운세 테마</h3>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-accent/10 p-5 shadow-lg backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          {yearlyFortune?.pillar && (
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                {yearlyFortune.pillar}
                {yearlyFortune.pillarKorean && ` (${yearlyFortune.pillarKorean})`}
              </span>
            </div>
          )}
          <h4 className="mb-3 font-serif text-xl font-semibold text-gradient-gold">{yearlyFortune?.theme}</h4>
          <p className="text-sm leading-relaxed text-foreground/90">{yearlyFortune?.description}</p>
          
          {/* 주요 월 하이라이트 */}
          {(yearlyFortune?.keyMonths || yearlyFortune?.monthlyHighlights) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {yearlyFortune.keyMonths?.map((m, i) => (
                <span key={i} className="rounded-lg border border-border/30 bg-secondary/30 px-3 py-1.5 text-xs text-foreground">
                  📅 {m.month}월: {m.theme}
                </span>
              ))}
              {yearlyFortune.monthlyHighlights?.slice(0, 3).map((m, i) => (
                <span key={i} className="rounded-lg border border-border/30 bg-secondary/30 px-3 py-1.5 text-xs text-foreground">
                  📅 {m.month}: {m.keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 영역별 운세 (4개 카드) */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">영역별 운세</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: "wealth", label: "재물운", icon: <Star className="h-4 w-4" /> },
            { key: "career", label: "직업운", icon: <Briefcase className="h-4 w-4" /> },
            { key: "health", label: "건강운", icon: <Activity className="h-4 w-4" /> },
            { key: "relationship", label: "애정운", icon: <Heart className="h-4 w-4" /> },
          ].map(({ key, label, icon }, index) => {
            const fortune = areaFortunes?.[key as keyof typeof areaFortunes];
            if (!fortune) return null;
            return (
              <div
                key={key}
                className={`rounded-2xl border p-4 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up ${gradeColors[fortune.grade] || "border-border/30 bg-card/80"}`}
                style={{ animationDelay: `${0.2 + index * 0.05}s`, animationFillMode: "forwards" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    {icon}
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <GradeStars grade={fortune.grade} />
                </div>
                <p className="mb-3 text-sm leading-relaxed text-foreground/90">{fortune.description}</p>
                {fortune.advice && (
                  <p className="mb-3 text-xs leading-relaxed text-primary/80 border-l-2 border-primary/30 pl-3">💡 {fortune.advice}</p>
                )}
                {/* 기회 및 리스크 */}
                {fortune.opportunities && fortune.opportunities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {fortune.opportunities.map((opp, i) => (
                      <span key={i} className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">✨ {opp}</span>
                    ))}
                  </div>
                )}
                {fortune.risks && fortune.risks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {fortune.risks.map((risk, i) => (
                      <span key={i} className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-400">⚠️ {risk}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 행운의 요소 */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">행운의 요소</h3>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">🎨 행운의 색상</p>
              <p className="text-sm font-medium text-foreground">{normalizedColors.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">🔢 행운의 숫자</p>
              <p className="text-sm font-medium text-foreground">{normalizedNumbers.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">🧭 행운의 방향</p>
              <p className="text-sm font-medium text-foreground">{normalizedDirections.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">🍃 행운의 계절</p>
              <p className="text-sm font-medium text-foreground">{normalizedSeasons.join(", ") || "-"}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

YearlyTab.displayName = "YearlyTab";
