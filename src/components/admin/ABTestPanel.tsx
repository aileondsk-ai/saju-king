import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, RotateCcw, Clock, Sparkles } from "lucide-react";

interface TestResult {
  model: string;
  response: unknown;
  duration: number;
  timestamp: string;
  error?: string;
}

interface TestInput {
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  calendarType: string;
}

export default function ABTestPanel() {
  const [testInput, setTestInput] = useState<TestInput>({
    name: "테스트",
    gender: "male",
    birthDate: "1990-01-15",
    birthTime: "10:30",
    calendarType: "solar",
  });
  
  const [geminiResult, setGeminiResult] = useState<TestResult | null>(null);
  const [gptResult, setGptResult] = useState<TestResult | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isLoadingGpt, setIsLoadingGpt] = useState(false);
  const [selectedTab, setSelectedTab] = useState("gemini");

  const runTest = async (model: "gemini" | "gpt") => {
    const setLoading = model === "gemini" ? setIsLoadingGemini : setIsLoadingGpt;
    const setResult = model === "gemini" ? setGeminiResult : setGptResult;
    
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke("saju-analysis", {
        body: {
          ...testInput,
          forceModel: model,
        },
      });

      const duration = Date.now() - startTime;

      if (error) {
        setResult({
          model: model === "gemini" ? "Gemini 3.0 Pro" : "GPT-5.2",
          response: null,
          duration,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
        toast({
          title: "테스트 실패",
          description: `${model.toUpperCase()} API 호출 중 오류가 발생했습니다.`,
          variant: "destructive",
        });
      } else {
        setResult({
          model: data?._meta?.usedModel || (model === "gemini" ? "Gemini 3.0 Pro" : "GPT-5.2"),
          response: data,
          duration,
          timestamp: new Date().toISOString(),
        });
        toast({
          title: "테스트 완료",
          description: `${model.toUpperCase()} 응답을 받았습니다. (${(duration / 1000).toFixed(2)}초)`,
        });
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      setResult({
        model: model === "gemini" ? "Gemini 3.0 Pro" : "GPT-5.2",
        response: null,
        duration,
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const runBothTests = async () => {
    setGeminiResult(null);
    setGptResult(null);
    // 병렬 실행
    await Promise.all([runTest("gemini"), runTest("gpt")]);
  };

  const resetResults = () => {
    setGeminiResult(null);
    setGptResult(null);
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}초`;
  };

  const renderResultCard = (result: TestResult | null, isLoading: boolean, model: string) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>{model} API 호출 중...</p>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Sparkles className="w-8 h-8 mb-3 opacity-50" />
          <p>테스트를 실행해주세요</p>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-destructive font-medium">오류 발생</p>
          <p className="text-sm text-destructive/80 mt-1">{result.error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(result.duration)}
          </Badge>
          <Badge variant="secondary">{result.model}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(result.timestamp).toLocaleString("ko-KR")}
          </span>
        </div>
        <ScrollArea className="h-[400px]">
          <pre className="text-xs font-mono p-4 bg-muted rounded-lg whitespace-pre-wrap">
            {JSON.stringify(result.response, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 입력 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            A/B 테스트 입력
          </CardTitle>
          <CardDescription>
            동일한 입력 데이터로 Gemini 3.0 Pro와 GPT-5.2의 응답을 비교합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={testInput.name}
                onChange={(e) => setTestInput({ ...testInput, name: e.target.value })}
                placeholder="이름"
              />
            </div>
            <div>
              <Label htmlFor="gender">성별</Label>
              <Select
                value={testInput.gender}
                onValueChange={(v) => setTestInput({ ...testInput, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="birthDate">생년월일</Label>
              <Input
                id="birthDate"
                type="date"
                value={testInput.birthDate}
                onChange={(e) => setTestInput({ ...testInput, birthDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="birthTime">출생시간</Label>
              <Input
                id="birthTime"
                type="time"
                value={testInput.birthTime}
                onChange={(e) => setTestInput({ ...testInput, birthTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="calendarType">달력 유형</Label>
              <Select
                value={testInput.calendarType}
                onValueChange={(v) => setTestInput({ ...testInput, calendarType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solar">양력</SelectItem>
                  <SelectItem value="lunar">음력</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={runBothTests} disabled={isLoadingGemini || isLoadingGpt} className="gap-2">
              <Play className="w-4 h-4" />
              양쪽 모두 테스트
            </Button>
            <Button
              variant="outline"
              onClick={() => runTest("gemini")}
              disabled={isLoadingGemini || isLoadingGpt}
            >
              Gemini만 테스트
            </Button>
            <Button
              variant="outline"
              onClick={() => runTest("gpt")}
              disabled={isLoadingGemini || isLoadingGpt}
            >
              GPT만 테스트
            </Button>
            <Button variant="ghost" onClick={resetResults} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gemini 결과 */}
        <Card className="border-blue-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Gemini 3.0 Pro (Primary)
              </CardTitle>
              {geminiResult && !geminiResult.error && (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50">
                  {formatDuration(geminiResult.duration)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderResultCard(geminiResult, isLoadingGemini, "Gemini")}
          </CardContent>
        </Card>

        {/* GPT 결과 */}
        <Card className="border-green-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                GPT-5.2 (Fallback)
              </CardTitle>
              {gptResult && !gptResult.error && (
                <Badge variant="outline" className="text-green-500 border-green-500/50">
                  {formatDuration(gptResult.duration)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderResultCard(gptResult, isLoadingGpt, "GPT")}
          </CardContent>
        </Card>
      </div>

      {/* 비교 분석 */}
      {geminiResult && gptResult && !geminiResult.error && !gptResult.error && (
        <Card>
          <CardHeader>
            <CardTitle>비교 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="gemini">Gemini 응답</TabsTrigger>
                <TabsTrigger value="gpt">GPT 응답</TabsTrigger>
                <TabsTrigger value="comparison">성능 비교</TabsTrigger>
              </TabsList>
              
              <TabsContent value="gemini" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <pre className="text-xs font-mono p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {JSON.stringify(geminiResult.response, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="gpt" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <pre className="text-xs font-mono p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {JSON.stringify(gptResult.response, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="comparison" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="font-medium text-blue-400 mb-2">Gemini 3.0 Pro</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">응답 시간</span>
                        <span>{formatDuration(geminiResult.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">모델</span>
                        <span>{geminiResult.model}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <h4 className="font-medium text-green-400 mb-2">GPT-5.2</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">응답 시간</span>
                        <span>{formatDuration(gptResult.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">모델</span>
                        <span>{gptResult.model}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">속도 비교</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Gemini</span>
                        <span>{formatDuration(geminiResult.duration)}</span>
                      </div>
                      <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (geminiResult.duration / Math.max(geminiResult.duration, gptResult.duration)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>GPT</span>
                        <span>{formatDuration(gptResult.duration)}</span>
                      </div>
                      <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (gptResult.duration / Math.max(geminiResult.duration, gptResult.duration)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {geminiResult.duration < gptResult.duration
                      ? `Gemini가 ${formatDuration(gptResult.duration - geminiResult.duration)} 더 빠릅니다.`
                      : geminiResult.duration > gptResult.duration
                      ? `GPT가 ${formatDuration(geminiResult.duration - gptResult.duration)} 더 빠릅니다.`
                      : "두 모델의 응답 시간이 동일합니다."}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
