import { useState, useRef, useEffect } from "react";
import { StarField } from "@/components/ui/StarField";
import { MessageCircle, Send, Sparkles, ThumbsUp, ThumbsDown, RefreshCw, User, Calendar, Clock, HelpCircle, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSajuChat, UserProfile, AnalysisContext } from "@/hooks/useSajuChat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { CommunityContext } from "@/components/views/CommunityView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ChatUserFormProps {
  onSubmit: (profile: UserProfile) => void;
}

const ChatUserForm = ({ onSubmit }: ChatUserFormProps) => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate) {
      toast.error("이름과 생년월일을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("saju_requests").insert({
        name,
        gender,
        birth_date: birthDate,
        birth_time: birthTime || null,
        calendar_type: "solar",
      });

      if (error) throw error;

      onSubmit({
        name,
        gender,
        birthDate,
        birthTime: birthTime || undefined,
      });

      toast.success("정보가 저장되었습니다!");
    } catch (err) {
      console.error("Error saving user profile:", err);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <StarField />
      
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="icon-circle h-12 w-12 p-3">
            <MessageCircle className="h-full w-full text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-foreground">AI 상담 시작하기</h1>
            <p className="text-sm text-muted-foreground">정확한 상담을 위해 정보를 입력해주세요</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">성별</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm transition-colors",
                  gender === "male"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                )}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm transition-colors",
                  gender === "female"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                )}
              >
                여성
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              생년월일 (양력)
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              태어난 시간 (선택)
            </label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">시간을 모르시면 비워두셔도 됩니다</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90",
              isSubmitting && "opacity-50"
            )}
          >
            {isSubmitting ? "처리 중..." : "상담 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
};

export interface ChatViewProps {
  initialContext?: {
    userName: string;
    analysisType: string;
    summary: string;
    analysisData?: Record<string, unknown>;
    formData?: Record<string, unknown>;
  } | null;
  onNavigateToCommunity?: (context: CommunityContext) => void;
}

export const ChatView = ({ initialContext, onNavigateToCommunity }: ChatViewProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
  
  // 분석 컨텍스트가 있으면 자동으로 프로필 및 컨텍스트 설정
  useEffect(() => {
    if (initialContext && !userProfile) {
      const profile: UserProfile = {
        name: initialContext.userName,
        gender: "male",
        birthDate: new Date().toISOString().split('T')[0],
      };
      setUserProfile(profile);
      
      // 분석 컨텍스트 구성
      if (initialContext.analysisType === "saju") {
        setAnalysisContext({
          mode: "personal",
          person: {
            name: initialContext.userName,
            gender: (initialContext.formData?.gender as string) || "male",
            birthDate: (initialContext.formData?.birthDate as string) || "",
            birthTime: initialContext.formData?.birthTime as string | undefined,
          },
          summary: initialContext.summary,
          analysisData: initialContext.analysisData,
          concerns: ["분석 결과 상세 설명"],
        });
      } else if (initialContext.analysisType === "compatibility") {
        setAnalysisContext({
          mode: "compatibility",
          relationshipType: (initialContext.formData?.relationType as string) || "연인",
          personA: {
            name: (initialContext.formData?.person1Name as string) || "A",
            gender: (initialContext.formData?.person1Gender as string) || "male",
            birthDate: (initialContext.formData?.person1BirthDate as string) || "",
          },
          personB: {
            name: (initialContext.formData?.person2Name as string) || "B",
            gender: (initialContext.formData?.person2Gender as string) || "male",
            birthDate: (initialContext.formData?.person2BirthDate as string) || "",
          },
          summary: initialContext.summary,
          analysisData: initialContext.analysisData,
          concerns: ["궁합 결과 상세 설명"],
        });
      }
    }
  }, [initialContext, userProfile]);

  const { messages, isLoading, error, sendMessage, clearMessages, suggestedTopics } = useSajuChat(
    userProfile || undefined,
    analysisContext || undefined
  );
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 분석에서 넘어온 경우 자동으로 첫 메시지 전송
  useEffect(() => {
    if (analysisContext && messages.length === 1) {
      const autoMessage = analysisContext.mode === "personal"
        ? "방금 받은 사주 분석 결과에 대해 더 자세히 알고 싶어요."
        : "방금 받은 궁합 분석 결과에 대해 더 자세히 알고 싶어요.";
      
      setTimeout(() => {
        sendMessage(autoMessage);
      }, 800);
    }
  }, [analysisContext]);

  // 새 메시지시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleResetProfile = () => {
    setUserProfile(null);
    setAnalysisContext(null);
    clearMessages();
  };

  // 게시판 공유 관련 상태 및 핸들러
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [useSummary, setUseSummary] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const generateAISummary = async (): Promise<string> => {
    // 초기 메시지를 제외한 대화만 추출
    const chatMessages = messages
      .filter(m => m.id !== "initial")
      .map(m => ({
        role: m.type as "user" | "bot",
        content: m.content
      }));

    if (chatMessages.length === 0) {
      return "아직 상담 내용이 없습니다.";
    }

    try {
      setIsSummarizing(true);
      const { data, error } = await supabase.functions.invoke("chat-summarize", {
        body: {
          messages: chatMessages,
          userName: userProfile?.name || "사용자"
        }
      });

      if (error) {
        console.error("Summary error:", error);
        throw new Error(error.message);
      }

      return data.summary;
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
      toast.error("AI 요약 생성에 실패했습니다. 직접 작성해주세요.");
      
      // 폴백: 기본 요약 생성
      const userMessages = messages.filter(m => m.type === "user" && m.id !== "initial");
      const questions = userMessages.slice(0, 3).map(m => m.content).join("\n• ");
      return `💬 ${userProfile?.name}님의 상담 내용\n\n📌 질문:\n• ${questions}`;
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleOpenShareDialog = async () => {
    setIsShareDialogOpen(true);
    const summary = await generateAISummary();
    setShareContent(summary);
  };

  const handleShareToCommunity = () => {
    if (!shareContent.trim()) {
      toast.error("공유할 내용을 입력해주세요.");
      return;
    }

    if (onNavigateToCommunity) {
      onNavigateToCommunity({
        initialContent: shareContent,
        sourceType: "chat_consultation",
      });
      setIsShareDialogOpen(false);
      toast.success("게시판으로 이동합니다.");
    }
  };

  // 사용자 프로필이 없으면 입력 폼 표시
  if (!userProfile) {
    return <ChatUserForm onSubmit={setUserProfile} />;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-20">
      <StarField />

      {/* Header - 개선된 디자인 */}
      <header className="relative z-10 border-b border-border/50 bg-gradient-to-b from-card/95 to-card/80 px-5 pb-4 pt-12 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="icon-circle h-11 w-11 p-2.5 shadow-lg">
                <MessageCircle className="h-full w-full text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">운세도우미</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {userProfile.name}님 {analysisContext?.mode === "compatibility" ? "궁합" : "사주"} 상담 중
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToCommunity && messages.length > 1 && (
              <button
                onClick={handleOpenShareDialog}
                className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20"
              >
                게시판 공유
              </button>
            )}
            <button
              onClick={handleResetProfile}
              className="rounded-xl border border-border/50 bg-secondary/30 p-2.5 text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-foreground"
              title="새 상담 시작"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 게시판 공유 다이얼로그 */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">상담 내용 공유하기</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              AI가 분석한 상담 요약을 게시판에 공유해보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isSummarizing ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI가 대화를 분석하고 있습니다...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={shareContent}
                  onChange={(e) => setShareContent(e.target.value)}
                  placeholder="공유할 내용을 입력하세요..."
                  className="min-h-[200px] bg-secondary/30 border-border text-foreground"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const summary = await generateAISummary();
                    setShareContent(summary);
                  }}
                  disabled={isSummarizing}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  AI 요약 다시 생성
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-summary"
                checked={useSummary}
                onCheckedChange={(checked) => setUseSummary(checked === true)}
              />
              <label htmlFor="use-summary" className="text-sm text-muted-foreground cursor-pointer">
                AI 요약 사용하기 (게시 시 자동 요약)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleShareToCommunity} disabled={isSummarizing}>
              게시판으로 이동
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages - 개선된 메시지 영역 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-32 pt-5">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-fade-in-up",
                message.type === "user" && "flex-row-reverse"
              )}
              style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
            >
              {message.type === "bot" && (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lavender/80 to-accent shadow-md">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                  message.type === "user"
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : "border border-border/30 bg-card/80 text-foreground backdrop-blur-sm"
                )}
              >
                {message.type === "bot" ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                )}
                
                {/* 메시지 시간 표시 */}
                <span className={cn(
                  "mt-2 block text-[10px]",
                  message.type === "user" ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
                )}>
                  {message.timestamp?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* 봇 메시지 피드백 */}
                {message.type === "bot" && message.content && message.id !== "initial" && (
                  <div className="mt-3 flex items-center gap-3 border-t border-border/20 pt-3">
                    <span className="text-xs text-muted-foreground">도움이 되었나요?</span>
                    <div className="flex gap-1">
                      <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* 타이핑 인디케이터 - 개선된 디자인 */}
          {isLoading && messages[messages.length - 1]?.type === "user" && (
            <div className="flex gap-3 animate-fade-in-up">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lavender/80 to-accent shadow-md">
                <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              </div>
              <div className="rounded-2xl border border-border/30 bg-card/80 px-5 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">운세도우미가 답변을 작성 중이에요</span>
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 추천 질문 - 개선된 디자인 */}
        {!isLoading && messages.length > 0 && (() => {
          const lastBotMessage = [...messages].reverse().find(m => m.type === "bot");
          const dynamicQuestions = lastBotMessage?.suggestedQuestions;
          
          const questions = dynamicQuestions && dynamicQuestions.length > 0
            ? dynamicQuestions
            : (analysisContext?.mode === "personal" ? [
                "제 사주에서 가장 강한 오행은 뭔가요?",
                "올해 운세가 궁금해요",
                "직장 운은 어떤가요?",
                "연애운이 궁금해요",
              ] : analysisContext?.mode === "compatibility" ? [
                "저희 궁합에서 가장 잘 맞는 점은?",
                "갈등이 생기면 어떻게 해결하면 좋을까요?",
                "장기적인 관계를 위한 조언이 있나요?",
              ] : suggestedTopics.slice(0, 4));
          
          return (
            <div className="mx-auto mt-6 max-w-2xl">
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {dynamicQuestions && dynamicQuestions.length > 0 ? "✨ 이어서 물어보세요" : "💡 이런 질문은 어떠세요?"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {questions.map((question, idx) => (
                    <button
                      key={`${question}-${idx}`}
                      onClick={() => handleQuickQuestion(question)}
                      className="group rounded-xl border border-border/50 bg-card/50 px-3.5 py-2 text-sm text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-sm"
                    >
                      <span className="opacity-70 transition-opacity group-hover:opacity-100">
                        {question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Input Area - 개선된 입력 영역 */}
      <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-border/50 bg-gradient-to-t from-card to-card/95 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-secondary/20 p-2 transition-all focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="궁금한 점을 물어보세요..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg",
                (!inputValue.trim() || isLoading) && "opacity-40 shadow-none"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
            AI 상담은 참고용이며, 중요한 결정은 전문가와 상담하세요
          </p>
        </div>
      </div>
    </div>
  );
};
