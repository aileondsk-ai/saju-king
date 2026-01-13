import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getActivePrompt(functionName: string, promptName: string, fallbackPrompt: string): Promise<string> {
  return fallbackPrompt;
}

const COMPATIBILITY_SYSTEM_PROMPT = `This is a placeholder prompt.
Please configure the actual system prompt in the database table 'prompt_versions'.
Function: compatibility-analysis
Prompt Name: system_prompt`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { person1, person2 } = await req.json();

    // DUMMY LOGIC
    console.log("Compatibility Analysis (DUMMY MODE) for:", person1.name, person2.name);

    return new Response(JSON.stringify({
      score: 85,
      summary: "This is a dummy compatibility analysis result.",
      details: {
        love: 90,
        communication: 80,
        values: 85
      }
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
