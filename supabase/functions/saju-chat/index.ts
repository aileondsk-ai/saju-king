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

// 천간 (10 Heavenly Stems)
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];

// 지지 (12 Earthly Branches)
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

// 지지 시간대 매핑
const HOUR_BRANCHES = [
  { start: 23, end: 1, branch: 0 },   // 자시
  { start: 1, end: 3, branch: 1 },    // 축시
  { start: 3, end: 5, branch: 2 },    // 인시
  { start: 5, end: 7, branch: 3 },    // 묘시
  { start: 7, end: 9, branch: 4 },    // 진시
  { start: 9, end: 11, branch: 5 },   // 사시
  { start: 11, end: 13, branch: 6 },  // 오시
  { start: 13, end: 15, branch: 7 },  // 미시
  { start: 15, end: 17, branch: 8 },  // 신시
  { start: 17, end: 19, branch: 9 },  // 유시
  { start: 19, end: 21, branch: 10 }, // 술시
  { start: 21, end: 23, branch: 11 }, // 해시
];

// 월건 표 (년간에 따른 월간 시작점)
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 갑기->병, 을경->무, 병신->경, 정임->임, 무계->갑

// 시간 천간 시작점 (일간에 따른 시간 천간)
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 갑기->갑, 을경->병, 병신->무, 정임->경, 무계->임

// 오행 타입 정의
type ElementType = "목" | "화" | "토" | "금" | "수";

// 오행 상생상극
const ELEMENT_NAMES: ElementType[] = ["목", "화", "토", "금", "수"];
const ELEMENT_MEANINGS: Record<ElementType, { organ: string; direction: string; color: string; season: string; trait: string }> = {
  "목": { organ: "간/담", direction: "동쪽", color: "청색/녹색", season: "봄", trait: "성장, 창의력, 인내" },
  "화": { organ: "심장/소장", direction: "남쪽", color: "적색", season: "여름", trait: "열정, 표현력, 활력" },
  "토": { organ: "비장/위", direction: "중앙", color: "황색", season: "환절기", trait: "안정, 신뢰, 중재" },
  "금": { organ: "폐/대장", direction: "서쪽", color: "백색/은색", season: "가을", trait: "결단력, 정의, 집중" },
  "수": { organ: "신장/방광", direction: "북쪽", color: "흑색/남색", season: "겨울", trait: "지혜, 유연성, 통찰" }
};

// 십신 관계
const TEN_GODS = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];

// 기준일 (1900년 1월 31일 = 경자년 기축월 갑진일)
const BASE_DATE = new Date(1900, 0, 31);
const BASE_YEAR_STEM = 6; // 경
const BASE_YEAR_BRANCH = 0; // 자
const BASE_DAY_STEM = 0; // 갑(甲) - 1900-01-01 기준
const BASE_DAY_BRANCH = 10; // 술(戌) - 1900-01-01 기준

function getDaysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

function getHourBranch(hour: number): number {
  if (hour >= 23 || hour < 1) return 0;
  if (hour >= 1 && hour < 3) return 1;
  if (hour >= 3 && hour < 5) return 2;
  if (hour >= 5 && hour < 7) return 3;
  if (hour >= 7 && hour < 9) return 4;
  if (hour >= 9 && hour < 11) return 5;
  if (hour >= 11 && hour < 13) return 6;
  if (hour >= 13 && hour < 15) return 7;
  if (hour >= 15 && hour < 17) return 8;
  if (hour >= 17 && hour < 19) return 9;
  if (hour >= 19 && hour < 21) return 10;
  return 11;
}

function calculateSaju(birthDate: Date, birthHour: number | null) {
  const days = getDaysBetween(BASE_DATE, birthDate);

  // 년주 계산 (입춘 기준으로 해야 하지만, 간략화하여 양력 기준)
  const year = birthDate.getFullYear();
  const yearDiff = year - 1900;
  const yearStemIndex = (BASE_YEAR_STEM + yearDiff) % 10;
  const yearBranchIndex = (BASE_YEAR_BRANCH + yearDiff) % 12;

  // 월주 계산 (절기 기준으로 해야 하지만, 간략화)
  const month = birthDate.getMonth(); // 0-11
  const monthBranchIndex = (month + 2) % 12; // 인월(1월)부터 시작
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthStemIndex = (monthStemStart + month) % 10;

  // 일주 계산
  const dayStemIndex = ((BASE_DAY_STEM + days) % 10 + 10) % 10;
  const dayBranchIndex = ((BASE_DAY_BRANCH + days) % 12 + 12) % 12;

  // 시주 계산
  let hourStemIndex = 0;
  let hourBranchIndex = 0;
  if (birthHour !== null) {
    hourBranchIndex = getHourBranch(birthHour);
    const hourStemStart = HOUR_STEM_START[dayStemIndex];
    hourStemIndex = (hourStemStart + hourBranchIndex) % 10;
  }

  return {
    year: { stem: yearStemIndex, branch: yearBranchIndex },
    month: { stem: monthStemIndex, branch: monthBranchIndex },
    day: { stem: dayStemIndex, branch: dayBranchIndex },
    hour: birthHour !== null ? { stem: hourStemIndex, branch: hourBranchIndex } : null
  };
}

function getPillarString(stem: number, branch: number): string {
  return `${HEAVENLY_STEMS[stem]}${EARTHLY_BRANCHES[branch]}(${STEMS_HANJA[stem]}${BRANCHES_HANJA[branch]})`;
}

function getPillarElement(stem: number, branch: number): string {
  return `${STEMS_ELEMENTS[stem]}(${HEAVENLY_STEMS[stem]})/${BRANCHES_ELEMENTS[branch]}(${EARTHLY_BRANCHES[branch]})`;
}

function countElements(saju: ReturnType<typeof calculateSaju>): Record<string, number> {
  const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };

  // 천간 오행 카운트
  counts[STEMS_ELEMENTS[saju.year.stem]]++;
  counts[STEMS_ELEMENTS[saju.month.stem]]++;
  counts[STEMS_ELEMENTS[saju.day.stem]]++;
  if (saju.hour) counts[STEMS_ELEMENTS[saju.hour.stem]]++;

  // 지지 오행 카운트
  counts[BRANCHES_ELEMENTS[saju.year.branch]]++;
  counts[BRANCHES_ELEMENTS[saju.month.branch]]++;
  counts[BRANCHES_ELEMENTS[saju.day.branch]]++;
  if (saju.hour) counts[BRANCHES_ELEMENTS[saju.hour.branch]]++;

  return counts;
}

function getDayMasterStrength(saju: ReturnType<typeof calculateSaju>, elementCounts: Record<string, number>): { strength: string; description: string } {
  const dayElement = STEMS_ELEMENTS[saju.day.stem] as ElementType;

  // 신강/신약 판단 (간략화)
  const selfCount = elementCounts[dayElement];
  const supportingElement = dayElement === "목" ? "수" : dayElement === "화" ? "목" : dayElement === "토" ? "화" : dayElement === "금" ? "토" : "금";
  const supportCount = elementCounts[supportingElement];

  const totalSupport = selfCount + supportCount;
  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);

  if (totalSupport > total / 2) {
    return {
      strength: "신강(身强)",
      description: `${dayElement} 기운이 강하고 지지를 많이 받아 본인의 에너지가 충만한 편입니다.`
    };
  } else {
    return {
      strength: "신약(身弱)",
      description: `${dayElement} 기운을 보충해주는 것이 좋으며, 협력과 지원이 중요합니다.`
    };
  }
}

function getYongsin(saju: ReturnType<typeof calculateSaju>, elementCounts: Record<string, number>, isStrong: boolean): { yongsin: ElementType; huisin: ElementType; gisin: ElementType } {
  const dayElement = STEMS_ELEMENTS[saju.day.stem] as ElementType;

  // 오행 상생 관계
  const generating: Record<ElementType, ElementType> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };
  const controlling: Record<ElementType, ElementType> = { "목": "토", "화": "금", "토": "수", "금": "목", "수": "화" };
  const generatedBy: Record<ElementType, ElementType> = { "목": "수", "화": "목", "토": "화", "금": "토", "수": "금" };

  let yongsin: ElementType;
  let huisin: ElementType;
  let gisin: ElementType;

  if (isStrong) {
    // 신강이면 설기(食傷)나 재(財)가 용신
    yongsin = generating[dayElement];
    huisin = generating[yongsin];
    gisin = dayElement;
  } else {
    // 신약이면 인성이나 비겁이 용신
    yongsin = generatedBy[dayElement];
    huisin = dayElement;
    gisin = controlling[dayElement];
  }

  return { yongsin, huisin, gisin };
}

function getCurrentDaeun(birthYear: number, gender: string): { period: string; pillar: string; description: string } {
  // 한국 시간 기준으로 현재 연도 계산
  const koreaTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentYear = koreaTime.getUTCFullYear();
  const age = currentYear - birthYear;

  // 대운 시작 나이 (간략화 - 실제로는 월주와 성별에 따라 순행/역행 결정)
  const daeunStartAge = 4;
  const daeunPeriod = 10;
  const daeunNumber = Math.floor((age - daeunStartAge) / daeunPeriod);

  const startYear = birthYear + daeunStartAge + (daeunNumber * daeunPeriod);
  const endYear = startYear + daeunPeriod - 1;

  // 대운 천간지지 계산 (간략화)
  const stemIndex = (6 + daeunNumber) % 10;
  const branchIndex = (daeunNumber * 1) % 12;

  return {
    period: `${startYear}-${endYear}`,
    pillar: getPillarString(stemIndex, branchIndex),
    description: `현재 ${daeunNumber + 1}번째 대운 중입니다.`
  };
}

function getYearlyFortune(birthYear: number): { year: string; pillar: string; theme: string } {
  // 한국 시간 기준으로 현재 연도 계산
  const koreaTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentYear = koreaTime.getUTCFullYear();
  const yearDiff = currentYear - 1900;
  const stemIndex = (6 + yearDiff) % 10;
  const branchIndex = yearDiff % 12;

  const themes = [
    "지혜와 계획의 해",
    "안정과 축적의 해",
    "성장과 도전의 해",
    "창의와 표현의 해",
    "변화와 전환의 해",
    "열정과 활력의 해",
    "성취와 결실의 해",
    "조화와 관계의 해",
    "발전과 확장의 해",
    "수확과 정리의 해",
    "신뢰와 책임의 해",
    "마무리와 준비의 해"
  ];

  return {
    year: `${currentYear}년`,
    pillar: getPillarString(stemIndex, branchIndex),
    theme: themes[branchIndex]
  };
}

function generateSajuContext(name: string, gender: string, birthDate: Date, birthHour: number | null): string {
  const saju = calculateSaju(birthDate, birthHour);
  const elementCounts = countElements(saju);
  const dayMaster = getDayMasterStrength(saju, elementCounts);
  const isStrong = dayMaster.strength.includes("신강");
  const { yongsin, huisin, gisin } = getYongsin(saju, elementCounts, isStrong);
  const daeun = getCurrentDaeun(birthDate.getFullYear(), gender);
  const yearly = getYearlyFortune(birthDate.getFullYear());

  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);

  const dayElementKor = STEMS_ELEMENTS[saju.day.stem] as ElementType;
  const dayElementMeaning = ELEMENT_MEANINGS[dayElementKor];

  // 운세 등급 계산 (간략화)
  const getFortuneGrade = (element: string): number => {
    if (element === yongsin) return 5;
    if (element === huisin) return 4;
    if (element === gisin) return 2;
    return 3;
  };

  const wealthGrade = getFortuneGrade(yearly.pillar.includes("재") ? yongsin : "토");
  const careerGrade = getFortuneGrade(yearly.pillar.includes("관") ? yongsin : "금");
  const healthGrade = Math.max(2, 5 - Math.abs(elementCounts[dayElementKor] - 2));
  const loveGrade = getFortuneGrade("화");

  const gradeStars = (grade: number) => "⭐".repeat(grade);

  const birthTimeStr = birthHour !== null
    ? `${birthHour}시 (${EARTHLY_BRANCHES[getHourBranch(birthHour)]}시)`
    : "미입력";

  return `[USER SAJU CONTEXT]
- 이름: ${name}
- 생년월일시: ${birthDate.getFullYear()}년 ${birthDate.getMonth() + 1}월 ${birthDate.getDate()}일 ${birthTimeStr}
- 성별: ${gender === 'male' ? '남성' : '여성'}

[사주 원국 - 四柱原局]
- 년주(年柱): ${getPillarString(saju.year.stem, saju.year.branch)} - ${getPillarElement(saju.year.stem, saju.year.branch)}
- 월주(月柱): ${getPillarString(saju.month.stem, saju.month.branch)} - ${getPillarElement(saju.month.stem, saju.month.branch)}
- 일주(日柱): ${getPillarString(saju.day.stem, saju.day.branch)} - ${getPillarElement(saju.day.stem, saju.day.branch)}
${saju.hour ? `- 시주(時柱): ${getPillarString(saju.hour.stem, saju.hour.branch)} - ${getPillarElement(saju.hour.stem, saju.hour.branch)}` : '- 시주(時柱): 시간 미입력'}

[일간 분석 - 日干分析]
- 일간: ${HEAVENLY_STEMS[saju.day.stem]}${STEMS_ELEMENTS[saju.day.stem]}(${STEMS_HANJA[saju.day.stem]}${dayElementKor})
- 일간 특성: ${dayElementMeaning.trait}
- ${dayMaster.strength}: ${dayMaster.description}

[오행 분포 - 五行分布]
- 목(木): ${elementCounts["목"]}개 (${Math.round(elementCounts["목"] / total * 100)}%)
- 화(火): ${elementCounts["화"]}개 (${Math.round(elementCounts["화"] / total * 100)}%)
- 토(土): ${elementCounts["토"]}개 (${Math.round(elementCounts["토"] / total * 100)}%)
- 금(金): ${elementCounts["금"]}개 (${Math.round(elementCounts["금"] / total * 100)}%)
- 수(水): ${elementCounts["수"]}개 (${Math.round(elementCounts["수"] / total * 100)}%)

[용신 분석 - 用神分析]
- 용신(用神): ${yongsin}(${yongsin}) - 가장 필요한 오행
- 희신(喜神): ${huisin}(${huisin}) - 용신을 돕는 오행
- 기신(忌神): ${gisin}(${gisin}) - 피해야 할 오행
- 행운의 색상: ${ELEMENT_MEANINGS[yongsin].color}
- 행운의 방향: ${ELEMENT_MEANINGS[yongsin].direction}

[현재 대운 - 大運]
- 대운 기간: ${daeun.period}
- 대운 간지: ${daeun.pillar}
- ${daeun.description}

[${yearly.year} 세운 - 歲運]
- 세운 간지: ${yearly.pillar}
- 올해 테마: ${yearly.theme}

[영역별 운세 전망]
- 재물운: ${gradeStars(wealthGrade)} (${wealthGrade}/5)
- 직업운: ${gradeStars(careerGrade)} (${careerGrade}/5)
- 건강운: ${gradeStars(healthGrade)} (${healthGrade}/5) - ${dayElementMeaning.organ} 관련 주의
- 애정운: ${gradeStars(loveGrade)} (${loveGrade}/5)

[행운의 요소]
- 행운의 색상: ${ELEMENT_MEANINGS[yongsin].color}, ${ELEMENT_MEANINGS[huisin].color}
- 행운의 방향: ${ELEMENT_MEANINGS[yongsin].direction}
- 행운의 계절: ${ELEMENT_MEANINGS[yongsin].season}`;
}

// 챗봇 시스템 프롬프트 (v2.0 대화형 스타일 + 추론 강화)
const CHATBOT_SYSTEM_PROMPT = `[SYSTEM]
This is a placeholder prompt.
Please configure the actual system prompt in the database table 'prompt_versions'.
Function: saju-chat
Prompt Name: system_prompt`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile, analysisContext } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("Gemini");
    const GPT_API_KEY = Deno.env.get("GPT");

    if (!GEMINI_API_KEY && !GPT_API_KEY) {
      console.error("No AI API keys configured");
      throw new Error("AI service is not configured");
    }

    console.log("Processing chat request with", messages?.length || 0, "messages");
    console.log("User profile:", userProfile);
    console.log("Analysis context mode:", analysisContext?.mode);

    // 분석 컨텍스트가 있으면 사용, 없으면 사주 계산
    let userContext: string;

    if (analysisContext) {
      // 분석 결과에서 넘어온 경우 - 템플릿 적용
      if (analysisContext.mode === "personal") {
        userContext = `[상담 모드: 개인 사주 분석 결과 기반]

[사용자 정보]
- 이름: ${analysisContext.person?.name || userProfile?.name || "사용자"}
- 성별: ${analysisContext.person?.gender || userProfile?.gender || "미상"}
- 생년월일: ${analysisContext.person?.birthDate || userProfile?.birthDate || "미상"}
- 출생시간: ${analysisContext.person?.birthTime || "모름"}

[사주 분석 결과 요약]
${analysisContext.summary || "분석 결과가 제공되지 않았습니다."}

[분석 데이터]
${analysisContext.analysisData ? JSON.stringify(analysisContext.analysisData, null, 2) : "없음"}

[사용자 관심사]
${analysisContext.concerns?.join(", ") || "일반 상담"}`;
      } else if (analysisContext.mode === "compatibility") {
        userContext = `[상담 모드: 궁합 분석 결과 기반]

[관계 유형]
${analysisContext.relationshipType || "연인"}

[A 정보]
- 이름: ${analysisContext.personA?.name || "A"}
- 성별: ${analysisContext.personA?.gender || "미상"}
- 생년월일: ${analysisContext.personA?.birthDate || "미상"}

[B 정보]
- 이름: ${analysisContext.personB?.name || "B"}
- 성별: ${analysisContext.personB?.gender || "미상"}
- 생년월일: ${analysisContext.personB?.birthDate || "미상"}

[궁합 분석 결과 요약]
${analysisContext.summary || "분석 결과가 제공되지 않았습니다."}

[분석 데이터]
${analysisContext.analysisData ? JSON.stringify(analysisContext.analysisData, null, 2) : "없음"}

[사용자 관심사]
${analysisContext.concerns?.join(", ") || "일반 궁합 상담"}`;
      } else {
        userContext = `[상담 모드: 일반 상담]
분석 결과 없이 일반 상담을 진행합니다.`;
      }
    } else if (userProfile && userProfile.birthDate) {
      // 직접 상담 진입 - 기존 사주 계산 로직 사용
      const birthDate = new Date(userProfile.birthDate);
      let birthHour: number | null = null;

      if (userProfile.birthTime) {
        const timeParts = userProfile.birthTime.split(':');
        birthHour = parseInt(timeParts[0], 10);
      }

      userContext = generateSajuContext(
        userProfile.name || "사용자",
        userProfile.gender || "unknown",
        birthDate,
        birthHour
      );

      console.log("Generated Saju context for:", userProfile.name);
    } else {
      userContext = `[USER SAJU CONTEXT]
사용자의 생년월일시 정보가 아직 입력되지 않았습니다.
사주 분석을 위해 생년월일시 정보가 필요합니다.
사용자에게 친절하게 정보 입력을 안내해주세요.`;
    }

    const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    // DB에서 활성 프롬프트 조회 (없으면 기본 프롬프트 사용)
    const baseSystemPrompt = await getActivePrompt("saju-chat", "system_prompt", CHATBOT_SYSTEM_PROMPT);
    const systemPrompt = baseSystemPrompt + "\n\n" + userContext + "\n\n현재 날짜: " + currentDate + "\n\n위 정보를 기반으로 사용자의 질문에 친근하고 공감적으로 답변해주세요.";

    // AI API 호출 함수 - Gemini 최우선, GPT 폴백
    async function callGeminiStreaming() {
      console.log("Calling Gemini API with streaming (primary)...");
      const allMessages = [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...(messages || []).map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        }))
      ];

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:streamGenerateContent?alt=sse&key=" + GEMINI_API_KEY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: allMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      return response;
    }

    async function callGPTStreaming() {
      console.log("Calling GPT API with streaming (fallback)...");
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
            ...(messages || []),
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GPT API error:", response.status, errorText);
        throw new Error(`GPT API error: ${response.status}`);
      }

      return response;
    }

    // Gemini SSE를 OpenAI 호환 형식으로 변환하는 TransformStream
    function createGeminiToOpenAITransform() {
      return new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (content) {
                  const openAIFormat = {
                    choices: [{
                      delta: { content },
                      index: 0
                    }]
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
                }
              } catch {
                // 파싱 실패 무시
              }
            }
          }
        }
      });
    }

    let streamResponse: Response;
    let isGemini = false;

    try {
      if (GEMINI_API_KEY) {
        streamResponse = await callGeminiStreaming();
        isGemini = true;
      } else {
        streamResponse = await callGPTStreaming();
        isGemini = false;
      }
    } catch (primaryError) {
      console.error("Primary API failed:", primaryError);
      if (GPT_API_KEY) {
        try {
          streamResponse = await callGPTStreaming();
          isGemini = false;
        } catch (gptError) {
          console.error("Fallback GPT also failed:", gptError);
          return new Response(
            JSON.stringify({ error: "AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "AI 서비스 오류가 발생했습니다." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Streaming response from AI");

    // Gemini인 경우 변환, GPT인 경우 그대로 전달
    const responseBody = isGemini && streamResponse.body
      ? streamResponse.body.pipeThrough(createGeminiToOpenAITransform())
      : streamResponse.body;

    return new Response(responseBody, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("saju-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
