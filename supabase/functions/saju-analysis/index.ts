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

// ========== 병렬 프롬프트 모듈 로드 ==========
interface PromptModules {
  systemPrompt: string;
  basePersona: string;
  daymasterAnalysis: string;
  tenstarStructure: string;
  luckCycleAnalysis: string;
  areaFortune: string;
  synthesisAdvice: string;
}

async function loadAllPromptModules(): Promise<PromptModules> {
  const functionName = "saju-analysis";

  // 병렬로 모든 프롬프트 모듈 로드 (system_prompt 포함)
  const [
    systemPrompt,
    basePersona,
    daymasterAnalysis,
    tenstarStructure,
    luckCycleAnalysis,
    areaFortune,
    synthesisAdvice
  ] = await Promise.all([
    getActivePrompt(functionName, "system_prompt", ""),
    getActivePrompt(functionName, "base_persona", ""),
    getActivePrompt(functionName, "daymaster_analysis", ""),
    getActivePrompt(functionName, "tenstar_structure", ""),
    getActivePrompt(functionName, "luck_cycle_analysis", ""),
    getActivePrompt(functionName, "area_fortune", ""),
    getActivePrompt(functionName, "synthesis_advice", "")
  ]);

  console.log("All prompt modules loaded in parallel");

  return {
    systemPrompt,
    basePersona,
    daymasterAnalysis,
    tenstarStructure,
    luckCycleAnalysis,
    areaFortune,
    synthesisAdvice
  };
}

// ========== 만세력 계산 엔진 v3.0 (1900~2030 확장 + 천문학적 계산 + 표준시/썸머타임 보정) ==========
// 기준: 24절기 입절 기준 + 자시(23:30) 일 교체 + 야/조자시 무시
// 시간 경계: end_inclusive (정각이 앞 시에 포함)
// 표준시 보정: 한국은 동경 127.5도 기준, 일본(동경 135도) 표준시 사용으로 30분 보정
// 썸머타임: 1948-1960, 1987-1988 실시 기간 1시간 역보정

const ENGINE_VERSION = "3.2.0";
const SOLAR_TERM_DATA_VERSION = "st_1900_2030_v1";
const LUNAR_DATA_VERSION = "lunar_1900_2100_v1";

// ========== 한국 음력 데이터 (1900-2100) ==========
// 각 연도의 음력 정보를 16진수로 인코딩
// 비트 0-3: 윤달 (0=없음, 1-12=윤달 월)
// 비트 4-15: 각 월의 대소월 (1=30일, 0=29일)
const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520  // 2100
];

// 음력 연도의 총 일수 계산
function getLunarYearDays(year: number): number {
  let sum = 348; // 12개월 * 29일 = 348 (기본)
  const info = LUNAR_INFO[year - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0; // 대월이면 +1일
  }
  return sum + getLeapMonthDays(year); // 윤달 일수 추가
}

// 윤달의 일수 (0이면 윤달 없음)
function getLeapMonthDays(year: number): number {
  const leapMonth = getLeapMonth(year);
  if (leapMonth === 0) return 0;
  return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
}

// 윤달이 몇 월인지 (0이면 윤달 없음)
function getLeapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf;
}

// 음력 해당 월의 일수
function getLunarMonthDays(year: number, month: number): number {
  const info = LUNAR_INFO[year - 1900];
  return (info & (0x10000 >> month)) ? 30 : 29;
}

// 음력 → 양력 변환
interface LunarToSolarResult {
  year: number;
  month: number;
  day: number;
  isValid: boolean;
  error?: string;
}

function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean = false): LunarToSolarResult {
  // 유효성 검사
  if (lunarYear < 1900 || lunarYear > 2100) {
    return { year: 0, month: 0, day: 0, isValid: false, error: "음력 연도는 1900~2100 범위만 지원합니다" };
  }
  if (lunarMonth < 1 || lunarMonth > 12) {
    return { year: 0, month: 0, day: 0, isValid: false, error: "음력 월은 1~12 범위여야 합니다" };
  }
  if (lunarDay < 1 || lunarDay > 30) {
    return { year: 0, month: 0, day: 0, isValid: false, error: "음력 일은 1~30 범위여야 합니다" };
  }

  // 윤달 검증
  const leapMonth = getLeapMonth(lunarYear);
  if (isLeapMonth && leapMonth !== lunarMonth) {
    return { year: 0, month: 0, day: 0, isValid: false, error: `${lunarYear}년에는 ${lunarMonth}월 윤달이 없습니다` };
  }

  // 해당 월의 일수 검증
  const monthDays = isLeapMonth ? getLeapMonthDays(lunarYear) : getLunarMonthDays(lunarYear, lunarMonth);
  if (lunarDay > monthDays) {
    return { year: 0, month: 0, day: 0, isValid: false, error: `${lunarYear}년 ${isLeapMonth ? '윤' : ''}${lunarMonth}월은 ${monthDays}일까지만 있습니다` };
  }

  // 1900년 1월 31일 = 음력 1900년 1월 1일 (기준점)
  let offset = 0;

  // 연도 차이 계산
  for (let y = 1900; y < lunarYear; y++) {
    offset += getLunarYearDays(y);
  }

  // 월 차이 계산
  for (let m = 1; m < lunarMonth; m++) {
    offset += getLunarMonthDays(lunarYear, m);
    // 윤달이 해당 월 이전이거나 해당 월이면서 isLeapMonth가 true면 윤달 일수 추가
    if (leapMonth === m) {
      offset += getLeapMonthDays(lunarYear);
    }
  }

  // 윤달인 경우 해당 월의 일수도 추가
  if (isLeapMonth) {
    offset += getLunarMonthDays(lunarYear, lunarMonth);
  }

  // 일 차이
  offset += lunarDay - 1;

  // 기준일(1900-01-31)에서 offset 일 추가
  const baseDate = new Date(1900, 0, 31); // 1900년 1월 31일
  const resultDate = new Date(baseDate.getTime() + offset * 24 * 60 * 60 * 1000);

  return {
    year: resultDate.getFullYear(),
    month: resultDate.getMonth() + 1,
    day: resultDate.getDate(),
    isValid: true
  };
}

// ========== 썸머타임(일광절약시간) 기간 정의 ==========
interface DSTperiod {
  start: Date;
  end: Date;
}

const DST_PERIODS: DSTperiod[] = [
  { start: new Date(1948, 5, 1, 0, 0), end: new Date(1948, 8, 13, 0, 0) },
  { start: new Date(1949, 3, 3, 0, 0), end: new Date(1949, 8, 11, 0, 0) },
  { start: new Date(1950, 3, 1, 0, 0), end: new Date(1950, 8, 10, 0, 0) },
  { start: new Date(1951, 4, 6, 0, 0), end: new Date(1951, 8, 9, 0, 0) },
  { start: new Date(1955, 4, 5, 0, 0), end: new Date(1955, 8, 9, 0, 0) },
  { start: new Date(1956, 4, 20, 0, 0), end: new Date(1956, 8, 30, 0, 0) },
  { start: new Date(1957, 4, 5, 0, 0), end: new Date(1957, 8, 22, 0, 0) },
  { start: new Date(1958, 4, 4, 0, 0), end: new Date(1958, 8, 21, 0, 0) },
  { start: new Date(1959, 4, 3, 0, 0), end: new Date(1959, 8, 20, 0, 0) },
  { start: new Date(1960, 4, 1, 0, 0), end: new Date(1960, 8, 18, 0, 0) },
  { start: new Date(1987, 4, 10, 2, 0), end: new Date(1987, 9, 11, 3, 0) },
  { start: new Date(1988, 4, 8, 2, 0), end: new Date(1988, 9, 9, 3, 0) },
];

function isDuringDST(year: number, month: number, day: number, hour: number, minute: number): boolean {
  const checkTime = new Date(year, month - 1, day, hour, minute);
  for (const period of DST_PERIODS) {
    if (checkTime >= period.start && checkTime < period.end) {
      return true;
    }
  }
  return false;
}

// ========== 시간 보정 함수 ==========
interface CorrectedTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dstApplied: boolean;
  kstCorrectionApplied: boolean;
  correctionLog: string[];
}

function applyTimeCorrections(year: number, month: number, day: number, hour: number, minute: number): CorrectedTime {
  const log: string[] = [];
  let correctedYear = year;
  let correctedMonth = month;
  let correctedDay = day;
  let correctedHour = hour;
  let correctedMinute = minute;
  let dstApplied = false;

  if (isDuringDST(year, month, day, hour, minute)) {
    dstApplied = true;
    const tempDate = new Date(year, month - 1, day, hour, minute);
    tempDate.setHours(tempDate.getHours() - 1);
    correctedYear = tempDate.getFullYear();
    correctedMonth = tempDate.getMonth() + 1;
    correctedDay = tempDate.getDate();
    correctedHour = tempDate.getHours();
    correctedMinute = tempDate.getMinutes();
    log.push(
      `DST: 썸머타임 기간 → ${hour}:${String(minute).padStart(2, "0")} → ${correctedHour}:${String(correctedMinute).padStart(2, "0")} (1시간 역보정)`,
    );
  }

  const preKstHour = correctedHour;
  const preKstMinute = correctedMinute;
  const kstDate = new Date(correctedYear, correctedMonth - 1, correctedDay, correctedHour, correctedMinute);
  kstDate.setMinutes(kstDate.getMinutes() - 30);
  correctedYear = kstDate.getFullYear();
  correctedMonth = kstDate.getMonth() + 1;
  correctedDay = kstDate.getDate();
  correctedHour = kstDate.getHours();
  correctedMinute = kstDate.getMinutes();
  log.push(
    `KST: 표준시 30분 보정 → ${preKstHour}:${String(preKstMinute).padStart(2, "0")} → ${correctedHour}:${String(correctedMinute).padStart(2, "0")}`,
  );

  return {
    year: correctedYear,
    month: correctedMonth,
    day: correctedDay,
    hour: correctedHour,
    minute: correctedMinute,
    dstApplied,
    kstCorrectionApplied: true,
    correctionLog: log,
  };
}

// ========== 기본 상수 ==========
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const STEMS_YINYANG = ["양", "음", "양", "음", "양", "음", "양", "음", "양", "음"];

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

const TEN_GODS = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
const TEN_GODS_HANJA = ["比肩", "劫財", "食神", "傷官", "偏財", "正財", "偏官", "正官", "偏印", "正印"];

type ElementType = "목" | "화" | "토" | "금" | "수";

const ELEMENT_MEANINGS: Record<
  ElementType,
  { organ: string; direction: string; color: string; season: string; trait: string }
> = {
  목: { organ: "간/담", direction: "동쪽", color: "청색/녹색", season: "봄", trait: "성장, 창의력, 인내, 추진력" },
  화: {
    organ: "심장/소장",
    direction: "남쪽",
    color: "적색/주황색",
    season: "여름",
    trait: "열정, 표현력, 활력, 예술성",
  },
  토: { organ: "비장/위", direction: "중앙", color: "황색/갈색", season: "환절기", trait: "안정, 신뢰, 중재, 포용력" },
  금: {
    organ: "폐/대장",
    direction: "서쪽",
    color: "백색/은색",
    season: "가을",
    trait: "결단력, 정의, 집중력, 명확함",
  },
  수: {
    organ: "신장/방광",
    direction: "북쪽",
    color: "흑색/남색",
    season: "겨울",
    trait: "지혜, 유연성, 통찰력, 적응력",
  },
};

// ========== 지장간(支藏干) 정의 ==========
// 각 지지에 숨어있는 천간들 (여기/중기/정기 순서)
const JIJANGGAN: Record<number, { yeogi?: number; junggi?: number; jeonggi: number }> = {
  0: { jeonggi: 9 },                    // 자(子): 계(癸)
  1: { yeogi: 9, junggi: 7, jeonggi: 5 }, // 축(丑): 계/신/기
  2: { yeogi: 4, junggi: 2, jeonggi: 0 }, // 인(寅): 무/병/갑
  3: { jeonggi: 1 },                    // 묘(卯): 을(乙)
  4: { yeogi: 1, junggi: 9, jeonggi: 4 }, // 진(辰): 을/계/무
  5: { yeogi: 4, junggi: 6, jeonggi: 2 }, // 사(巳): 무/경/병
  6: { yeogi: 5, jeonggi: 3 },          // 오(午): 기/정
  7: { yeogi: 3, junggi: 1, jeonggi: 5 }, // 미(未): 정/을/기
  8: { yeogi: 4, junggi: 8, jeonggi: 6 }, // 신(申): 무/임/경
  9: { jeonggi: 7 },                    // 유(酉): 신(辛)
  10: { yeogi: 7, junggi: 3, jeonggi: 4 }, // 술(戌): 신/정/무
  11: { yeogi: 4, junggi: 0, jeonggi: 8 }, // 해(亥): 무/갑/임
};

// ========== 태양 황경 계산 알고리즘 ==========
const SOLAR_TERM_ANGLES: Record<string, number> = {
  소한: 285, 대한: 300, 입춘: 315, 우수: 330, 경칩: 345, 춘분: 0,
  청명: 15, 곡우: 30, 입하: 45, 소만: 60, 망종: 75, 하지: 90,
  소서: 105, 대서: 120, 입추: 135, 처서: 150, 백로: 165, 추분: 180,
  한로: 195, 상강: 210, 입동: 225, 소설: 240, 대설: 255, 동지: 270,
};

const TERM_TO_MONTH: Record<string, number> = {
  소한: 12, 대한: 12, 입춘: 1, 우수: 1, 경칩: 2, 춘분: 2,
  청명: 3, 곡우: 3, 입하: 4, 소만: 4, 망종: 5, 하지: 5,
  소서: 6, 대서: 6, 입추: 7, 처서: 7, 백로: 8, 추분: 8,
  한로: 9, 상강: 9, 입동: 10, 소설: 10, 대설: 11, 동지: 11,
};

const JEOL_TERMS = ["입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설", "소한"];

function julianDay(year: number, month: number, day: number, hour: number = 0): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}

function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function solarLongitude(jd: number): number {
  const T = julianCentury(jd);
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = L0 % 360;
  if (L0 < 0) L0 += 360;

  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = (M * Math.PI) / 180;

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);

  let sunLon = L0 + C;
  sunLon = sunLon % 360;
  if (sunLon < 0) sunLon += 360;

  return sunLon;
}

function findSolarTermTime(year: number, termAngle: number, startMonth: number): Date {
  let jd1 = julianDay(year, startMonth, 1, 0);
  let jd2 = julianDay(year, startMonth + 1, 15, 0);

  const angleDiff = (lon: number, target: number): number => {
    let diff = lon - target;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  };

  for (let i = 0; i < 50; i++) {
    const jdMid = (jd1 + jd2) / 2;
    const lonMid = solarLongitude(jdMid);
    const diff = angleDiff(lonMid, termAngle);

    if (Math.abs(diff) < 0.00001) break;

    const lonStart = solarLongitude(jd1);
    const diffStart = angleDiff(lonStart, termAngle);

    if (diffStart * diff < 0) {
      jd2 = jdMid;
    } else {
      jd1 = jdMid;
    }
  }

  const jdResult = (jd1 + jd2) / 2;
  const Z = Math.floor(jdResult + 0.5);
  const F = jdResult + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const yearResult = month > 2 ? C - 4716 : C - 4715;

  const totalHours = F * 24;
  const hour = Math.floor(totalHours);
  const minute = Math.floor((totalHours - hour) * 60);

  const utcDate = new Date(Date.UTC(yearResult, month - 1, day, hour, minute));
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  return kstDate;
}

interface SolarTerm {
  name: string;
  date: string;
  time: string;
  month: number;
}

function calculateYearSolarTerms(year: number): SolarTerm[] {
  const terms: SolarTerm[] = [];
  const termOrder = [
    { name: "소한", startMonth: 1 }, { name: "대한", startMonth: 1 },
    { name: "입춘", startMonth: 2 }, { name: "우수", startMonth: 2 },
    { name: "경칩", startMonth: 3 }, { name: "춘분", startMonth: 3 },
    { name: "청명", startMonth: 4 }, { name: "곡우", startMonth: 4 },
    { name: "입하", startMonth: 5 }, { name: "소만", startMonth: 5 },
    { name: "망종", startMonth: 6 }, { name: "하지", startMonth: 6 },
    { name: "소서", startMonth: 7 }, { name: "대서", startMonth: 7 },
    { name: "입추", startMonth: 8 }, { name: "처서", startMonth: 8 },
    { name: "백로", startMonth: 9 }, { name: "추분", startMonth: 9 },
    { name: "한로", startMonth: 10 }, { name: "상강", startMonth: 10 },
    { name: "입동", startMonth: 11 }, { name: "소설", startMonth: 11 },
    { name: "대설", startMonth: 12 }, { name: "동지", startMonth: 12 },
  ];

  for (const { name, startMonth } of termOrder) {
    const angle = SOLAR_TERM_ANGLES[name];
    const kstDate = findSolarTermTime(year, angle, startMonth);
    const dateStr = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, "0")}-${String(kstDate.getDate()).padStart(2, "0")}`;
    const timeStr = `${String(kstDate.getHours()).padStart(2, "0")}:${String(kstDate.getMinutes()).padStart(2, "0")}`;
    terms.push({ name, date: dateStr, time: timeStr, month: TERM_TO_MONTH[name] });
  }
  return terms;
}

const SOLAR_TERMS_DATA: Record<number, SolarTerm[]> = {};

function initializeSolarTermsData(): void {
  for (let year = 1900; year <= 2030; year++) {
    SOLAR_TERMS_DATA[year] = calculateYearSolarTerms(year);
  }
}

initializeSolarTermsData();

// 검증된 2020~2030 데이터로 덮어쓰기
const VERIFIED_SOLAR_TERMS: Record<number, SolarTerm[]> = {
  2024: [
    { name: "소한", date: "2024-01-06", time: "05:49", month: 12 },
    { name: "대한", date: "2024-01-20", time: "23:07", month: 12 },
    { name: "입춘", date: "2024-02-04", time: "17:27", month: 1 },
    { name: "우수", date: "2024-02-19", time: "13:13", month: 1 },
    { name: "경칩", date: "2024-03-05", time: "11:23", month: 2 },
    { name: "춘분", date: "2024-03-20", time: "12:06", month: 2 },
    { name: "청명", date: "2024-04-04", time: "15:02", month: 3 },
    { name: "곡우", date: "2024-04-19", time: "22:59", month: 3 },
    { name: "입하", date: "2024-05-05", time: "09:10", month: 4 },
    { name: "소만", date: "2024-05-20", time: "21:59", month: 4 },
    { name: "망종", date: "2024-06-05", time: "13:10", month: 5 },
    { name: "하지", date: "2024-06-21", time: "05:51", month: 5 },
    { name: "소서", date: "2024-07-06", time: "23:20", month: 6 },
    { name: "대서", date: "2024-07-22", time: "16:44", month: 6 },
    { name: "입추", date: "2024-08-07", time: "09:09", month: 7 },
    { name: "처서", date: "2024-08-22", time: "23:55", month: 7 },
    { name: "백로", date: "2024-09-07", time: "12:11", month: 8 },
    { name: "추분", date: "2024-09-22", time: "21:44", month: 8 },
    { name: "한로", date: "2024-10-08", time: "04:00", month: 9 },
    { name: "상강", date: "2024-10-23", time: "07:15", month: 9 },
    { name: "입동", date: "2024-11-07", time: "07:20", month: 10 },
    { name: "소설", date: "2024-11-22", time: "04:56", month: 10 },
    { name: "대설", date: "2024-12-07", time: "00:17", month: 11 },
    { name: "동지", date: "2024-12-21", time: "18:21", month: 11 },
  ],
  2025: [
    { name: "소한", date: "2025-01-05", time: "11:33", month: 12 },
    { name: "대한", date: "2025-01-20", time: "04:55", month: 12 },
    { name: "입춘", date: "2025-02-03", time: "23:10", month: 1 },
    { name: "우수", date: "2025-02-18", time: "18:57", month: 1 },
    { name: "경칩", date: "2025-03-05", time: "17:07", month: 2 },
    { name: "춘분", date: "2025-03-20", time: "18:01", month: 2 },
    { name: "청명", date: "2025-04-04", time: "21:48", month: 3 },
    { name: "곡우", date: "2025-04-20", time: "04:56", month: 3 },
    { name: "입하", date: "2025-05-05", time: "14:57", month: 4 },
    { name: "소만", date: "2025-05-21", time: "03:55", month: 4 },
    { name: "망종", date: "2025-06-05", time: "19:04", month: 5 },
    { name: "하지", date: "2025-06-21", time: "11:42", month: 5 },
    { name: "소서", date: "2025-07-07", time: "05:05", month: 6 },
    { name: "대서", date: "2025-07-22", time: "22:29", month: 6 },
    { name: "입추", date: "2025-08-07", time: "14:52", month: 7 },
    { name: "처서", date: "2025-08-23", time: "05:33", month: 7 },
    { name: "백로", date: "2025-09-07", time: "17:52", month: 8 },
    { name: "추분", date: "2025-09-23", time: "03:19", month: 8 },
    { name: "한로", date: "2025-10-08", time: "09:41", month: 9 },
    { name: "상강", date: "2025-10-23", time: "12:51", month: 9 },
    { name: "입동", date: "2025-11-07", time: "13:04", month: 10 },
    { name: "소설", date: "2025-11-22", time: "10:36", month: 10 },
    { name: "대설", date: "2025-12-07", time: "05:52", month: 11 },
    { name: "동지", date: "2025-12-22", time: "00:03", month: 11 },
  ],
  2026: [
    { name: "소한", date: "2026-01-05", time: "17:23", month: 12 },
    { name: "대한", date: "2026-01-20", time: "10:45", month: 12 },
    { name: "입춘", date: "2026-02-04", time: "05:02", month: 1 },
    { name: "우수", date: "2026-02-19", time: "00:52", month: 1 },
    { name: "경칩", date: "2026-03-05", time: "22:59", month: 2 },
    { name: "춘분", date: "2026-03-20", time: "23:46", month: 2 },
    { name: "청명", date: "2026-04-05", time: "03:39", month: 3 },
    { name: "곡우", date: "2026-04-20", time: "10:39", month: 3 },
    { name: "입하", date: "2026-05-05", time: "20:49", month: 4 },
    { name: "소만", date: "2026-05-21", time: "09:37", month: 4 },
    { name: "망종", date: "2026-06-06", time: "00:48", month: 5 },
    { name: "하지", date: "2026-06-21", time: "17:25", month: 5 },
    { name: "소서", date: "2026-07-07", time: "10:57", month: 6 },
    { name: "대서", date: "2026-07-23", time: "04:13", month: 6 },
    { name: "입추", date: "2026-08-07", time: "20:43", month: 7 },
    { name: "처서", date: "2026-08-23", time: "11:19", month: 7 },
    { name: "백로", date: "2026-09-07", time: "23:41", month: 8 },
    { name: "추분", date: "2026-09-23", time: "09:05", month: 8 },
    { name: "한로", date: "2026-10-08", time: "15:29", month: 9 },
    { name: "상강", date: "2026-10-23", time: "18:38", month: 9 },
    { name: "입동", date: "2026-11-07", time: "18:52", month: 10 },
    { name: "소설", date: "2026-11-22", time: "16:23", month: 10 },
    { name: "대설", date: "2026-12-07", time: "11:52", month: 11 },
    { name: "동지", date: "2026-12-22", time: "05:50", month: 11 },
  ],
};

for (const year in VERIFIED_SOLAR_TERMS) {
  SOLAR_TERMS_DATA[Number(year)] = VERIFIED_SOLAR_TERMS[Number(year)];
}

// ========== 만세력 계산 상수 ==========
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
const BASE_JD = 2415021;
const BASE_YEAR_STEM = 6;
const BASE_YEAR_BRANCH = 0;
const BASE_DAY_STEM = 0;
const BASE_DAY_BRANCH = 10;

function dateToJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

interface CalcOptions {
  use_solar_terms_for_year: boolean;
  use_solar_terms_for_month: boolean;
  zishi_split: boolean;
  hour_boundary_inclusive: "end_inclusive" | "start_inclusive";
  timezone: string;
}

const DEFAULT_OPTIONS: CalcOptions = {
  use_solar_terms_for_year: true,
  use_solar_terms_for_month: true,
  zishi_split: false,
  hour_boundary_inclusive: "end_inclusive",
  timezone: "Asia/Seoul",
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function dateToTimestamp(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) - KST_OFFSET_MS;
}

function birthDateToTimestamp(year: number, month: number, day: number, hour: number, minute: number): number {
  return Date.UTC(year, month - 1, day, hour, minute) - KST_OFFSET_MS;
}

// ========== 절기 조회/판정 ==========
interface SolarTermResult {
  month: number;
  term: SolarTerm | null;
  nextTerm: SolarTerm | null;
  isTermBoundary: boolean;
  yearAdjust: number;
  decisionLog: string[];
  references: {
    ipchunAt: string | null;
    monthTermStart: string | null;
    monthTermEnd: string | null;
  };
}

function findSolarTermInfo(birthDate: Date, birthHour: number, birthMinute: number): SolarTermResult {
  const year = birthDate.getFullYear();
  const birthTimestamp = birthDateToTimestamp(year, birthDate.getMonth() + 1, birthDate.getDate(), birthHour, birthMinute);
  const decisionLog: string[] = [];

  const prevYearTerms = SOLAR_TERMS_DATA[year - 1] || [];
  const currentYearTerms = SOLAR_TERMS_DATA[year] || [];
  const nextYearTerms = SOLAR_TERMS_DATA[year + 1] || [];

  const allJeolTerms = [
    ...prevYearTerms.filter((t) => JEOL_TERMS.includes(t.name)),
    ...currentYearTerms.filter((t) => JEOL_TERMS.includes(t.name)),
    ...nextYearTerms.filter((t) => JEOL_TERMS.includes(t.name)),
  ].sort((a, b) => dateToTimestamp(a.date, a.time) - dateToTimestamp(b.date, b.time));

  let currentMonth = 12;
  let currentTerm: SolarTerm | null = null;
  let nextTerm: SolarTerm | null = null;
  let isTermBoundary = false;
  let yearAdjust = 0;
  let ipchunAt: string | null = null;
  let monthTermStart: string | null = null;
  let monthTermEnd: string | null = null;

  const ipchun = currentYearTerms.find((t) => t.name === "입춘");
  if (ipchun) {
    const ipchunTimestamp = dateToTimestamp(ipchun.date, ipchun.time);
    ipchunAt = `${ipchun.date} ${ipchun.time}`;

    if (birthTimestamp < ipchunTimestamp) {
      yearAdjust = -1;
      decisionLog.push(`year_boundary: 입춘(${ipchun.date} ${ipchun.time}) 이전 → 전년 귀속`);
    } else {
      decisionLog.push(`year_boundary: 입춘(${ipchun.date} ${ipchun.time}) 이후 → 당해 귀속`);
    }
  }

  for (let i = 0; i < allJeolTerms.length; i++) {
    const term = allJeolTerms[i];
    const termTimestamp = dateToTimestamp(term.date, term.time);

    if (birthTimestamp >= termTimestamp) {
      currentMonth = term.month;
      currentTerm = term;
      monthTermStart = `${term.date} ${term.time}`;

      if (i + 1 < allJeolTerms.length) {
        nextTerm = allJeolTerms[i + 1];
        monthTermEnd = `${nextTerm.date} ${nextTerm.time}`;
      }

      const hourMs = 60 * 60 * 1000;
      if (Math.abs(birthTimestamp - termTimestamp) <= hourMs) {
        isTermBoundary = true;
        decisionLog.push(`month_boundary: 절기 경계 ±1시간 이내 (${term.name})`);
      }
    } else {
      break;
    }
  }

  const monthNames: Record<number, string> = {
    1: "인월", 2: "묘월", 3: "진월", 4: "사월", 5: "오월", 6: "미월",
    7: "신월", 8: "유월", 9: "술월", 10: "해월", 11: "자월", 12: "축월",
  };

  decisionLog.push(
    `month_boundary: 절기 구간 [${currentTerm?.name || "?"}~${nextTerm?.name || "?"}] → ${monthNames[currentMonth] || currentMonth + "월"}`,
  );

  return {
    month: currentMonth,
    term: currentTerm,
    nextTerm,
    isTermBoundary,
    yearAdjust,
    decisionLog,
    references: { ipchunAt, monthTermStart, monthTermEnd },
  };
}

// ========== 시주 계산 ==========
interface HourResult {
  branch: number;
  decisionLog: string;
}

function getHourBranch(hour: number, minute: number, options: CalcOptions): HourResult {
  let branch: number;
  let hourLabel: string;

  if (hour >= 23 || hour < 1) { branch = 0; hourLabel = "자시"; }
  else if (hour >= 1 && hour < 3) { branch = 1; hourLabel = "축시"; }
  else if (hour >= 3 && hour < 5) { branch = 2; hourLabel = "인시"; }
  else if (hour >= 5 && hour < 7) { branch = 3; hourLabel = "묘시"; }
  else if (hour >= 7 && hour < 9) { branch = 4; hourLabel = "진시"; }
  else if (hour >= 9 && hour < 11) { branch = 5; hourLabel = "사시"; }
  else if (hour >= 11 && hour < 13) { branch = 6; hourLabel = "오시"; }
  else if (hour >= 13 && hour < 15) { branch = 7; hourLabel = "미시"; }
  else if (hour >= 15 && hour < 17) { branch = 8; hourLabel = "신시"; }
  else if (hour >= 17 && hour < 19) { branch = 9; hourLabel = "유시"; }
  else if (hour >= 19 && hour < 21) { branch = 10; hourLabel = "술시"; }
  else { branch = 11; hourLabel = "해시"; }

  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");

  return {
    branch,
    decisionLog: `hour_boundary: ${hh}:${mm} (보정 후) ${options.hour_boundary_inclusive} → ${hourLabel}`,
  };
}

// ========== 일주 계산 ==========
interface DayResult {
  adjustedYear: number;
  adjustedMonth: number;
  adjustedDay: number;
  dayChange: boolean;
}

function getAdjustedDateFromCorrected(
  correctedYear: number,
  correctedMonth: number,
  correctedDay: number,
  correctedHour: number,
): DayResult {
  if (correctedHour >= 23) {
    const nextDay = new Date(correctedYear, correctedMonth - 1, correctedDay + 1);
    return {
      adjustedYear: nextDay.getFullYear(),
      adjustedMonth: nextDay.getMonth() + 1,
      adjustedDay: nextDay.getDate(),
      dayChange: true,
    };
  }
  return {
    adjustedYear: correctedYear,
    adjustedMonth: correctedMonth,
    adjustedDay: correctedDay,
    dayChange: false,
  };
}

function getDaysBetweenJD(year: number, month: number, day: number): number {
  const targetJD = dateToJulianDayNumber(year, month, day);
  return targetJD - BASE_JD;
}

// ========== 4주 산출 ==========
interface SajuPillars {
  year: { stem: number; branch: number };
  month: { stem: number; branch: number };
  day: { stem: number; branch: number };
  hour: { stem: number; branch: number } | null;
}

interface Proof {
  engine_version: string;
  solar_term_data_version: string;
  options_snapshot: CalcOptions;
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
  options: CalcOptions = DEFAULT_OPTIONS,
): SajuResult {
  const originalYear = birthDate.getFullYear();
  const originalMonth = birthDate.getMonth() + 1;
  const originalDay = birthDate.getDate();
  const effectiveHour = birthHour ?? 12;
  const effectiveMinute = birthMinute;

  const decisionLog: Array<{ key: string; value: string }> = [];

  const corrected = applyTimeCorrections(originalYear, originalMonth, originalDay, effectiveHour, effectiveMinute);

  corrected.correctionLog.forEach((log) => {
    const [key, ...valueParts] = log.split(":");
    decisionLog.push({ key: key.trim(), value: valueParts.join(":").trim() });
  });

  const correctedBirthDate = new Date(corrected.year, corrected.month - 1, corrected.day);

  const solarTermInfo = findSolarTermInfo(correctedBirthDate, corrected.hour, corrected.minute);
  solarTermInfo.decisionLog.forEach((log) => {
    const [key, ...valueParts] = log.split(":");
    decisionLog.push({ key: key.trim(), value: valueParts.join(":").trim() });
  });

  const { adjustedYear, adjustedMonth, adjustedDay, dayChange } = getAdjustedDateFromCorrected(
    corrected.year,
    corrected.month,
    corrected.day,
    corrected.hour,
  );
  const days = getDaysBetweenJD(adjustedYear, adjustedMonth, adjustedDay);
  const dayStemIndex = (((BASE_DAY_STEM + days) % 10) + 10) % 10;
  const dayBranchIndex = (((BASE_DAY_BRANCH + days) % 12) + 12) % 12;

  if (dayChange) {
    decisionLog.push({
      key: "day_boundary",
      value: `보정 후 ${corrected.hour}:${String(corrected.minute).padStart(2, "0")} (23시 이후) → 익일`,
    });
  }

  const effectiveYear = correctedBirthDate.getFullYear() + solarTermInfo.yearAdjust;
  const yearDiff = effectiveYear - 1900;
  const yearStemIndex = (((BASE_YEAR_STEM + yearDiff) % 10) + 10) % 10;
  const yearBranchIndex = (((BASE_YEAR_BRANCH + yearDiff) % 12) + 12) % 12;

  const monthBranchIndex = (solarTermInfo.month + 1) % 12;
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthStemIndex = (monthStemStart + solarTermInfo.month - 1) % 10;

  let hourResult: { stem: number; branch: number } | null = null;
  if (birthHour !== null) {
    const hourInfo = getHourBranch(corrected.hour, corrected.minute, options);
    const hourStemIndex = (HOUR_STEM_START[dayStemIndex] + hourInfo.branch) % 10;
    hourResult = { stem: hourStemIndex, branch: hourInfo.branch };
  }

  return {
    pillars: {
      year: { stem: yearStemIndex, branch: yearBranchIndex },
      month: { stem: monthStemIndex, branch: monthBranchIndex },
      day: { stem: dayStemIndex, branch: dayBranchIndex },
      hour: hourResult,
    },
    proof: {
      engine_version: ENGINE_VERSION,
      solar_term_data_version: SOLAR_TERM_DATA_VERSION,
      options_snapshot: options,
      decision_log: decisionLog,
      references: {
        ipchun_at: solarTermInfo.references.ipchunAt,
        month_terms: [solarTermInfo.references.monthTermStart, solarTermInfo.references.monthTermEnd],
        base_epoch: "1900-01-01 (갑술일, JD 2415021)",
      },
    },
  };
}

// ========== 십신 계산 (강화) ==========
function getTenGod(dayStem: number, targetStem: number): number {
  const dayElement = Math.floor(dayStem / 2);
  const targetElement = Math.floor(targetStem / 2);
  const dayYinYang = dayStem % 2;
  const targetYinYang = targetStem % 2;

  const elementDiff = (targetElement - dayElement + 5) % 5;
  const sameYinYang = dayYinYang === targetYinYang;

  return elementDiff * 2 + (sameYinYang ? 0 : 1);
}

// 지지의 정기로부터 십신 계산
function getTenGodFromBranch(dayStem: number, branchIndex: number): number {
  const jeonggi = JIJANGGAN[branchIndex].jeonggi;
  return getTenGod(dayStem, jeonggi);
}

// ========== 상세 십신 분포 계산 (8자 모두) ==========
interface TenGodDetail {
  position: string;       // 위치 (년간, 년지, 월간, 월지, 일지, 시간, 시지)
  stem: string;           // 천간/지지 한글
  stemHanja: string;      // 한자
  element: string;        // 오행
  tenGod: string;         // 십신
  tenGodHanja: string;    // 십신 한자
}

interface TenGodDistribution {
  details: TenGodDetail[];
  counts: Record<string, number>;
  dominant: string[];
  analysis: {
    bigyeop: number;      // 비겁 (비견+겁재)
    siksang: number;      // 식상 (식신+상관)
    jaecaeung: number;    // 재성 (편재+정재)
    gwanseong: number;    // 관성 (편관+정관)
    inseong: number;      // 인성 (편인+정인)
  };
}

function calculateDetailedTenGods(saju: SajuPillars): TenGodDistribution {
  const details: TenGodDetail[] = [];
  const counts: Record<string, number> = {};
  const dayStem = saju.day.stem;

  // 연간
  const yearStemTenGod = getTenGod(dayStem, saju.year.stem);
  details.push({
    position: "년간",
    stem: HEAVENLY_STEMS[saju.year.stem],
    stemHanja: STEMS_HANJA[saju.year.stem],
    element: STEMS_ELEMENTS[saju.year.stem],
    tenGod: TEN_GODS[yearStemTenGod],
    tenGodHanja: TEN_GODS_HANJA[yearStemTenGod],
  });
  counts[TEN_GODS[yearStemTenGod]] = (counts[TEN_GODS[yearStemTenGod]] || 0) + 1;

  // 연지 (정기 기준)
  const yearBranchTenGod = getTenGodFromBranch(dayStem, saju.year.branch);
  details.push({
    position: "년지",
    stem: EARTHLY_BRANCHES[saju.year.branch],
    stemHanja: BRANCHES_HANJA[saju.year.branch],
    element: BRANCHES_ELEMENTS[saju.year.branch],
    tenGod: TEN_GODS[yearBranchTenGod],
    tenGodHanja: TEN_GODS_HANJA[yearBranchTenGod],
  });
  counts[TEN_GODS[yearBranchTenGod]] = (counts[TEN_GODS[yearBranchTenGod]] || 0) + 1;

  // 월간
  const monthStemTenGod = getTenGod(dayStem, saju.month.stem);
  details.push({
    position: "월간",
    stem: HEAVENLY_STEMS[saju.month.stem],
    stemHanja: STEMS_HANJA[saju.month.stem],
    element: STEMS_ELEMENTS[saju.month.stem],
    tenGod: TEN_GODS[monthStemTenGod],
    tenGodHanja: TEN_GODS_HANJA[monthStemTenGod],
  });
  counts[TEN_GODS[monthStemTenGod]] = (counts[TEN_GODS[monthStemTenGod]] || 0) + 1;

  // 월지 (정기 기준)
  const monthBranchTenGod = getTenGodFromBranch(dayStem, saju.month.branch);
  details.push({
    position: "월지",
    stem: EARTHLY_BRANCHES[saju.month.branch],
    stemHanja: BRANCHES_HANJA[saju.month.branch],
    element: BRANCHES_ELEMENTS[saju.month.branch],
    tenGod: TEN_GODS[monthBranchTenGod],
    tenGodHanja: TEN_GODS_HANJA[monthBranchTenGod],
  });
  counts[TEN_GODS[monthBranchTenGod]] = (counts[TEN_GODS[monthBranchTenGod]] || 0) + 1;

  // 일지 (정기 기준)
  const dayBranchTenGod = getTenGodFromBranch(dayStem, saju.day.branch);
  details.push({
    position: "일지",
    stem: EARTHLY_BRANCHES[saju.day.branch],
    stemHanja: BRANCHES_HANJA[saju.day.branch],
    element: BRANCHES_ELEMENTS[saju.day.branch],
    tenGod: TEN_GODS[dayBranchTenGod],
    tenGodHanja: TEN_GODS_HANJA[dayBranchTenGod],
  });
  counts[TEN_GODS[dayBranchTenGod]] = (counts[TEN_GODS[dayBranchTenGod]] || 0) + 1;

  // 시주
  if (saju.hour) {
    const hourStemTenGod = getTenGod(dayStem, saju.hour.stem);
    details.push({
      position: "시간",
      stem: HEAVENLY_STEMS[saju.hour.stem],
      stemHanja: STEMS_HANJA[saju.hour.stem],
      element: STEMS_ELEMENTS[saju.hour.stem],
      tenGod: TEN_GODS[hourStemTenGod],
      tenGodHanja: TEN_GODS_HANJA[hourStemTenGod],
    });
    counts[TEN_GODS[hourStemTenGod]] = (counts[TEN_GODS[hourStemTenGod]] || 0) + 1;

    const hourBranchTenGod = getTenGodFromBranch(dayStem, saju.hour.branch);
    details.push({
      position: "시지",
      stem: EARTHLY_BRANCHES[saju.hour.branch],
      stemHanja: BRANCHES_HANJA[saju.hour.branch],
      element: BRANCHES_ELEMENTS[saju.hour.branch],
      tenGod: TEN_GODS[hourBranchTenGod],
      tenGodHanja: TEN_GODS_HANJA[hourBranchTenGod],
    });
    counts[TEN_GODS[hourBranchTenGod]] = (counts[TEN_GODS[hourBranchTenGod]] || 0) + 1;
  }

  // 우세 십신 분석
  const dominant = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // 카테고리별 분석
  const analysis = {
    bigyeop: (counts["비견"] || 0) + (counts["겁재"] || 0),
    siksang: (counts["식신"] || 0) + (counts["상관"] || 0),
    jaecaeung: (counts["편재"] || 0) + (counts["정재"] || 0),
    gwanseong: (counts["편관"] || 0) + (counts["정관"] || 0),
    inseong: (counts["편인"] || 0) + (counts["정인"] || 0),
  };

  return { details, counts, dominant, analysis };
}

// ========== 오행 분포 ==========
function countElements(saju: SajuPillars): Record<ElementType, number> {
  const counts: Record<ElementType, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  counts[STEMS_ELEMENTS[saju.year.stem] as ElementType]++;
  counts[STEMS_ELEMENTS[saju.month.stem] as ElementType]++;
  counts[STEMS_ELEMENTS[saju.day.stem] as ElementType]++;
  if (saju.hour) counts[STEMS_ELEMENTS[saju.hour.stem] as ElementType]++;

  counts[BRANCHES_ELEMENTS[saju.year.branch] as ElementType]++;
  counts[BRANCHES_ELEMENTS[saju.month.branch] as ElementType]++;
  counts[BRANCHES_ELEMENTS[saju.day.branch] as ElementType]++;
  if (saju.hour) counts[BRANCHES_ELEMENTS[saju.hour.branch] as ElementType]++;

  return counts;
}

// ========== 일간 강약 ==========
function getDayMasterStrength(saju: SajuPillars, elementCounts: Record<ElementType, number>): string {
  const dayElement = STEMS_ELEMENTS[saju.day.stem] as ElementType;
  const generatedBy: Record<ElementType, ElementType> = { 목: "수", 화: "목", 토: "화", 금: "토", 수: "금" };

  const selfCount = elementCounts[dayElement];
  const supportCount = elementCounts[generatedBy[dayElement]];
  const totalSupport = selfCount + supportCount;
  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);

  if (totalSupport > total / 2 + 1) return "신강";
  if (totalSupport < total / 2 - 1) return "신약";
  return "중화";
}

// ========== 용신/희신/기신 ==========
interface YongsinResult {
  yongsin: ElementType;
  huisin: ElementType;
  gisin: ElementType;
  method: "억부" | "조후" | "조후+억부";
  reasoning: string;
}

function getYongsin(dayElement: ElementType, strength: string, monthBranch: number): YongsinResult {
  const generating: Record<ElementType, ElementType> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controlling: Record<ElementType, ElementType> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  const generatedBy: Record<ElementType, ElementType> = { 목: "수", 화: "목", 토: "화", 금: "토", 수: "금" };

  const winterBranches = [0, 1, 11];
  const summerBranches = [5, 6, 7];

  const isWinter = winterBranches.includes(monthBranch);
  const isSummer = summerBranches.includes(monthBranch);

  if (isWinter) {
    return {
      yongsin: "화",
      huisin: "금",
      gisin: "수",
      method: "조후+억부",
      reasoning: `겨울(${EARTHLY_BRANCHES[monthBranch]}월) 출생으로 한습하므로 화(火)로 온기 보충`,
    };
  }

  if (isSummer) {
    return {
      yongsin: "수",
      huisin: "금",
      gisin: "화",
      method: "조후+억부",
      reasoning: `여름(${EARTHLY_BRANCHES[monthBranch]}월) 출생으로 조열하므로 수(水)로 열기 조절`,
    };
  }

  if (strength === "신강") {
    return {
      yongsin: generating[dayElement],
      huisin: generating[generating[dayElement]],
      gisin: dayElement,
      method: "억부",
      reasoning: `${strength}하므로 ${generating[dayElement]}(식상)으로 설기`,
    };
  } else if (strength === "신약") {
    return {
      yongsin: generatedBy[dayElement],
      huisin: dayElement,
      gisin: controlling[dayElement],
      method: "억부",
      reasoning: `${strength}하므로 ${generatedBy[dayElement]}(인성)으로 생조`,
    };
  }

  return {
    yongsin: generatedBy[dayElement],
    huisin: dayElement,
    gisin: controlling[dayElement],
    method: "억부",
    reasoning: `${strength}으로 균형 잡혀 있으나, ${generatedBy[dayElement]}(인성)이 안정에 도움`,
  };
}

// ========== 격국 ==========
const MONTH_BRANCH_MAIN_QI: Record<number, number> = {
  0: 9, 1: 5, 2: 0, 3: 1, 4: 4, 5: 2, 6: 3, 7: 5, 8: 6, 9: 7, 10: 4, 11: 8,
};

interface StructureResult {
  name: string;
  tenGod: string;
  tenGodHanja: string;
  reasoning: string;
}

function getStructureType(saju: SajuPillars): StructureResult {
  const monthBranch = saju.month.branch;
  const dayStem = saju.day.stem;

  const mainQiStem = MONTH_BRANCH_MAIN_QI[monthBranch];
  const tenGodIndex = getTenGod(dayStem, mainQiStem);
  const tenGodName = TEN_GODS[tenGodIndex];
  const tenGodHanja = TEN_GODS_HANJA[tenGodIndex];
  const structureName = tenGodName + "격";

  return {
    name: structureName,
    tenGod: tenGodName,
    tenGodHanja: tenGodHanja,
    reasoning: `월지 ${EARTHLY_BRANCHES[monthBranch]}(${BRANCHES_HANJA[monthBranch]})의 정기는 ${HEAVENLY_STEMS[mainQiStem]}(${STEMS_HANJA[mainQiStem]}), 일간 ${HEAVENLY_STEMS[dayStem]}(${STEMS_HANJA[dayStem]}) 기준 ${tenGodName}(${tenGodHanja}) 관계`,
  };
}

// ========== 대운 계산 ==========
interface DaeunPillar {
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  element: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
}

function calculateDaeun(
  birthDate: Date,
  birthHour: number,
  birthMinute: number,
  gender: string,
  saju: SajuPillars,
): { startAge: number; direction: string; pillars: DaeunPillar[]; daysToTerm: number } {
  const yearStem = saju.year.stem;
  const monthStem = saju.month.stem;
  const monthBranch = saju.month.branch;

  const yearYinYang = yearStem % 2;
  const isMale = gender === "male";
  const isForward = (yearYinYang === 0 && isMale) || (yearYinYang === 1 && !isMale);
  const direction = isForward ? "순행" : "역행";

  const year = birthDate.getFullYear();
  const birthTimestamp = new Date(year, birthDate.getMonth(), birthDate.getDate(), birthHour, birthMinute).getTime();

  const prevYearTerms = SOLAR_TERMS_DATA[year - 1] || [];
  const currentYearTerms = SOLAR_TERMS_DATA[year] || [];
  const nextYearTerms = SOLAR_TERMS_DATA[year + 1] || [];

  const allJeolTerms = [
    ...prevYearTerms.filter((t) => JEOL_TERMS.includes(t.name)),
    ...currentYearTerms.filter((t) => JEOL_TERMS.includes(t.name)),
    ...nextYearTerms.filter((t) => JEOL_TERMS.includes(t.name)),
  ].sort((a, b) => dateToTimestamp(a.date, a.time) - dateToTimestamp(b.date, b.time));

  let daysToTerm = 15;

  if (isForward) {
    for (const term of allJeolTerms) {
      const termTimestamp = dateToTimestamp(term.date, term.time);
      if (termTimestamp > birthTimestamp) {
        daysToTerm = Math.round((termTimestamp - birthTimestamp) / (24 * 60 * 60 * 1000));
        break;
      }
    }
  } else {
    for (let i = allJeolTerms.length - 1; i >= 0; i--) {
      const term = allJeolTerms[i];
      const termTimestamp = dateToTimestamp(term.date, term.time);
      if (termTimestamp <= birthTimestamp) {
        daysToTerm = Math.round((birthTimestamp - termTimestamp) / (24 * 60 * 60 * 1000));
        break;
      }
    }
  }

  const startAge = Math.max(1, Math.round(daysToTerm / 3));
  const birthYear = birthDate.getFullYear();
  const pillars: DaeunPillar[] = [];

  for (let i = 0; i < 8; i++) {
    let stemIndex: number;
    let branchIndex: number;

    if (isForward) {
      stemIndex = (monthStem + i + 1) % 10;
      branchIndex = (monthBranch + i + 1) % 12;
    } else {
      stemIndex = (monthStem - i - 1 + 10) % 10;
      branchIndex = (monthBranch - i - 1 + 12) % 12;
    }

    const ageStart = startAge + i * 10;
    const ageEnd = ageStart + 9;

    pillars.push({
      stem: HEAVENLY_STEMS[stemIndex],
      branch: EARTHLY_BRANCHES[branchIndex],
      stemHanja: STEMS_HANJA[stemIndex],
      branchHanja: BRANCHES_HANJA[branchIndex],
      element: STEMS_ELEMENTS[stemIndex],
      startAge: ageStart,
      endAge: ageEnd,
      startYear: birthYear + ageStart,
      endYear: birthYear + ageEnd,
    });
  }

  return { startAge, direction, pillars, daysToTerm };
}

function getCurrentDaeun(daeunPillars: DaeunPillar[], currentAge: number): DaeunPillar | null {
  return daeunPillars.find((p) => currentAge >= p.startAge && currentAge <= p.endAge) || null;
}

// ========== 기본 시스템 프롬프트 (폴백용) ==========
const FALLBACK_SYSTEM_PROMPT = `[ROLE]
This is a placeholder prompt.
Please configure the actual system prompt in the database table 'prompt_versions'.
Function: saju-analysis
Prompt Name: system_prompt`;

// ========== 분석 컨텍스트 및 데이터 생성 (확장) ==========
interface AnalysisData {
  context: string;
  daeun: { startAge: number; direction: string; pillars: DaeunPillar[]; daysToTerm: number };
  currentDaeun: DaeunPillar | null;
  saeun: { year: number; stem: string; branch: string; stemHanja: string; branchHanja: string; element: string };
  tenGodDistribution: TenGodDistribution;
  sajuPillars: SajuPillars;
  proof: {
    engine_version: string;
    solar_term_data_version: string;
    decision_log: Array<{ key: string; value: string }>;
    references: {
      ipchun_at: string | null;
      month_terms: [string | null, string | null];
      base_epoch: string;
    };
  };
}

function generateAnalysisData(
  name: string,
  gender: string,
  birthDate: Date,
  birthHour: number | null,
  birthMinute: number,
  calendarType: string,
  lunarConversionLog?: string | null,
): AnalysisData {
  const effectiveHour = birthHour ?? 12;
  const { pillars: saju, proof } = calculateSaju(birthDate, birthHour, birthMinute);
  const elementCounts = countElements(saju);
  const strength = getDayMasterStrength(saju, elementCounts);
  const dayElement = STEMS_ELEMENTS[saju.day.stem] as ElementType;
  const yongsinResult = getYongsin(dayElement, strength, saju.month.branch);
  const structureResult = getStructureType(saju);
  const tenGodDistribution = calculateDetailedTenGods(saju);
  const daeun = calculateDaeun(birthDate, effectiveHour, birthMinute, gender, saju);

  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);
  const koreaTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentYear = koreaTime.getUTCFullYear();
  const age = currentYear - birthDate.getFullYear();
  const currentDaeun = getCurrentDaeun(daeun.pillars, age);

  // 세운 정보 (2026년 기준)
  const saeunYear = 2026;
  const saeunYearDiff = saeunYear - 1900;
  const saeunStemIndex = (((BASE_YEAR_STEM + saeunYearDiff) % 10) + 10) % 10;
  const saeunBranchIndex = (((BASE_YEAR_BRANCH + saeunYearDiff) % 12) + 12) % 12;

  const birthTimeInfo = birthHour !== null ? `${birthHour}시 ${birthMinute}분` : "모름 (시주 미상)";

  let uncertaintyNote = "";
  const hasTermBoundary = proof.decision_log.some((d) => d.key === "month_boundary" && d.value.includes("경계"));

  if (birthHour === null) {
    uncertaintyNote = "출생시각 미상으로 시주 분석이 제한됩니다.";
  } else if (hasTermBoundary) {
    uncertaintyNote = "절기 경계 ±1시간 이내로, 월주가 달라질 수 있습니다.";
  } else if (birthHour === 23 || birthHour === 0) {
    uncertaintyNote = "자시(23:00~01:00) 경계로, 일주가 달라질 수 있습니다.";
  }

  // 음력 변환 로그 추가
  if (lunarConversionLog) {
    proof.decision_log.push({ key: "lunar_conversion", value: lunarConversionLog });
  }

  const saeunData = {
    year: saeunYear,
    stem: HEAVENLY_STEMS[saeunStemIndex],
    branch: EARTHLY_BRANCHES[saeunBranchIndex],
    stemHanja: STEMS_HANJA[saeunStemIndex],
    branchHanja: BRANCHES_HANJA[saeunBranchIndex],
    element: STEMS_ELEMENTS[saeunStemIndex],
  };

  const contextString = JSON.stringify(
    {
      birth_info: {
        name,
        gender: gender === "male" ? "남성" : "여성",
        calendar: calendarType === "solar" ? "양력" : "음력",
        birth_date: `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, "0")}-${String(birthDate.getDate()).padStart(2, "0")}`,
        birth_time: birthTimeInfo,
        current_age: age,
        analysis_year: saeunYear,
      },
      chart: {
        pillars: {
          year: {
            stem: HEAVENLY_STEMS[saju.year.stem],
            branch: EARTHLY_BRANCHES[saju.year.branch],
            stemHanja: STEMS_HANJA[saju.year.stem],
            branchHanja: BRANCHES_HANJA[saju.year.branch],
          },
          month: {
            stem: HEAVENLY_STEMS[saju.month.stem],
            branch: EARTHLY_BRANCHES[saju.month.branch],
            stemHanja: STEMS_HANJA[saju.month.stem],
            branchHanja: BRANCHES_HANJA[saju.month.branch],
          },
          day: {
            stem: HEAVENLY_STEMS[saju.day.stem],
            branch: EARTHLY_BRANCHES[saju.day.branch],
            stemHanja: STEMS_HANJA[saju.day.stem],
            branchHanja: BRANCHES_HANJA[saju.day.branch],
          },
          hour: saju.hour
            ? {
              stem: HEAVENLY_STEMS[saju.hour.stem],
              branch: EARTHLY_BRANCHES[saju.hour.branch],
              stemHanja: STEMS_HANJA[saju.hour.stem],
              branchHanja: BRANCHES_HANJA[saju.hour.branch],
            }
            : null,
        },
        day_master: {
          stem: HEAVENLY_STEMS[saju.day.stem],
          stemHanja: STEMS_HANJA[saju.day.stem],
          element: dayElement,
          yinYang: STEMS_YINYANG[saju.day.stem],
          strength,
        },
        five_elements: {
          counts: elementCounts,
          total,
          percentages: {
            wood: Math.round((elementCounts["목"] / total) * 100),
            fire: Math.round((elementCounts["화"] / total) * 100),
            earth: Math.round((elementCounts["토"] / total) * 100),
            metal: Math.round((elementCounts["금"] / total) * 100),
            water: Math.round((elementCounts["수"] / total) * 100),
          },
        },
        ten_gods: tenGodDistribution,
        structure: {
          type: structureResult.name,
          tenGod: structureResult.tenGod,
          tenGodHanja: structureResult.tenGodHanja,
          reasoning: structureResult.reasoning,
        },
        yongsin: yongsinResult,
      },
      daeun: {
        start_age: daeun.startAge,
        direction: daeun.direction,
        pillars: daeun.pillars,
        current: currentDaeun
          ? {
            pillar: `${currentDaeun.stem}${currentDaeun.branch}`,
            pillarHanja: `${currentDaeun.stemHanja}${currentDaeun.branchHanja}`,
            element: currentDaeun.element,
            period: `${currentDaeun.startAge}세~${currentDaeun.endAge}세`,
            years_remaining: currentDaeun.endAge - age,
          }
          : null,
      },
      saeun: saeunData,
      uncertainty_note: uncertaintyNote || "해당 없음",
    },
    null,
    2,
  );

  return {
    context: contextString,
    daeun,
    currentDaeun,
    saeun: saeunData,
    tenGodDistribution,
    sajuPillars: saju,
    proof,
  };
}

// ========== JSON 추출 함수 ==========
function extractJSON(text: string): string | null {
  const startIndex = text.indexOf("{");
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\" && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) {
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }
  return null;
}

// ========== 서버 핸들러 ==========
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, gender, birthDate, birthTime, calendarType, forceModel } = await req.json();

    console.log("Analyzing saju for:", name);
    console.log("Input - birthDate:", birthDate, "birthTime:", birthTime, "gender:", gender, "calendarType:", calendarType);
    console.log("Force model:", forceModel || "auto (Gemini primary, GPT fallback)");

    // 입력 날짜 파싱
    const inputParts = birthDate.split("-");
    let inputYear = parseInt(inputParts[0], 10);
    let inputMonth = parseInt(inputParts[1], 10);
    let inputDay = parseInt(inputParts[2], 10);

    // 음력인 경우 양력으로 변환
    let solarYear = inputYear;
    let solarMonth = inputMonth;
    let solarDay = inputDay;
    let lunarConversionLog: string | null = null;

    if (calendarType === "lunar") {
      console.log(`Converting lunar date: ${inputYear}-${inputMonth}-${inputDay} to solar...`);
      const solarResult = lunarToSolar(inputYear, inputMonth, inputDay, false);

      if (!solarResult.isValid) {
        console.error("Lunar to solar conversion failed:", solarResult.error);
        return new Response(JSON.stringify({ error: solarResult.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      solarYear = solarResult.year;
      solarMonth = solarResult.month;
      solarDay = solarResult.day;
      lunarConversionLog = `음력 ${inputYear}년 ${inputMonth}월 ${inputDay}일 → 양력 ${solarYear}년 ${solarMonth}월 ${solarDay}일`;
      console.log("Lunar to solar conversion:", lunarConversionLog);
    }

    // 양력 날짜로 Date 객체 생성 (UTC 기준으로 명시적 생성하여 시차 오류 방지)
    const birthDateObj = new Date(Date.UTC(solarYear, solarMonth - 1, solarDay, 12, 0, 0));

    let birthHour: number | null = null;
    let birthMinute: number = 0;

    if (typeof birthTime === "string" && birthTime.trim() !== "") {
      const raw = birthTime.trim();

      // 시간 파싱 로직 개선:
      // 1. 직접 HH:mm 입력 (예: "01:15") - 그대로 사용
      // 2. 범위 입력 (예: "23:30~01:29") - 범위의 중간값 또는 대표값 사용
      // 3. 시진 이름 포함 (예: "자시(23:30~01:29)") - 시진에 맞는 대표값 사용

      // 시진별 대표 시간 (각 시진의 중간 시간)
      const siJinTimes: Record<string, { hour: number; minute: number }> = {
        "자시": { hour: 0, minute: 30 },   // 23:30~01:29 → 중간값 00:30
        "축시": { hour: 2, minute: 0 },    // 01:30~03:29 → 중간값 02:00
        "인시": { hour: 4, minute: 0 },    // 03:30~05:29 → 중간값 04:00
        "묘시": { hour: 6, minute: 0 },    // 05:30~07:29 → 중간값 06:00
        "진시": { hour: 8, minute: 0 },    // 07:30~09:29 → 중간값 08:00
        "사시": { hour: 10, minute: 0 },   // 09:30~11:29 → 중간값 10:00
        "오시": { hour: 12, minute: 0 },   // 11:30~13:29 → 중간값 12:00
        "미시": { hour: 14, minute: 0 },   // 13:30~15:29 → 중간값 14:00
        "신시": { hour: 16, minute: 0 },   // 15:30~17:29 → 중간값 16:00
        "유시": { hour: 18, minute: 0 },   // 17:30~19:29 → 중간값 18:00
        "술시": { hour: 20, minute: 0 },   // 19:30~21:29 → 중간값 20:00
        "해시": { hour: 22, minute: 0 },   // 21:30~23:29 → 중간값 22:00
      };

      // 시진 이름이 포함된 경우 먼저 확인
      let parsed = false;
      for (const [siJinName, time] of Object.entries(siJinTimes)) {
        if (raw.includes(siJinName)) {
          birthHour = time.hour;
          birthMinute = time.minute;
          parsed = true;
          console.log(`Parsed siJin name "${siJinName}" → ${birthHour}:${String(birthMinute).padStart(2, "0")}`);
          break;
        }
      }

      // 시진 이름이 없으면 직접 시간 파싱 시도
      if (!parsed) {
        // 범위 형식인 경우 (HH:mm~HH:mm 또는 HH:mm-HH:mm)
        const rangeMatch = raw.match(/(\d{1,2}):(\d{2})\s*[~\-–—]\s*(\d{1,2}):(\d{2})/);
        if (rangeMatch) {
          // 범위의 시작과 끝 시간
          const startH = Number(rangeMatch[1]);
          const startM = Number(rangeMatch[2]);
          const endH = Number(rangeMatch[3]);
          const endM = Number(rangeMatch[4]);

          // 자시 범위(23:30~01:29)인 경우 특별 처리
          if (startH === 23 && endH < 12) {
            // 자시: 다음날 00:30을 대표값으로 사용
            birthHour = 0;
            birthMinute = 30;
          } else {
            // 일반 범위: 중간값 계산
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            const midMinutes = Math.floor((startMinutes + endMinutes) / 2);
            birthHour = Math.floor(midMinutes / 60);
            birthMinute = midMinutes % 60;
          }
          parsed = true;
          console.log(`Parsed time range "${raw}" → ${birthHour}:${String(birthMinute).padStart(2, "0")}`);
        }

        // 단일 시간 형식 (HH:mm)
        if (!parsed) {
          const singleMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
          if (singleMatch) {
            const h = Number(singleMatch[1]);
            const m = Number(singleMatch[2]);
            if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
              birthHour = h;
              birthMinute = m;
              parsed = true;
              console.log(`Parsed single time "${raw}" → ${birthHour}:${String(birthMinute).padStart(2, "0")}`);
            }
          }
        }
      }
    }

    console.log("Parsed birthTime ->", { birthHour, birthMinute });
    console.log("Using solar date for calculation:", `${solarYear}-${solarMonth}-${solarDay}`);

    const analysisData = generateAnalysisData(
      name,
      gender,
      birthDateObj,
      birthHour,
      birthMinute,
      "solar", // 변환 후에는 항상 양력으로 처리
      lunarConversionLog, // 음력 변환 로그 추가
    );

    const analysisContext = analysisData.context;

    console.log("Analysis context generated with enhanced ten-god distribution");

    // 프롬프트 모듈 병렬 로드
    const promptModules = await loadAllPromptModules();

    // 프롬프트 모듈 병합 (system_prompt에 JSON 스키마가 포함되어 있으므로 맨 앞에 배치)
    const combinedPrompt = [
      promptModules.systemPrompt,
      promptModules.basePersona,
      promptModules.daymasterAnalysis,
      promptModules.tenstarStructure,
      promptModules.luckCycleAnalysis,
      promptModules.areaFortune,
      promptModules.synthesisAdvice,
    ].filter(p => p && p.trim()).join("\n\n");

    // DB에서 로드된 프롬프트가 없으면 폴백
    const systemPrompt = combinedPrompt || FALLBACK_SYSTEM_PROMPT;

    // JSON 응답 지시어 추가
    const finalSystemPrompt = systemPrompt + "\n\n응답은 반드시 JSON 형식으로 제공해주세요.";

    const GPT_API_KEY = Deno.env.get("GPT");
    const GEMINI_API_KEY = Deno.env.get("Gemini");

    if (!GPT_API_KEY && !GEMINI_API_KEY) {
      console.error("No AI API keys configured");
      throw new Error("AI service is not configured");
    }

    async function callGeminiAPI() {
      console.log("Calling Gemini API (primary)...");
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=" +
        GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: finalSystemPrompt + "\n\n" + analysisContext }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

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
          Authorization: `Bearer ${GPT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: analysisContext },
          ],
          response_format: { type: "json_object" },
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

    let rawContent: string;
    let usedModel: string = "unknown";

    // A/B 테스트용 강제 모델 선택
    if (forceModel === "gemini" && GEMINI_API_KEY) {
      console.log("Forced to use Gemini API for A/B test");
      rawContent = await callGeminiAPI();
      usedModel = "gemini-3-pro-preview";
    } else if (forceModel === "gpt" && GPT_API_KEY) {
      console.log("Forced to use GPT API for A/B test");
      rawContent = await callGPTAPI();
      usedModel = "gpt-5.2";
    } else {
      // 기본 동작: Gemini 우선, GPT 폴백
      try {
        if (GEMINI_API_KEY) {
          rawContent = await callGeminiAPI();
          usedModel = "gemini-3-pro-preview";
        } else {
          rawContent = await callGPTAPI();
          usedModel = "gpt-5.2";
        }
      } catch (primaryError) {
        console.error("Primary API failed:", primaryError);
        if (GPT_API_KEY) {
          try {
            rawContent = await callGPTAPI();
            usedModel = "gpt-5.2 (fallback)";
          } catch (gptError) {
            console.error("Fallback GPT also failed:", gptError);
            return new Response(JSON.stringify({ error: "AI 서비스 오류가 발생했습니다." }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          return new Response(JSON.stringify({ error: "AI 서비스 오류가 발생했습니다." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    console.log("AI response received, parsing JSON...");

    let analysisResult;
    try {
      analysisResult = JSON.parse(rawContent);
    } catch {
      console.log("Direct JSON parse failed, attempting extraction...");
      const extractedJson = extractJSON(rawContent);
      if (extractedJson) {
        try {
          analysisResult = JSON.parse(extractedJson);
          console.log("JSON extraction successful");
        } catch (innerError) {
          console.error("JSON extraction also failed:", innerError);
          throw new Error("AI 응답 형식이 올바르지 않습니다.");
        }
      } else {
        throw new Error("AI 응답에서 결과를 찾을 수 없습니다.");
      }
    }

    // daeun과 saeun, tenGodDistribution을 백엔드 계산 결과로 추가
    const finalResult = {
      ...analysisResult,
      _meta: {
        usedModel,
        timestamp: new Date().toISOString(),
      },
      daeun: {
        start_age: analysisData.daeun.startAge,
        direction: analysisData.daeun.direction,
        pillars: analysisData.daeun.pillars,
        current: analysisData.currentDaeun
          ? {
            pillar: `${analysisData.currentDaeun.stem}${analysisData.currentDaeun.branch}`,
            pillarHanja: `${analysisData.currentDaeun.stemHanja}${analysisData.currentDaeun.branchHanja}`,
            element: analysisData.currentDaeun.element,
            period: `${analysisData.currentDaeun.startAge}세~${analysisData.currentDaeun.endAge}세`,
            years_remaining: analysisData.currentDaeun.endAge - (new Date().getFullYear() - birthDateObj.getFullYear()),
          }
          : null,
      },
      saeun: analysisData.saeun,
      tenGodDistribution: analysisData.tenGodDistribution,
      calculationProof: {
        engineVersion: analysisData.proof.engine_version,
        solarTermDataVersion: analysisData.proof.solar_term_data_version,
        decisionLog: analysisData.proof.decision_log,
        references: {
          ipchunAt: analysisData.proof.references.ipchun_at,
          monthTermStart: analysisData.proof.references.month_terms[0],
          monthTermEnd: analysisData.proof.references.month_terms[1],
          baseEpoch: analysisData.proof.references.base_epoch,
        },
      },
    };

    console.log("Saju analysis completed for:", name);

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("saju-analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
