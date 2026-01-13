import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worryId, content } = await req.json();

    if (!worryId || !content) {
      return new Response(
        JSON.stringify({ error: "worryId and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worry-summarize] Processing worry ${worryId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // AI 요약 생성
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `당신은 따뜻하고 공감력 있는 상담사입니다. 사용자의 고민을 한 문장으로 요약해주세요.
            
규칙:
- 30자 내외로 핵심만 요약
- 따뜻하고 공감하는 톤 유지
- 판단하지 않고 있는 그대로 요약
- 한국어로 작성`,
          },
          {
            role: "user",
            content: `다음 고민을 한 문장으로 요약해주세요:\n\n${content}`,
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[worry-summarize] AI error: ${errorText}`);
      throw new Error("AI summarization failed");
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("No summary generated");
    }

    console.log(`[worry-summarize] Generated summary: ${summary}`);

    // DB 업데이트
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("worries")
      .update({ ai_summary: summary })
      .eq("id", worryId);

    if (updateError) {
      console.error(`[worry-summarize] DB update error:`, updateError);
      throw updateError;
    }

    console.log(`[worry-summarize] Successfully updated worry ${worryId}`);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[worry-summarize] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
