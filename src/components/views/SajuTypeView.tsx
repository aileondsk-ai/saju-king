import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TimeInput } from "@/components/forms/TimeInput";
import { MBTISelector } from "@/components/saju-type/MBTISelector";
import { NewSajuTypeResultPage } from "@/components/saju-type/NewSajuTypeResultPage";
import { SajuTypeResultPage } from "@/components/saju-type/SajuTypeResultPage";
import { getSajuTypeByIlgan, SajuType } from "@/data/sajuTypes";
import { 
  calculateFourPillars, 
  parseDateString, 
  FourPillars,
} from "@/lib/saju-calculator";
import { Sparkles, Calendar, RotateCcw, Clock, ArrowRight, ArrowLeft, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { SajuTypeAnalysisResponse } from "@/types/saju-type-analysis";
import { toast } from "sonner";
import { AnalysisLoadingOverlay } from "@/components/ui/AnalysisLoadingOverlay";

type Step = "input" | "mbti" | "analyzing" | "result";

interface SajuTypeViewProps {
  initialMbti?: string;
  prefilledData?: {
    name: string;
    birthDate: string;
    birthTime?: string;
  };
}

export function SajuTypeView({ initialMbti, prefilledData }: SajuTypeViewProps) {
  const [step, setStep] = useState<Step>(initialMbti ? "mbti" : "input");
  const [birthDate, setBirthDate] = useState(prefilledData?.birthDate || "");
  const [birthTime, setBirthTime] = useState<string>(prefilledData?.birthTime || "");
  const [name, setName] = useState(prefilledData?.name || "");
  const [gender, setGender] = useState<string>("male");
  const [selectedMBTI, setSelectedMBTI] = useState<string | null>(initialMbti || null);
  const [pillars, setPillars] = useState<FourPillars | null>(null);
  const [sajuType, setSajuType] = useState<SajuType | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SajuTypeAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [useAIAnalysis, setUseAIAnalysis] = useState(true);

  // LocalStorage에서 기존 사용자 정보 로드
  useEffect(() => {
    if (!prefilledData) {
      const savedInfo = localStorage.getItem("sajuUserInfo");
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          if (parsed.name) setName(parsed.name);
          if (parsed.birthDate) setBirthDate(parsed.birthDate);
          if (parsed.birthTime) setBirthTime(parsed.birthTime);
          if (parsed.gender) setGender(parsed.gender);
        } catch (e) {
          console.error("Failed to parse saved user info");
        }
      }
    }
  }, [prefilledData]);

  const handleProceedToMBTI = () => {
    setError("");
    
    const parsed = parseDateString(birthDate);
    if (!parsed) {
      setError("올바른 생년월일을 입력해주세요 (예: 1995.03.15)");
      return;
    }

    // Save to localStorage
    localStorage.setItem("sajuUserInfo", JSON.stringify({
      name,
      birthDate,
      birthTime,
      gender,
    }));

    // 더 이상 프론트에서 4주 계산 안함 - 백엔드에서 계산
    setStep("mbti");
  };

  const handleMBTISelect = (mbti: string) => {
    setSelectedMBTI(mbti);
  };

  const handleProceedToResult = async () => {
    if (!selectedMBTI) return;
    
    const parsed = parseDateString(birthDate);
    if (!parsed) {
      toast.error("생년월일을 다시 확인해주세요.");
      return;
    }

    let hour: number | null = null;
    let minute: number = 0;

    if (birthTime && birthTime !== "unknown" && birthTime.includes(":")) {
      const [h, m] = birthTime.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        hour = h;
        minute = m;
      }
    }
    
    if (useAIAnalysis) {
      setStep("analyzing");
      
      try {
        // 백엔드에서 4주를 직접 계산하도록 생년월일 전달
        const { data, error } = await supabase.functions.invoke("saju-type-analysis", {
          body: {
            birthYear: parsed.year,
            birthMonth: parsed.month,
            birthDay: parsed.day,
            birthHour: hour,
            birthMinute: minute,
            gender,
            mbti: selectedMBTI,
            userName: name || undefined,
          },
        });

        if (error) {
          throw error;
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // 백엔드에서 받은 pillars 사용
        if (data.input_summary?.pillars) {
          setPillars(data.input_summary.pillars);
        }

        setAnalysisResult(data);
        setStep("result");
      } catch (e) {
        console.error("Analysis error:", e);
        toast.error("AI 분석에 실패했습니다. 다시 시도해주세요.");
        setStep("mbti");
      }
    } else {
      // 기본 분석은 더 이상 지원 안함 (AI 분석 필수)
      toast.error("AI 분석이 필요합니다.");
    }
  };

  const handleSkipMBTI = () => {
    setSelectedMBTI("ISFJ");
    setUseAIAnalysis(false);
    setStep("result");
  };

  const handleReset = () => {
    setBirthDate("");
    setBirthTime("");
    setName("");
    setGender("male");
    setSelectedMBTI(null);
    setPillars(null);
    setSajuType(null);
    setAnalysisResult(null);
    setError("");
    setUseAIAnalysis(true);
    setStep("input");
  };

  const handleBackToInput = () => {
    setStep("input");
  };

  const handleBackToMBTI = () => {
    setStep("mbti");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Loading Overlay */}
      {step === "analyzing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <AnalysisLoadingOverlay 
            title={`${name || ''}님의 사주 × MBTI 분석 중`}
            subtitle="AI가 동양의 지혜와 현대 심리학을 융합하고 있어요"
            type="saju"
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">MBTI × 사주 유형</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          MBTI와 사주를 교차 분석하여 나를 깊이 이해해요
        </p>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {["생년월일", "MBTI", "결과"].map((label, idx) => {
            const stepIdx = idx === 0 ? "input" : idx === 1 ? "mbti" : "result";
            const isActive = step === stepIdx || (step === "analyzing" && idx === 2);
            const isPast = 
              (step === "mbti" && idx === 0) || 
              (step === "analyzing" && idx < 2) ||
              (step === "result" && idx < 2);
            
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isPast && "bg-primary/30 text-primary",
                  !isActive && !isPast && "bg-muted text-muted-foreground"
                )}>
                  {step === "analyzing" && idx === 2 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={cn(
                  "text-xs hidden sm:inline",
                  isActive && "text-primary font-medium",
                  !isActive && "text-muted-foreground"
                )}>
                  {label}
                </span>
                {idx < 2 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Step 1: 생년월일 입력 */}
        {step === "input" && (
          <>
            <Card className="p-6 space-y-5 bg-card/80 backdrop-blur border-border/50 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  이름 (선택)
                </Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-foreground/80 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  생년월일 (양력)
                </Label>
                <Input
                  id="birthDate"
                  placeholder="19950315"
                  value={birthDate}
                  onChange={(e) => {
                    // 숫자만 추출
                    const digits = e.target.value.replace(/\D/g, '');
                    
                    // 최대 8자리까지만 허용
                    const limited = digits.slice(0, 8);
                    
                    // 자동 포맷팅: YYYY.MM.DD
                    let formatted = limited;
                    if (limited.length > 4) {
                      formatted = limited.slice(0, 4) + '.' + limited.slice(4);
                    }
                    if (limited.length > 6) {
                      formatted = limited.slice(0, 4) + '.' + limited.slice(4, 6) + '.' + limited.slice(6);
                    }
                    
                    setBirthDate(formatted);
                  }}
                  className="bg-background/50"
                  inputMode="numeric"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  8자리 숫자 입력 시 자동 변환 (예: 19950315 → 1995.03.15)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthTime" className="text-foreground/80 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  출생 시각 (선택)
                </Label>
                <TimeInput
                  value={birthTime === "unknown" ? "" : birthTime}
                  onChange={(value) => setBirthTime(value || "unknown")}
                />
                <p className="text-xs text-muted-foreground">
                  시간을 모르시면 비워두세요
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground/80">성별</Label>
                <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="text-sm">남성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="text-sm">여성</Label>
                  </div>
                </RadioGroup>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button 
                onClick={handleProceedToMBTI} 
                className="w-full"
                disabled={!birthDate}
              >
                다음: MBTI 선택하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>

            {/* Info Section */}
            <Card className="p-5 bg-card/50 border-border/30">
              <h3 className="font-semibold text-foreground mb-3">왜 MBTI와 사주를 함께 볼까요?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                MBTI는 현재 나의 성향을, 사주는 태어날 때 부여받은 기질을 보여줘요.
                둘을 교차 분석하면 더 입체적으로 나를 이해할 수 있어요.
              </p>
            </Card>
          </>
        )}

        {/* Step 2: MBTI 선택 */}
        {step === "mbti" && (
          <Card className="p-6 bg-card/80 backdrop-blur border-border/50 animate-in fade-in slide-in-from-right-4 duration-300">
            <MBTISelector 
              selectedMBTI={selectedMBTI} 
              onSelect={handleMBTISelect} 
              onSkip={handleSkipMBTI}
            />
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={handleBackToInput}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전
              </Button>
              <Button 
                onClick={handleProceedToResult}
                className="flex-1"
                disabled={!selectedMBTI}
              >
                AI 분석 시작
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: 결과 */}
        {step === "result" && analysisResult && selectedMBTI && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <NewSajuTypeResultPage
              pillars={analysisResult.input_summary.pillars}
              mbti={selectedMBTI}
              analysisResult={analysisResult}
              userName={name || undefined}
            />

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={handleBackToMBTI}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                MBTI 변경
              </Button>
              <Button 
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 하기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
