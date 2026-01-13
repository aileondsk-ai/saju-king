import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";

interface TimeInputProps {
  value: string; // "HH:mm" format (24시간제), 빈 문자열이면 시간 모름
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * 시간 입력 컴포넌트 - PC/모바일 공통 UX
 * 시간 모름/시간 입력 선택 + 24시간제 시/분 숫자 입력 (00:00 ~ 23:59)
 *
 * UX 개선사항:
 * - 시간 모름/시간 입력 버튼으로 명확한 선택
 * - 24시간제 직접 입력 (00-23시, 00-59분)
 * - 자동 포커스 이동 (시 입력 완료 시 분으로)
 * - 키보드 네비게이션 (Enter, 화살표 키)
 * - 실시간 입력 검증 및 피드백
 * - 모바일 최적화된 입력 경험
 */
export function TimeInput({ value, onChange, className, disabled }: TimeInputProps) {
  const [timeMode, setTimeMode] = useState<"unknown" | "input">(value ? "input" : "unknown");
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoFocusMinute = useRef(false);

  // Parse current value (24시간제 그대로 사용)
  const parseValue = (val: string) => {
    if (!val) return { hour: "", minute: "" };

    const [h, m] = val.split(":");
    const hourNum = parseInt(h, 10);

    if (isNaN(hourNum)) return { hour: "", minute: m || "" };

    // 24시간제 그대로 사용 (00-23)
    return {
      hour: hourNum.toString(),
      minute: m || "",
    };
  };

  const { hour, minute } = parseValue(value);

  const handleHourChange = (newHour: string) => {
    // 숫자만 허용
    const digits = newHour.replace(/\D/g, "").slice(0, 2);

    if (!digits) {
      // 빈 값일 때는 분만 유지
      if (minute) {
        onChange(`00:${minute}`);
      } else {
        onChange("");
      }
      return;
    }

    // 00-23 범위 검증
    let numValue = parseInt(digits, 10);
    let validHour = digits;

    if (!isNaN(numValue)) {
      if (numValue > 23) {
        validHour = "23";
      } else if (numValue < 0) {
        validHour = "0";
      }
    }

    // 분이 있으면 그대로, 없으면 "00"으로 자동 채움
    onChange(`${validHour}:${minute || "00"}`);

    // 2자리 입력 완료 시 자동으로 분 입력으로 포커스 이동
    // 단, 사용자가 직접 입력한 경우에만 (백스페이스 등으로 삭제 중이 아닐 때)
    if (validHour.length === 2 && newHour.length >= 2 && minuteInputRef.current) {
      shouldAutoFocusMinute.current = true;
      // 짧은 딜레이로 포커스 이동 (사용자 입력을 방해하지 않도록)
      setTimeout(() => {
        if (
          shouldAutoFocusMinute.current &&
          minuteInputRef.current &&
          document.activeElement === hourInputRef.current
        ) {
          minuteInputRef.current.focus();
          // 자동 포커스 시에는 텍스트를 선택하지 않고 커서만 이동
          minuteInputRef.current.setSelectionRange(0, 0);
        }
        shouldAutoFocusMinute.current = false;
      }, 150);
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    // 자동 포커스 플래그 해제 (사용자가 직접 입력 중)
    shouldAutoFocusMinute.current = false;

    // 숫자만 허용
    const digits = newMinute.replace(/\D/g, "").slice(0, 2);

    if (!digits) {
      // 빈 값일 때는 시만 유지 (분은 "00"으로 자동 채움)
      if (hour) {
        onChange(`${hour}:00`);
      } else {
        onChange("");
      }
      return;
    }

    // 0-59 범위 검증
    const numValue = parseInt(digits, 10);
    let validMinute = digits;
    if (!isNaN(numValue)) {
      if (numValue > 59) {
        validMinute = "59";
      } else if (numValue < 0) {
        validMinute = "0";
      }
    }

    // 입력 중에는 padStart 하지 않고 그대로 표시 (사용자가 입력하는 대로)
    // 저장할 때만 포맷팅
    if (hour) {
      // 입력 중에는 원본 그대로, 완료 시에만 포맷팅
      onChange(`${hour}:${validMinute}`);
    } else {
      // 시간이 없으면 기본 시간 설정 (00시)
      onChange(`00:${validMinute}`);
    }
  };

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 키 또는 오른쪽 화살표 키로 분 입력으로 이동
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
    }
  };

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 키는 폼 제출을 위해 기본 동작 유지
    // 왼쪽 화살표 키로 시 입력으로 이동
    if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      hourInputRef.current?.focus();
      hourInputRef.current?.select();
    }
  };

  const handleClear = () => {
    onChange("");
    setTimeMode("unknown");
  };

  const handleTimeModeChange = (mode: "unknown" | "input") => {
    setTimeMode(mode);
    if (mode === "unknown") {
      onChange("");
    } else {
      // 시간 입력 모드로 전환 시 기본값 설정 (00시, 분은 빈 문자열)
      if (!value) {
        onChange("00:");
      }
      // 포커스를 시 입력으로 이동
      setTimeout(() => {
        hourInputRef.current?.focus();
        hourInputRef.current?.select();
      }, 50);
    }
  };

  // value가 변경되면 timeMode도 동기화
  useEffect(() => {
    if (value && timeMode === "unknown") {
      setTimeMode("input");
    } else if (!value && timeMode === "input") {
      setTimeMode("unknown");
    }
  }, [value]);

  const isInputDisabled = disabled || timeMode === "unknown";

  return (
    <div className={cn("space-y-3", className)}>
      {/* 시간 모름/시간 입력 선택 버튼 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={timeMode === "unknown" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTimeModeChange("unknown")}
          disabled={disabled}
          className={cn(
            "flex-1 transition-all",
            timeMode === "unknown" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-secondary",
          )}
        >
          <Clock className="h-4 w-4 mr-2" />
          시간 모름
        </Button>
        <Button
          type="button"
          variant={timeMode === "input" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTimeModeChange("input")}
          disabled={disabled}
          className={cn(
            "flex-1 transition-all",
            timeMode === "input" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-secondary",
          )}
        >
          <Clock className="h-4 w-4 mr-2" />
          시간 입력
        </Button>
      </div>

      {/* 시간 입력 필드들 (시간 입력 모드일 때만 표시) */}
      {timeMode === "input" && (
        <div className="flex flex-wrap items-center gap-2">
          {/* 시 입력 */}
          <div className="flex items-center gap-1">
            <Input
              ref={hourInputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="00"
              value={value ? hour : ""}
              onChange={(e) => handleHourChange(e.target.value)}
              onKeyDown={handleHourKeyDown}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => {
                // 포커스를 잃을 때 시 값이 있으면 2자리로 포맷팅
                const currentValue = e.target.value;
                if (currentValue) {
                  const numValue = parseInt(currentValue, 10);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 23) {
                    const formattedHour = numValue.toString().padStart(2, "0");
                    // 분이 있으면 그대로, 없으면 "00"으로 자동 채움
                    onChange(`${formattedHour}:${minute || "00"}`);
                  }
                } else if (currentValue === "" && minute) {
                  // 시가 빈 값이고 분이 있으면 기본값 00시로 설정
                  onChange(`00:${minute}`);
                }
              }}
              className={cn(
                "w-16 text-center bg-secondary/50 border-border text-base font-medium",
                "transition-all focus:ring-2 focus:ring-primary focus:border-primary",
                "hover:bg-secondary/70",
              )}
              maxLength={2}
              disabled={isInputDisabled}
              aria-label="시 입력 (00-23)"
            />
            <span className="text-muted-foreground text-sm font-medium">시</span>
          </div>

          {/* 구분자 */}
          <span className="text-muted-foreground text-lg font-light">:</span>

          {/* 분 입력 */}
          <div className="flex items-center gap-1">
            <Input
              ref={minuteInputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="00"
              value={value ? minute : ""}
              onChange={(e) => handleMinuteChange(e.target.value)}
              onKeyDown={handleMinuteKeyDown}
              onFocus={(e) => {
                // 사용자가 직접 포커스한 경우 (클릭 또는 탭)
                shouldAutoFocusMinute.current = false;
                // 약간의 딜레이 후 select (포커스가 완전히 이동한 후)
                setTimeout(() => {
                  if (e.target === document.activeElement) {
                    (e.target as HTMLInputElement).select();
                  }
                }, 0);
              }}
              onMouseDown={(e) => {
                // 마우스 클릭 시 자동 포커스 취소
                shouldAutoFocusMinute.current = false;
              }}
              onClick={(e) => {
                // 클릭 시에도 선택
                setTimeout(() => {
                  if (e.currentTarget === document.activeElement) {
                    e.currentTarget.select();
                  }
                }, 0);
              }}
              onBlur={(e) => {
                // 포커스를 잃을 때 분 값이 있으면 2자리로 포맷팅
                const currentValue = e.target.value;
                if (currentValue && hour) {
                  const numValue = parseInt(currentValue, 10);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 59) {
                    const formattedMinute = numValue.toString().padStart(2, "0");
                    // 시도 2자리로 포맷팅
                    const hourNum = parseInt(hour, 10);
                    const formattedHour = !isNaN(hourNum) ? hourNum.toString().padStart(2, "0") : hour;
                    onChange(`${formattedHour}:${formattedMinute}`);
                  }
                } else if (currentValue === "" && hour) {
                  // 빈 값이면 "00"으로 자동 채움
                  const hourNum = parseInt(hour, 10);
                  const formattedHour = !isNaN(hourNum) ? hourNum.toString().padStart(2, "0") : hour;
                  onChange(`${formattedHour}:00`);
                }
              }}
              className={cn(
                "w-16 text-center bg-secondary/50 border-border text-base font-medium",
                "transition-all focus:ring-2 focus:ring-primary focus:border-primary",
                "hover:bg-secondary/70",
              )}
              maxLength={2}
              disabled={isInputDisabled}
              aria-label="분 입력"
            />
            <span className="text-muted-foreground text-sm font-medium">분</span>
          </div>

          {/* 삭제 버튼 */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isInputDisabled}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                "text-muted-foreground hover:text-foreground hover:bg-destructive/10",
                "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              aria-label="시간 삭제"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
