import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========== DB 프롬프트 조회 함수 ==========
async function getActivePrompt(functionName: string, promptName: string, fallbackPrompt: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.log("Supabase credentials not found, using fallback prompt");
      return fallbackPrompt;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("prompt_versions")
      .select("prompt_content")
      .eq("function_name", functionName)
      .eq("prompt_name", promptName)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.log(`No active prompt found for ${functionName}/${promptName}, using fallback`);
      return fallbackPrompt;
    }

    console.log(`Loaded active prompt for ${functionName}/${promptName} from DB`);
    return data.prompt_content;
  } catch (err) {
    console.error("Error fetching prompt from DB:", err);
    return fallbackPrompt;
  }
}

// ========== 기본 상수 (타입 정의용) ==========
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const STEMS_YINYANG = ["양", "음", "양", "음", "양", "음", "양", "음", "양", "음"];

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// ========== DUMMY DATA ENGINE ==========
// 실제 만세력 로직은 제거되었습니다.
// This file is a DUMMY version for the public repository.
// Real calculation logic has been removed to protect intellectual property.

interface LunarToSolarResult {
  year: number;
  month: number;
  day: number;
  isValid: boolean;
  error?: string;
  lunarConversionLog?: string | null;
}

function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean = false): LunarToSolarResult {
  // Dummy conversion: Just return input as solar
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isValid: true,
    lunarConversionLog: "음력 변환 로직은 더미 데이터로 대체되었습니다."
  };
}

type ElementType = "목" | "화" | "토" | "금" | "수";

interface SajuPillars {
  year: { stem: number; branch: number };
  month: { stem: number; branch: number };
  day: { stem: number; branch: number };
  hour: { stem: number; branch: number } | null;
}

interface Proof {
  engine_version: string;
  solar_term_data_version: string;
  decision_log: Array<{ key: string; value: string }>;
  references: {
    ipchun_at: string | null;
    month_terms: [string | null, string | null];
    base_epoch: string;
  };
}

interface SajuResult {
  pillars: SajuPillars;
  proof: Proof;
}

function calculateSaju(
  birthDate: Date,
  birthHour: number | null,
  birthMinute: number = 0,
  options: any = {},
): SajuResult {
  // Dummy Saju: Always return Gap-Ja (0,0) for Year/Month, and variable Day/Hour based on randomness or simple modulo
  return {
    pillars: {
      year: { stem: 0, branch: 0 }, // 갑자
      month: { stem: 2, branch: 2 }, // 병인
      day: { stem: 4, branch: 4 }, // 무진
      hour: { stem: 6, branch: 6 } // 경오
    },
    proof: {
      engine_version: "DUMMY-3.0",
      solar_term_data_version: "DUMMY",
      decision_log: [{ key: "Info", value: "This is dummy data." }],
      references: {
        ipchun_at: null,
        month_terms: [null, null],
        base_epoch: "DUMMY"
      }
    }
  };
}

interface StructureResult {
  name: string;
  tenGod: string;
  tenGodHanja: string;
  reasoning: string;
}

interface YongsinResult {
  yongsin: ElementType;
  huisin: ElementType;
  gisin: ElementType;
  method: "억부" | "조후" | "조후+억부";
  reasoning: string;
}

interface PersonAnalysis {
  dayMaster: {
    stem: string;
    stemHanja: string;
    element: ElementType;
    yinYang: string;
    strength: string;
  };
  structure: StructureResult;
  yongsin: YongsinResult;
  elementCounts: Record<ElementType, number>;
}

function analyzePersonSaju(pillars: SajuPillars): PersonAnalysis {
  return {
    dayMaster: {
      stem: HEAVENLY_STEMS[pillars.day.stem],
      stemHanja: STEMS_HANJA[pillars.day.stem],
      element: "토",
      yinYang: "양",
      strength: "신강"
    },
    structure: {
      name: "편재격",
      tenGod: "편재",
      tenGodHanja: "偏財",
      reasoning: "더미 데이터 분석 결과입니다."
    },
    yongsin: {
      yongsin: "목",
      huisin: "수",
      gisin: "토",
      method: "억부",
      reasoning: "더미 데이터 용신 분석입니다."
    },
    elementCounts: { "목": 1, "화": 2, "토": 3, "금": 1, "수": 1 }
  };
}

// ========== 서버 핸들러 ==========

const FALLBACK_SYSTEM_PROMPT = `[ROLE]
This is a placeholder prompt.
Please configure the actual system prompt in the database table 'prompt_versions'.
Function: saju-analysis
Prompt Name: system_prompt`;

const FALLBACK_COMPONENT_PROMPT = `[PLACEHOLDER]
This is a placeholder prompt component.
Please configure the actual prompt in the database table 'prompt_versions'.`;

// PromptModules interface
interface PromptModules {
  systemPrompt: string;
  basePersona: string;
  daymasterAnalysis: string;
  tenstarStructure: string;
  luckCycleAnalysis: string;
  areaFortune: string;
  synthesisAdvice: string;
}

// Loader function
async function loadAllPromptModules(): Promise<PromptModules> {
  const functionName = "saju-analysis";

  const [
    systemPrompt,
    basePersona,
    daymasterAnalysis,
    tenstarStructure,
    luckCycleAnalysis,
    areaFortune,
    synthesisAdvice
  ] = await Promise.all([
    getActivePrompt(functionName, "system_prompt", FALLBACK_SYSTEM_PROMPT),
    getActivePrompt(functionName, "base_persona", FALLBACK_COMPONENT_PROMPT),
    getActivePrompt(functionName, "daymaster_analysis", FALLBACK_COMPONENT_PROMPT),
    getActivePrompt(functionName, "tenstar_structure", FALLBACK_COMPONENT_PROMPT),
    getActivePrompt(functionName, "luck_cycle_analysis", FALLBACK_COMPONENT_PROMPT),
    getActivePrompt(functionName, "area_fortune", FALLBACK_COMPONENT_PROMPT),
    getActivePrompt(functionName, "synthesis_advice", FALLBACK_COMPONENT_PROMPT)
  ]);

  return { systemPrompt, basePersona, daymasterAnalysis, tenstarStructure, luckCycleAnalysis, areaFortune, synthesisAdvice };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, gender, birthDate, birthTime, calendarType, forceModel } = await req.json();

    console.log("Analyzing saju (DUMMY MODE) for:", name);

    // Dummy Conversion
    const solarResult = lunarToSolar(2000, 1, 1, false); // Dummy args
    const birthDateObj = new Date(); // Dummy date

    // Dummy Calculation
    const saju = calculateSaju(birthDateObj, 12, 0);
    const analysis = analyzePersonSaju(saju.pillars);

    const dayElement = analysis.dayMaster.element;
    const strength = analysis.dayMaster.strength;
    const elementCounts = analysis.elementCounts;
    const total = 8;
    const tenGodDistribution = { "비견": 1, "겁재": 1, "식신": 1, "상관": 1, "편재": 1, "정재": 1, "편관": 1, "정관": 1 }; // Dummy
    const structureResult = analysis.structure;
    const yongsinResult = analysis.yongsin;

    // Dummy Daeun/Saeun
    const daeun = { startAge: 1, direction: "forward", pillars: [], daysToTerm: 10 };
    const currentDaeun = { stem: "갑", branch: "자", stemHanja: "甲", branchHanja: "子", element: "목", startAge: 10, endAge: 19 };
    const saeunYear = 2026;
    const saeunData = { year: 2026, stem: "병", branch: "오", stemHanja: "丙", branchHanja: "午", element: "화" };
    const uncertaintyNote = null;

    // Load Prompts (Still works with DB or Fallback)
    const prompts = await loadAllPromptModules();

    // AI API Call (Keeping the structure but simplifing)
    const GEMINI_API_KEY = Deno.env.get("Gemini");
    const GPT_API_KEY = Deno.env.get("GPT");

    let finalResponse = "This is a dummy AI response based on dummy data.";

    // ... (Skipping actual AI call implementation for brevity in this dummy file, or keeping it if needed to show architecture)
    // For this task, user wants to hide "Core Logic". AI calling code is "Core Logic" too? 
    // Usually "Logic" means the Manse calculation. AI calls are standard.
    // I represents the AI logic here with a placeholder to avoid complexity in this file replacement.

    // Construct simplified context string
    const contextString = JSON.stringify({
      birth_info: { name, gender, calendar: calendarType, birth_date: birthDate, birth_time: birthTime },
      chart: { ...saju.pillars, day_master: analysis.dayMaster },
      note: "This is dummy data."
    }, null, 2);

    return new Response(JSON.stringify({
      analysis: finalResponse,
      saju: {
        pillars: saju.pillars,
        tenGods: tenGodDistribution,
        yongsin: yongsinResult,
        daeun: { current: currentDaeun }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper for LunarToSolar (unused but kept for reference if needed, or removed)
function getLunarYearDays(year: number): number { return 365; }
