import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========== DB 프롬프트 조회 함수 ==========
async function getActivePrompt(functionName: string, promptName: string, fallbackPrompt: string): Promise<string> {
  // Implementation hidden/simplified for public repo - using fallback
  return fallbackPrompt;
}

const DEFAULT_DAILY_FORTUNE_PROMPT = `[ROLE]
This is a placeholder prompt.
Please configure the actual system prompt in the database table 'prompt_versions'.
Function: daily-fortune
Prompt Name: system_prompt`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, birthDate } = await req.json();

    // DUMMY LOGIC
    console.log("Daily Fortune (DUMMY MODE) for:", name);

    return new Response(JSON.stringify({
      fortune: "This is a dummy daily fortune result. Connect your AI API and Database to generate real fortunes.",
      lucky_color: "Red",
      lucky_direction: "East"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
