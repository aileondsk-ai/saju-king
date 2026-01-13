import { useState, useEffect, useRef } from "react";
import { Star, RefreshCw, Sparkles, Heart, Share2, Wallet, Briefcase, Users, Download, Loader2, Check, Image, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  getUserBirthInfo,
  getCachedFortune,
  cacheDailyFortune,
  clearUserBirthInfo,
} from "@/lib/daily-fortune-storage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FortuneShareCard } from "./FortuneShareCard";
import html2canvas from "html2canvas";

interface DailyFortuneResultProps {
  onNavigate: (tab: string) => void;
  onReset: () => void;
}

interface FortuneData {
  date: {
    display: string;
    weekday: string;
    ganji: string;
  };
  user: {
    name: string;
    birthYear: number;
    zodiac: string;
  };
  fortune: {
    keyword: string;
    score: number;
    grade: string;
    description: string;
    areas: {
      wealth: { score: number; label: string };
      work: { score: number; label: string };
      relationship: { score: number; label: string };
    };
    tip: string;
    lucky: {
      color: string;
      colorCode: string;
      numbers: number[];
    };
  };
}

const AreaScoreCard = ({
  icon: Icon,
  label,
  score,
  scoreLabel,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  scoreLabel: string;
  delay?: number;
}) => {
  return (
    <div 
      className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-500",
              i < score ? "bg-primary scale-100" : "bg-muted/30 scale-75"
            )}
            style={{ transitionDelay: `${delay + i * 100}ms` }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-foreground">{scoreLabel}</span>
    </div>
  );
};

// Skeleton Components
const SkeletonCard = () => (
  <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/50 p-6">
    <div className="flex flex-col items-center gap-4">
      <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
      <div className="h-8 w-48 animate-pulse rounded bg-muted/30" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-6 animate-pulse rounded-full bg-muted/30" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="h-10 w-20 animate-pulse rounded bg-muted/30" />
      <div className="mt-2 space-y-2 w-full">
        <div className="h-4 w-full animate-pulse rounded bg-muted/20" />
        <div className="h-4 w-3/4 mx-auto animate-pulse rounded bg-muted/20" />
        <div className="h-4 w-5/6 mx-auto animate-pulse rounded bg-muted/20" />
      </div>
      <div className="mt-4 grid w-full grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/20" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

const SkeletonTip = () => (
  <div className="rounded-xl border border-border/30 bg-card/40 p-4">
    <div className="flex items-start gap-2">
      <div className="h-4 w-4 animate-pulse rounded bg-muted/30" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-muted/30" />
        <div className="h-4 w-full animate-pulse rounded bg-muted/20" />
      </div>
    </div>
  </div>
);

const SkeletonLucky = () => (
  <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/30 px-4 py-3">
    <div className="flex items-center gap-2">
      <div className="h-5 w-5 animate-pulse rounded-full bg-muted/30" />
      <div className="h-4 w-20 animate-pulse rounded bg-muted/20" />
    </div>
    <div className="h-5 w-px bg-border/30" />
    <div className="flex items-center gap-2">
      <div className="h-5 w-5 animate-pulse rounded-full bg-muted/30" />
      <div className="h-4 w-12 animate-pulse rounded bg-muted/20" />
    </div>
  </div>
);

export const DailyFortuneResult = ({ onNavigate, onReset }: DailyFortuneResultProps) => {
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFortune();
  }, []);

  const fetchFortune = async () => {
    setLoading(true);
    setError(null);

    const cached = getCachedFortune();
    if (cached) {
      setFortune(cached);
      setLoading(false);
      return;
    }

    const userInfo = getUserBirthInfo();
    if (!userInfo) {
      setError("생년월일 정보가 없습니다");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("daily-fortune", {
        body: {
          birthDate: userInfo.birthDate,
          name: userInfo.name,
        },
      });

      if (fetchError) throw fetchError;

      if (data?.success && data?.data) {
        setFortune(data.data);
        cacheDailyFortune(data.data);
      } else {
        throw new Error(data?.error || "운세를 불러올 수 없습니다");
      }
    } catch (err) {
      console.error("Fortune fetch error:", err);
      setError(err instanceof Error ? err.message : "운세를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const captureShareCard = async (): Promise<Blob | null> => {
    if (!shareCardRef.current) return null;

    setIsCapturing(true);
    setShowShareCard(true);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          setShowShareCard(false);
          setIsCapturing(false);
          resolve(blob);
        }, "image/png", 1.0);
      });
    } catch (error) {
      console.error("Capture error:", error);
      setShowShareCard(false);
      setIsCapturing(false);
      toast({
        title: "오류",
        description: "이미지 생성 중 오류가 발생했습니다",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageDownload = async () => {
    const blob = await captureShareCard();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `오늘의운세-${fortune?.date.display.replace(/\s/g, "")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "저장 완료",
      description: "이미지가 저장되었습니다",
    });
  };

  const handleImageShare = async () => {
    const blob = await captureShareCard();
    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], "오늘의운세.png", { type: "image/png" });
      
      try {
        await navigator.share({
          title: "오늘의 운세",
          text: `✨ "${fortune?.fortune.keyword}" - ${fortune?.fortune.score}점`,
          files: [file],
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleImageDownload();
        }
      }
    } else {
      handleImageDownload();
    }
  };

  const handleTextShare = async () => {
    if (!fortune) return;

    const shareText = `📅 ${fortune.date.display}
✨ "${fortune.fortune.keyword}"
⭐ ${fortune.fortune.score}점

💰${fortune.fortune.areas.wealth.label} 💼${fortune.fortune.areas.work.label} 💕${fortune.fortune.areas.relationship.label}

나도 오늘 운세 보기 👉 ${window.location.origin}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "오늘의 운세",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "복사 완료",
          description: "운세가 클립보드에 복사되었습니다",
        });
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleReset = () => {
    clearUserBirthInfo();
    onReset();
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm space-y-4">
        {/* Date Skeleton */}
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/30" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-muted/20" />
        </div>
        
        <SkeletonCard />
        <SkeletonTip />
        <SkeletonLucky />
        
        {/* CTA Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-xl bg-muted/20" />
          <div className="h-24 animate-pulse rounded-xl bg-muted/20" />
        </div>
        
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          ✨ 오늘의 운세를 불러오는 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchFortune}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (!fortune) return null;

  const starCount = Math.round(fortune.fortune.score / 20);

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Hidden Share Card for Capture */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        {showShareCard && fortune && (
          <FortuneShareCard ref={shareCardRef} fortune={fortune} />
        )}
      </div>

      {/* Date & Reset */}
      <div className="flex items-center justify-between px-1 animate-fade-in">
        <span className="text-sm font-medium text-foreground">{fortune.date.display}</span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          생년월일 변경
        </button>
      </div>

      {/* Main Fortune Card */}
      <div 
        className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 p-6 shadow-xl shadow-primary/5 animate-scale-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="text-center">
          <p className="text-xs tracking-wide text-muted-foreground animate-fade-in" style={{ animationDelay: "200ms" }}>
            오늘의 키워드
          </p>
          <h2 
            className="mt-3 font-serif text-2xl font-bold text-gradient-gold animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            ✨ {fortune.fortune.keyword}
          </h2>

          {/* Star Rating */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-6 w-6 transition-all duration-500 animate-scale-in",
                    i < starCount
                      ? "fill-primary text-primary drop-shadow-sm"
                      : "text-muted/40"
                  )}
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                />
              ))}
            </div>
            <span 
              className="text-3xl font-bold tracking-tight text-foreground animate-fade-in"
              style={{ animationDelay: "900ms" }}
            >
              {fortune.fortune.score}점
            </span>
          </div>
        </div>

        {/* Description */}
        <p 
          className="mt-5 text-center text-sm leading-relaxed text-foreground/85 animate-fade-in"
          style={{ animationDelay: "1000ms" }}
        >
          {fortune.fortune.description}
        </p>

        {/* Area Scores */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <AreaScoreCard
            icon={Wallet}
            label="재물"
            score={fortune.fortune.areas.wealth.score}
            scoreLabel={fortune.fortune.areas.wealth.label}
            delay={1100}
          />
          <AreaScoreCard
            icon={Briefcase}
            label="일"
            score={fortune.fortune.areas.work.score}
            scoreLabel={fortune.fortune.areas.work.label}
            delay={1200}
          />
          <AreaScoreCard
            icon={Users}
            label="관계"
            score={fortune.fortune.areas.relationship.score}
            scoreLabel={fortune.fortune.areas.relationship.label}
            delay={1300}
          />
        </div>
      </div>

      {/* Tip Card */}
      <div 
        className="rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm animate-fade-in"
        style={{ animationDelay: "1400ms" }}
      >
        <div className="flex items-start gap-2">
          <span className="text-base">💡</span>
          <div>
            <p className="text-xs font-medium text-primary">오늘의 한마디</p>
            <p className="mt-1 text-sm text-foreground">"{fortune.fortune.tip}"</p>
          </div>
        </div>
      </div>

      {/* Lucky Elements */}
      <div 
        className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3 animate-fade-in"
        style={{ animationDelay: "1500ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🎨</span>
          <span className="text-xs text-muted-foreground">행운의 색</span>
          <div
            className="ml-1 h-5 w-5 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: fortune.fortune.lucky.colorCode }}
          />
          <span className="text-sm font-medium text-foreground">{fortune.fortune.lucky.color}</span>
        </div>
        <div className="h-5 w-px bg-border/50" />
        <div className="flex items-center gap-2">
          <span className="text-sm">🔢</span>
          <span className="text-sm font-medium text-foreground">
            {fortune.fortune.lucky.numbers.join(", ")}
          </span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onNavigate("saju")}
          className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-card/80 p-3 text-center transition-all hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/10 hover-scale animate-fade-in"
          style={{ animationDelay: "1600ms" }}
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">사주 분석</p>
            <p className="text-[10px] text-muted-foreground">타고난 운명</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate("compatibility")}
          className="flex flex-col items-center gap-2 rounded-xl border border-pink-500/20 bg-card/80 p-3 text-center transition-all hover:border-pink-500/40 hover:bg-card hover:shadow-lg hover:shadow-pink-500/10 hover-scale animate-fade-in"
          style={{ animationDelay: "1700ms" }}
        >
          <Heart className="h-5 w-5 text-pink-400" />
          <div>
            <p className="text-xs font-semibold text-foreground">궁합 분석</p>
            <p className="text-[10px] text-muted-foreground">우리의 케미</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate("saju-type")}
          className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/20 bg-card/80 p-3 text-center transition-all hover:border-amber-500/40 hover:bg-card hover:shadow-lg hover:shadow-amber-500/10 hover-scale animate-fade-in"
          style={{ animationDelay: "1800ms" }}
        >
          <Zap className="h-5 w-5 text-amber-400" />
          <div>
            <p className="text-xs font-semibold text-foreground">MBTI×사주</p>
            <p className="text-[10px] text-muted-foreground">유형 분석</p>
          </div>
        </button>
      </div>

      {/* Share Buttons */}
      <div 
        className="grid grid-cols-2 gap-2 animate-fade-in"
        style={{ animationDelay: "1900ms" }}
      >
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-card/40 hover:bg-card/60"
          onClick={handleImageShare}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Image className="h-4 w-4" />
          )}
          이미지로 공유
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-card/40 hover:bg-card/60"
          onClick={handleTextShare}
        >
          <Share2 className="h-4 w-4" />
          텍스트로 공유
        </Button>
      </div>
    </div>
  );
};
