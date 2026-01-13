import { FourPillars } from "@/lib/saju-calculator";
import { ElementBalance } from "@/types/saju-type-analysis";
import { cn } from "@/lib/utils";

interface ElementBalanceChartProps {
  pillars: FourPillars;
  serverBalance?: ElementBalance; // 서버에서 계산된 오행 밸런스 (우선 사용)
}

const ELEMENTS = ["목", "화", "토", "금", "수"];
const ELEMENT_INFO: Record<string, { 
  color: string; 
  bgColor: string; 
  icon: string; 
  name: string;
  meaning: string;
}> = {
  "목": { 
    color: "text-green-400", 
    bgColor: "bg-green-500", 
    icon: "🌳", 
    name: "목(木)",
    meaning: "성장, 창의"
  },
  "화": { 
    color: "text-red-400", 
    bgColor: "bg-red-500", 
    icon: "🔥", 
    name: "화(火)",
    meaning: "열정, 표현"
  },
  "토": { 
    color: "text-amber-400", 
    bgColor: "bg-amber-500", 
    icon: "⛰️", 
    name: "토(土)",
    meaning: "안정, 신뢰"
  },
  "금": { 
    color: "text-slate-300", 
    bgColor: "bg-slate-400", 
    icon: "⚔️", 
    name: "금(金)",
    meaning: "결단, 정의"
  },
  "수": { 
    color: "text-blue-400", 
    bgColor: "bg-blue-500", 
    icon: "💧", 
    name: "수(水)",
    meaning: "지혜, 유연"
  },
};

// saju-analysis와 동일한 인덱스 기반 배열 (정합성 보장)
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

function calculateElementBalance(pillars: FourPillars): Record<string, number> {
  const counts: Record<string, number> = {
    "목": 0, "화": 0, "토": 0, "금": 0, "수": 0
  };

  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];

  for (const pillar of pillarList) {
    if (!pillar) continue;
    
    // 천간 오행 (인덱스 기반)
    const stemIdx = STEMS_HANJA.indexOf(pillar.stemHanja);
    if (stemIdx >= 0) {
      const element = STEMS_ELEMENTS[stemIdx];
      if (element) counts[element]++;
    }
    
    // 지지 오행 (인덱스 기반)
    const branchIdx = BRANCHES_HANJA.indexOf(pillar.branchHanja);
    if (branchIdx >= 0) {
      const element = BRANCHES_ELEMENTS[branchIdx];
      if (element) counts[element]++;
    }
  }

  return counts;
}

function getBalanceAnalysis(counts: Record<string, number>): { 
  strong: string[]; 
  weak: string[]; 
  message: string 
} {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const avg = total / 5;
  
  const strong = ELEMENTS.filter(el => counts[el] > avg);
  const weak = ELEMENTS.filter(el => counts[el] < avg * 0.5);

  let message = "";
  
  if (strong.length === 0 && weak.length === 0) {
    message = "오행이 비교적 균형 잡힌 사주예요. 다방면에서 안정적인 에너지를 가졌어요.";
  } else if (strong.length > 0 && weak.length > 0) {
    const strongNames = strong.map(el => ELEMENT_INFO[el].name).join(", ");
    const weakNames = weak.map(el => ELEMENT_INFO[el].name).join(", ");
    message = `${strongNames}이(가) 강하고, ${weakNames}이(가) 부족해요. 부족한 기운을 보완하면 좋아요.`;
  } else if (strong.length > 0) {
    const strongNames = strong.map(el => ELEMENT_INFO[el].name).join(", ");
    message = `${strongNames}의 기운이 강해요. 해당 분야에서 능력을 발휘하기 좋아요.`;
  } else if (weak.length > 0) {
    const weakNames = weak.map(el => ELEMENT_INFO[el].name).join(", ");
    message = `${weakNames}의 기운이 부족해요. 해당 분야를 의식적으로 보완하면 좋아요.`;
  }

  return { strong, weak, message };
}

export function ElementBalanceChart({ pillars, serverBalance }: ElementBalanceChartProps) {
  // 서버에서 계산된 오행 밸런스가 있으면 우선 사용, 없으면 클라이언트에서 계산
  const counts = serverBalance?.counts 
    ? (serverBalance.counts as Record<string, number>)
    : calculateElementBalance(pillars);
  
  const maxCount = Math.max(...Object.values(counts), 1);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  
  // 서버에서 계산된 분석 사용 또는 클라이언트에서 계산
  const analysis = serverBalance 
    ? { 
        strong: serverBalance.dominant, 
        weak: serverBalance.weak, 
        message: serverBalance.analysis 
      }
    : getBalanceAnalysis(counts);

  return (
    <div className="space-y-4">
      {/* 원형 요약 */}
      <div className="flex justify-center gap-3 flex-wrap">
        {ELEMENTS.map((element) => {
          const info = ELEMENT_INFO[element];
          const count = counts[element];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const isStrong = analysis.strong.includes(element);
          const isWeak = analysis.weak.includes(element);
          
          return (
            <div 
              key={element}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all",
                isStrong && "bg-primary/10 border border-primary/30",
                isWeak && "opacity-50"
              )}
            >
              <span className="text-2xl">{info.icon}</span>
              <span className={cn("text-xs font-medium mt-1", info.color)}>
                {info.name}
              </span>
              <span className="text-lg font-bold text-foreground">
                {count}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>

      {/* 바 차트 */}
      <div className="space-y-2">
        {ELEMENTS.map((element) => {
          const info = ELEMENT_INFO[element];
          const count = counts[element];
          const percentage = (count / maxCount) * 100;
          
          return (
            <div key={element} className="flex items-center gap-2">
              <span className={cn("w-12 text-xs font-medium text-right", info.color)}>
                {info.name}
              </span>
              <div className="flex-1 h-4 bg-card/50 rounded-full overflow-hidden border border-border/30">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", info.bgColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-6 text-xs text-muted-foreground text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* 분석 메시지 */}
      <div className="p-3 rounded-lg bg-card/50 border border-border/30">
        <p className="text-sm text-foreground/80 leading-relaxed">
          💡 {analysis.message}
        </p>
      </div>

      {/* 오행 의미 */}
      <div className="grid grid-cols-5 gap-1 text-center">
        {ELEMENTS.map((element) => {
          const info = ELEMENT_INFO[element];
          return (
            <div key={element} className="text-[10px] text-muted-foreground">
              {info.meaning}
            </div>
          );
        })}
      </div>
    </div>
  );
}
