import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment, communityService } from "@/services/communityService";
import { getDeviceId } from "@/lib/utils";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CommentListProps {
  worryId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export function CommentList({ worryId, comments, onCommentAdded }: CommentListProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const deviceId = getDeviceId();
      const newComment = await communityService.createComment(worryId, content, deviceId);
      onCommentAdded(newComment);
      setContent("");
      toast.success("댓글이 등록되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">댓글 {comments.length}개</h3>
      </div>

      <div className="space-y-4 mb-8">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">아직 댓글이 없습니다. 첫 번째 위로를 건네주세요.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">익명</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-card/50 p-3 rounded-r-lg rounded-bl-lg border border-border/50">
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>
                <div className="flex justify-end mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          placeholder="따뜻한 위로의 한마디를 남겨주세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] pr-20 bg-background/50 border-border text-foreground"
          maxLength={500}
        />
        <div className="absolute bottom-2 right-2">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="h-8"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
