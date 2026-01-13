import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userName } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[chat-summarize] Processing ${messages.length} messages for ${userName}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 대화 내용을 포맷팅
    const conversationText = messages
      .map((msg: ChatMessage) => `${msg.role === "user" ? "👤 질문" : "🔮 답변"}: ${msg.content}`)
      .join("\n\n");

    // AI로 대화 요약 및 인사이트 추출
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          {
            role: "system",
            content: `당신은 사주 상담 내용을 분석하는 전문가입니다. 대화 내용을 분석하여 핵심 정보를 추출해주세요.

## 분석 규칙
1. 사용자의 주요 고민을 파악합니다
2. 상담에서 나온 핵심 인사이트를 추출합니다
3. 사용자에게 도움이 될 조언을 정리합니다
4. 키워드는 3-5개로 추출합니다

## 출력 형식 (반드시 아래 형식으로 작성)
📋 상담 요약
[2-3문장으로 전체 상담 내용 요약]

🔑 핵심 키워드
#키워드1 #키워드2 #키워드3

💡 주요 인사이트
• [인사이트 1]
• [인사이트 2]
• [인사이트 3]

💬 나의 고민
[사용자의 핵심 고민을 1-2문장으로 정리]

## 주의사항
- 따뜻하고 공감하는 톤 유지
- 개인정보는 포함하지 않음
- 게시판에 올릴 수 있도록 정리`,
          },
          {
            role: "user",
            content: `다음은 ${userName || "사용자"}님의 사주 상담 대화입니다. 분석해주세요:\n\n${conversationText}`,
          },
        ],
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "서비스 사용량을 초과했습니다." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error(`[chat-summarize] AI error: ${errorText}`);
      throw new Error("AI summarization failed");
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("No summary generated");
    }

    console.log(`[chat-summarize] Generated summary successfully`);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[chat-summarize] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
