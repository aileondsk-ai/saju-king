import { Star, Briefcase, BarChart3 } from "lucide-react";
import type { StructureData, TenGodDistribution } from "@/lib/saju-result-normalizer";

interface PersonalityTabProps {
  structure?: StructureData;
  tenGodDistribution?: TenGodDistribution;
  careerSuggestions?: string[];
}

const distributionColors: Record<string, string> = {
  "비겁": "bg-blue-500",
  "식상": "bg-emerald-500",
  "재성": "bg-amber-500",
  "관성": "bg-purple-500",
  "인성": "bg-cyan-500",
};

const distributionDescriptions: Record<string, string> = {
  "비겁": "자기주장, 독립성, 경쟁심",
  "식상": "창의력, 표현력, 재능 발휘",
  "재성": "현실 감각, 재물운, 실용성",
  "관성": "책임감, 조직력, 리더십",
  "인성": "학습 능력, 지적 호기심, 통찰력",
};

export const PersonalityTab = ({ structure, tenGodDistribution, careerSuggestions }: PersonalityTabProps) => {
  // 백엔드에서 계산된 분포 사용, 없으면 기존 방식으로 계산
  const analysisData = tenGodDistribution?.analysis || {
    bigyeop: 0,
    siksang: 0,
    jaecaeung: 0,
    gwanseong: 0,
    inseong: 0,
  };

  const tenStarDistribution: Record<string, number> = {
    "비겁": analysisData.bigyeop,
    "식상": analysisData.siksang,
    "재성": analysisData.jaecaeung,
    "관성": analysisData.gwanseong,
    "인성": analysisData.inseong,
  };

  const maxCount = Math.max(...Object.values(tenStarDistribution), 1);
  const total = Object.values(tenStarDistribution).reduce((a, b) => a + b, 0);

  // 우세 카테고리 찾기
  const dominantCategory = Object.entries(tenStarDistribution)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)[0];

  return (
    <div className="space-y-6 px-5 py-5">
      {/* 십신 분포 차트 (개선) */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">십신 분포</h3>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="space-y-3">
            {Object.entries(tenStarDistribution).map(([name, count]) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-medium text-foreground">{name}</span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-lg bg-secondary/50">
                      <div
                        className={`h-full ${distributionColors[name]} transition-all duration-700`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex w-16 items-center gap-1">
                    <span className="w-6 text-center text-sm font-bold text-foreground">{count}</span>
                    <span className="text-xs text-muted-foreground">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 우세 십신 해석 */}
          {dominantCategory && dominantCategory[1] > 0 && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-primary">{dominantCategory[0]}</span>이 우세합니다
              </p>
              <p className="mt-1 text-xs text-foreground/80">
                {distributionDescriptions[dominantCategory[0]]}이 두드러지는 성향입니다.
              </p>
            </div>
          )}

          {/* 십신 상세 분포 (새 데이터 있을 때) */}
          {tenGodDistribution?.details && tenGodDistribution.details.length > 0 && (
            <div className="mt-4 border-t border-border/20 pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">위치별 십신</p>
              <div className="flex flex-wrap gap-1.5">
                {tenGodDistribution.details.map((detail, i) => (
                  <span 
                    key={i} 
                    className="rounded-lg border border-border/30 bg-secondary/30 px-2 py-1 text-[10px]"
                  >
                    <span className="text-muted-foreground">{detail.position}</span>
                    <span className="mx-1 text-foreground">{detail.stemHanja}</span>
                    <span className="text-primary">{detail.tenGod}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 격국 카드 */}
      {structure && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Star className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">격국 분석</h3>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
            <div className="mb-4">
              <span className="text-gradient-gold font-serif text-xl font-semibold">{structure.name || structure.type}</span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-foreground/90">{structure.description}</p>
            {structure.detailedExplanation && (
              <p className="mb-5 text-xs leading-relaxed text-muted-foreground">{structure.detailedExplanation}</p>
            )}

            {/* 용신/원신/희신/기신 */}
            <div className="space-y-3">
              {/* 용신 */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">용신 (用神)</p>
                  <p className="font-serif text-lg font-semibold text-primary">{structure.yongsin.element}</p>
                </div>
                {(structure.yongsin.reason || structure.yongsin.description) && (
                  <p className="text-xs leading-relaxed text-primary/80">{structure.yongsin.reason || structure.yongsin.description}</p>
                )}
              </div>
              
              {/* 원신 (새로 추가) */}
              {structure.wonsin?.element && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">원신 (原神)</p>
                    <p className="font-serif text-lg font-semibold text-emerald-400">{structure.wonsin.element}</p>
                  </div>
                  {structure.wonsin.description && (
                    <p className="text-xs leading-relaxed text-emerald-400/80">{structure.wonsin.description}</p>
                  )}
                </div>
              )}
              
              {/* 희신 */}
              <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">희신 (喜神)</p>
                  <p className="font-serif text-lg font-semibold text-foreground">{structure.huisin.element}</p>
                </div>
                {structure.huisin.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{structure.huisin.description}</p>
                )}
              </div>
              
              {/* 기신 */}
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">기신 (忌神)</p>
                  <p className="font-serif text-lg font-semibold text-destructive">{structure.gisin.element}</p>
                </div>
                {structure.gisin.description && (
                  <p className="text-xs leading-relaxed text-destructive/70">{structure.gisin.description}</p>
                )}
              </div>
            </div>

            {/* 용신 실천 팁 */}
            {structure.yongsin.practicalTips && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-2 text-xs font-medium text-primary">💡 용신 활용 팁</p>
                <p className="text-sm leading-relaxed text-foreground/90">{structure.yongsin.practicalTips}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 추천 직업/분야 */}
      {careerSuggestions && careerSuggestions.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">추천 분야</h3>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <div className="flex flex-wrap gap-2">
              {careerSuggestions.map((career, i) => (
                <span key={i} className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-foreground">
                  {career}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
