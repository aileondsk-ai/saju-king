import { useState, useRef, useMemo } from "react";
import { StarField } from "@/components/ui/StarField";
import { Sparkles, RefreshCw, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { SajuInputForm, SajuFormData } from "@/components/forms/SajuInputForm";
import { toast } from "sonner";
import { AnalysisLoadingOverlay } from "@/components/ui/AnalysisLoadingOverlay";
import { ConsultationCTA } from "@/components/ui/ConsultationCTA";
import { ShareResultButton } from "@/components/ui/ShareResultButton";

import { HeroSection } from "@/components/saju-result/HeroSection";
import { TabNavigation, SajuTabType } from "@/components/saju-result/TabNavigation";
import { ChartTab } from "@/components/saju-result/tabs/ChartTab";
import { PersonalityTab } from "@/components/saju-result/tabs/PersonalityTab";
import { RoadmapTab } from "@/components/saju-result/tabs/RoadmapTab";
import { YearlyTab } from "@/components/saju-result/tabs/YearlyTab";
import { ActionTab } from "@/components/saju-result/tabs/ActionTab";
import { normalizeSajuResult, NormalizedSajuResult, CalculationProof } from "@/lib/saju-result-normalizer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";


const ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saju-analysis`;

// 계산 근거 섹션
const CalculationProofSection = ({ proof }: { proof: CalculationProof }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const decisionLogLabels: Record<string, string> = {
    year_boundary: "연주 판정",
    month_boundary: "월주 판정",
    month_calc: "월주 계산",
    day_boundary: "일주 판정",
    hour_boundary: "시주 판정",
    KST: "시간 보정",
  };

  return (
    <section className="relative z-10 px-5 py-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-4 flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-foreground">계산 근거</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div
          className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              엔진 v{proof.engineVersion}
            </span>
            <span className="rounded-full border border-border/30 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground">
              절기 데이터 {proof.solarTermDataVersion}
            </span>
          </div>
          <div className="mb-4 rounded-xl border border-border/20 bg-secondary/20 p-3">
            <p className="mb-2 text-xs font-medium text-primary">📅 절기 참조</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {proof.references.ipchunAt && (
                <div className="flex justify-between">
                  <span>입춘 시각</span>
                  <span className="font-mono text-foreground">{proof.references.ipchunAt}</span>
                </div>
              )}
              {proof.references.monthTermStart && (
                <div className="flex justify-between">
                  <span>월 절기 시작</span>
                  <span className="font-mono text-foreground">{proof.references.monthTermStart}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-primary">🔍 판정 로그</p>
            <div className="space-y-2">
              {proof.decisionLog.map((log, i) => (
                <div key={i} className="rounded-lg border border-border/20 bg-secondary/20 p-2.5">
                  <p className="mb-1 text-xs font-medium text-foreground">
                    {decisionLogLabels[log.key] || log.key}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

interface SajuViewProps {
  onNavigateToChat?: (context: {
    userName: string;
    analysisType: string;
    summary: string;
    analysisData?: Record<string, unknown>;
    formData?: Record<string, unknown>;
  }) => void;
}

export const SajuView = ({ onNavigateToChat }: SajuViewProps) => {
  const [userData, setUserData] = useState<(SajuFormData & { id: string }) | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawResult, setRawResult] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState<SajuTabType>("chart");
  const resultRef = useRef<HTMLDivElement>(null);

  // 정규화된 결과 (메모이제이션)
  const result: NormalizedSajuResult | null = useMemo(() => {
    if (!rawResult) return null;
    return normalizeSajuResult(rawResult);
  }, [rawResult]);

  const handleFormSubmit = async (data: SajuFormData & { id: string }) => {
    setUserData(data);
    setIsAnalyzing(true);
    try {
      const response = await fetch(ANALYSIS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          name: data.name,
          gender: data.gender,
          birthDate: `${data.birthYear}-${data.birthMonth.padStart(2, "0")}-${data.birthDay.padStart(2, "0")}`,
          birthTime: data.birthHour || null,
          calendarType: data.calendarType,
        }),
      });
      if (!response.ok) {
        throw new Error((await response.json().catch(() => ({}))).error || "분석 중 오류가 발생했습니다.");
      }
      setRawResult(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.");
      setUserData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartConsultation = () => {
    if (result?.dayMaster && userData && onNavigateToChat) {
      const structureLabel = result.structure?.name || result.structure?.type || "(격국 정보 없음)";
      onNavigateToChat({
        userName: userData.name,
        analysisType: "saju",
        summary: `사주분석 결과 - 일간: ${result.dayMaster.stem}(${result.dayMaster.element}), 격국: ${structureLabel}`,
        analysisData: rawResult as Record<string, unknown>,
        formData: {
          gender: userData.gender,
          birthDate: `${userData.birthYear}-${userData.birthMonth}-${userData.birthDay}`,
          birthTime: userData.birthHour,
        },
      });
    }
  };

  const handleReset = () => {
    setUserData(null);
    setRawResult(null);
    setActiveTab("chart");
  };


  // 입력 폼
  if (!userData) {
    return (
      <div className="relative min-h-screen bg-background pb-24">
        <StarField />
        <header className="relative z-10 px-5 pb-4 pt-12">
          <div className="flex items-center gap-3">
            <div className="icon-circle h-10 w-10 p-2.5">
              <Sparkles className="h-full w-full text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">사주팔자 분석</h1>
              <p className="text-sm text-muted-foreground">생년월일을 입력해주세요</p>
            </div>
          </div>
        </header>
        <section className="relative z-10 px-5 py-4">
          <div className="fortune-card">
            <SajuInputForm onSubmit={handleFormSubmit} />
          </div>
        </section>
        <section className="relative z-10 px-5 py-4">
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              ✨ 입력하신 정보를 바탕으로 사주명식, 오행 밸런스, 성격 분석, 현재 운세 흐름을 AI가 상세히 분석해드려요
            </p>
          </div>
        </section>
      </div>
    );
  }

  // 분석 중
  if (isAnalyzing) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
        <StarField />
        <div className="relative z-10">
          <AnalysisLoadingOverlay
            title="사주를 분석하고 있어요"
            subtitle={`${userData.name}님의 사주팔자를 AI가 상세히 분석 중입니다`}
            type="saju"
          />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const formatBirthDate = () =>
    `${userData.birthYear}년 ${userData.birthMonth}월 ${userData.birthDay}일 (${userData.calendarType === "solar" ? "양력" : "음력"})`;

  // 영역별 운세 점수 계산
  const overallScore = result.areaFortunes
    ? Math.round(
        ((result.areaFortunes.wealth.grade +
          result.areaFortunes.career.grade +
          result.areaFortunes.health.grade +
          result.areaFortunes.relationship.grade) /
          4) *
          2
      )
    : undefined;

  // 전체 요약 자동 생성 (fullResultMarkdown이 없을 때 폴백)
  const generateAutoSummary = (): string | null => {
    if (result.fullResultMarkdown) return result.fullResultMarkdown;
    
    const parts: string[] = [];
    
    // 일간 설명
    if (result.dayMaster?.description) {
      parts.push(result.dayMaster.description);
    } else if (result.dayMaster) {
      parts.push(`${userData.name}님의 일간은 '${result.dayMaster.stem}(${result.dayMaster.element})'입니다.`);
    }
    
    // 격국 설명
    if (result.structure?.description) {
      parts.push(result.structure.description);
    }
    
    // 올해 운세 테마
    if (result.yearlyFortune?.description) {
      parts.push(result.yearlyFortune.description);
    }
    
    // 핵심 조언
    if (result.overallAdvice?.coreMessage) {
      parts.push(`📌 ${result.overallAdvice.coreMessage}`);
    }
    
    return parts.length > 0 ? parts.join("\n\n") : null;
  };

  const summaryContent = generateAutoSummary();

  // 결과 화면 (탭 기반)
  return (
    <div className="relative min-h-screen bg-background pb-28">
      <StarField />
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-gradient-to-b from-card/95 to-card/80 px-5 pb-4 pt-12 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="icon-circle h-11 w-11 p-2.5 shadow-lg">
                <Sparkles className="h-full w-full text-primary" />
              </div>
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">
                {userData.name}님의 사주팔자
              </h1>
              <p className="text-sm text-muted-foreground">{formatBirthDate()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShareResultButton
              targetRef={resultRef}
              fileName={`saju-${userData.name}`}
              title={`${userData.name}님의 사주 분석`}
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

      <div ref={resultRef}>
        {/* Hero Section */}
        <HeroSection
          userName={userData.name}
          birthInfo={formatBirthDate()}
          yearKeyword={result.yearlyFortune?.theme}
          overallScore={overallScore}
          dayMasterElement={
            result.dayMaster ? `${result.dayMaster.stem} (${result.dayMaster.element})` : undefined
          }
          structureType={result.structure?.name || result.structure?.type}
          saeun={result.saeun ?? undefined}
        />

        {/* 전체 요약 (fullResultMarkdown 또는 자동 생성) */}
        {summaryContent && (
          <section className="relative z-10 px-5 py-4">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
              <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                전체 요약
              </h3>
              <div className="prose prose-sm prose-invert max-w-none text-foreground/90">
                <p className="whitespace-pre-line leading-relaxed">{summaryContent}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "chart" && (
          <ErrorBoundary fallbackMessage="사주 차트 정보를 불러오는 중 오류가 발생했습니다.">
            <ChartTab
              pillars={result.sajuChart ?? undefined}
              dayMaster={result.dayMaster ?? undefined}
              elementBalance={result.elementBalance}
              elementBalanceAnalysis={result.elementBalanceAnalysis ?? undefined}
              tenGodDistribution={result.tenGodDistribution ?? undefined}
            />
          </ErrorBoundary>
        )}
        {activeTab === "personality" && (
          <ErrorBoundary fallbackMessage="성격 분석 정보를 불러오는 중 오류가 발생했습니다.">
            <PersonalityTab
              structure={result.structure ?? undefined}
              tenGodDistribution={result.tenGodDistribution ?? undefined}
            />
          </ErrorBoundary>
        )}
        {activeTab === "roadmap" && (
          <ErrorBoundary fallbackMessage="인생 로드맵 정보를 불러오는 중 오류가 발생했습니다.">
            <RoadmapTab
              daeun={result.daeun ?? undefined}
              currentLuckCycle={result.currentLuckCycle ?? undefined}
            />
          </ErrorBoundary>
        )}
        {activeTab === "yearly" && (
          <ErrorBoundary fallbackMessage="운세 정보를 불러오는 중 오류가 발생했습니다.">
            <YearlyTab
              yearlyFortune={result.yearlyFortune ?? undefined}
              areaFortunes={result.areaFortunes ?? undefined}
              luckyElements={result.luckyElements ?? undefined}
              saeun={result.saeun ?? undefined}
            />
          </ErrorBoundary>
        )}
        {activeTab === "action" && (
          <ErrorBoundary fallbackMessage="조언 정보를 불러오는 중 오류가 발생했습니다.">
            <ActionTab overallAdvice={result.overallAdvice ?? undefined} />
          </ErrorBoundary>
        )}

        {/* 스토리텔링 서술 */}
        {result.narrativeDescription && (
          <section className="relative z-10 px-5 py-4">
            <div className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {result.narrativeDescription}
              </p>
            </div>
          </section>
        )}

        {/* Disclaimer */}
        {result.disclaimer && (
          <section className="relative z-10 px-5 py-4">
            <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4">
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                {result.disclaimer}
              </p>
            </div>
          </section>
        )}

        {/* Calculation Proof - 맨 아래 */}
        {result.calculationProof && <CalculationProofSection proof={result.calculationProof} />}
      </div>

      {/* Consultation CTA */}
      {onNavigateToChat && (
        <ConsultationCTA
          userName={userData.name}
          analysisType="saju"
          onStartConsultation={handleStartConsultation}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
