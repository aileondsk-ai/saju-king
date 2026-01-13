import { forwardRef } from "react";
import { Map, TrendingUp, ChevronRight } from "lucide-react";
import type { DaeunData, CurrentLuckCycle } from "@/lib/saju-result-normalizer";

interface RoadmapTabProps {
  daeun?: DaeunData;
  currentLuckCycle?: CurrentLuckCycle;
}

// 오행에 따른 색상
function getElementColor(element?: string) {
  switch (element) {
    case "목": return "bg-emerald-500";
    case "화": return "bg-red-500";
    case "토": return "bg-amber-600";
    case "금": return "bg-slate-400";
    case "수": return "bg-blue-500";
    default: return "bg-muted";
  }
}

export const RoadmapTab = forwardRef<HTMLDivElement, RoadmapTabProps>(({ daeun, currentLuckCycle }, ref) => {
  // 대운 차트가 있는지 확인
  const hasDaeunChart = daeun?.pillars && daeun.pillars.length > 0;

  return (
    <div ref={ref} className="space-y-6 px-5 py-5">
      {/* 대운 개요 */}
      {daeun && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Map className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">인생 로드맵</h3>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <div className="mb-3 flex flex-wrap gap-2">
              {daeun.direction && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {daeun.direction === "forward" || daeun.direction === "순행" ? "순행 대운" : "역행 대운"}
                </span>
              )}
              {daeun.startAge > 0 && (
                <span className="rounded-full border border-border/30 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground">
                  대운 시작: {daeun.startAge}세
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {daeun.direction === "forward" || daeun.direction === "순행"
                ? "대운이 순행하여 자연스러운 흐름으로 발전해 나갑니다."
                : "대운이 역행하여 성찰과 내면 성장에 유리합니다."}
            </p>
          </div>
        </section>
      )}

      {/* 대운 타임라인 */}
      {hasDaeunChart && daeun?.pillars && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">대운 타임라인</h3>
          </div>
          <div className="mb-3 text-sm text-muted-foreground">
            대운은 10년마다 변화하는 인생의 큰 흐름이에요 🌊
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3" style={{ minWidth: "max-content" }}>
              {daeun.pillars.map((pillar, index) => {
                const isCurrent = daeun.current && 
                  `${pillar.stem}${pillar.branch}` === daeun.current.pillar.replace(/[\u4e00-\u9fa5]/g, '');
                
                return (
                  <div
                    key={index}
                    className={`relative flex w-28 flex-col rounded-2xl border p-4 transition-all opacity-0 animate-fade-in-up ${
                      isCurrent
                        ? "border-primary bg-primary/20 shadow-lg shadow-primary/20"
                        : "border-border/30 bg-card/80"
                    }`}
                    style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        현재
                      </div>
                    )}
                    <div className="mb-2 text-center">
                      <span className="font-serif text-lg font-bold text-foreground">
                        {pillar.stemHanja}{pillar.branchHanja}
                      </span>
                    </div>
                    <div className="mb-2 text-center text-xs text-muted-foreground">
                      {pillar.startAge}세~{pillar.endAge}세
                    </div>
                    <div className="flex justify-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] text-white ${getElementColor(pillar.element)}`}>
                        {pillar.element}
                      </span>
                    </div>
                    <div className="mt-2 text-center text-[10px] text-muted-foreground">
                      {pillar.startYear}~{pillar.endYear}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 현재 대운 상세 */}
      {(daeun?.current || currentLuckCycle) && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <ChevronRight className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">현재 대운</h3>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-gradient-gold font-serif text-lg font-medium">
                {daeun?.current?.period || currentLuckCycle?.period}
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                {daeun?.current?.pillarHanja || daeun?.current?.pillar || currentLuckCycle?.pillar}
                {daeun?.current?.element ? ` (${daeun.current.element})` : ''}
              </span>
            </div>
            
            {daeun?.current?.yearsRemaining !== undefined && daeun.current.yearsRemaining > 0 && (
              <div className="mb-3 rounded-lg bg-secondary/30 p-2">
                <p className="text-xs text-muted-foreground">
                  이 대운은 앞으로 <span className="font-medium text-primary">{daeun.current.yearsRemaining}년</span> 남았어요
                </p>
              </div>
            )}

            {currentLuckCycle?.description && (
              <p className="mb-4 text-sm leading-relaxed text-foreground/90">{currentLuckCycle.description}</p>
            )}
            
            {currentLuckCycle?.opportunities && currentLuckCycle.opportunities.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-emerald-400">✨ 기회</p>
                <div className="flex flex-wrap gap-2">
                  {currentLuckCycle.opportunities.map((opp, i) => (
                    <span key={i} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-foreground">{opp}</span>
                  ))}
                </div>
              </div>
            )}
            
            {(currentLuckCycle?.challenges || currentLuckCycle?.cautions) && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-amber-400">⚠️ 주의</p>
                <div className="flex flex-wrap gap-2">
                  {(currentLuckCycle.challenges || currentLuckCycle.cautions)?.map((item, i) => (
                    <span key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-foreground">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {currentLuckCycle?.actionTips && currentLuckCycle.actionTips.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-primary">💡 실천 팁</p>
                <ul className="space-y-1">
                  {currentLuckCycle.actionTips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 대운 정보가 없는 경우 */}
      {!hasDaeunChart && !daeun?.current && !currentLuckCycle && (
        <section className="rounded-2xl border border-border/30 bg-card/80 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            대운 정보를 불러오는 중입니다...
          </p>
        </section>
      )}
    </div>
  );
});

RoadmapTab.displayName = "RoadmapTab";
