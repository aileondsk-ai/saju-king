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

// 천간 (Heavenly Stems)
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const HEAVENLY_STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// 지지 (Earthly Branches)  
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const EARTHLY_BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 띠
const ZODIAC_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

// 오행
const ELEMENTS = ["목", "화", "토", "금", "수"];
const ELEMENT_COLORS: Record<string, { name: string; code: string }> = {
  "목": { name: "초록", code: "#4CAF50" },
  "화": { name: "빨강", code: "#E53935" },
  "토": { name: "노랑", code: "#FFC107" },
  "금": { name: "흰색", code: "#FAFAFA" },
  "수": { name: "파랑", code: "#2196F3" },
};
const ELEMENT_NUMBERS: Record<string, number[]> = {
  "목": [3, 8],
  "화": [2, 7],
  "토": [5, 10],
  "금": [4, 9],
  "수": [1, 6],
};

// 천간 → 오행 매핑
const STEM_TO_ELEMENT: Record<string, string> = {
  "갑": "목", "을": "목",
  "병": "화", "정": "화",
  "무": "토", "기": "토",
  "경": "금", "신": "금",
  "임": "수", "계": "수",
};

// 지지 → 오행 매핑
const BRANCH_TO_ELEMENT: Record<string, string> = {
  "자": "수", "축": "토", "인": "목", "묘": "목",
  "진": "토", "사": "화", "오": "화", "미": "토",
  "신": "금", "유": "금", "술": "토", "해": "수",
};

// 육합 (六合) 관계
const COMBINATIONS = [
  ["자", "축"], ["인", "해"], ["묘", "술"],
  ["진", "유"], ["사", "신"], ["오", "미"]
];

// 충 (沖) 관계
const CLASHES = [
  ["자", "오"], ["축", "미"], ["인", "신"],
  ["묘", "유"], ["진", "술"], ["사", "해"]
];

// 상생 관계 (A가 B를 생함)
const GENERATING: Record<string, string> = {
  "목": "화", "화": "토", "토": "금", "금": "수", "수": "목"
};

// 상극 관계 (A가 B를 극함)
const CONTROLLING: Record<string, string> = {
  "목": "토", "토": "수", "수": "화", "화": "금", "금": "목"
};

// 일진 계산 (기준일: 1900년 1월 1일 = 갑자일)
function getDayGanji(date: Date): { gan: string; ji: string; ganHanja: string; jiHanja: string } {
  const baseDate = new Date(1900, 0, 1); // 1900년 1월 1일
  const diffTime = date.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 1900년 1월 1일은 갑자(甲子)일이 아니므로 보정 필요
  // 실제로 1900년 1월 1일은 갑진(甲辰)일 → 4번째 지지
  const baseStemIndex = 0; // 갑
  const baseBranchIndex = 4; // 진

  const stemIndex = (baseStemIndex + diffDays) % 10;
  const branchIndex = (baseBranchIndex + diffDays) % 12;

  return {
    gan: HEAVENLY_STEMS[stemIndex >= 0 ? stemIndex : stemIndex + 10],
    ji: EARTHLY_BRANCHES[branchIndex >= 0 ? branchIndex : branchIndex + 12],
    ganHanja: HEAVENLY_STEMS_HANJA[stemIndex >= 0 ? stemIndex : stemIndex + 10],
    jiHanja: EARTHLY_BRANCHES_HANJA[branchIndex >= 0 ? branchIndex : branchIndex + 12],
  };
}

// 연주 계산
function getYearGanji(year: number): { gan: string; ji: string; zodiac: string } {
  const baseYear = 1984; // 갑자년
  const diff = year - baseYear;

  const stemIndex = ((diff % 10) + 10) % 10;
  const branchIndex = ((diff % 12) + 12) % 12;

  return {
    gan: HEAVENLY_STEMS[stemIndex],
    ji: EARTHLY_BRANCHES[branchIndex],
    zodiac: ZODIAC_ANIMALS[branchIndex],
  };
}

// 월주 계산 (간략화 - 생일 기준 월)
function getMonthGanji(month: number, yearStem: string): { gan: string; ji: string } {
  // 월지는 고정: 인(1월), 묘(2월), ... 축(12월)
  const branchIndex = (month + 1) % 12; // 1월=인(2), 2월=묘(3), ...

  // 월간은 연간에 따라 결정 (연간 갑/기 → 병인월 시작)
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem);
  const monthStemBase = (yearStemIndex % 5) * 2 + 2;
  const stemIndex = (monthStemBase + month - 1) % 10;

  return {
    gan: HEAVENLY_STEMS[stemIndex],
    ji: EARTHLY_BRANCHES[branchIndex],
  };
}

// 일주 계산 (간략화 - 생일 기준)
function getBirthDayGanji(birthDate: Date): { gan: string; ji: string } {
  return getDayGanji(birthDate);
}

// 두 지지 간 관계 점수 계산
function calculateRelation(ji1: string, ji2: string): number {
  // 합(合) 관계: +25
  for (const combo of COMBINATIONS) {
    if ((combo[0] === ji1 && combo[1] === ji2) || (combo[0] === ji2 && combo[1] === ji1)) {
      return 25;
    }
  }

  // 충(沖) 관계: -20
  for (const clash of CLASHES) {
    if ((clash[0] === ji1 && clash[1] === ji2) || (clash[0] === ji2 && clash[1] === ji1)) {
      return -20;
    }
  }

  const element1 = BRANCH_TO_ELEMENT[ji1];
  const element2 = BRANCH_TO_ELEMENT[ji2];

  // 상생 관계: +10
  if (GENERATING[element1] === element2 || GENERATING[element2] === element1) {
    return 10;
  }

  // 상극 관계: -10
  if (CONTROLLING[element1] === element2 || CONTROLLING[element2] === element1) {
    return -10;
  }

  return 0;
}

// 영역별 점수 계산
function calculateAreaScores(
  birthYear: { gan: string; ji: string },
  birthMonth: { gan: string; ji: string },
  birthDay: { gan: string; ji: string },
  todayJi: string
): { wealth: number; work: number; relationship: number } {
  const todayElement = BRANCH_TO_ELEMENT[todayJi];
  const dayElement = BRANCH_TO_ELEMENT[birthDay.ji];

  // 재물운: 일간이 극하는 오행이 오늘 강하면 +
  let wealthScore = 3;
  if (CONTROLLING[dayElement] === todayElement) {
    wealthScore = 4;
  } else if (todayElement === "금" || todayElement === "토") {
    wealthScore = Math.min(5, wealthScore + 1);
  }

  // 직장운: 오늘 화(火) 기운이면 추진력 +
  let workScore = 3;
  if (todayElement === "화" || todayElement === "목") {
    workScore = Math.min(5, workScore + 2);
  } else if (todayElement === "토") {
    workScore = Math.min(5, workScore + 1);
  }

  // 관계운: 합 관계면 +
  let relationScore = 3;
  const yearRelation = calculateRelation(birthYear.ji, todayJi);
  if (yearRelation > 0) {
    relationScore = Math.min(5, relationScore + 2);
  } else if (yearRelation < 0) {
    relationScore = Math.max(1, relationScore - 1);
  }

  return {
    wealth: Math.max(1, Math.min(5, wealthScore)),
    work: Math.max(1, Math.min(5, workScore)),
    relationship: Math.max(1, Math.min(5, relationScore)),
  };
}

// 종합 점수 계산
function calculateDailyFortune(birthDate: Date, today: Date): {
  score: number;
  grade: string;
  areas: { wealth: number; work: number; relationship: number };
  element: string;
  luckyColor: { name: string; code: string };
  luckyNumbers: number[];
} {
  const birthYear = getYearGanji(birthDate.getFullYear());
  const birthMonth = getMonthGanji(birthDate.getMonth() + 1, birthYear.gan);
  const birthDay = getBirthDayGanji(birthDate);
  const todayGanji = getDayGanji(today);

  let baseScore = 65;

  // 연지 상성 (40%)
  const yearRelation = calculateRelation(birthYear.ji, todayGanji.ji);
  baseScore += yearRelation * 0.4;

  // 월지 상성 (30%)
  const monthRelation = calculateRelation(birthMonth.ji, todayGanji.ji);
  baseScore += monthRelation * 0.3;

  // 일지 상성 (20%)
  const dayRelation = calculateRelation(birthDay.ji, todayGanji.ji);
  baseScore += dayRelation * 0.2;

  // 계절/월운 (10%) - 현재 월 기반
  const currentMonth = today.getMonth() + 1;
  const seasonBonus = (currentMonth >= 3 && currentMonth <= 5) ? 3 :
    (currentMonth >= 9 && currentMonth <= 11) ? 2 : 0;
  baseScore += seasonBonus * 0.1;

  const finalScore = Math.max(50, Math.min(95, Math.round(baseScore)));

  let grade = "normal";
  if (finalScore >= 85) grade = "excellent";
  else if (finalScore >= 70) grade = "good";
  else if (finalScore < 55) grade = "caution";

  const todayElement = BRANCH_TO_ELEMENT[todayGanji.ji];
  const areas = calculateAreaScores(birthYear, birthMonth, birthDay, todayGanji.ji);

  // 용신 기반 행운 요소 (간략화: 오늘 오행의 상생 오행)
  const luckyElement = Object.entries(GENERATING).find(([_, v]) => v === todayElement)?.[0] || todayElement;

  return {
    score: finalScore,
    grade,
    areas,
    element: todayElement,
    luckyColor: ELEMENT_COLORS[luckyElement],
    luckyNumbers: ELEMENT_NUMBERS[luckyElement],
  };
}

// 요일 한글
function getWeekdayKorean(date: Date): string {
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return weekdays[date.getDay()];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthDate, name } = await req.json();

    if (!birthDate) {
      return new Response(
        JSON.stringify({ error: "생년월일이 필요합니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const birth = new Date(birthDate);
    const today = new Date();

    // 한국 시간으로 조정
    const koreaOffset = 9 * 60 * 60 * 1000;
    const koreaToday = new Date(today.getTime() + koreaOffset);

    // 오늘의 운세 계산
    const fortune = calculateDailyFortune(birth, koreaToday);
    const todayGanji = getDayGanji(koreaToday);
    const birthYearInfo = getYearGanji(birth.getFullYear());

    const userName = name || "회원";

    // 기본 시스템 프롬프트 템플릿
    const DEFAULT_DAILY_FORTUNE_PROMPT = `[ROLE]
This is a placeholder prompt.
Please configure the actual system prompt in the database table 'prompt_versions'.
Function: daily-fortune
Prompt Name: system_prompt`;

    // DB에서 활성 프롬프트 조회 (없으면 기본 프롬프트 사용)
    const basePrompt = await getActivePrompt("daily-fortune", "system_prompt", DEFAULT_DAILY_FORTUNE_PROMPT);

    // 동적 컨텍스트 추가
    const dynamicContext = `

[CONTEXT]
- 오늘 날짜: ${koreaToday.getFullYear()}년 ${koreaToday.getMonth() + 1}월 ${koreaToday.getDate()}일 ${getWeekdayKorean(koreaToday)}
- 오늘 일진: ${todayGanji.gan}${todayGanji.ji} (${todayGanji.ganHanja}${todayGanji.jiHanja})
- 오늘 오행: ${fortune.element}(${fortune.element === "목" ? "木 - 나무의 생명력" : fortune.element === "화" ? "火 - 불의 열정" : fortune.element === "토" ? "土 - 대지의 안정" : fortune.element === "금" ? "金 - 금속의 결단력" : "水 - 물의 유연함"})
- 사용자 이름: ${userName}
- 사용자 생년: ${birth.getFullYear()}년생 (${birthYearInfo.zodiac}띠)
- 계산된 점수: ${fortune.score}점 (${fortune.grade})
- 재물운: ${fortune.areas.wealth}/5, 직장운: ${fortune.areas.work}/5, 관계운: ${fortune.areas.relationship}/5`;

    const systemPrompt = basePrompt + dynamicContext;
    const userPrompt = `위 정보를 바탕으로 스토리텔링 기법을 활용한 오늘의 운세를 생성해주세요. JSON만 출력하세요.`;

    console.log("Calling AI for daily fortune generation...");

    const GEMINI_API_KEY = Deno.env.get("Gemini");
    const GPT_API_KEY = Deno.env.get("GPT");

    if (!GEMINI_API_KEY && !GPT_API_KEY) {
      throw new Error("No AI API keys configured");
    }

    // AI API 호출 함수 - Gemini 최우선, GPT 폴백
    async function callGeminiAPI() {
      console.log("Calling Gemini API (primary)...");
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=" + GEMINI_API_KEY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 500,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    async function callGPTAPI() {
      console.log("Calling GPT API (fallback)...");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GPT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GPT API error:", response.status, errorText);
        throw new Error(`GPT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }

    let aiContent: string;
    try {
      if (GEMINI_API_KEY) {
        aiContent = await callGeminiAPI();
      } else {
        aiContent = await callGPTAPI();
      }
    } catch (primaryError) {
      console.error("Primary API failed:", primaryError);
      if (GPT_API_KEY) {
        try {
          aiContent = await callGPTAPI();
        } catch (gptError) {
          console.error("Fallback GPT also failed:", gptError);
          // 폴백 응답 사용
          aiContent = JSON.stringify({
            keyword: fortune.score >= 70 ? "좋은 기운" : "차분한 하루",
            description: `오늘은 ${fortune.element} 기운이 흐르는 날이에요. ${userName}님에게 ${fortune.score >= 70 ? "활기찬" : "평온한"} 에너지가 함께할 거예요.`,
            tip: fortune.score >= 70 ? "오전에 중요한 일 먼저!" : "무리하지 말고 여유롭게",
          });
        }
      } else {
        aiContent = JSON.stringify({
          keyword: fortune.score >= 70 ? "좋은 기운" : "차분한 하루",
          description: `오늘은 ${fortune.element} 기운이 흐르는 날이에요. ${userName}님에게 ${fortune.score >= 70 ? "활기찬" : "평온한"} 에너지가 함께할 거예요.`,
          tip: fortune.score >= 70 ? "오전에 중요한 일 먼저!" : "무리하지 말고 여유롭게",
        });
      }
    }

    console.log("AI response:", aiContent);

    // JSON 파싱
    let aiResult: { keyword: string; description: string; tip: string };
    try {
      // JSON 블록 추출
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      console.error("Failed to parse AI response, using fallback");
      aiResult = {
        keyword: fortune.score >= 70 ? "좋은 기운" : "차분한 하루",
        description: `오늘은 ${fortune.element}(${fortune.element === "목" ? "木" : fortune.element === "화" ? "火" : fortune.element === "토" ? "土" : fortune.element === "금" ? "金" : "水"}) 기운이 흐르는 날이에요. ${userName}님에게 ${fortune.score >= 70 ? "활기찬" : "평온한"} 에너지가 함께할 거예요.`,
        tip: fortune.score >= 70 ? "오전에 중요한 일 먼저!" : "무리하지 말고 여유롭게",
      };
    }

    // 최종 응답 구성
    const result = {
      success: true,
      data: {
        date: {
          solar: `${koreaToday.getFullYear()}-${String(koreaToday.getMonth() + 1).padStart(2, "0")}-${String(koreaToday.getDate()).padStart(2, "0")}`,
          display: `${koreaToday.getFullYear()}년 ${koreaToday.getMonth() + 1}월 ${koreaToday.getDate()}일 ${getWeekdayKorean(koreaToday)}`,
          weekday: getWeekdayKorean(koreaToday),
          ganji: `${todayGanji.gan}${todayGanji.ji}`,
          ganjiHanja: `${todayGanji.ganHanja}${todayGanji.jiHanja}`,
        },
        user: {
          name: userName,
          birthYear: birth.getFullYear(),
          zodiac: birthYearInfo.zodiac,
        },
        fortune: {
          keyword: aiResult.keyword,
          score: fortune.score,
          grade: fortune.grade,
          description: aiResult.description,
          areas: {
            wealth: { score: fortune.areas.wealth, label: getScoreLabel(fortune.areas.wealth) },
            work: { score: fortune.areas.work, label: getScoreLabel(fortune.areas.work) },
            relationship: { score: fortune.areas.relationship, label: getScoreLabel(fortune.areas.relationship) },
          },
          tip: aiResult.tip,
          lucky: {
            color: fortune.luckyColor.name,
            colorCode: fortune.luckyColor.code,
            numbers: fortune.luckyNumbers,
          },
        },
      },
    };

    console.log("Daily fortune generated successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in daily-fortune:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "운세 생성 중 오류가 발생했습니다" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getScoreLabel(score: number): string {
  if (score >= 5) return "아주좋음";
  if (score >= 4) return "좋음";
  if (score >= 3) return "보통";
  if (score >= 2) return "주의";
  return "조심";
}
