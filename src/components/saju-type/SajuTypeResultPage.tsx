import { forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FourPillars } from "@/lib/saju-calculator";
import { 
  SajuType, 
  getMBTIAnalysis, 
  getYearlyFortune2026, 
  MBTI_NAMES,
  MBTICrossInsight 
} from "@/data/sajuTypes";
import { cn } from "@/lib/utils";
import { Star, Sparkles, Calendar, MapPin, Hash, Palette, Gauge } from "lucide-react";
import { ElementBalanceChart } from "./ElementBalanceChart";

interface SajuTypeResultPageProps {
  pillars: FourPillars;
  sajuType: SajuType;
  mbti: string;
  userName?: string;
}

const ELEMENT_TEXT_COLORS: Record<string, string> = {
  "목": "text-green-400",
  "화": "text-red-400",
  "토": "text-amber-400",
  "금": "text-slate-300",
  "수": "text-blue-400",
};

const ELEMENT_BG_COLORS: Record<string, string> = {
  "목": "bg-green-500/20 border-green-500/30",
  "화": "bg-red-500/20 border-red-500/30",
  "토": "bg-amber-500/20 border-amber-500/30",
  "금": "bg-slate-400/20 border-slate-400/30",
  "수": "bg-blue-500/20 border-blue-500/30",
};

// 십신 계산 (간략화)
function getTenStar(dayStem: string, targetStem: string): string {
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const dayIdx = stems.indexOf(dayStem);
  const targetIdx = stems.indexOf(targetStem);
  
  if (dayIdx === -1 || targetIdx === -1) return "";
  
  const diff = (targetIdx - dayIdx + 10) % 10;
  const tenStars = ["비겁", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
  
  // 일간 자신
  if (diff === 0) return "일간";
  
  return tenStars[diff] || "";
}

export const SajuTypeResultPage = forwardRef<HTMLDivElement, SajuTypeResultPageProps>(
  ({ pillars, sajuType, mbti, userName }, ref) => {
    const mbtiAnalysis = getMBTIAnalysis(sajuType.ilgan, mbti);
    const yearlyFortune = getYearlyFortune2026(sajuType.ilgan);
    const mbtiName = MBTI_NAMES[mbti] || "";

    const pillarLabels = ["년주", "월주", "일주", "시주"];
    const pillarData = [pillars.year, pillars.month, pillars.day, pillars.hour];

    return (
      <div ref={ref} className="space-y-6">
        {/* Section 1: 사주 기본 정보 테이블 */}
        <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            사주 기본 정보
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">구분</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">천간</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">지지</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">십신</th>
                </tr>
              </thead>
              <tbody>
                {pillarData.map((pillar, index) => {
                  if (!pillar) {
                    return (
                      <tr key={index} className="border-b border-border/30">
                        <td className="py-3 px-2 text-muted-foreground">{pillarLabels[index]}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground/50" colSpan={3}>미입력</td>
                      </tr>
                    );
                  }
                  
                  const tenStar = getTenStar(pillars.day.stemHanja, pillar.stemHanja);
                  const textColor = ELEMENT_TEXT_COLORS[pillar.element] || "";
                  
                  return (
                    <tr key={index} className="border-b border-border/30">
                      <td className="py-3 px-2 text-foreground font-medium">{pillarLabels[index]}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn("font-bold text-lg", textColor)}>
                          {pillar.stemHanja}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({pillar.stem})
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-bold text-lg text-foreground">
                          {pillar.branchHanja}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({pillar.branch})
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {tenStar}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 일간 강조 */}
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="text-xs text-muted-foreground mb-1">일간</div>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-bold", ELEMENT_TEXT_COLORS[pillars.day.element])}>
                {pillars.day.stemHanja}{pillars.day.element}
              </span>
              <span className="text-foreground/80">
                ({sajuType.ilganKo}) = {sajuType.name.split(" ").slice(-1)[0]}
              </span>
            </div>
          </div>
        </Card>

        {/* Section 1.5: 오행 밸런스 */}
        <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            오행 밸런스
          </h2>
          <ElementBalanceChart pillars={pillars} />
        </Card>

        {/* Section 2: 사주 유형 카드 */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl">
          <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", sajuType.color)} />
          
          <div className="relative z-10 p-6">
            {/* 아이콘 */}
            <div className="text-center mb-4">
              <span className="text-6xl">{sajuType.icon}</span>
            </div>

            {/* 유형명 */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                [{sajuType.name}] {sajuType.ilganKo.slice(0, 1)}토형
              </h2>
              <p className="text-primary mt-2 text-sm font-medium">
                "{sajuType.quote}"
              </p>
            </div>

            {/* 핵심 키워드 (별점) */}
            <div className="space-y-2 mb-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">핵심 키워드</h3>
              {sajuType.keywords.map((kw) => (
                <div key={kw.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{kw.label}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= kw.score ? "text-primary fill-primary" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 특징 리스트 */}
            <div className="space-y-2 p-4 rounded-lg bg-card/50 border border-border/30">
              <h3 className="text-sm font-semibold text-foreground mb-2">{sajuType.ilganKo}의 특징</h3>
              <ul className="space-y-1.5">
                {sajuType.traits.map((trait, idx) => (
                  <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Section 3: MBTI 교차 인사이트 */}
        <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-4">
            💡 MBTI 교차 인사이트
          </h2>
          
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="text-sm text-muted-foreground">입력한 MBTI</div>
            <div className="text-lg font-bold text-foreground">
              {mbti} <span className="text-primary">({mbtiName})</span>
            </div>
          </div>

          {/* 비교 테이블 */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">구분</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">사주 ({sajuType.ilganKo})</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">MBTI ({mbti})</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">교집합</th>
                </tr>
              </thead>
              <tbody>
                {mbtiAnalysis.crossInsights.map((insight, idx) => (
                  <tr key={idx} className="border-b border-border/30">
                    <td className="py-2 px-2 text-foreground">{insight.category}</td>
                    <td className="py-2 px-2 text-center text-foreground/80">{insight.sajuLabel}</td>
                    <td className="py-2 px-2 text-center text-foreground/80">{insight.mbtiLabel}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          insight.match === "일치" && "bg-green-500/20 text-green-400",
                          insight.match === "비슷" && "bg-amber-500/20 text-amber-400",
                          insight.match === "다름" && "bg-slate-500/20 text-slate-400"
                        )}
                      >
                        {insight.match === "일치" ? "✓ 일치" : insight.match === "비슷" ? "△ 비슷" : "○ 다름"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 공통 키워드 */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">공통 키워드</div>
            <div className="flex flex-wrap gap-2">
              {mbtiAnalysis.commonKeywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>

          {/* 흥미로운 차이 */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
            <div className="text-sm font-medium text-amber-400 mb-1">흥미로운 차이</div>
            <p className="text-sm text-foreground/80">{mbtiAnalysis.interestingDifference}</p>
          </div>

          {/* 결합 결과 */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="text-sm font-medium text-primary mb-1">결과</div>
            <p className="text-foreground font-medium">{mbtiAnalysis.combinedResult}</p>
          </div>
        </Card>

        {/* Section 4: 2026년 한 줄 운세 */}
        <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            2026년 한 줄 운세
          </h2>

          <div className="text-center mb-5 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-lg font-bold text-foreground">
              "{yearlyFortune.summary}"
            </p>
          </div>

          {/* 상반기/하반기 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 rounded-lg bg-card/50 border border-border/30 text-center">
              <div className="text-2xl mb-1">{yearlyFortune.firstHalf.emoji}</div>
              <div className="text-xs text-muted-foreground mb-1">상반기</div>
              <div className="text-sm font-medium text-foreground">{yearlyFortune.firstHalf.label}</div>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/30 text-center">
              <div className="text-2xl mb-1">{yearlyFortune.secondHalf.emoji}</div>
              <div className="text-xs text-muted-foreground mb-1">하반기</div>
              <div className="text-sm font-medium text-foreground">{yearlyFortune.secondHalf.label}</div>
            </div>
          </div>

          {/* 행운/주의 달 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <div className="text-xs text-muted-foreground mb-2">행운의 달</div>
              <div className="flex flex-wrap gap-1">
                {yearlyFortune.luckyMonths.map((m) => (
                  <Badge key={m} className="bg-green-500/20 text-green-400 border-green-500/30">
                    {m}월
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">조심할 달</div>
              <div className="flex flex-wrap gap-1">
                {yearlyFortune.cautionMonths.map((m) => (
                  <Badge key={m} variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                    {m}월
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* 럭키 포인트 */}
          <div className="p-4 rounded-lg bg-card/50 border border-border/30">
            <div className="text-sm font-semibold text-foreground mb-3">럭키 포인트</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Palette className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">컬러</div>
                <div className="text-sm font-medium text-foreground">{yearlyFortune.lucky.color}</div>
              </div>
              <div>
                <Hash className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">숫자</div>
                <div className="text-sm font-medium text-foreground">{yearlyFortune.lucky.number.join(", ")}</div>
              </div>
              <div>
                <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">방향</div>
                <div className="text-sm font-medium text-foreground">{yearlyFortune.lucky.direction}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <div className="text-xs text-muted-foreground">
            사주킹 saju-king.com
          </div>
        </div>
      </div>
    );
  }
);

SajuTypeResultPage.displayName = "SajuTypeResultPage";
