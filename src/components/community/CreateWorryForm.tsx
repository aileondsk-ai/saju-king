import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { communityService } from "@/services/communityService";
import { getDeviceId } from "@/lib/utils";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateWorryFormProps {
  initialContent?: string;
  initialSourceType?: string;
  onSuccess: () => void;
}

export function CreateWorryForm({ initialContent = "", initialSourceType = "web", onSuccess }: CreateWorryFormProps) {
  const [content, setContent] = useState(initialContent);
  const [useSummary, setUseSummary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sourceType = initialSourceType;

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const deviceId = getDeviceId();
      await communityService.createWorry({
        content,
        deviceId,
        useSummary,
        sourceType,
      });
      
      if (useSummary) {
        toast.success("고민이 등록되었습니다. AI가 곧 요약을 제공할 거예요.");
      } else {
        toast.success("고민이 등록되었습니다.");
      }
      
      setContent("");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card/50 p-4 rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-foreground">고민 나누기</h3>
      <Textarea
        placeholder="어떤 고민이 있으신가요? 익명으로 자유롭게 털어놓으세요. 다른 분들이 공감해줄 거예요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] bg-background/50 border-border text-foreground focus:border-primary/50"
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
        
        <Button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              등록 중...
            </>
          ) : (
            <>
              등록하기 <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
