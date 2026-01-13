import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { History, Plus, Save, RotateCcw, Check, Eye, X, FlaskConical } from "lucide-react";
import ABTestPanel from "@/components/admin/ABTestPanel";

interface PromptVersion {
  id: string;
  function_name: string;
  version_number: number;
  prompt_name: string;
  prompt_content: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FUNCTION_OPTIONS = [
  { value: "saju-analysis", label: "사주 분석", description: "SAJU_ANALYSIS_SYSTEM_PROMPT" },
  { value: "compatibility-analysis", label: "궁합 분석", description: "COMPATIBILITY_SYSTEM_PROMPT" },
  { value: "saju-chat", label: "사주 상담", description: "CHATBOT_SYSTEM_PROMPT" },
  { value: "daily-fortune", label: "오늘의 운세", description: "daily-fortune systemPrompt" },
];

const PROMPT_NAME_OPTIONS = [
  { value: "system_prompt", label: "시스템 프롬프트" },
  { value: "knowledge_base", label: "지식 베이스" },
  { value: "user_template", label: "유저 템플릿" },
];

export default function PromptManagementView() {
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>("saju-analysis");
  const [selectedPromptName, setSelectedPromptName] = useState<string>("system_prompt");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<string>("prompts");
  
  // 새 버전 생성 폼
  const [newContent, setNewContent] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  
  // 프리뷰 다이얼로그
  const [previewPrompt, setPreviewPrompt] = useState<PromptVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [selectedFunction, selectedPromptName]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("function_name", selectedFunction)
        .eq("prompt_name", selectedPromptName)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      toast({
        title: "오류",
        description: "프롬프트 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextVersionNumber = () => {
    if (prompts.length === 0) return 1;
    return Math.max(...prompts.map(p => p.version_number)) + 1;
  };

  const handleCreateVersion = async () => {
    if (!newContent.trim()) {
      toast({
        title: "오류",
        description: "프롬프트 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("prompt_versions").insert({
        function_name: selectedFunction,
        prompt_name: selectedPromptName,
        version_number: getNextVersionNumber(),
        prompt_content: newContent,
        description: newDescription || null,
        is_active: false,
      });

      if (error) throw error;

      toast({
        title: "성공",
        description: "새 버전이 생성되었습니다.",
      });
      
      setNewContent("");
      setNewDescription("");
      setShowNewVersionDialog(false);
      fetchPrompts();
    } catch (error) {
      console.error("Failed to create version:", error);
      toast({
        title: "오류",
        description: "버전 생성에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateVersion = async (prompt: PromptVersion) => {
    setSaving(true);
    try {
      // 먼저 같은 function_name + prompt_name의 모든 활성화 해제
      await supabase
        .from("prompt_versions")
        .update({ is_active: false })
        .eq("function_name", selectedFunction)
        .eq("prompt_name", selectedPromptName);

      // 선택한 버전 활성화
      const { error } = await supabase
        .from("prompt_versions")
        .update({ is_active: true })
        .eq("id", prompt.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: `v${prompt.version_number}이 활성화되었습니다.`,
      });
      
      fetchPrompts();
    } catch (error) {
      console.error("Failed to activate version:", error);
      toast({
        title: "오류",
        description: "버전 활성화에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (prompt: PromptVersion) => {
    // 이전 버전으로 롤백 = 해당 버전을 활성화
    await handleActivateVersion(prompt);
    toast({
      title: "롤백 완료",
      description: `v${prompt.version_number}으로 롤백되었습니다.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activePrompt = prompts.find(p => p.is_active);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">프롬프트 관리</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI 분석 프롬프트의 버전을 관리하고 A/B 테스트를 수행할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 메인 탭 (프롬프트 관리 / A/B 테스트) */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="prompts" className="gap-2">
              <History className="w-4 h-4" />
              프롬프트 관리
            </TabsTrigger>
            <TabsTrigger value="abtest" className="gap-2">
              <FlaskConical className="w-4 h-4" />
              A/B 테스트
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abtest" className="mt-6">
            <ABTestPanel />
          </TabsContent>

          <TabsContent value="prompts" className="mt-6 space-y-6">
            {/* 새 버전 생성 버튼 */}
            <div className="flex justify-end">
              <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    새 버전 생성
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>새 프롬프트 버전 생성</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">기능</label>
                        <p className="text-sm text-muted-foreground">
                          {FUNCTION_OPTIONS.find(f => f.value === selectedFunction)?.label}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">프롬프트 종류</label>
                        <p className="text-sm text-muted-foreground">
                          {PROMPT_NAME_OPTIONS.find(p => p.value === selectedPromptName)?.label}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">변경 설명</label>
                      <Input
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="예: 스토리텔링 방식 강화, 톤앤매너 수정"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">프롬프트 내용</label>
                      <ScrollArea className="h-[300px] mt-1">
                        <Textarea
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder="프롬프트 내용을 입력하세요..."
                          className="min-h-[280px] font-mono text-sm"
                        />
                      </ScrollArea>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleCreateVersion} disabled={saving} className="gap-2">
                      <Save className="w-4 h-4" />
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* 필터 */}
            <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">기능 선택</label>
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNCTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">({option.description})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">프롬프트 종류</label>
                <Select value={selectedPromptName} onValueChange={setSelectedPromptName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_NAME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* 현재 활성 프롬프트 */}
            {activePrompt && (
              <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">활성</Badge>
                  <CardTitle className="text-lg">v{activePrompt.version_number}</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(activePrompt.created_at)}
                </span>
              </div>
              {activePrompt.description && (
                <CardDescription>{activePrompt.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-background/50 rounded-lg p-3 font-mono text-xs max-h-[150px] overflow-y-auto">
                {activePrompt.prompt_content.substring(0, 500)}
                {activePrompt.prompt_content.length > 500 && "..."}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => {
                  setPreviewPrompt(activePrompt);
                  setShowPreview(true);
                }}
              >
                <Eye className="w-4 h-4" />
                전체 보기
              </Button>
            </CardContent>
              </Card>
            )}

            {/* 버전 히스토리 */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              버전 히스토리
            </CardTitle>
            <CardDescription>
              총 {prompts.length}개의 버전이 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>저장된 프롬프트가 없습니다.</p>
                <p className="text-sm mt-1">새 버전을 생성해주세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-4 rounded-lg border ${
                      prompt.is_active
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">v{prompt.version_number}</span>
                          {prompt.is_active && (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              활성
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(prompt.created_at)}
                          </span>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {prompt.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {prompt.prompt_content.substring(0, 100)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewPrompt(prompt);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!prompt.is_active && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateVersion(prompt)}
                              disabled={saving}
                              className="gap-1"
                            >
                              <Check className="w-4 h-4" />
                              활성화
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollback(prompt)}
                              disabled={saving}
                              className="gap-1"
                            >
                              <RotateCcw className="w-4 h-4" />
                              롤백
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
            </Card>

            {/* 프롬프트 프리뷰 다이얼로그 */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    v{previewPrompt?.version_number} 프롬프트 내용
                    {previewPrompt?.is_active && (
                      <Badge variant="default" className="bg-green-500">활성</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <pre className="whitespace-pre-wrap text-sm font-mono p-4 bg-muted rounded-lg">
                    {previewPrompt?.prompt_content}
                  </pre>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    닫기
                  </Button>
                  {previewPrompt && !previewPrompt.is_active && (
                    <Button
                      onClick={() => {
                        handleActivateVersion(previewPrompt);
                        setShowPreview(false);
                      }}
                      disabled={saving}
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      이 버전 활성화
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
