import { useState, useEffect } from "react";
import { z } from "zod";
import { Heart, Calendar, Clock, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/forms/TimeInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserBirthInfo, parseBirthDate } from "@/lib/daily-fortune-storage";
const personSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요").max(50),
  gender: z.enum(["male", "female"]),
  birthYear: z.string().regex(/^\d{4}$/),
  birthMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/),
  birthDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/),
  birthHour: z.string().optional(),
  calendarType: z.enum(["solar", "lunar"]),
});

const compatibilitySchema = z.object({
  person1: personSchema,
  person2: personSchema,
  relationType: z.enum(["lover", "friend", "family", "business"]),
});

export type CompatibilityFormData = z.infer<typeof compatibilitySchema>;

interface CompatibilityInputFormProps {
  onSubmit: (data: CompatibilityFormData & { id: string }) => void;
}

// HH:mm 직접 입력 방식으로 변경 - 시진 범위 선택 제거

const relationTypes = [
  { value: "lover", label: "연인", icon: "💕" },
  { value: "friend", label: "친구", icon: "🤝" },
  { value: "family", label: "가족", icon: "👨‍👩‍👧" },
  { value: "business", label: "비즈니스", icon: "💼" },
];

const emptyPerson = {
  name: "",
  gender: "" as "male" | "female" | "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  birthHour: "",
  calendarType: "solar" as "solar" | "lunar",
};

export const CompatibilityInputForm = ({ onSubmit }: CompatibilityInputFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 본인, 2: 상대방
  const [person1, setPerson1] = useState(emptyPerson);
  const [person2, setPerson2] = useState(emptyPerson);
  const [relationType, setRelationType] = useState<"lover" | "friend" | "family" | "business">("lover");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prefilled, setPrefilled] = useState(false);

  // 오늘의 운세에서 저장된 생년월일 자동 채우기 (본인 정보만)
  useEffect(() => {
    const userInfo = getUserBirthInfo();
    if (userInfo && !prefilled) {
      const parsed = parseBirthDate(userInfo.birthDate);
      if (parsed) {
        setPerson1(prev => ({
          ...prev,
          name: userInfo.name,
          birthYear: parsed.year,
          birthMonth: parsed.month,
          birthDay: parsed.day,
        }));
        setPrefilled(true);
      }
    }
  }, [prefilled]);

  const currentPerson = step === 1 ? person1 : person2;
  const setCurrentPerson = step === 1 ? setPerson1 : setPerson2;

  const handleChange = (field: string, value: string) => {
    setCurrentPerson((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validatePerson = () => {
    const result = personSchema.safeParse(currentPerson);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validatePerson()) return;
    setErrors({});
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePerson()) return;

    setIsLoading(true);

    try {
      const formatDate = (p: typeof person1) =>
        `${p.birthYear}-${p.birthMonth.padStart(2, "0")}-${p.birthDay.padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("compatibility_requests")
        .insert({
          person1_name: person1.name.trim(),
          person1_gender: person1.gender,
          person1_birth_date: formatDate(person1),
          person1_birth_time: person1.birthHour || null,
          person1_calendar_type: person1.calendarType,
          person2_name: person2.name.trim(),
          person2_gender: person2.gender,
          person2_birth_date: formatDate(person2),
          person2_birth_time: person2.birthHour || null,
          person2_calendar_type: person2.calendarType,
          relation_type: relationType,
        })
        .select()
        .single();

      if (error) throw error;

      onSubmit({
        person1: person1 as z.infer<typeof personSchema>,
        person2: person2 as z.infer<typeof personSchema>,
        relationType,
        id: data.id,
      });
    } catch (error) {
      console.error("Error saving compatibility request:", error);
      toast({
        title: "오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 1 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
            1
          </div>
          <span className="text-sm font-medium">본인 정보</span>
        </div>
        <div className="h-px w-8 bg-border" />
        <div className={`flex items-center gap-2 ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 2 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
            2
          </div>
          <span className="text-sm font-medium">상대방 정보</span>
        </div>
      </div>

      {/* Relation Type (Step 1 only) */}
      {step === 1 && (
        <>
          {/* Prefill Notice */}
          {prefilled && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-center text-sm text-primary">
                ✨ 오늘의 운세에서 입력한 정보가 자동으로 채워졌어요
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              관계 유형
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {relationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setRelationType(type.value as typeof relationType)}
                  className={`fortune-card py-3 text-center transition-all ${
                    relationType === type.value
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="text-lg">{type.icon}</div>
                  <span className="text-xs text-foreground">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Person Info Header */}
      <div className="rounded-xl bg-secondary/30 p-3 text-center">
        <p className="text-sm text-muted-foreground">
          {step === 1 ? "👤 본인 정보를 입력해주세요" : "💕 상대방 정보를 입력해주세요"}
        </p>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-primary" />
            이름
          </Label>
          <Input
            id="name"
            placeholder="이름을 입력해주세요"
            value={currentPerson.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="bg-secondary/50 border-border"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label className="text-foreground">성별</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "male", label: "남성" },
              { value: "female", label: "여성" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("gender", option.value)}
                className={`fortune-card py-3 text-center transition-all ${
                  currentPerson.gender === option.value
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/50"
                }`}
              >
                <span className="font-medium text-foreground">{option.label}</span>
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-sm text-destructive">성별을 선택해주세요</p>}
        </div>

        {/* Calendar Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            양력/음력
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "solar", label: "양력" },
              { value: "lunar", label: "음력" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("calendarType", option.value)}
                className={`fortune-card py-3 text-center transition-all ${
                  currentPerson.calendarType === option.value
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/50"
                }`}
              >
                <span className="font-medium text-foreground">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <Label className="text-foreground">생년월일</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="년 (YYYY)"
              value={currentPerson.birthYear}
              onChange={(e) => handleChange("birthYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="bg-secondary/50 border-border text-center"
              maxLength={4}
            />
            <Input
              placeholder="월"
              value={currentPerson.birthMonth}
              onChange={(e) => handleChange("birthMonth", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="bg-secondary/50 border-border text-center"
              maxLength={2}
            />
            <Input
              placeholder="일"
              value={currentPerson.birthDay}
              onChange={(e) => handleChange("birthDay", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="bg-secondary/50 border-border text-center"
              maxLength={2}
            />
          </div>
          {(errors.birthYear || errors.birthMonth || errors.birthDay) && (
            <p className="text-sm text-destructive">올바른 생년월일을 입력해주세요</p>
          )}
        </div>

        {/* Birth Hour - 시/분 분리 입력 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            태어난 시간 (선택)
          </Label>
          <TimeInput
            value={currentPerson.birthHour}
            onChange={(value) => handleChange("birthHour", value)}
          />
          <p className="text-xs text-muted-foreground">
            시간을 모르시면 비워두세요
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {step === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 py-6"
            >
              이전
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-primary to-gold-dark py-6 text-lg font-medium"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Heart className="h-5 w-5 animate-pulse" />
                분석 중...
              </span>
            ) : step === 1 ? (
              "다음"
            ) : (
              <span className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                궁합 분석하기
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
