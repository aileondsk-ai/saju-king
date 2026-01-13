import { forwardRef } from "react";
import { MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsultationCTAProps {
  userName: string;
  analysisType: "saju" | "compatibility";
  onStartConsultation: () => void;
  onReset: () => void;
}

export const ConsultationCTA = forwardRef<HTMLDivElement, ConsultationCTAProps>(
  ({ userName, analysisType, onStartConsultation, onReset }, ref) => {
    return (
      <div ref={ref} className="mt-8 px-4 py-4">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/30 bg-gradient-to-br from-card/98 to-card/95 p-5 shadow-xl backdrop-blur-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {userName}님, 더 궁금한 점이 있으신가요?
              </p>
              <p className="text-sm text-muted-foreground">
                {analysisType === "saju"
                  ? "AI 상담사가 사주 분석을 상세히 설명해드려요"
                  : "AI 상담사가 궁합에 대해 깊이 있는 조언을 드려요"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onStartConsultation}
              className="flex-1 gap-2 rounded-xl py-6 text-base shadow-md transition-all hover:shadow-lg"
              size="lg"
            >
              <MessageCircle className="h-5 w-5" />
              심층 상담 바로가기
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="lg"
              className="gap-2 rounded-xl border-border/50 bg-secondary/30 px-4 py-6 hover:bg-secondary/50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ConsultationCTA.displayName = "ConsultationCTA";