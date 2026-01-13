import { Button } from "@/components/ui/button";
import { MBTI_TYPES } from "@/data/sajuTypes";
import { cn } from "@/lib/utils";

interface MBTISelectorProps {
  selectedMBTI: string | null;
  onSelect: (mbti: string | null) => void;
  onSkip: () => void;
}

export function MBTISelector({ selectedMBTI, onSelect, onSkip }: MBTISelectorProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-foreground">당신의 MBTI는?</h3>
        <p className="text-sm text-muted-foreground">사주와 MBTI를 결합해 더 정확한 분석을 제공해요</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {MBTI_TYPES.map((mbti) => (
          <Button
            key={mbti}
            variant={selectedMBTI === mbti ? "default" : "outline"}
            className={cn(
              "h-12 text-sm font-medium transition-all",
              selectedMBTI === mbti
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/50 border-border text-foreground/80 hover:bg-card hover:border-primary/50"
            )}
            onClick={() => onSelect(mbti)}
          >
            {mbti}
          </Button>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          잘 모르겠어요 / 건너뛰기
        </button>
      </div>
    </div>
  );
}
