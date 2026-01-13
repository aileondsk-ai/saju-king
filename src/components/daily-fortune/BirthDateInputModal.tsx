import { useState } from "react";
import { X, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveUserBirthInfo } from "@/lib/daily-fortune-storage";

interface BirthDateInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, birthDate: string) => void;
}

export const BirthDateInputModal = ({
  isOpen,
  onClose,
  onSubmit,
}: BirthDateInputModalProps) => {
  const [name, setName] = useState("");
  const [birthDateInput, setBirthDateInput] = useState("");
  const [error, setError] = useState("");

  const validateAndParseBirthDate = (input: string): string | null => {
    // 숫자만 추출
    const digits = input.replace(/\D/g, "");
    
    // 8자리 체크 (YYYYMMDD)
    if (digits.length !== 8) {
      return null;
    }
    
    const year = parseInt(digits.substring(0, 4), 10);
    const month = parseInt(digits.substring(4, 6), 10);
    const day = parseInt(digits.substring(6, 8), 10);
    
    const currentYear = new Date().getFullYear();
    
    // 유효성 검증
    if (year < 1900 || year > currentYear) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    // 월별 일수 체크
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return null;
    
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const formatBirthDateDisplay = (input: string): string => {
    const digits = input.replace(/\D/g, "");
    
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.substring(0, 4)}.${digits.substring(4)}`;
    } else {
      return `${digits.substring(0, 4)}.${digits.substring(4, 6)}.${digits.substring(6, 8)}`;
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");
    
    // 최대 8자리까지만 허용
    if (digits.length <= 8) {
      setBirthDateInput(formatBirthDateDisplay(digits));
      setError("");
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    
    const parsedDate = validateAndParseBirthDate(birthDateInput);
    if (!parsedDate) {
      setError("올바른 생년월일을 입력해주세요 (예: 1990.01.15)");
      return;
    }

    saveUserBirthInfo(name.trim(), parsedDate);
    onSubmit(name.trim(), parsedDate);
  };

  const digits = birthDateInput.replace(/\D/g, "");
  const isValid = name.trim() && digits.length === 8;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-sm animate-fade-in rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-gold-dark/20">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            오늘의 운세 보기
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            생년월일만 입력하면 매일 운세를 확인할 수 있어요
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              이름
            </Label>
            <Input
              id="name"
              placeholder="이름을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          {/* Birth Date - Direct Input */}
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              생년월일
            </Label>
            <Input
              id="birthDate"
              type="text"
              inputMode="numeric"
              placeholder="예: 1990.01.15"
              value={birthDateInput}
              onChange={handleBirthDateChange}
              className="bg-secondary/50 text-center text-lg tracking-wider"
              maxLength={12}
            />
            <p className="text-center text-xs text-muted-foreground">
              숫자 8자리를 입력해주세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="mt-6 w-full bg-gradient-to-r from-primary to-gold-dark text-primary-foreground hover:opacity-90"
        >
          ✨ 오늘의 운세 보기
        </Button>

        {/* Note */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          입력한 정보는 기기에만 저장되며, 서버에 전송되지 않아요
        </p>
      </div>
    </div>
  );
};
