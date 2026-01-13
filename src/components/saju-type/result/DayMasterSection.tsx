import { Card } from "@/components/ui/card";
import { SajuAnalysisResult } from "@/types/saju-type-analysis";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayMasterSectionProps {
  dayMaster: SajuAnalysisResult["day_master"];
  className?: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  "목": "from-green-500/20 to-emerald-500/20 border-green-500/30",
  "화": "from-red-500/20 to-orange-500/20 border-red-500/30",
  "토": "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
  "금": "from-slate-400/20 to-zinc-400/20 border-slate-400/30",
  "수": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
};

const ELEMENT_TEXT: Record<string, string> = {
  "목": "text-green-400",
  "화": "text-red-400",
  "토": "text-amber-400",
  "금": "text-slate-300",
  "수": "text-blue-400",
};

export function DayMasterSection({ dayMaster, className }: DayMasterSectionProps) {
  const elementColor = ELEMENT_COLORS[dayMaster.element] || ELEMENT_COLORS["토"];
  const textColor = ELEMENT_TEXT[dayMaster.element] || ELEMENT_TEXT["토"];

  return (
    <Card className={cn(
      "p-6 bg-gradient-to-br border backdrop-blur",
      elementColor,
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">일간(日干) 본질</h2>
      </div>

      <div className="text-center mb-6">
        <div className={cn("text-5xl font-bold mb-2", textColor)}>
          {dayMaster.name}
        </div>
        <div className="text-lg text-foreground/80 font-medium">
          "{dayMaster.image}"
        </div>
      </div>

      <div className="p-4 rounded-lg bg-card/50 border border-border/30">
        <p className="text-sm text-foreground/80 leading-relaxed">
          {dayMaster.essence}
        </p>
      </div>
    </Card>
  );
}
