import { useState, useRef } from "react";
import { StarField } from "@/components/ui/StarField";
import { Heart, RefreshCw } from "lucide-react";
import { CompatibilityInputForm, CompatibilityFormData } from "@/components/forms/CompatibilityInputForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnalysisLoadingOverlay } from "@/components/ui/AnalysisLoadingOverlay";
import { ConsultationCTA } from "@/components/ui/ConsultationCTA";
import { ShareResultButton } from "@/components/ui/ShareResultButton";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { normalizeCompatibilityResult, NormalizedCompatibilityResult } from "@/lib/saju-result-normalizer";


// 분리된 컴포넌트들
import { OverallScoreCard } from "@/components/compatibility/OverallScoreCard";
import { DetailScoresSection } from "@/components/compatibility/DetailScoresSection";
import { PersonStylesSection } from "@/components/compatibility/PersonStylesSection";
import { InteractionSection } from "@/components/compatibility/InteractionSection";
import { RelationshipAdviceSection } from "@/components/compatibility/RelationshipAdviceSection";
import { YearlyFortuneSection } from "@/components/compatibility/YearlyFortuneSection";
import {
  CompatibilityFormDataWithId,
  RELATION_LABELS,
} from "@/components/compatibility/types";

const ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compatibility-analysis`;

interface CompatibilityViewProps {
  onNavigateToChat?: (context: { userName: string; analysisType: string; summary: string; analysisData?: Record<string, unknown>; formData?: Record<string, unknown> }) => void;
}

export const CompatibilityView = ({ onNavigateToChat }: CompatibilityViewProps) => {
  const [formData, setFormData] = useState<CompatibilityFormDataWithId | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NormalizedCompatibilityResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = async (data: CompatibilityFormData & { id: string }) => {
    setFormData(data as CompatibilityFormDataWithId);
    setIsAnalyzing(true);

    try {
      const response = await fetch(ANALYSIS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          person1: {
            name: data.person1.name,
            gender: data.person1.gender,
            birthDate: `${data.person1.birthYear}-${data.person1.birthMonth.padStart(2, "0")}-${data.person1.birthDay.padStart(2, "0")}`,
            birthTime: data.person1.birthHour || null,
          },
          person2: {
            name: data.person2.name,
            gender: data.person2.gender,
            birthDate: `${data.person2.birthYear}-${data.person2.birthMonth.padStart(2, "0")}-${data.person2.birthDay.padStart(2, "0")}`,
            birthTime: data.person2.birthHour || null,
          },
          relationType: data.relationType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "분석 중 오류가 발생했습니다.");
      }

      const analysisResult = await response.json();

      // Debug logging
      try {
        console.log("compatibility-analysis response keys:", Object.keys(analysisResult ?? {}));
      } catch {
        // ignore
      }

      // 정규화 레이어 사용
      const normalizedResult = normalizeCompatibilityResult(analysisResult);
      setResult(normalizedResult);
    } catch (error) {
      console.error("Compatibility analysis error:", error);
      toast.error(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.");
      setFormData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const handleStartConsultation = () => {
    if (result && formData && onNavigateToChat) {
      const summary = `궁합분석 결과 - ${formData.person1.name}님과 ${formData.person2.name}님의 ${RELATION_LABELS[formData.relationType]} 궁합: ${result.overallScore}점`;
      onNavigateToChat({
        userName: formData.person1.name,
        analysisType: "compatibility",
        summary,
        analysisData: result as unknown as Record<string, unknown>,
        formData: {
          relationType: formData.relationType,
          person1Name: formData.person1.name,
          person1Gender: formData.person1.gender,
          person1BirthDate: `${formData.person1.birthYear}-${formData.person1.birthMonth}-${formData.person1.birthDay}`,
          person2Name: formData.person2.name,
          person2Gender: formData.person2.gender,
          person2BirthDate: `${formData.person2.birthYear}-${formData.person2.birthMonth}-${formData.person2.birthDay}`,
        },
      });
    }
  };

  const handleReset = () => {
    setFormData(null);
    setResult(null);
  };


  // 입력 폼 화면
  if (!formData) {
    return (
      <div className="relative min-h-screen bg-background pb-24">
        <StarField />
        <header className="relative z-10 px-5 pb-4 pt-12">
          <div className="flex items-center gap-3">
            <div className="icon-circle h-10 w-10 p-2.5">
              <Heart className="h-full w-full text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">궁합 분석</h1>
              <p className="text-sm text-muted-foreground">두 사람의 정보를 입력해주세요</p>
            </div>
          </div>
        </header>
        <section className="relative z-10 px-5 py-4">
          <div className="fortune-card">
            <CompatibilityInputForm onSubmit={handleFormSubmit} />
          </div>
        </section>
      </div>
    );
  }

  // 분석 중 화면
  if (isAnalyzing) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
        <StarField />
        <div className="relative z-10">
          <AnalysisLoadingOverlay
            title="궁합을 분석하고 있어요"
            subtitle={`${formData.person1.name}님과 ${formData.person2.name}님의 사주를 비교 분석 중입니다`}
            type="compatibility"
          />
        </div>
      </div>
    );
  }

  // 결과가 없으면 에러 화면
  if (!result) {
    return (
      <div className="relative min-h-screen bg-background pb-24">
        <StarField />
        <header className="relative z-10 px-5 pb-4 pt-12">
          <div className="flex items-center gap-3">
            <div className="icon-circle h-10 w-10 p-2.5">
              <Heart className="h-full w-full text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">궁합 분석</h1>
              <p className="text-sm text-muted-foreground">결과를 불러오지 못했어요</p>
            </div>
          </div>
        </header>
        <main className="relative z-10 px-5 py-6">
          <div className="fortune-card p-5">
            <p className="text-sm text-foreground/80">응답 형식이 예상과 달라 화면 표시가 중단되었습니다. 다시 분석을 시도해주세요.</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleReset}>다시 분석하기</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 결과 화면
  return (
    <div className="relative min-h-screen bg-background pb-28">
      <StarField />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-gradient-to-b from-card/95 to-card/80 px-5 pb-4 pt-12 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="icon-circle h-11 w-11 p-2.5 shadow-lg">
                <Heart className="h-full w-full text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-card bg-primary text-[8px] text-primary-foreground">✓</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">궁합 분석 결과</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                {formData.person1.name}님 & {formData.person2.name}님
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShareResultButton
              targetRef={resultRef}
              fileName={`compatibility-${formData.person1.name}-${formData.person2.name}`}
              title={`${formData.person1.name}님과 ${formData.person2.name}님의 궁합`}
            />
            <button
              onClick={handleReset}
              className="rounded-xl border border-border/50 bg-secondary/30 p-2.5 text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-foreground"
              title="다시 분석하기"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 결과 컨테이너 (이미지 캡처용) */}
      <div ref={resultRef} className="relative z-10">
        {/* Overall Score */}
        <section className="px-5 pt-5 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <ErrorBoundary fallbackMessage="종합 점수를 불러오는 중 오류가 발생했습니다.">
            <OverallScoreCard
              score={result.overallScore}
              comment={result.overallComment}
              person1Name={formData.person1.name}
              person2Name={formData.person2.name}
              relationType={formData.relationType}
              relationLabel={RELATION_LABELS[formData.relationType] ?? formData.relationType}
            />
          </ErrorBoundary>
        </section>

        {/* Detail Scores */}
        <ErrorBoundary fallbackMessage="세부 점수를 불러오는 중 오류가 발생했습니다.">
          <DetailScoresSection details={result.details} />
        </ErrorBoundary>

        {/* Person Styles */}
        <ErrorBoundary fallbackMessage="관계 스타일 정보를 불러오는 중 오류가 발생했습니다.">
          <PersonStylesSection
            person1Name={formData.person1.name}
            person2Name={formData.person2.name}
            personAStyle={result.personAStyle}
            personBStyle={result.personBStyle}
          />
        </ErrorBoundary>

        {/* Interaction Analysis */}
        <ErrorBoundary fallbackMessage="상호작용 분석을 불러오는 중 오류가 발생했습니다.">
          {result.interaction && <InteractionSection interaction={result.interaction} />}
        </ErrorBoundary>

        {/* Relationship Advice */}
        <ErrorBoundary fallbackMessage="관계 조언을 불러오는 중 오류가 발생했습니다.">
          {result.relationshipAdvice && <RelationshipAdviceSection advice={result.relationshipAdvice} />}
        </ErrorBoundary>

        {/* Yearly Fortune */}
        <ErrorBoundary fallbackMessage="연간 운세를 불러오는 중 오류가 발생했습니다.">
          {result.yearlyFortune && (
            <YearlyFortuneSection
              fortune={result.yearlyFortune}
              person1Name={formData.person1.name}
              person2Name={formData.person2.name}
            />
          )}
        </ErrorBoundary>

        {/* Ethics Notice */}
        {result.ethicsNotice && (
          <section className="px-5 py-4">
            <div className="rounded-2xl border border-muted/30 bg-muted/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                ⚖️ {result.ethicsNotice}
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Consultation CTA */}
      {onNavigateToChat && (
        <ConsultationCTA
          userName={formData.person1.name}
          analysisType="compatibility"
          onStartConsultation={handleStartConsultation}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
