import { useState, useEffect } from "react";
import { StarField } from "@/components/ui/StarField";
import { Sparkles, Heart, MessageCircle, ChevronRight, Calendar, Star } from "lucide-react";
import { getUserBirthInfo } from "@/lib/daily-fortune-storage";
import { BirthDateInputModal } from "@/components/daily-fortune/BirthDateInputModal";
import { DailyFortuneResult } from "@/components/daily-fortune/DailyFortuneResult";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView = ({ onNavigate }: HomeViewProps) => {
  const [hasBirthInfo, setHasBirthInfo] = useState<boolean | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);

  useEffect(() => {
    const info = getUserBirthInfo();
    setHasBirthInfo(!!info);
  }, []);

  const handleBirthInfoSubmit = () => {
    setShowInputModal(false);
    setHasBirthInfo(true);
  };

  const handleReset = () => {
    setHasBirthInfo(false);
  };

  // 로딩 중
  if (hasBirthInfo === null) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        <StarField />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
      <StarField />
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary/90 via-gold-dark/80 to-primary/90 backdrop-blur-md border-b border-primary/20 shadow-lg shadow-primary/10">
        <div className="flex items-center justify-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/20 backdrop-blur-sm">
            <span className="font-serif text-lg font-bold text-primary-foreground">王</span>
          </div>
          <div className="text-center">
            <h1 className="font-serif text-lg font-bold text-primary-foreground">사주킹</h1>
            <div className="flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-primary-foreground/80">AI 사주 분석 서비스</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 bg-gradient-celestial opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center px-4 pt-6">
        {hasBirthInfo ? (
          /* 오늘의 운세 결과 */
          <DailyFortuneResult onNavigate={onNavigate} onReset={handleReset} />
        ) : (
          /* 온보딩 화면 */
          <>
            {/* Hero Card */}
            <div className="w-full max-w-sm mb-5 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 p-6 shadow-lg backdrop-blur-sm">
                <h2 className="font-serif text-xl leading-relaxed text-foreground text-center">
                  나의 <span className="text-gradient-gold">사주팔자</span>가<br />궁금하신가요?
                </h2>
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  생년월일시로 타고난 운명을 분석해 드려요
                </p>
              </div>
            </div>

            {/* 오늘의 운세 CTA - 강조 */}
            <div className="w-full max-w-sm mb-5 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
              <button
                onClick={() => setShowInputModal(true)}
                className="group relative w-full overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-r from-primary/20 via-gold-dark/10 to-primary/20 p-5 text-left shadow-xl shadow-primary/10 transition-all hover:shadow-2xl hover:shadow-primary/20"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-dark shadow-lg">
                    <Calendar className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">✨ 오늘의 운세 보기</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">생년월일만 입력하면 바로 확인!</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {/* 분석 서비스 */}
            <div className="w-full max-w-sm space-y-3 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <h3 className="text-sm font-medium text-foreground">분석 서비스</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigate("saju")}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-card/80 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-gold-dark/20 border border-primary/20 transition-transform group-hover:scale-110">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">사주 분석</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">나의 타고난 운명</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate("compatibility")}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-pink-500/20 bg-card/80 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:border-pink-500/40 hover:bg-card hover:shadow-lg hover:shadow-pink-500/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-lavender/20 border border-pink-500/20 transition-transform group-hover:scale-110">
                    <Heart className="h-6 w-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">궁합 분석</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">두 사람의 인연</p>
                  </div>
                </button>
              </div>

              {/* MBTI x 사주 유형 */}
              <button
                onClick={() => onNavigate("sajuType")}
                className="group col-span-2 flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 text-left shadow-sm backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 transition-transform group-hover:scale-110">
                  <Star className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">MBTI × 사주 유형</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">MBTI와 함께보는 나의 사주 유형</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
              </button>

              {/* 프리미엄 사주 배너 - 임시 숨김 */}
              {/* TODO: 결제 기능 완성 후 다시 활성화 */}
            </div>

            {/* AI 상담 */}
            <div className="w-full max-w-sm mt-5 space-y-3 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">상담 서비스</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-muted/40 to-transparent" />
              </div>

              <button
                onClick={() => onNavigate("chat")}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 text-left shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/80 border border-border transition-colors group-hover:border-primary/30">
                  <MessageCircle className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">AI 상담</p>
                  <p className="text-sm text-muted-foreground">고민 상담하기</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            </div>

            {/* Footer */}
            <div className="w-full max-w-sm mt-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}>
              <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-center text-xs text-muted-foreground">
                  ✨ 무료 · 회원가입 없음 · 약 90초 분석
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Birth Date Input Modal */}
      <BirthDateInputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        onSubmit={handleBirthInfoSubmit}
      />
    </div>
  );
};
