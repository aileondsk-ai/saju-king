import { useState, useEffect } from "react";
import { z } from "zod";
import { 
  Sparkles, Calendar, Clock, User, Phone, Mail, Heart, Brain, Crown, Eye, Hand 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserBirthInfo, parseBirthDate } from "@/lib/daily-fortune-storage";
import { ImageUploadField } from "./ImageUploadField";

const mbtiTypes = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const birthHours = [
  { value: "", label: "모름" },
  { value: "23:30-01:29", label: "자시 (23:30~01:29)" },
  { value: "01:30-03:29", label: "축시 (01:30~03:29)" },
  { value: "03:30-05:29", label: "인시 (03:30~05:29)" },
  { value: "05:30-07:29", label: "묘시 (05:30~07:29)" },
  { value: "07:30-09:29", label: "진시 (07:30~09:29)" },
  { value: "09:30-11:29", label: "사시 (09:30~11:29)" },
  { value: "11:30-13:29", label: "오시 (11:30~13:29)" },
  { value: "13:30-15:29", label: "미시 (13:30~15:29)" },
  { value: "15:30-17:29", label: "신시 (15:30~17:29)" },
  { value: "17:30-19:29", label: "유시 (17:30~19:29)" },
  { value: "19:30-21:29", label: "술시 (19:30~21:29)" },
  { value: "21:30-23:29", label: "해시 (21:30~23:29)" },
];

const premiumSajuSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요").max(50, "이름이 너무 깁니다"),
  gender: z.enum(["male", "female"], { required_error: "성별을 선택해주세요" }),
  contact: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 연락처를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  birthYear: z.string().regex(/^\d{4}$/, "올바른 연도를 입력해주세요"),
  birthMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/, "올바른 월을 입력해주세요"),
  birthDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, "올바른 일을 입력해주세요"),
  birthHour: z.string().optional(),
  calendarType: z.enum(["solar", "lunar"]),
  mbti: z.string().optional(),
  hasPartner: z.boolean(),
  partnerName: z.string().optional(),
  partnerGender: z.enum(["male", "female"]).optional(),
  partnerBirthYear: z.string().optional(),
  partnerBirthMonth: z.string().optional(),
  partnerBirthDay: z.string().optional(),
  partnerBirthHour: z.string().optional(),
  partnerCalendarType: z.enum(["solar", "lunar"]).optional(),
});

export type PremiumSajuFormData = z.infer<typeof premiumSajuSchema>;

interface PremiumSajuInputFormProps {
  onSubmit: (data: PremiumSajuFormData & { 
    orderId: string; 
    orderNumber: string;
    faceImageBase64?: string;
    palmImageBase64?: string;
  }) => void;
}

// 파일을 Base64로 변환하는 유틸리티 함수
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64, 부분 제거
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 주문번호 생성 함수
const generateOrderNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PS${dateStr}-${randomStr}`;
};

export const PremiumSajuInputForm = ({ onSubmit }: PremiumSajuInputFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    gender: "" as "male" | "female" | "",
    contact: "",
    email: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "",
    calendarType: "solar" as "solar" | "lunar",
    mbti: "",
    hasPartner: false,
    partnerName: "",
    partnerGender: "" as "male" | "female" | "",
    partnerBirthYear: "",
    partnerBirthMonth: "",
    partnerBirthDay: "",
    partnerBirthHour: "",
    partnerCalendarType: "solar" as "solar" | "lunar",
  });
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [palmImage, setPalmImage] = useState<File | null>(null);
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

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // 연락처 자동 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const dataToValidate = {
      ...formData,
      gender: formData.gender || undefined,
      partnerGender: formData.hasPartner ? formData.partnerGender || undefined : undefined,
      partnerCalendarType: formData.hasPartner ? formData.partnerCalendarType : undefined,
    };

    const result = premiumSajuSchema.safeParse(dataToValidate);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      
      // 첫 번째 에러로 스크롤
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 연인 정보 추가 검증
    if (formData.hasPartner) {
      const partnerErrors: Record<string, string> = {};
      if (!formData.partnerName?.trim()) {
        partnerErrors.partnerName = "연인 이름을 입력해주세요";
      }
      if (!formData.partnerGender) {
        partnerErrors.partnerGender = "연인 성별을 선택해주세요";
      }
      if (!formData.partnerBirthYear || !/^\d{4}$/.test(formData.partnerBirthYear)) {
        partnerErrors.partnerBirthYear = "연인 생년을 입력해주세요";
      }
      if (!formData.partnerBirthMonth || !/^(0?[1-9]|1[0-2])$/.test(formData.partnerBirthMonth)) {
        partnerErrors.partnerBirthMonth = "연인 생월을 입력해주세요";
      }
      if (!formData.partnerBirthDay || !/^(0?[1-9]|[12]\d|3[01])$/.test(formData.partnerBirthDay)) {
        partnerErrors.partnerBirthDay = "연인 생일을 입력해주세요";
      }

      if (Object.keys(partnerErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...partnerErrors }));
        return;
      }
    }

    setIsLoading(true);

    try {
      const orderNumber = generateOrderNumber();
      const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, "0")}-${formData.birthDay.padStart(2, "0")}`;
      
      // 이미지를 Base64로 변환
      let faceImageBase64: string | undefined;
      let palmImageBase64: string | undefined;

      if (faceImage) {
        faceImageBase64 = await fileToBase64(faceImage);
      }
      if (palmImage) {
        palmImageBase64 = await fileToBase64(palmImage);
      }

      // 주문 정보를 DB에 저장
      const { data, error } = await supabase
        .from("premium_saju_orders")
        .insert({
          order_number: orderNumber,
          name: formData.name.trim(),
          gender: formData.gender,
          contact: formData.contact.replace(/-/g, ""),
          email: formData.email.trim(),
          birth_date: birthDate,
          birth_time: formData.birthHour || null,
          calendar_type: formData.calendarType,
          mbti: formData.mbti || null,
          has_partner: formData.hasPartner,
          payment_status: "pending",
          face_image_path: faceImage ? `${orderNumber}/face.jpg` : null,
          palm_image_path: palmImage ? `${orderNumber}/palm.jpg` : null,
        })
        .select()
        .single();

      if (error) throw error;

      onSubmit({ 
        ...result.data, 
        orderId: data.id, 
        orderNumber: data.order_number,
        hasPartner: formData.hasPartner,
        partnerName: formData.partnerName,
        partnerGender: formData.partnerGender as "male" | "female" | undefined,
        partnerBirthYear: formData.partnerBirthYear,
        partnerBirthMonth: formData.partnerBirthMonth,
        partnerBirthDay: formData.partnerBirthDay,
        partnerBirthHour: formData.partnerBirthHour,
        partnerCalendarType: formData.partnerCalendarType,
        faceImageBase64,
        palmImageBase64,
      });
    } catch (error) {
      console.error("Error saving premium saju order:", error);
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
      {/* 프리미엄 안내 배너 */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-amber-700/10 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-300">프리미엄 사주 분석</h3>
            <p className="text-xs text-amber-400/80">AI 기반 깊이 있는 운명 분석</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          전문가 수준의 상세한 사주 분석 결과를 이메일로 받아보세요.
        </p>
      </div>

      {/* Prefill Notice */}
      {prefilled && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-center text-sm text-primary">
            ✨ 이전에 입력한 정보가 자동으로 채워졌어요
          </p>
        </div>
      )}

      {/* Section: 기본 정보 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
          기본 정보
        </h4>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-primary" />
            이름 <span className="text-destructive">*</span>
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
          <Label className="text-foreground">성별 <span className="text-destructive">*</span></Label>
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

        {/* Contact */}
        <div className="space-y-2">
          <Label htmlFor="contact" className="flex items-center gap-2 text-foreground">
            <Phone className="h-4 w-4 text-primary" />
            연락처 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact"
            type="tel"
            placeholder="010-0000-0000"
            value={formData.contact}
            onChange={(e) => handleChange("contact", formatPhoneNumber(e.target.value))}
            className="bg-secondary/50 border-border"
            maxLength={13}
          />
          {errors.contact && <p className="text-sm text-destructive">{errors.contact}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            이메일 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="bg-secondary/50 border-border"
          />
          <p className="text-xs text-muted-foreground">분석 결과가 이메일로 발송됩니다</p>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      </div>

      {/* Section: 생년월일시 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
          생년월일시
        </h4>

        {/* Calendar Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            양력/음력 <span className="text-destructive">*</span>
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
          <Label className="text-foreground">생년월일 <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              id="birthYear"
              placeholder="년 (YYYY)"
              value={formData.birthYear}
              onChange={(e) => handleChange("birthYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="bg-secondary/50 border-border text-center"
              maxLength={4}
            />
            <Input
              id="birthMonth"
              placeholder="월"
              value={formData.birthMonth}
              onChange={(e) => handleChange("birthMonth", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="bg-secondary/50 border-border text-center"
              maxLength={2}
            />
            <Input
              id="birthDay"
              placeholder="일"
              value={formData.birthDay}
              onChange={(e) => handleChange("birthDay", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="bg-secondary/50 border-border text-center"
              maxLength={2}
            />
          </div>
          {(errors.birthYear || errors.birthMonth || errors.birthDay) && (
            <p className="text-sm text-destructive">올바른 생년월일을 입력해주세요</p>
          )}
        </div>

        {/* Birth Hour */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            태어난 시간 (선택)
          </Label>
          <select
            value={formData.birthHour}
            onChange={(e) => handleChange("birthHour", e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-foreground focus:border-primary focus:outline-none"
          >
            {birthHours.map((hour) => (
              <option key={hour.value} value={hour.value}>
                {hour.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section: 추가 정보 (선택) */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
          추가 정보 (선택)
        </h4>

        {/* MBTI */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Brain className="h-4 w-4 text-primary" />
            MBTI
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {mbtiTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange("mbti", formData.mbti === type ? "" : type)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                  formData.mbti === type
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {formData.mbti && (
            <p className="text-xs text-primary">선택됨: {formData.mbti}</p>
          )}
        </div>

        {/* Has Partner */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hasPartner"
              checked={formData.hasPartner}
              onCheckedChange={(checked) => handleChange("hasPartner", checked === true)}
            />
            <Label htmlFor="hasPartner" className="flex items-center gap-2 cursor-pointer">
              <Heart className="h-4 w-4 text-pink-400" />
              연인이 있어요
            </Label>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            연인 정보를 입력하면 궁합 분석도 함께 받아보실 수 있어요
          </p>
        </div>
      </div>

      {/* Section: 관상/손금 분석 (선택) */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
          🔮 관상/손금 분석 (선택)
        </h4>
        <p className="text-xs text-muted-foreground">
          얼굴 또는 손바닥 사진을 업로드하면 AI가 관상과 손금을 분석해드려요
        </p>

        {/* Face Image Upload */}
        <ImageUploadField
          label="얼굴 사진"
          description="정면 얼굴 사진을 업로드하면 관상 분석을 받을 수 있어요"
          icon={<Eye className="h-4 w-4 text-primary" />}
          value={faceImage}
          onChange={setFaceImage}
          guideType="face"
        />

        {/* Palm Image Upload */}
        <ImageUploadField
          label="손바닥 사진"
          description="손바닥을 펴고 찍은 사진을 업로드하면 손금 분석을 받을 수 있어요"
          icon={<Hand className="h-4 w-4 text-primary" />}
          value={palmImage}
          onChange={setPalmImage}
          guideType="palm"
        />

        {(faceImage || palmImage) && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-center text-sm text-primary">
              ✨ {faceImage && palmImage ? '관상 + 손금' : faceImage ? '관상' : '손금'} 분석이 결과에 포함됩니다
            </p>
          </div>
        )}
      </div>

      {/* Partner Section */}
      {formData.hasPartner && (
        <div className="space-y-4 rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
          <h4 className="text-sm font-medium text-pink-300 flex items-center gap-2">
            <Heart className="h-4 w-4" />
            연인 정보
          </h4>

          {/* Partner Name */}
          <div className="space-y-2">
            <Label htmlFor="partnerName" className="text-foreground">
              연인 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="partnerName"
              placeholder="연인 이름"
              value={formData.partnerName}
              onChange={(e) => handleChange("partnerName", e.target.value)}
              className="bg-secondary/50 border-border"
            />
            {errors.partnerName && <p className="text-sm text-destructive">{errors.partnerName}</p>}
          </div>

          {/* Partner Gender */}
          <div className="space-y-2">
            <Label className="text-foreground">연인 성별 <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "male", label: "남성" },
                { value: "female", label: "여성" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange("partnerGender", option.value)}
                  className={`fortune-card py-2 text-center text-sm transition-all ${
                    formData.partnerGender === option.value
                      ? "border-pink-400 bg-pink-500/10"
                      : "hover:border-pink-400/50"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {errors.partnerGender && <p className="text-sm text-destructive">{errors.partnerGender}</p>}
          </div>

          {/* Partner Calendar Type */}
          <div className="space-y-2">
            <Label className="text-foreground">양력/음력</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "solar", label: "양력" },
                { value: "lunar", label: "음력" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange("partnerCalendarType", option.value)}
                  className={`fortune-card py-2 text-center text-sm transition-all ${
                    formData.partnerCalendarType === option.value
                      ? "border-pink-400 bg-pink-500/10"
                      : "hover:border-pink-400/50"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Partner Birth Date */}
          <div className="space-y-2">
            <Label className="text-foreground">연인 생년월일 <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                id="partnerBirthYear"
                placeholder="년 (YYYY)"
                value={formData.partnerBirthYear}
                onChange={(e) => handleChange("partnerBirthYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="bg-secondary/50 border-border text-center text-sm"
                maxLength={4}
              />
              <Input
                id="partnerBirthMonth"
                placeholder="월"
                value={formData.partnerBirthMonth}
                onChange={(e) => handleChange("partnerBirthMonth", e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="bg-secondary/50 border-border text-center text-sm"
                maxLength={2}
              />
              <Input
                id="partnerBirthDay"
                placeholder="일"
                value={formData.partnerBirthDay}
                onChange={(e) => handleChange("partnerBirthDay", e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="bg-secondary/50 border-border text-center text-sm"
                maxLength={2}
              />
            </div>
            {(errors.partnerBirthYear || errors.partnerBirthMonth || errors.partnerBirthDay) && (
              <p className="text-sm text-destructive">올바른 생년월일을 입력해주세요</p>
            )}
          </div>

          {/* Partner Birth Hour */}
          <div className="space-y-2">
            <Label className="text-foreground">연인 태어난 시간 (선택)</Label>
            <select
              value={formData.partnerBirthHour}
              onChange={(e) => handleChange("partnerBirthHour", e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:border-pink-400 focus:outline-none"
            >
              {birthHours.map((hour) => (
                <option key={hour.value} value={hour.value}>
                  {hour.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Price & Submit */}
      <div className="space-y-4 pt-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">프리미엄 사주 분석</p>
          <p className="text-2xl font-bold text-amber-400">
            ₩3,900
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            결제 완료 후 이메일로 상세 분석 결과를 보내드려요
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 py-6 text-lg font-medium text-white shadow-lg shadow-amber-500/20"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-spin" />
              처리 중...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              결제하고 분석받기
            </span>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          결제 진행 시 <span className="text-primary">이용약관</span> 및{" "}
          <span className="text-primary">개인정보처리방침</span>에 동의하는 것으로 간주합니다.
        </p>
      </div>
    </form>
  );
};
