import { useState, useEffect } from "react";
import { z } from "zod";
import { Sparkles, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/forms/TimeInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserBirthInfo, parseBirthDate } from "@/lib/daily-fortune-storage";
const sajuSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요").max(50, "이름이 너무 깁니다"),
  gender: z.enum(["male", "female"], { required_error: "성별을 선택해주세요" }),
  birthYear: z.string().regex(/^\d{4}$/, "올바른 연도를 입력해주세요"),
  birthMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/, "올바른 월을 입력해주세요"),
  birthDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, "올바른 일을 입력해주세요"),
  birthHour: z.string().optional(),
  calendarType: z.enum(["solar", "lunar"]),
});

export type SajuFormData = z.infer<typeof sajuSchema>;

interface SajuInputFormProps {
  onSubmit: (data: SajuFormData & { id: string }) => void;
}

// HH:mm 직접 입력 방식으로 변경 - 시진 범위 선택 제거

export const SajuInputForm = ({ onSubmit }: SajuInputFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    gender: "" as "male" | "female" | "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "",
    calendarType: "solar" as "solar" | "lunar",
  });
  const [prefilled, setPrefilled] = useState(false);

  // 오늘의 운세에서 저장된 생년월일 자동 채우기
  useEffect(() => {
    const userInfo = getUserBirthInfo();
    if (userInfo && !prefilled) {
      const parsed = parseBirthDate(userInfo.birthDate);
      if (parsed) {
        setFormData(prev => ({
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = sajuSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Save to DB
      const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, "0")}-${formData.birthDay.padStart(2, "0")}`;
      
      const { data, error } = await supabase
        .from("saju_requests")
        .insert({
          name: formData.name.trim(),
          gender: formData.gender,
          birth_date: birthDate,
          birth_time: formData.birthHour || null,
          calendar_type: formData.calendarType,
        })
        .select()
        .single();

      if (error) throw error;

      onSubmit({ ...result.data, id: data.id });
    } catch (error) {
      console.error("Error saving saju request:", error);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prefill Notice */}
      {prefilled && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-center text-sm text-primary">
            ✨ 오늘의 운세에서 입력한 정보가 자동으로 채워졌어요
          </p>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
          <User className="h-4 w-4 text-primary" />
          이름
        </Label>
        <Input
          id="name"
          placeholder="이름을 입력해주세요"
          value={formData.name}
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
                formData.gender === option.value
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary/50"
              }`}
            >
              <span className="font-medium text-foreground">{option.label}</span>
            </button>
          ))}
        </div>
        {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
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
                formData.calendarType === option.value
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
          <div>
            <Input
              placeholder="년 (YYYY)"
              value={formData.birthYear}
              onChange={(e) => handleChange("birthYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="bg-secondary/50 border-border text-center"
              maxLength={4}
            />
          </div>
          <div>
            <Input
              placeholder="월"
              value={formData.birthMonth}
              onChange={(e) => handleChange("birthMonth", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="bg-secondary/50 border-border text-center"
              maxLength={2}
            />
          </div>
          <div>
            <Input
              placeholder="일"
              value={formData.birthDay}
              onChange={(e) => handleChange("birthDay", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="bg-secondary/50 border-border text-center"
              maxLength={2}
            />
          </div>
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
          value={formData.birthHour}
          onChange={(value) => handleChange("birthHour", value)}
        />
        <p className="text-xs text-muted-foreground">
          시간을 모르시면 비워두세요
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-primary to-gold-dark py-6 text-lg font-medium"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-spin" />
            분석 중...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            사주 분석하기
          </span>
        )}
      </Button>
    </form>
  );
};
