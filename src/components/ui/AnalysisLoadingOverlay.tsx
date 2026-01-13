import { useState, useEffect, forwardRef } from "react";
import { Sparkles, Moon, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AnalysisLoadingOverlayProps {
  title: string;
  subtitle?: string;
  type?: "saju" | "compatibility";
}

const sajuSteps: LoadingStep[] = [
  { id: "birth", label: "생년월일시 확인", icon: <Moon className="h-4 w-4" /> },
  { id: "chart", label: "사주 명식 계산", icon: <Sparkles className="h-4 w-4" /> },
  { id: "element", label: "오행 분포 분석", icon: <Star className="h-4 w-4" /> },
  { id: "daymaster", label: "일간 강약 판단", icon: <Moon className="h-4 w-4" /> },
  { id: "yongsin", label: "용신 도출", icon: <Sparkles className="h-4 w-4" /> },
  { id: "fortune", label: "운세 해석 생성", icon: <Star className="h-4 w-4" /> },
  { id: "result", label: "결과 정리", icon: <Sparkles className="h-4 w-4" /> },
];

const compatibilitySteps: LoadingStep[] = [
  { id: "person1", label: "첫 번째 사주 계산", icon: <Moon className="h-4 w-4" /> },
  { id: "person2", label: "두 번째 사주 계산", icon: <Moon className="h-4 w-4" /> },
  { id: "element", label: "오행 상성 분석", icon: <Sparkles className="h-4 w-4" /> },
  { id: "compatibility", label: "궁합 점수 산출", icon: <Star className="h-4 w-4" /> },
  { id: "advice", label: "조언 생성", icon: <Sparkles className="h-4 w-4" /> },
  { id: "result", label: "결과 정리", icon: <Star className="h-4 w-4" /> },
];

const funFacts = [
  "사주명리학은 3,000년 이상의 역사를 가지고 있어요 ✨",
  "천간과 지지는 우주의 기운을 담고 있어요 🌙",
  "오행의 조화가 삶의 균형을 결정해요 ☯️",
  "대운은 10년마다 변화하는 인생의 큰 흐름이에요 🌊",
  "용신은 당신의 사주를 빛나게 하는 요소예요 💫",
  "생년월일시에는 하늘의 메시지가 담겨있어요 🌟",
  "좋은 운은 준비된 사람에게 찾아온답니다 🍀",
  "음양의 조화가 만물의 근본이에요 ☀️🌙",
];

export const AnalysisLoadingOverlay = forwardRef<HTMLDivElement, AnalysisLoadingOverlayProps>(
  ({ title, subtitle, type = "saju" }, ref) => {
    const steps = type === "saju" ? sajuSteps : compatibilitySteps;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentFact, setCurrentFact] = useState(funFacts[0]);

  // 단계별 진행 (90초 기준으로 조정)
  useEffect(() => {
    const totalDuration = 90; // 총 예상 시간 90초
    const stepDuration = (totalDuration / steps.length) * 1000; // 각 단계별 소요 시간
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // 90초 동안 95%까지 진행 (매 100ms마다 약 0.1% 증가)
        const increment = 95 / (totalDuration * 10);
        if (prev >= 95) return 95;
        return prev + increment;
      });
    }, 100);

    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, stepDuration);

    const elapsedTimer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepTimer);
      clearInterval(elapsedTimer);
    };
  }, [steps.length]);

  // 재미있는 사실 변경
  useEffect(() => {
    const factTimer = setInterval(() => {
      setCurrentFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    }, 5000);

    return () => clearInterval(factTimer);
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center px-6 text-center">
      {/* 메인 애니메이션 아이콘 */}
      <div className="relative mb-8">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* 바깥 링 애니메이션 */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" style={{ animationDuration: "3s" }} />
          {/* 안쪽 링 */}
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-gold-light" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
          {/* 중앙 아이콘 */}
          <Moon className="h-10 w-10 animate-pulse text-primary" />
        </div>
        {/* 빛나는 효과 */}
        <div className="absolute inset-0 animate-pulse-glow rounded-full" />
      </div>

      {/* 제목 */}
      <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
      )}

      {/* 진행률 바 */}
      <div className="mb-4 w-full max-w-xs">
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{elapsedTime}초 경과</span>
          <span>약 90초 소요</span>
        </div>
      </div>

      {/* 단계별 표시 */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-300",
              index < currentStepIndex
                ? "bg-primary/20 text-primary"
                : index === currentStepIndex
                  ? "animate-pulse border border-primary bg-primary/10 text-primary"
                  : "bg-secondary/30 text-muted-foreground"
            )}
          >
            {step.icon}
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {/* 재미있는 사실 */}
      <div className="min-h-[48px] rounded-xl border border-border/50 bg-secondary/20 px-4 py-3">
        <p className="animate-fade-in text-sm text-muted-foreground" key={currentFact}>
          {currentFact}
        </p>
      </div>
    </div>
  );
  }
);

AnalysisLoadingOverlay.displayName = "AnalysisLoadingOverlay";
