import { useState, useRef } from "react";
import { Camera, X, Upload, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImageUploadFieldProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string;
  className?: string;
  guideType?: "face" | "palm";
}

const FACE_GUIDE = {
  title: "📸 관상 분석을 위한 촬영 가이드",
  tips: [
    { icon: "💡", title: "밝은 조명", desc: "자연광 또는 밝은 조명 아래에서 촬영하세요" },
    { icon: "📷", title: "정면 촬영", desc: "카메라를 눈높이에 맞추고 정면을 바라봐주세요" },
    { icon: "😐", title: "무표정", desc: "자연스러운 무표정 상태로 촬영하세요" },
    { icon: "👓", title: "안경 벗기", desc: "가능하면 안경을 벗고 촬영하세요" },
    { icon: "💇", title: "이마 노출", desc: "이마가 보이도록 앞머리를 정리해주세요" },
    { icon: "🖼️", title: "얼굴 전체", desc: "얼굴 전체가 프레임 안에 들어오도록 하세요" },
  ],
};

const PALM_GUIDE = {
  title: "🖐️ 손금 분석을 위한 촬영 가이드",
  tips: [
    { icon: "✋", title: "손바닥 펴기", desc: "손가락을 자연스럽게 펴고 손바닥을 위로 향하게 하세요" },
    { icon: "💡", title: "밝은 조명", desc: "그림자가 생기지 않도록 밝은 곳에서 촬영하세요" },
    { icon: "📷", title: "수직 촬영", desc: "손바닥 바로 위에서 수직으로 촬영하세요" },
    { icon: "🔍", title: "선명한 손금", desc: "손금이 잘 보이도록 가까이에서 촬영하세요" },
    { icon: "🧴", title: "깨끗한 손", desc: "손을 깨끗이 씻고 건조한 상태에서 촬영하세요" },
    { icon: "👐", title: "주로 쓰는 손", desc: "오른손잡이는 오른손, 왼손잡이는 왼손을 촬영하세요" },
  ],
};

export function ImageUploadField({
  label,
  description,
  icon,
  value,
  onChange,
  previewUrl,
  className,
  guideType,
}: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const guide = guideType === "face" ? FACE_GUIDE : guideType === "palm" ? PALM_GUIDE : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    // 이미지 타입 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setIsLoading(true);
    
    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
    
    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-foreground">
        {icon}
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">(선택)</span>
        {guide && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
                aria-label="촬영 가이드 보기"
              >
                <HelpCircle className="h-4 w-4 text-primary" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-lg">{guide.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {guide.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <span className="text-xl">{tip.icon}</span>
                    <div>
                      <p className="font-medium text-foreground text-sm">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/30">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-background/80 text-xs text-foreground">
            {value?.name || "업로드됨"}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-all flex flex-col items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                촬영하거나 갤러리에서 선택
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
