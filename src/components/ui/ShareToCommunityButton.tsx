import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2 } from "lucide-react";

export interface ShareToCommunityContext {
  analysisType: "saju" | "compatibility";
  userName: string;
  summary: string;
  generatedContent?: string;
}

interface ShareToCommunityButtonProps {
  context: ShareToCommunityContext;
  onShare: (content: string, useSummary: boolean, sourceType: string) => void;
  isLoading?: boolean;
}

export function ShareToCommunityButton({
  context,
  onShare,
  isLoading = false,
}: ShareToCommunityButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [useSummary, setUseSummary] = useState(true);

  const generateDefaultContent = (): string => {
    if (context.generatedContent) return context.generatedContent;

    if (context.analysisType === "saju") {
      return `안녕하세요, ${context.userName}입니다.\n\n사주 분석을 받아봤는데요,\n${context.summary}\n\n이런 결과가 나왔는데 어떻게 해석해야 할지, 비슷한 경험 있으신 분 계실까요?`;
    } else {
      return `안녕하세요, ${context.userName}입니다.\n\n궁합 분석을 받아봤는데요,\n${context.summary}\n\n이 결과에 대해 어떻게 생각하시나요? 조언 부탁드려요!`;
    }
  };

  const handleOpen = () => {
    setContent(generateDefaultContent());
    setIsOpen(true);
  };

  const handleShare = () => {
    if (!content.trim()) return;
    const sourceType = context.analysisType === "saju" ? "saju_analysis" : "compatibility_analysis";
    onShare(content, useSummary, sourceType);
    setIsOpen(false);
    setContent("");
  };

  const analysisLabel = context.analysisType === "saju" ? "사주 분석" : "궁합 분석";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <MessageSquarePlus className="h-4 w-4" />
        고민 나누기
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              {analysisLabel} 결과로 고민 나누기
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              분석 결과를 바탕으로 다른 분들과 고민을 나눠보세요. 내용은 자유롭게 수정할 수 있어요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="고민 내용을 작성해주세요..."
              className="min-h-[150px] bg-background/50 border-border text-foreground resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={useSummary}
                  onCheckedChange={(checked) => setUseSummary(checked === true)}
                  className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  AI 요약 사용
                </span>
              </label>
              <span className="text-xs text-muted-foreground">
                {content.length}/1000
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground"
            >
              취소
            </Button>
            <Button
              onClick={handleShare}
              disabled={!content.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                "게시판에 공유하기"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
