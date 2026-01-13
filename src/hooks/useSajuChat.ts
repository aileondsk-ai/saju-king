import { useState, useCallback } from "react";
import { SAJU_PROMPTS } from "@/lib/saju-prompts";

export interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  suggestedQuestions?: string[];
}

export interface UserProfile {
  name: string;
  gender: string;
  birthDate: string;
  birthTime?: string;
}

export interface AnalysisContext {
  mode: "personal" | "compatibility";
  // 개인 사주 분석용
  person?: {
    name: string;
    gender: string;
    birthDate: string;
    birthTime?: string;
  };
  // 궁합 분석용
  relationshipType?: string;
  personA?: {
    name: string;
    gender: string;
    birthDate: string;
    birthTime?: string;
  };
  personB?: {
    name: string;
    gender: string;
    birthDate: string;
    birthTime?: string;
  };
  // 공통
  summary: string;
  analysisData?: Record<string, unknown>;
  concerns?: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saju-chat`;

export function useSajuChat(userProfile?: UserProfile, analysisContext?: AnalysisContext) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      type: "bot",
      content: analysisContext 
        ? `${userProfile?.name || ""}님, 분석 결과를 바탕으로 상담을 시작할게요. 😊\n\n궁금하신 점이나 더 알고 싶은 부분이 있으시면 편하게 말씀해주세요.`
        : SAJU_PROMPTS.chatbot.initialGreeting,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 대화 히스토리 구성 (시스템 메시지 제외)
    const conversationHistory = messages
      .filter((m) => m.id !== "initial")
      .map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      }));

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...conversationHistory,
            { role: "user", content: userInput },
          ],
          userProfile: userProfile ? {
            name: userProfile.name,
            gender: userProfile.gender,
            birthDate: userProfile.birthDate,
            birthTime: userProfile.birthTime,
          } : null,
          analysisContext: analysisContext || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      if (!response.body) {
        throw new Error("응답을 받지 못했습니다.");
      }

      // 스트리밍 응답 처리
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      // 어시스턴트 메시지 생성
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          type: "bot",
          content: "",
          timestamp: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // SSE 라인별 처리
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              
              // 추천 질문 파싱
              const { cleanContent, suggestedQuestions } = parseResponse(assistantContent);
              
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: cleanContent, suggestedQuestions }
                    : m
                )
              );
            }
          } catch {
            // JSON 파싱 실패시 버퍼에 다시 넣기
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      
      // 에러 메시지를 봇 응답으로 추가
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `죄송해요, 일시적인 문제가 발생했어요. 😢\n${errorMessage}\n\n잠시 후 다시 시도해주세요.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, userProfile, analysisContext]);

  // 추천 질문 파싱 함수
  function parseResponse(content: string): { cleanContent: string; suggestedQuestions?: string[] } {
    const startMarker = "---SUGGESTED_QUESTIONS---";
    const endMarker = "---END_SUGGESTED_QUESTIONS---";
    
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) {
      return { cleanContent: content };
    }
    
    const endIdx = content.indexOf(endMarker);
    const cleanContent = content.substring(0, startIdx).trim();
    
    if (endIdx === -1) {
      // 아직 끝 마커가 안 왔음 - 파싱 시도
      const questionsSection = content.substring(startIdx + startMarker.length);
      const questions = parseQuestions(questionsSection);
      return { cleanContent, suggestedQuestions: questions.length > 0 ? questions : undefined };
    }
    
    const questionsSection = content.substring(startIdx + startMarker.length, endIdx);
    const questions = parseQuestions(questionsSection);
    
    return { cleanContent, suggestedQuestions: questions.length > 0 ? questions : undefined };
  }

  function parseQuestions(section: string): string[] {
    const lines = section.split("\n").filter(line => line.trim());
    const questions: string[] = [];
    
    for (const line of lines) {
      // "1. 질문내용" 또는 "- 질문내용" 형식 파싱
      const match = line.match(/^[\d\-\.\)]+\s*(.+)/);
      if (match && match[1]) {
        const question = match[1].trim().replace(/[\[\]]/g, "");
        if (question.length > 3 && question.length < 50) {
          questions.push(question);
        }
      }
    }
    
    return questions.slice(0, 3);
  }

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "initial",
        type: "bot",
        content: SAJU_PROMPTS.chatbot.initialGreeting,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    suggestedTopics: SAJU_PROMPTS.chatbot.suggestedTopics,
  };
}
