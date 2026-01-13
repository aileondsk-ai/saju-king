import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Sparkles, Heart, MessageCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateWorryForm } from "@/components/community/CreateWorryForm";
import { WorryCard } from "@/components/community/WorryCard";
import { communityService, Worry, Comment } from "@/services/communityService";
import { CommentList } from "@/components/community/CommentList";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface CommunityContext {
  initialContent?: string;
  sourceType?: string;
}

interface CommunityViewProps {
  onBack?: () => void;
  context?: CommunityContext;
  onContextClear?: () => void;
}

const FILTER_OPTIONS = [
  { value: "all", label: "전체", icon: null },
  { value: "saju_analysis", label: "사주", icon: Sparkles },
  { value: "compatibility_analysis", label: "궁합", icon: Heart },
  { value: "chat_consultation", label: "AI상담", icon: MessageCircle },
  { value: "web", label: "직접작성", icon: Globe },
] as const;

export function CommunityView({ onBack, context, onContextClear }: CommunityViewProps) {
  const [worries, setWorries] = useState<Worry[]>([]);
  const [selectedWorry, setSelectedWorry] = useState<Worry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const loadWorries = async (sourceType?: string) => {
    setIsLoading(true);
    try {
      const data = await communityService.getWorries(sourceType);
      setWorries(data);
    } catch (error) {
      console.error("Failed to load worries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorries(activeFilter);
  }, [activeFilter]);

  // Clear context after successful post
  const handlePostSuccess = () => {
    setActiveFilter("all"); // Reset filter to show new post
    loadWorries("all");
    if (onContextClear) {
      onContextClear();
    }
  };

  const handleWorryClick = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const worry = await communityService.getWorry(id);
      if (worry) {
        setSelectedWorry(worry);
        await communityService.incrementViewCount(id);
        const commentsData = await communityService.getComments(id);
        setComments(commentsData);
      }
    } catch (error) {
      console.error("Failed to load worry details:", error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCommentAdded = (comment: Comment) => {
    setComments((prev) => [...prev, comment]);
  };

  const handleBackToList = () => {
    setSelectedWorry(null);
    setComments([]);
    loadWorries(activeFilter);
  };

  // Detail View
  if (selectedWorry) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">고민 상세</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-card/50 rounded-xl p-5 border border-border mb-4">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="text-xs">
                {new Date(selectedWorry.created_at).toLocaleString()}
              </Badge>
              {selectedWorry.ai_summary && (
                <Badge className="bg-primary/20 text-primary text-xs">AI 요약</Badge>
              )}
            </div>

            {selectedWorry.ai_summary && (
              <div className="bg-primary/10 rounded-lg p-4 mb-4 border border-primary/20">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  "{selectedWorry.ai_summary}"
                </p>
              </div>
            )}

            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {selectedWorry.content}
            </p>
          </div>

          <CommentList
            worryId={selectedWorry.id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-lg font-bold text-foreground">고민 나누기</h1>
        </div>
        
        {/* Category Filter */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-4">
          <CreateWorryForm 
            initialContent={context?.initialContent} 
            initialSourceType={context?.sourceType}
            onSuccess={handlePostSuccess} 
          />

          {isLoading || isDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : worries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {activeFilter === "all" 
                  ? "아직 등록된 고민이 없어요." 
                  : `'${FILTER_OPTIONS.find(f => f.value === activeFilter)?.label}' 카테고리에 고민이 없어요.`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">첫 번째 고민을 나눠보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worries.map((worry) => (
                <WorryCard key={worry.id} worry={worry} onClick={handleWorryClick} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
