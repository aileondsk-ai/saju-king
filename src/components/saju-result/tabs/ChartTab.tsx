import { Sparkles, Flame, Droplets, Mountain, Wind, Leaf, Users } from "lucide-react";
import type { 
  SajuChartData, 
  DayMasterData, 
  TenGodDistribution,
  TenGodDetail 
} from "@/lib/saju-result-normalizer";

interface ChartTabProps {
  pillars?: SajuChartData;
  dayMaster?: DayMasterData;
  elementBalance?: Record<string, { count: number; percentage: number }>;
  elementBalanceAnalysis?: string;
  tenGodDistribution?: TenGodDistribution;
}

const elementIcons: Record<string, React.ReactNode> = {
  "목": <Leaf className="h-4 w-4" />,
  "화": <Flame className="h-4 w-4" />,
  "토": <Mountain className="h-4 w-4" />,
  "금": <Wind className="h-4 w-4" />,
  "수": <Droplets className="h-4 w-4" />,
};

const elementColors: Record<string, string> = {
  "목": "text-emerald-400",
  "화": "text-red-400",
  "토": "text-amber-400",
  "금": "text-slate-300",
  "수": "text-blue-400",
};

// 십신 별 색상
const tenGodColors: Record<string, string> = {
  "비견": "text-blue-400 bg-blue-500/20",
  "겁재": "text-blue-300 bg-blue-500/10",
  "식신": "text-emerald-400 bg-emerald-500/20",
  "상관": "text-emerald-300 bg-emerald-500/10",
  "편재": "text-amber-400 bg-amber-500/20",
  "정재": "text-amber-300 bg-amber-500/10",
  "편관": "text-purple-400 bg-purple-500/20",
  "정관": "text-purple-300 bg-purple-500/10",
  "편인": "text-cyan-400 bg-cyan-500/20",
  "정인": "text-cyan-300 bg-cyan-500/10",
};

export const ChartTab = ({ pillars, dayMaster, elementBalance, elementBalanceAnalysis, tenGodDistribution }: ChartTabProps) => {
  const pillarList = pillars
    ? [
        { name: "년주", pillarKey: "year", ...pillars.yearPillar },
        { name: "월주", pillarKey: "month", ...pillars.monthPillar },
        { name: "일주", pillarKey: "day", ...pillars.dayPillar },
        { name: "시주", pillarKey: "hour", ...pillars.hourPillar },
      ]
    : [];

  const distribution = elementBalance || {};

  // 십신 상세 정보에서 각 주(柱)별 십신 찾기
  const getTenGodForPosition = (pillarKey: string, type: "gan" | "ji"): TenGodDetail | undefined => {
    if (!tenGodDistribution?.details) return undefined;

    const positionMap: Record<string, string> = {
      "year-gan": "년간",
      "year-ji": "년지",
      "month-gan": "월간",
      "month-ji": "월지",
      "day-ji": "일지",
      "hour-gan": "시간",
      "hour-ji": "시지",
    };

    const position = positionMap[`${pillarKey}-${type}`];
    return tenGodDistribution.details.find((d) => d.position === position);
  };

  return (
    <div className="space-y-6 px-5 py-5">
      {/* 사주 명식 테이블 (십신 포함) */}
      {pillars && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">사주 명식</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {pillarList.map((pillar, index) => {
              const ganTenGod = getTenGodForPosition(pillar.pillarKey, "gan");
              const jiTenGod = getTenGodForPosition(pillar.pillarKey, "ji");

              return (
                <div
                  key={pillar.name}
                  className="rounded-2xl border border-border/30 bg-card/80 p-3 text-center shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}
                >
                  <span className="mb-2 block text-xs font-medium text-primary">{pillar.name}</span>

                  {/* 천간 + 십신 */}
                  <div className="mb-1">
                    <div className="font-serif text-2xl text-primary">{pillar.ganHanja}</div>
                    {ganTenGod && pillar.pillarKey !== "day" && (
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium ${tenGodColors[ganTenGod.tenGod] || "bg-muted text-muted-foreground"}`}>
                        {ganTenGod.tenGod}
                      </span>
                    )}
                    {pillar.pillarKey === "day" && (
                      <span className="mt-0.5 inline-block rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                        일간
                      </span>
                    )}
                  </div>

                  {/* 지지 + 십신 */}
                  <div>
                    <div className="font-serif text-2xl text-foreground">{pillar.jiHanja}</div>
                    {jiTenGod && (
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium ${tenGodColors[jiTenGod.tenGod] || "bg-muted text-muted-foreground"}`}>
                        {jiTenGod.tenGod}
                      </span>
                    )}
                  </div>

                  <span className="mt-2 block text-xs text-muted-foreground">{pillar.gan}{pillar.ji}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 십신 분포 미니 차트 */}
      {tenGodDistribution && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">십신 분포</h3>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/80 p-4 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: "비겁", value: tenGodDistribution.analysis.bigyeop, color: "bg-blue-500" },
                { label: "식상", value: tenGodDistribution.analysis.siksang, color: "bg-emerald-500" },
                { label: "재성", value: tenGodDistribution.analysis.jaecaeung, color: "bg-amber-500" },
                { label: "관성", value: tenGodDistribution.analysis.gwanseong, color: "bg-purple-500" },
                { label: "인성", value: tenGodDistribution.analysis.inseong, color: "bg-cyan-500" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${item.color}/20`}>
                    <span className="font-bold text-foreground">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            {tenGodDistribution.dominant.length > 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                우세 십신: <span className="text-primary font-medium">{tenGodDistribution.dominant.join(", ")}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* 일간 카드 */}
      {dayMaster && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              {elementIcons[dayMaster.element] || <Sparkles className="h-4 w-4 text-primary" />}
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">일간 분석</h3>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
            <div className="mb-4 flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ${elementColors[dayMaster.element] || "text-primary"}`}>
                {elementIcons[dayMaster.element] || <Sparkles className="h-7 w-7" />}
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-foreground">
                  {dayMaster.stem} ({dayMaster.element}) - {dayMaster.yinYang}
                </p>
                {dayMaster.strength && <p className="text-sm text-muted-foreground">{dayMaster.strength}</p>}
                {dayMaster.image && (
                  <p className="mt-1 text-xs italic text-primary/80">"{dayMaster.image}"</p>
                )}
              </div>
            </div>
            {(dayMaster.description || dayMaster.characteristics) && (
              <p className="mb-4 text-sm leading-relaxed text-foreground/90">{dayMaster.description || dayMaster.characteristics}</p>
            )}
            {dayMaster.coreTraits && dayMaster.coreTraits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dayMaster.coreTraits.map((trait) => (
                  <span key={trait} className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-foreground">✨ {trait}</span>
                ))}
              </div>
            )}
            {dayMaster.strengths && dayMaster.strengths.length > 0 && (
              <div className={`flex flex-wrap gap-2 ${dayMaster.coreTraits?.length ? "mt-3" : ""}`}>
                {dayMaster.strengths.map((trait) => (
                  <span key={trait} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-foreground">💪 {trait}</span>
                ))}
              </div>
            )}
            {dayMaster.watchPoints && dayMaster.watchPoints.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dayMaster.watchPoints.map((point) => (
                  <span key={point} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">⚠️ {point}</span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 오행 밸런스 */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">오행 밸런스</h3>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
          <div className="space-y-4">
            {["목", "화", "토", "금", "수"].map((element) => {
              const data = (distribution as Record<string, { count: number; percentage: number }>)[element] || { count: 0, percentage: 0 };
              const status = data.percentage >= 30 ? "과다" : data.percentage <= 10 ? "부족" : "적정";
              const statusColor = status === "과다" ? "text-red-400" : status === "부족" ? "text-blue-400" : "text-emerald-400";
              return (
                <div key={element} className="flex items-center gap-3">
                  <div className={`flex w-16 items-center gap-2 ${elementColors[element]}`}>
                    {elementIcons[element]}
                    <span className="text-sm font-medium">{element}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000"
                        style={{ width: `${Math.min(data.percentage * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex w-24 items-center justify-end gap-2">
                    <span className="text-sm font-medium text-foreground">{data.count}</span>
                    <span className="text-xs text-muted-foreground">({data.percentage}%)</span>
                    <span className={`text-[10px] ${statusColor}`}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {elementBalanceAnalysis && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm leading-relaxed text-foreground/90">{elementBalanceAnalysis}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
