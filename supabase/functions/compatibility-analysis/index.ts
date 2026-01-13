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

function applyTimeCorrections(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): CorrectedTime {
  const log: string[] = [];
  let correctedYear = year;
  let correctedMonth = month;
  let correctedDay = day;
  let correctedHour = hour;
  let correctedMinute = minute;
  let dstApplied = false;

  // 1. 썸머타임 보정
  if (isDuringDST(year, month, day, hour, minute)) {
    dstApplied = true;
    const tempDate = new Date(year, month - 1, day, hour, minute);
    tempDate.setHours(tempDate.getHours() - 1);
    correctedYear = tempDate.getFullYear();
    correctedMonth = tempDate.getMonth() + 1;
    correctedDay = tempDate.getDate();
    correctedHour = tempDate.getHours();
    correctedMinute = tempDate.getMinutes();
    log.push(`DST: 썸머타임 기간 → ${hour}:${String(minute).padStart(2, '0')} → ${correctedHour}:${String(correctedMinute).padStart(2, '0')} (1시간 역보정)`);
  }

  // 2. 한국 표준시 30분 보정
  const preKstHour = correctedHour;
  const preKstMinute = correctedMinute;
  const kstDate = new Date(correctedYear, correctedMonth - 1, correctedDay, correctedHour, correctedMinute);
  kstDate.setMinutes(kstDate.getMinutes() - 30);
  correctedYear = kstDate.getFullYear();
  correctedMonth = kstDate.getMonth() + 1;
  correctedDay = kstDate.getDate();
  correctedHour = kstDate.getHours();
  correctedMinute = kstDate.getMinutes();
  log.push(`KST: 표준시 30분 보정 → ${preKstHour}:${String(preKstMinute).padStart(2, '0')} → ${correctedHour}:${String(correctedMinute).padStart(2, '0')}`);

  return {
    year: correctedYear,
    month: correctedMonth,
    day: correctedDay,
    hour: correctedHour,
    minute: correctedMinute,
    dstApplied,
    kstCorrectionApplied: true,
    correctionLog: log
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

// ========== 천문학적 절기 계산 알고리즘 (VSOP87 기반) ==========
const SOLAR_TERM_ANGLES: Record<string, number> = {
  "소한": 285, "대한": 300, "입춘": 315, "우수": 330,
  "경칩": 345, "춘분": 0, "청명": 15, "곡우": 30,
  "입하": 45, "소만": 60, "망종": 75, "하지": 90,
  "소서": 105, "대서": 120, "입추": 135, "처서": 150,
  "백로": 165, "추분": 180, "한로": 195, "상강": 210,
  "입동": 225, "소설": 240, "대설": 255, "동지": 270
};

const TERM_TO_MONTH: Record<string, number> = {
  "소한": 12, "대한": 12, "입춘": 1, "우수": 1,
  "경칩": 2, "춘분": 2, "청명": 3, "곡우": 3,
  "입하": 4, "소만": 4, "망종": 5, "하지": 5,
  "소서": 6, "대서": 6, "입추": 7, "처서": 7,
  "백로": 8, "추분": 8, "한로": 9, "상강": 9,
  "입동": 10, "소설": 10, "대설": 11, "동지": 11
};

const JEOL_TERMS = ["입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설", "소한"];

// ========== 태양 황경 계산 (Jean Meeus 알고리즘) ==========
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
  M = M * Math.PI / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
    + 0.000289 * Math.sin(3 * M);
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
    { name: "대설", startMonth: 12 }, { name: "동지", startMonth: 12 }
  ];

  for (const { name, startMonth } of termOrder) {
    const angle = SOLAR_TERM_ANGLES[name];
    const kstDate = findSolarTermTime(year, angle, startMonth);
    const dateStr = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(kstDate.getHours()).padStart(2, '0')}:${String(kstDate.getMinutes()).padStart(2, '0')}`;
    terms.push({ name, date: dateStr, time: timeStr, month: TERM_TO_MONTH[name] });
  }

  return terms;
}

// 1900~2030년 절기 데이터 (캐시)
const SOLAR_TERMS_DATA: Record<number, SolarTerm[]> = {};

function initializeSolarTermsData(): void {
  for (let year = 1900; year <= 2030; year++) {
    SOLAR_TERMS_DATA[year] = calculateYearSolarTerms(year);
  }
}

initializeSolarTermsData();

// 검증된 2020~2030 데이터로 덮어쓰기 (한국천문연구원 기준)
const VERIFIED_SOLAR_TERMS: Record<number, SolarTerm[]> = {
  2020: [
    { name: "소한", date: "2020-01-06", time: "06:30", month: 12 },
    { name: "대한", date: "2020-01-20", time: "23:55", month: 12 },
    { name: "입춘", date: "2020-02-04", time: "18:03", month: 1 },
    { name: "우수", date: "2020-02-19", time: "13:57", month: 1 },
    { name: "경칩", date: "2020-03-05", time: "11:57", month: 2 },
    { name: "춘분", date: "2020-03-20", time: "12:50", month: 2 },
    { name: "청명", date: "2020-04-04", time: "16:38", month: 3 },
    { name: "곡우", date: "2020-04-19", time: "23:45", month: 3 },
    { name: "입하", date: "2020-05-05", time: "09:51", month: 4 },
    { name: "소만", date: "2020-05-20", time: "22:49", month: 4 },
    { name: "망종", date: "2020-06-05", time: "13:58", month: 5 },
    { name: "하지", date: "2020-06-21", time: "06:44", month: 5 },
    { name: "소서", date: "2020-07-06", time: "23:14", month: 6 },
    { name: "대서", date: "2020-07-22", time: "16:37", month: 6 },
    { name: "입추", date: "2020-08-07", time: "10:06", month: 7 },
    { name: "처서", date: "2020-08-23", time: "00:45", month: 7 },
    { name: "백로", date: "2020-09-07", time: "13:08", month: 8 },
    { name: "추분", date: "2020-09-22", time: "22:31", month: 8 },
    { name: "한로", date: "2020-10-08", time: "04:55", month: 9 },
    { name: "상강", date: "2020-10-23", time: "07:59", month: 9 },
    { name: "입동", date: "2020-11-07", time: "08:14", month: 10 },
    { name: "소설", date: "2020-11-22", time: "05:40", month: 10 },
    { name: "대설", date: "2020-12-07", time: "01:09", month: 11 },
    { name: "동지", date: "2020-12-21", time: "19:02", month: 11 }
  ],
  2021: [
    { name: "소한", date: "2021-01-05", time: "12:23", month: 12 },
    { name: "대한", date: "2021-01-20", time: "05:40", month: 12 },
    { name: "입춘", date: "2021-02-03", time: "23:59", month: 1 },
    { name: "우수", date: "2021-02-18", time: "19:44", month: 1 },
    { name: "경칩", date: "2021-03-05", time: "17:54", month: 2 },
    { name: "춘분", date: "2021-03-20", time: "18:37", month: 2 },
    { name: "청명", date: "2021-04-04", time: "22:35", month: 3 },
    { name: "곡우", date: "2021-04-20", time: "05:33", month: 3 },
    { name: "입하", date: "2021-05-05", time: "15:47", month: 4 },
    { name: "소만", date: "2021-05-21", time: "04:37", month: 4 },
    { name: "망종", date: "2021-06-05", time: "19:52", month: 5 },
    { name: "하지", date: "2021-06-21", time: "12:32", month: 5 },
    { name: "소서", date: "2021-07-07", time: "05:05", month: 6 },
    { name: "대서", date: "2021-07-22", time: "22:26", month: 6 },
    { name: "입추", date: "2021-08-07", time: "15:54", month: 7 },
    { name: "처서", date: "2021-08-23", time: "06:35", month: 7 },
    { name: "백로", date: "2021-09-07", time: "18:53", month: 8 },
    { name: "추분", date: "2021-09-23", time: "04:21", month: 8 },
    { name: "한로", date: "2021-10-08", time: "10:39", month: 9 },
    { name: "상강", date: "2021-10-23", time: "13:51", month: 9 },
    { name: "입동", date: "2021-11-07", time: "13:59", month: 10 },
    { name: "소설", date: "2021-11-22", time: "11:34", month: 10 },
    { name: "대설", date: "2021-12-07", time: "06:57", month: 11 },
    { name: "동지", date: "2021-12-22", time: "00:59", month: 11 }
  ],
  2022: [
    { name: "소한", date: "2022-01-05", time: "18:14", month: 12 },
    { name: "대한", date: "2022-01-20", time: "11:39", month: 12 },
    { name: "입춘", date: "2022-02-04", time: "05:51", month: 1 },
    { name: "우수", date: "2022-02-19", time: "01:43", month: 1 },
    { name: "경칩", date: "2022-03-05", time: "23:44", month: 2 },
    { name: "춘분", date: "2022-03-21", time: "00:33", month: 2 },
    { name: "청명", date: "2022-04-05", time: "04:20", month: 3 },
    { name: "곡우", date: "2022-04-20", time: "11:24", month: 3 },
    { name: "입하", date: "2022-05-05", time: "21:26", month: 4 },
    { name: "소만", date: "2022-05-21", time: "10:23", month: 4 },
    { name: "망종", date: "2022-06-06", time: "01:26", month: 5 },
    { name: "하지", date: "2022-06-21", time: "18:14", month: 5 },
    { name: "소서", date: "2022-07-07", time: "11:38", month: 6 },
    { name: "대서", date: "2022-07-23", time: "05:07", month: 6 },
    { name: "입추", date: "2022-08-07", time: "21:29", month: 7 },
    { name: "처서", date: "2022-08-23", time: "12:16", month: 7 },
    { name: "백로", date: "2022-09-08", time: "00:32", month: 8 },
    { name: "추분", date: "2022-09-23", time: "10:04", month: 8 },
    { name: "한로", date: "2022-10-08", time: "16:22", month: 9 },
    { name: "상강", date: "2022-10-23", time: "19:36", month: 9 },
    { name: "입동", date: "2022-11-07", time: "19:45", month: 10 },
    { name: "소설", date: "2022-11-22", time: "17:20", month: 10 },
    { name: "대설", date: "2022-12-07", time: "12:46", month: 11 },
    { name: "동지", date: "2022-12-22", time: "06:48", month: 11 }
  ],
  2023: [
    { name: "소한", date: "2023-01-06", time: "00:05", month: 12 },
    { name: "대한", date: "2023-01-20", time: "17:30", month: 12 },
    { name: "입춘", date: "2023-02-04", time: "11:43", month: 1 },
    { name: "우수", date: "2023-02-19", time: "07:34", month: 1 },
    { name: "경칩", date: "2023-03-06", time: "05:36", month: 2 },
    { name: "춘분", date: "2023-03-21", time: "06:24", month: 2 },
    { name: "청명", date: "2023-04-05", time: "10:13", month: 3 },
    { name: "곡우", date: "2023-04-20", time: "17:14", month: 3 },
    { name: "입하", date: "2023-05-06", time: "03:19", month: 4 },
    { name: "소만", date: "2023-05-21", time: "16:09", month: 4 },
    { name: "망종", date: "2023-06-06", time: "07:18", month: 5 },
    { name: "하지", date: "2023-06-21", time: "23:58", month: 5 },
    { name: "소서", date: "2023-07-07", time: "17:31", month: 6 },
    { name: "대서", date: "2023-07-23", time: "10:50", month: 6 },
    { name: "입추", date: "2023-08-08", time: "03:23", month: 7 },
    { name: "처서", date: "2023-08-23", time: "18:01", month: 7 },
    { name: "백로", date: "2023-09-08", time: "06:27", month: 8 },
    { name: "추분", date: "2023-09-23", time: "15:50", month: 8 },
    { name: "한로", date: "2023-10-08", time: "22:16", month: 9 },
    { name: "상강", date: "2023-10-24", time: "01:21", month: 9 },
    { name: "입동", date: "2023-11-08", time: "01:36", month: 10 },
    { name: "소설", date: "2023-11-22", time: "23:03", month: 10 },
    { name: "대설", date: "2023-12-07", time: "18:33", month: 11 },
    { name: "동지", date: "2023-12-22", time: "12:27", month: 11 }
  ],
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
    { name: "동지", date: "2024-12-21", time: "18:21", month: 11 }
  ],
  2025: [
    { name: "소한", date: "2025-01-05", time: "11:33", month: 12 },
    { name: "대한", date: "2025-01-20", time: "04:59", month: 12 },
    { name: "입춘", date: "2025-02-03", time: "23:10", month: 1 },
    { name: "우수", date: "2025-02-18", time: "19:07", month: 1 },
    { name: "경칩", date: "2025-03-05", time: "17:07", month: 2 },
    { name: "춘분", date: "2025-03-20", time: "18:01", month: 2 },
    { name: "청명", date: "2025-04-04", time: "21:48", month: 3 },
    { name: "곡우", date: "2025-04-20", time: "04:55", month: 3 },
    { name: "입하", date: "2025-05-05", time: "14:57", month: 4 },
    { name: "소만", date: "2025-05-21", time: "03:54", month: 4 },
    { name: "망종", date: "2025-06-05", time: "18:56", month: 5 },
    { name: "하지", date: "2025-06-21", time: "11:42", month: 5 },
    { name: "소서", date: "2025-07-07", time: "05:05", month: 6 },
    { name: "대서", date: "2025-07-22", time: "22:29", month: 6 },
    { name: "입추", date: "2025-08-07", time: "14:51", month: 7 },
    { name: "처서", date: "2025-08-23", time: "05:33", month: 7 },
    { name: "백로", date: "2025-09-07", time: "17:52", month: 8 },
    { name: "추분", date: "2025-09-23", time: "03:19", month: 8 },
    { name: "한로", date: "2025-10-08", time: "09:41", month: 9 },
    { name: "상강", date: "2025-10-23", time: "12:51", month: 9 },
    { name: "입동", date: "2025-11-07", time: "13:04", month: 10 },
    { name: "소설", date: "2025-11-22", time: "10:36", month: 10 },
    { name: "대설", date: "2025-12-07", time: "06:04", month: 11 },
    { name: "동지", date: "2025-12-22", time: "00:03", month: 11 }
  ],
  2026: [
    { name: "소한", date: "2026-01-05", time: "17:23", month: 12 },
    { name: "대한", date: "2026-01-20", time: "10:45", month: 12 },
    { name: "입춘", date: "2026-02-04", time: "05:02", month: 1 },
    { name: "우수", date: "2026-02-19", time: "00:52", month: 1 },
    { name: "경칩", date: "2026-03-05", time: "23:00", month: 2 },
    { name: "춘분", date: "2026-03-20", time: "23:46", month: 2 },
    { name: "청명", date: "2026-04-05", time: "03:40", month: 3 },
    { name: "곡우", date: "2026-04-20", time: "10:39", month: 3 },
    { name: "입하", date: "2026-05-05", time: "20:48", month: 4 },
    { name: "소만", date: "2026-05-21", time: "09:37", month: 4 },
    { name: "망종", date: "2026-06-06", time: "00:48", month: 5 },
    { name: "하지", date: "2026-06-21", time: "17:24", month: 5 },
    { name: "소서", date: "2026-07-07", time: "10:56", month: 6 },
    { name: "대서", date: "2026-07-23", time: "04:13", month: 6 },
    { name: "입추", date: "2026-08-07", time: "20:42", month: 7 },
    { name: "처서", date: "2026-08-23", time: "11:19", month: 7 },
    { name: "백로", date: "2026-09-07", time: "23:41", month: 8 },
    { name: "추분", date: "2026-09-23", time: "09:05", month: 8 },
    { name: "한로", date: "2026-10-08", time: "15:29", month: 9 },
    { name: "상강", date: "2026-10-23", time: "18:38", month: 9 },
    { name: "입동", date: "2026-11-07", time: "18:52", month: 10 },
    { name: "소설", date: "2026-11-22", time: "16:23", month: 10 },
    { name: "대설", date: "2026-12-07", time: "11:52", month: 11 },
    { name: "동지", date: "2026-12-22", time: "05:50", month: 11 }
  ],
  2027: [
    { name: "소한", date: "2027-01-05", time: "23:10", month: 12 },
    { name: "대한", date: "2027-01-20", time: "16:30", month: 12 },
    { name: "입춘", date: "2027-02-04", time: "10:46", month: 1 },
    { name: "우수", date: "2027-02-19", time: "06:33", month: 1 },
    { name: "경칩", date: "2027-03-06", time: "04:39", month: 2 },
    { name: "춘분", date: "2027-03-21", time: "05:25", month: 2 },
    { name: "청명", date: "2027-04-05", time: "09:17", month: 3 },
    { name: "곡우", date: "2027-04-20", time: "16:17", month: 3 },
    { name: "입하", date: "2027-05-06", time: "02:25", month: 4 },
    { name: "소만", date: "2027-05-21", time: "15:18", month: 4 },
    { name: "망종", date: "2027-06-06", time: "06:25", month: 5 },
    { name: "하지", date: "2027-06-21", time: "23:11", month: 5 },
    { name: "소서", date: "2027-07-07", time: "16:37", month: 6 },
    { name: "대서", date: "2027-07-23", time: "10:04", month: 6 },
    { name: "입추", date: "2027-08-08", time: "02:27", month: 7 },
    { name: "처서", date: "2027-08-23", time: "17:14", month: 7 },
    { name: "백로", date: "2027-09-08", time: "05:28", month: 8 },
    { name: "추분", date: "2027-09-23", time: "15:02", month: 8 },
    { name: "한로", date: "2027-10-08", time: "21:16", month: 9 },
    { name: "상강", date: "2027-10-24", time: "00:32", month: 9 },
    { name: "입동", date: "2027-11-08", time: "00:38", month: 10 },
    { name: "소설", date: "2027-11-22", time: "22:15", month: 10 },
    { name: "대설", date: "2027-12-07", time: "17:37", month: 11 },
    { name: "동지", date: "2027-12-22", time: "11:42", month: 11 }
  ],
  2028: [
    { name: "소한", date: "2028-01-06", time: "04:55", month: 12 },
    { name: "대한", date: "2028-01-20", time: "22:22", month: 12 },
    { name: "입춘", date: "2028-02-04", time: "16:31", month: 1 },
    { name: "우수", date: "2028-02-19", time: "12:25", month: 1 },
    { name: "경칩", date: "2028-03-05", time: "10:24", month: 2 },
    { name: "춘분", date: "2028-03-20", time: "11:17", month: 2 },
    { name: "청명", date: "2028-04-04", time: "15:02", month: 3 },
    { name: "곡우", date: "2028-04-19", time: "22:09", month: 3 },
    { name: "입하", date: "2028-05-05", time: "08:10", month: 4 },
    { name: "소만", date: "2028-05-20", time: "21:09", month: 4 },
    { name: "망종", date: "2028-06-05", time: "12:10", month: 5 },
    { name: "하지", date: "2028-06-21", time: "05:02", month: 5 },
    { name: "소서", date: "2028-07-06", time: "22:30", month: 6 },
    { name: "대서", date: "2028-07-22", time: "15:54", month: 6 },
    { name: "입추", date: "2028-08-07", time: "08:21", month: 7 },
    { name: "처서", date: "2028-08-22", time: "23:00", month: 7 },
    { name: "백로", date: "2028-09-07", time: "11:22", month: 8 },
    { name: "추분", date: "2028-09-22", time: "20:45", month: 8 },
    { name: "한로", date: "2028-10-08", time: "03:08", month: 9 },
    { name: "상강", date: "2028-10-23", time: "06:13", month: 9 },
    { name: "입동", date: "2028-11-07", time: "06:27", month: 10 },
    { name: "소설", date: "2028-11-22", time: "03:54", month: 10 },
    { name: "대설", date: "2028-12-06", time: "23:25", month: 11 },
    { name: "동지", date: "2028-12-21", time: "17:20", month: 11 }
  ],
  2029: [
    { name: "소한", date: "2029-01-05", time: "10:42", month: 12 },
    { name: "대한", date: "2029-01-20", time: "04:01", month: 12 },
    { name: "입춘", date: "2029-02-03", time: "22:20", month: 1 },
    { name: "우수", date: "2029-02-18", time: "18:07", month: 1 },
    { name: "경칩", date: "2029-03-05", time: "16:17", month: 2 },
    { name: "춘분", date: "2029-03-20", time: "16:58", month: 2 },
    { name: "청명", date: "2029-04-04", time: "20:52", month: 3 },
    { name: "곡우", date: "2029-04-20", time: "03:55", month: 3 },
    { name: "입하", date: "2029-05-05", time: "14:03", month: 4 },
    { name: "소만", date: "2029-05-21", time: "02:55", month: 4 },
    { name: "망종", date: "2029-06-05", time: "18:05", month: 5 },
    { name: "하지", date: "2029-06-21", time: "10:48", month: 5 },
    { name: "소서", date: "2029-07-07", time: "04:22", month: 6 },
    { name: "대서", date: "2029-07-22", time: "21:42", month: 6 },
    { name: "입추", date: "2029-08-07", time: "14:12", month: 7 },
    { name: "처서", date: "2029-08-23", time: "04:52", month: 7 },
    { name: "백로", date: "2029-09-07", time: "17:16", month: 8 },
    { name: "추분", date: "2029-09-23", time: "02:38", month: 8 },
    { name: "한로", date: "2029-10-08", time: "09:00", month: 9 },
    { name: "상강", date: "2029-10-23", time: "12:07", month: 9 },
    { name: "입동", date: "2029-11-07", time: "12:17", month: 10 },
    { name: "소설", date: "2029-11-22", time: "09:49", month: 10 },
    { name: "대설", date: "2029-12-07", time: "05:13", month: 11 },
    { name: "동지", date: "2029-12-21", time: "23:14", month: 11 }
  ],
  2030: [
    { name: "소한", date: "2030-01-05", time: "16:31", month: 12 },
    { name: "대한", date: "2030-01-20", time: "09:55", month: 12 },
    { name: "입춘", date: "2030-02-04", time: "04:08", month: 1 },
    { name: "우수", date: "2030-02-19", time: "00:00", month: 1 },
    { name: "경칩", date: "2030-03-05", time: "22:04", month: 2 },
    { name: "춘분", date: "2030-03-20", time: "22:52", month: 2 },
    { name: "청명", date: "2030-04-05", time: "02:40", month: 3 },
    { name: "곡우", date: "2030-04-20", time: "09:44", month: 3 },
    { name: "입하", date: "2030-05-05", time: "19:54", month: 4 },
    { name: "소만", date: "2030-05-21", time: "08:50", month: 4 },
    { name: "망종", date: "2030-06-06", time: "00:01", month: 5 },
    { name: "하지", date: "2030-06-21", time: "16:31", month: 5 },
    { name: "소서", date: "2030-07-07", time: "10:11", month: 6 },
    { name: "대서", date: "2030-07-23", time: "03:28", month: 6 },
    { name: "입추", date: "2030-08-07", time: "20:00", month: 7 },
    { name: "처서", date: "2030-08-23", time: "10:36", month: 7 },
    { name: "백로", date: "2030-09-07", time: "23:01", month: 8 },
    { name: "추분", date: "2030-09-23", time: "08:27", month: 8 },
    { name: "한로", date: "2030-10-08", time: "14:45", month: 9 },
    { name: "상강", date: "2030-10-23", time: "17:53", month: 9 },
    { name: "입동", date: "2030-11-07", time: "18:06", month: 10 },
    { name: "소설", date: "2030-11-22", time: "15:33", month: 10 },
    { name: "대설", date: "2030-12-07", time: "11:00", month: 11 },
    { name: "동지", date: "2030-12-22", time: "04:58", month: 11 }
  ]
};

// 검증된 데이터로 덮어쓰기
for (const year in VERIFIED_SOLAR_TERMS) {
  SOLAR_TERMS_DATA[Number(year)] = VERIFIED_SOLAR_TERMS[Number(year)];
}

// ========== 절기 정보 조회 함수 ==========
interface SolarTermInfo {
  month: number;
  termName: string;
  termStart: string | null;
  termEnd: string | null;
  isTermBoundary: boolean;
}

function findSolarTermInfo(birthDate: Date, birthHour: number, birthMinute: number = 0): SolarTermInfo {
  const year = birthDate.getFullYear();
  const birthKstMs = new Date(
    year,
    birthDate.getMonth(),
    birthDate.getDate(),
    birthHour,
    birthMinute
  ).getTime();

  const allTerms: { name: string; timestamp: number; month: number; date: string; time: string }[] = [];

  for (let y = year - 1; y <= year + 1; y++) {
    const terms = SOLAR_TERMS_DATA[y];
    if (!terms) continue;

    for (const term of terms) {
      const [tYear, tMonth, tDay] = term.date.split('-').map(Number);
      const [tHour, tMin] = term.time.split(':').map(Number);
      const termTimestamp = new Date(tYear, tMonth - 1, tDay, tHour, tMin).getTime();
      allTerms.push({
        name: term.name,
        timestamp: termTimestamp,
        month: term.month,
        date: term.date,
        time: term.time
      });
    }
  }

  allTerms.sort((a, b) => a.timestamp - b.timestamp);

  let currentTermIndex = -1;
  for (let i = 0; i < allTerms.length; i++) {
    if (allTerms[i].timestamp <= birthKstMs) {
      currentTermIndex = i;
    } else {
      break;
    }
  }

  if (currentTermIndex < 0) {
    return { month: 1, termName: "입춘", termStart: null, termEnd: null, isTermBoundary: false };
  }

  const currentTerm = allTerms[currentTermIndex];
  const nextTerm = allTerms[currentTermIndex + 1];
  const timeDiff = currentTerm.timestamp - birthKstMs;
  const isTermBoundary = Math.abs(timeDiff) < 60 * 60 * 1000;

  return {
    month: currentTerm.month,
    termName: currentTerm.name,
    termStart: `${currentTerm.date} ${currentTerm.time}`,
    termEnd: nextTerm ? `${nextTerm.date} ${nextTerm.time}` : null,
    isTermBoundary
  };
}

// ========== 자동 검증 QA 함수 ==========
interface QATestCase {
  birthDate: string;
  birthTime: string;
  expectedMonth: number;
  expectedMonthName: string;
  description: string;
}

interface QAResult {
  testCase: QATestCase;
  actualMonth: number;
  actualMonthName: string;
  passed: boolean;
  details: string;
}

function runMonthPillarQA(): { passed: number; failed: number; total: number; results: QAResult[] } {
  const testCases: QATestCase[] = [
    { birthDate: "1950-02-04", birthTime: "10:00", expectedMonth: 12, expectedMonthName: "축월", description: "1950 입춘 직전" },
    { birthDate: "1950-02-04", birthTime: "20:00", expectedMonth: 1, expectedMonthName: "인월", description: "1950 입춘 직후" },
    { birthDate: "1960-02-04", birthTime: "08:00", expectedMonth: 12, expectedMonthName: "축월", description: "1960 입춘 직전" },
    { birthDate: "1960-02-05", birthTime: "00:00", expectedMonth: 1, expectedMonthName: "인월", description: "1960 입춘 직후" },
    { birthDate: "1970-02-04", birthTime: "06:00", expectedMonth: 12, expectedMonthName: "축월", description: "1970 입춘 직전" },
    { birthDate: "1970-02-04", birthTime: "18:00", expectedMonth: 1, expectedMonthName: "인월", description: "1970 입춘 직후" },
    { birthDate: "1980-02-04", birthTime: "22:00", expectedMonth: 12, expectedMonthName: "축월", description: "1980 입춘 직전" },
    { birthDate: "1980-02-05", birthTime: "08:00", expectedMonth: 1, expectedMonthName: "인월", description: "1980 입춘 직후" },
    { birthDate: "1990-02-04", birthTime: "02:00", expectedMonth: 12, expectedMonthName: "축월", description: "1990 입춘 직전" },
    { birthDate: "1990-02-04", birthTime: "16:00", expectedMonth: 1, expectedMonthName: "인월", description: "1990 입춘 직후" },
    { birthDate: "1985-03-05", birthTime: "06:00", expectedMonth: 1, expectedMonthName: "인월", description: "1985 경칩 직전" },
    { birthDate: "1985-03-06", birthTime: "06:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1985 경칩 직후" },
    { birthDate: "1995-03-05", birthTime: "23:00", expectedMonth: 1, expectedMonthName: "인월", description: "1995 경칩 직전" },
    { birthDate: "1995-03-06", birthTime: "12:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1995 경칩 직후" },
    { birthDate: "1975-04-04", birthTime: "08:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1975 청명 직전" },
    { birthDate: "1975-04-05", birthTime: "08:00", expectedMonth: 3, expectedMonthName: "진월", description: "1975 청명 직후" },
    { birthDate: "1988-05-05", birthTime: "06:00", expectedMonth: 3, expectedMonthName: "진월", description: "1988 입하 직전" },
    { birthDate: "1988-05-05", birthTime: "18:00", expectedMonth: 4, expectedMonthName: "사월", description: "1988 입하 직후" },
    { birthDate: "1992-06-05", birthTime: "08:00", expectedMonth: 4, expectedMonthName: "사월", description: "1992 망종 직전" },
    { birthDate: "1992-06-06", birthTime: "08:00", expectedMonth: 5, expectedMonthName: "오월", description: "1992 망종 직후" },
    { birthDate: "1983-07-07", birthTime: "04:00", expectedMonth: 5, expectedMonthName: "오월", description: "1983 소서 직전" },
    { birthDate: "1983-07-07", birthTime: "18:00", expectedMonth: 6, expectedMonthName: "미월", description: "1983 소서 직후" },
    { birthDate: "1978-08-07", birthTime: "06:00", expectedMonth: 6, expectedMonthName: "미월", description: "1978 입추 직전" },
    { birthDate: "1978-08-08", birthTime: "06:00", expectedMonth: 7, expectedMonthName: "신월", description: "1978 입추 직후" },
    { birthDate: "1965-09-07", birthTime: "12:00", expectedMonth: 7, expectedMonthName: "신월", description: "1965 백로 직전" },
    { birthDate: "1965-09-08", birthTime: "12:00", expectedMonth: 8, expectedMonthName: "유월", description: "1965 백로 직후" },
    { birthDate: "1972-10-07", birthTime: "22:00", expectedMonth: 8, expectedMonthName: "유월", description: "1972 한로 직전" },
    { birthDate: "1972-10-08", birthTime: "22:00", expectedMonth: 9, expectedMonthName: "술월", description: "1972 한로 직후" },
    { birthDate: "1958-11-07", birthTime: "06:00", expectedMonth: 9, expectedMonthName: "술월", description: "1958 입동 직전" },
    { birthDate: "1958-11-08", birthTime: "06:00", expectedMonth: 10, expectedMonthName: "해월", description: "1958 입동 직후" },
    { birthDate: "1997-12-06", birthTime: "20:00", expectedMonth: 10, expectedMonthName: "해월", description: "1997 대설 직전" },
    { birthDate: "1997-12-07", birthTime: "20:00", expectedMonth: 11, expectedMonthName: "자월", description: "1997 대설 직후" },
    { birthDate: "1982-01-05", birthTime: "06:00", expectedMonth: 11, expectedMonthName: "자월", description: "1982 소한 직전" },
    { birthDate: "1982-01-06", birthTime: "06:00", expectedMonth: 12, expectedMonthName: "축월", description: "1982 소한 직후" },
    { birthDate: "1955-01-15", birthTime: "12:00", expectedMonth: 12, expectedMonthName: "축월", description: "1955년 1월 중순 (축월)" },
    { birthDate: "1962-02-20", birthTime: "12:00", expectedMonth: 1, expectedMonthName: "인월", description: "1962년 2월 중순 (인월)" },
    { birthDate: "1968-03-20", birthTime: "12:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1968년 3월 중순 (묘월)" },
    { birthDate: "1973-04-20", birthTime: "12:00", expectedMonth: 3, expectedMonthName: "진월", description: "1973년 4월 중순 (진월)" },
    { birthDate: "1979-05-20", birthTime: "12:00", expectedMonth: 4, expectedMonthName: "사월", description: "1979년 5월 중순 (사월)" },
    { birthDate: "1984-06-20", birthTime: "12:00", expectedMonth: 5, expectedMonthName: "오월", description: "1984년 6월 중순 (오월)" },
    { birthDate: "1989-07-20", birthTime: "12:00", expectedMonth: 6, expectedMonthName: "미월", description: "1989년 7월 중순 (미월)" },
    { birthDate: "1993-08-20", birthTime: "12:00", expectedMonth: 7, expectedMonthName: "신월", description: "1993년 8월 중순 (신월)" },
    { birthDate: "1998-09-20", birthTime: "12:00", expectedMonth: 8, expectedMonthName: "유월", description: "1998년 9월 중순 (유월)" },
    { birthDate: "2003-10-20", birthTime: "12:00", expectedMonth: 9, expectedMonthName: "술월", description: "2003년 10월 중순 (술월)" },
    { birthDate: "2008-11-20", birthTime: "12:00", expectedMonth: 10, expectedMonthName: "해월", description: "2008년 11월 중순 (해월)" },
    { birthDate: "2013-12-20", birthTime: "12:00", expectedMonth: 11, expectedMonthName: "자월", description: "2013년 12월 중순 (자월)" },
    { birthDate: "1900-01-10", birthTime: "12:00", expectedMonth: 12, expectedMonthName: "축월", description: "1900년 1월 (지원 범위 시작)" },
    { birthDate: "1900-02-10", birthTime: "12:00", expectedMonth: 1, expectedMonthName: "인월", description: "1900년 2월 (인월)" },
    { birthDate: "1900-12-25", birthTime: "12:00", expectedMonth: 11, expectedMonthName: "자월", description: "1900년 12월 (자월)" },
    { birthDate: "2030-01-10", birthTime: "12:00", expectedMonth: 12, expectedMonthName: "축월", description: "2030년 1월 (지원 범위 끝)" },
    { birthDate: "2030-02-10", birthTime: "12:00", expectedMonth: 1, expectedMonthName: "인월", description: "2030년 2월 (인월)" },
    { birthDate: "2030-12-25", birthTime: "12:00", expectedMonth: 11, expectedMonthName: "자월", description: "2030년 12월 (자월)" },
    { birthDate: "1905-03-15", birthTime: "10:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1905년 3월 (묘월)" },
    { birthDate: "1910-04-18", birthTime: "14:00", expectedMonth: 3, expectedMonthName: "진월", description: "1910년 4월 (진월)" },
    { birthDate: "1915-05-22", birthTime: "08:00", expectedMonth: 4, expectedMonthName: "사월", description: "1915년 5월 (사월)" },
    { birthDate: "1920-06-25", birthTime: "16:00", expectedMonth: 5, expectedMonthName: "오월", description: "1920년 6월 (오월)" },
    { birthDate: "1925-07-28", birthTime: "20:00", expectedMonth: 6, expectedMonthName: "미월", description: "1925년 7월 (미월)" },
    { birthDate: "1930-08-15", birthTime: "11:00", expectedMonth: 7, expectedMonthName: "신월", description: "1930년 8월 (신월)" },
    { birthDate: "1935-09-12", birthTime: "09:00", expectedMonth: 8, expectedMonthName: "유월", description: "1935년 9월 (유월)" },
    { birthDate: "1940-10-18", birthTime: "15:00", expectedMonth: 9, expectedMonthName: "술월", description: "1940년 10월 (술월)" },
    { birthDate: "1945-11-22", birthTime: "07:00", expectedMonth: 10, expectedMonthName: "해월", description: "1945년 11월 (해월)" },
    { birthDate: "1952-12-28", birthTime: "13:00", expectedMonth: 11, expectedMonthName: "자월", description: "1952년 12월 (자월)" },
    { birthDate: "1957-01-18", birthTime: "19:00", expectedMonth: 12, expectedMonthName: "축월", description: "1957년 1월 (축월)" },
    { birthDate: "1963-02-25", birthTime: "21:00", expectedMonth: 1, expectedMonthName: "인월", description: "1963년 2월 (인월)" },
    { birthDate: "1969-03-28", birthTime: "05:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1969년 3월 (묘월)" },
    { birthDate: "1974-04-22", birthTime: "17:00", expectedMonth: 3, expectedMonthName: "진월", description: "1974년 4월 (진월)" },
    { birthDate: "1981-05-18", birthTime: "23:00", expectedMonth: 4, expectedMonthName: "사월", description: "1981년 5월 (사월)" },
    { birthDate: "1986-06-28", birthTime: "03:00", expectedMonth: 5, expectedMonthName: "오월", description: "1986년 6월 (오월)" },
    { birthDate: "1991-07-15", birthTime: "10:30", expectedMonth: 6, expectedMonthName: "미월", description: "1991년 7월 (미월)" },
    { birthDate: "1996-08-25", birthTime: "14:45", expectedMonth: 7, expectedMonthName: "신월", description: "1996년 8월 (신월)" },
    { birthDate: "2001-09-18", birthTime: "08:15", expectedMonth: 8, expectedMonthName: "유월", description: "2001년 9월 (유월)" },
    { birthDate: "2006-10-22", birthTime: "16:30", expectedMonth: 9, expectedMonthName: "술월", description: "2006년 10월 (술월)" },
    { birthDate: "2011-11-15", birthTime: "20:00", expectedMonth: 10, expectedMonthName: "해월", description: "2011년 11월 (해월)" },
    { birthDate: "2016-12-18", birthTime: "11:30", expectedMonth: 11, expectedMonthName: "자월", description: "2016년 12월 (자월)" },
    { birthDate: "2018-01-08", birthTime: "09:00", expectedMonth: 12, expectedMonthName: "축월", description: "2018년 1월 (축월)" },
    { birthDate: "2019-02-15", birthTime: "14:00", expectedMonth: 1, expectedMonthName: "인월", description: "2019년 2월 (인월)" },
    { birthDate: "1948-02-04", birthTime: "23:00", expectedMonth: 12, expectedMonthName: "축월", description: "1948 입춘 직전 야간" },
    { birthDate: "1948-02-05", birthTime: "10:00", expectedMonth: 1, expectedMonthName: "인월", description: "1948 입춘 직후" },
    { birthDate: "1956-03-05", birthTime: "18:00", expectedMonth: 1, expectedMonthName: "인월", description: "1956 경칩 직전" },
    { birthDate: "1956-03-06", birthTime: "10:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1956 경칩 직후" },
    { birthDate: "1964-04-04", birthTime: "22:00", expectedMonth: 2, expectedMonthName: "묘월", description: "1964 청명 직전" },
    { birthDate: "1964-04-05", birthTime: "14:00", expectedMonth: 3, expectedMonthName: "진월", description: "1964 청명 직후" },
    { birthDate: "1976-05-05", birthTime: "04:00", expectedMonth: 3, expectedMonthName: "진월", description: "1976 입하 직전" },
    { birthDate: "1976-05-05", birthTime: "20:00", expectedMonth: 4, expectedMonthName: "사월", description: "1976 입하 직후" },
    { birthDate: "1987-06-05", birthTime: "16:00", expectedMonth: 4, expectedMonthName: "사월", description: "1987 망종 직전" },
    { birthDate: "1987-06-06", birthTime: "14:00", expectedMonth: 5, expectedMonthName: "오월", description: "1987 망종 직후" },
    { birthDate: "1999-07-07", birthTime: "02:00", expectedMonth: 5, expectedMonthName: "오월", description: "1999 소서 직전" },
    { birthDate: "1999-07-07", birthTime: "20:00", expectedMonth: 6, expectedMonthName: "미월", description: "1999 소서 직후" },
    { birthDate: "2002-08-07", birthTime: "18:00", expectedMonth: 6, expectedMonthName: "미월", description: "2002 입추 직전" },
    { birthDate: "2002-08-08", birthTime: "12:00", expectedMonth: 7, expectedMonthName: "신월", description: "2002 입추 직후" },
    { birthDate: "2007-09-07", birthTime: "20:00", expectedMonth: 7, expectedMonthName: "신월", description: "2007 백로 직전" },
    { birthDate: "2007-09-08", birthTime: "18:00", expectedMonth: 8, expectedMonthName: "유월", description: "2007 백로 직후" },
    { birthDate: "2012-10-07", birthTime: "20:00", expectedMonth: 8, expectedMonthName: "유월", description: "2012 한로 직전" },
    { birthDate: "2012-10-08", birthTime: "14:00", expectedMonth: 9, expectedMonthName: "술월", description: "2012 한로 직후" },
    { birthDate: "2017-11-07", birthTime: "06:00", expectedMonth: 9, expectedMonthName: "술월", description: "2017 입동 직전" },
    { birthDate: "2017-11-07", birthTime: "20:00", expectedMonth: 10, expectedMonthName: "해월", description: "2017 입동 직후" }
  ];

  const results: QAResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const birthDate = new Date(tc.birthDate);
    const [hour, minute] = tc.birthTime.split(':').map(Number);

    const solarTermInfo = findSolarTermInfo(birthDate, hour, minute);
    const actualMonth = solarTermInfo.month;

    const monthNames: Record<number, string> = {
      1: "인월", 2: "묘월", 3: "진월", 4: "사월", 5: "오월", 6: "미월",
      7: "신월", 8: "유월", 9: "술월", 10: "해월", 11: "자월", 12: "축월"
    };

    const actualMonthName = monthNames[actualMonth] || `${actualMonth}월`;
    const isPassed = actualMonth === tc.expectedMonth;

    if (isPassed) {
      passed++;
    } else {
      failed++;
    }

    results.push({
      testCase: tc,
      actualMonth,
      actualMonthName,
      passed: isPassed,
      details: isPassed
        ? `OK: ${tc.description}`
        : `FAIL: ${tc.description} - 예상 ${tc.expectedMonth}(${tc.expectedMonthName}), 실제 ${actualMonth}(${actualMonthName})`
    });
  }

  return { passed, failed, total: testCases.length, results };
}

// ========== 만세력 계산 상수 ==========
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];

// 기준일: 1900-01-01 (신미일, 辛未日) - Julian Day Number 기반 정확한 계산
// 검증: 1990년 1월 3일 = 을축(乙丑)일 (한국천문연구원 만세력 기준)
const BASE_JD = 2415021; // 1900년 1월 1일의 Julian Day Number
const BASE_YEAR_STEM = 6;
const BASE_YEAR_BRANCH = 0;
const BASE_DAY_STEM = 0; // 갑(甲) - 1900-01-01 기준
const BASE_DAY_BRANCH = 10; // 술(戌) - 1900-01-01 기준

// 그레고리력 → Julian Day Number 변환 (Fliegel-Van Flandern 알고리즘)
function dateToJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getDaysBetweenJD(year: number, month: number, day: number): number {
  const targetJD = dateToJulianDayNumber(year, month, day);
  return targetJD - BASE_JD;
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

function parseTimeToHour(timeStr: string | null): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const raw = timeStr.trim();

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
  for (const [siJinName, time] of Object.entries(siJinTimes)) {
    if (raw.includes(siJinName)) {
      console.log(`Parsed siJin name "${siJinName}" → ${time.hour}:${String(time.minute).padStart(2, "0")}`);
      return time;
    }
  }

  // 범위 형식인 경우 (HH:mm~HH:mm 또는 HH:mm-HH:mm)
  const rangeMatch = raw.match(/(\d{1,2}):(\d{2})\s*[~\-–—]\s*(\d{1,2}):(\d{2})/);
  if (rangeMatch) {
    const startH = Number(rangeMatch[1]);
    const startM = Number(rangeMatch[2]);
    const endH = Number(rangeMatch[3]);
    const endM = Number(rangeMatch[4]);

    // 자시 범위(23:30~01:29)인 경우 특별 처리
    if (startH === 23 && endH < 12) {
      console.log(`Parsed 자시 range "${raw}" → 0:30`);
      return { hour: 0, minute: 30 };
    } else {
      // 일반 범위: 중간값 계산
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const midMinutes = Math.floor((startMinutes + endMinutes) / 2);
      const resultHour = Math.floor(midMinutes / 60);
      const resultMinute = midMinutes % 60;
      console.log(`Parsed time range "${raw}" → ${resultHour}:${String(resultMinute).padStart(2, "0")}`);
      return { hour: resultHour, minute: resultMinute };
    }
  }

  // 단일 시간 형식 (HH:mm)
  const singleMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (singleMatch) {
    const h = Number(singleMatch[1]);
    const m = Number(singleMatch[2]);
    if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      console.log(`Parsed single time "${raw}" → ${h}:${String(m).padStart(2, "0")}`);
      return { hour: h, minute: m };
    }
  }

  return null;
}

interface CalculationProof {
  engineVersion: string;
  solarTermDataVersion: string;
  decisionLog: Record<string, string>;
  references: {
    ipchunAt: string | null;
    monthTermStart: string | null;
    monthTermEnd: string | null;
    baseEpoch: string;
  };
}

function calculateSaju(birthDate: Date, birthHour: number | null, birthMinute: number = 0): {
  pillars: {
    year: { stem: number; branch: number };
    month: { stem: number; branch: number };
    day: { stem: number; branch: number };
    hour: { stem: number; branch: number } | null;
  };
  proof: CalculationProof;
} {
  const originalYear = birthDate.getFullYear();
  const originalMonth = birthDate.getMonth() + 1;
  const originalDay = birthDate.getDate();
  const effectiveHour = birthHour ?? 12;
  const effectiveMinute = birthMinute;

  const decisionLog: Record<string, string> = {};

  // ========== 시간 보정 적용 (DST + 표준시 30분) ==========
  const corrected = applyTimeCorrections(
    originalYear,
    originalMonth,
    originalDay,
    effectiveHour,
    effectiveMinute
  );

  corrected.correctionLog.forEach((log, idx) => {
    const [key, ...valueParts] = log.split(':');
    decisionLog[`time_correction_${idx}`] = valueParts.join(':').trim();
  });

  const correctedBirthDate = new Date(corrected.year, corrected.month - 1, corrected.day);

  // 입춘 기준 연주 결정
  const terms = SOLAR_TERMS_DATA[corrected.year];
  const ipchunTerm = terms?.find(t => t.name === "입춘");
  let ipchunAt: string | null = null;

  let yearForCalc = corrected.year;
  if (ipchunTerm) {
    const [tYear, tMonth, tDay] = ipchunTerm.date.split('-').map(Number);
    const [tHour, tMin] = ipchunTerm.time.split(':').map(Number);
    const ipchunTimestamp = new Date(tYear, tMonth - 1, tDay, tHour, tMin).getTime();
    ipchunAt = `${ipchunTerm.date} ${ipchunTerm.time} KST`;

    const birthTimestamp = new Date(
      corrected.year,
      corrected.month - 1,
      corrected.day,
      corrected.hour,
      corrected.minute
    ).getTime();

    if (birthTimestamp < ipchunTimestamp) {
      yearForCalc = corrected.year - 1;
      decisionLog["year_boundary"] = `입춘(${ipchunAt}) 전 출생 → ${corrected.year - 1}년 간지 적용`;
    } else {
      decisionLog["year_boundary"] = `입춘(${ipchunAt}) 후 출생 → ${corrected.year}년 간지 적용`;
    }
  }

  const yearDiff = yearForCalc - 1900;
  const yearStemIndex = ((BASE_YEAR_STEM + yearDiff) % 10 + 10) % 10;
  const yearBranchIndex = ((BASE_YEAR_BRANCH + yearDiff) % 12 + 12) % 12;

  // 절기 기준 월주 결정
  const solarTermInfo = findSolarTermInfo(correctedBirthDate, corrected.hour, corrected.minute);
  const monthBranchIndex = (solarTermInfo.month + 1) % 12;
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthStemIndex = (monthStemStart + solarTermInfo.month - 1) % 10;

  decisionLog["month_boundary"] = `절기(${solarTermInfo.termName}) 기준 → ${solarTermInfo.month}월(${EARTHLY_BRANCHES[monthBranchIndex]}월)`;

  // 일주 계산 (보정 후 23:00 이후 다음날)
  let dayYear = corrected.year;
  let dayMonth = corrected.month;
  let dayDay = corrected.day;

  if (corrected.hour >= 23) {
    const nextDay = new Date(corrected.year, corrected.month - 1, corrected.day + 1);
    dayYear = nextDay.getFullYear();
    dayMonth = nextDay.getMonth() + 1;
    dayDay = nextDay.getDate();
    decisionLog["day_boundary"] = `보정 후 ${corrected.hour}시 (23시 이후) → 다음날(${dayYear}-${String(dayMonth).padStart(2, '0')}-${String(dayDay).padStart(2, '0')}) 일주 적용`;
  } else {
    decisionLog["day_boundary"] = `보정 후 ${corrected.hour}시 (23시 전) → 당일 일주 적용`;
  }

  const days = getDaysBetweenJD(dayYear, dayMonth, dayDay);
  const dayStemIndex = ((BASE_DAY_STEM + days) % 10 + 10) % 10;
  const dayBranchIndex = ((BASE_DAY_BRANCH + days) % 12 + 12) % 12;

  // 시주 계산 (보정된 시간 기준)
  let hourPillar: { stem: number; branch: number } | null = null;
  if (birthHour !== null) {
    const hourBranchIndex = getHourBranch(corrected.hour);
    const hourStemStart = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8][dayStemIndex];
    const hourStemIndex = (hourStemStart + hourBranchIndex) % 10;
    hourPillar = { stem: hourStemIndex, branch: hourBranchIndex };
    decisionLog["hour_pillar"] = `보정 후 ${corrected.hour}시 → ${HEAVENLY_STEMS[hourStemIndex]}${EARTHLY_BRANCHES[hourBranchIndex]}시`;
  } else {
    decisionLog["hour_pillar"] = "시간 미입력 → 시주 미산출";
  }

  return {
    pillars: {
      year: { stem: yearStemIndex, branch: yearBranchIndex },
      month: { stem: monthStemIndex, branch: monthBranchIndex },
      day: { stem: dayStemIndex, branch: dayBranchIndex },
      hour: hourPillar
    },
    proof: {
      engineVersion: ENGINE_VERSION,
      solarTermDataVersion: SOLAR_TERM_DATA_VERSION,
      decisionLog,
      references: {
        ipchunAt,
        monthTermStart: solarTermInfo.termStart,
        monthTermEnd: solarTermInfo.termEnd,
        baseEpoch: "1900-01-01 (신미일, JD 2415021)"
      }
    }
  };
}

function getPillarString(stem: number, branch: number): string {
  return `${HEAVENLY_STEMS[stem]}${EARTHLY_BRANCHES[branch]}(${STEMS_HANJA[stem]}${BRANCHES_HANJA[branch]})`;
}

function countElements(pillars: ReturnType<typeof calculateSaju>["pillars"]): Record<ElementType, number> {
  const counts: Record<ElementType, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };

  counts[STEMS_ELEMENTS[pillars.year.stem] as ElementType]++;
  counts[STEMS_ELEMENTS[pillars.month.stem] as ElementType]++;
  counts[STEMS_ELEMENTS[pillars.day.stem] as ElementType]++;
  if (pillars.hour) counts[STEMS_ELEMENTS[pillars.hour.stem] as ElementType]++;

  counts[BRANCHES_ELEMENTS[pillars.year.branch] as ElementType]++;
  counts[BRANCHES_ELEMENTS[pillars.month.branch] as ElementType]++;
  counts[BRANCHES_ELEMENTS[pillars.day.branch] as ElementType]++;
  if (pillars.hour) counts[BRANCHES_ELEMENTS[pillars.hour.branch] as ElementType]++;

  return counts;
}

// ========== 십신 계산 ==========
function getTenGod(dayStem: number, targetStem: number): number {
  const dayElement = Math.floor(dayStem / 2);
  const targetElement = Math.floor(targetStem / 2);
  const dayYinYang = dayStem % 2;
  const targetYinYang = targetStem % 2;

  const elementDiff = (targetElement - dayElement + 5) % 5;
  const sameYinYang = dayYinYang === targetYinYang;

  return elementDiff * 2 + (sameYinYang ? 0 : 1);
}

// ========== 일간 강약 ==========
function getDayMasterStrength(pillars: ReturnType<typeof calculateSaju>["pillars"], elementCounts: Record<ElementType, number>): string {
  const dayElement = STEMS_ELEMENTS[pillars.day.stem] as ElementType;
  const generatedBy: Record<ElementType, ElementType> = { "목": "수", "화": "목", "토": "화", "금": "토", "수": "금" };

  const selfCount = elementCounts[dayElement];
  const supportCount = elementCounts[generatedBy[dayElement]];
  const totalSupport = selfCount + supportCount;
  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);

  if (totalSupport > total / 2 + 1) return "신강";
  if (totalSupport < total / 2 - 1) return "신약";
  return "중화";
}

// ========== 용신/희신/기신 (억부 + 조후 병행) ==========
interface YongsinResult {
  yongsin: ElementType;
  huisin: ElementType;
  gisin: ElementType;
  method: "억부" | "조후" | "조후+억부";
  reasoning: string;
}

function getYongsin(
  dayElement: ElementType,
  strength: string,
  monthBranch: number
): YongsinResult {
  const generating: Record<ElementType, ElementType> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };
  const controlling: Record<ElementType, ElementType> = { "목": "토", "화": "금", "토": "수", "금": "목", "수": "화" };
  const generatedBy: Record<ElementType, ElementType> = { "목": "수", "화": "목", "토": "화", "금": "토", "수": "금" };

  // 월지로 계절 판단 (조후 용신용)
  const winterBranches = [0, 1, 11]; // 자, 축, 해
  const summerBranches = [5, 6, 7];  // 사, 오, 미

  const isWinter = winterBranches.includes(monthBranch);
  const isSummer = summerBranches.includes(monthBranch);

  if (isWinter) {
    return {
      yongsin: "화",
      huisin: "금",
      gisin: "수",
      method: "조후+억부",
      reasoning: `겨울(${EARTHLY_BRANCHES[monthBranch]}월) 출생으로 한습하므로 화(火)로 온기 보충, 금(金)은 토와 수 사이의 통관 역할`
    };
  }

  if (isSummer) {
    return {
      yongsin: "수",
      huisin: "금",
      gisin: "화",
      method: "조후+억부",
      reasoning: `여름(${EARTHLY_BRANCHES[monthBranch]}월) 출생으로 조열하므로 수(水)로 열기 조절, 금(金)은 수를 생조`
    };
  }

  if (strength === "신강") {
    return {
      yongsin: generating[dayElement],
      huisin: generating[generating[dayElement]],
      gisin: dayElement,
      method: "억부",
      reasoning: `${strength}하므로 ${generating[dayElement]}(식상)으로 설기, ${generating[generating[dayElement]]}(재성)이 보조`
    };
  } else if (strength === "신약") {
    return {
      yongsin: generatedBy[dayElement],
      huisin: dayElement,
      gisin: controlling[dayElement],
      method: "억부",
      reasoning: `${strength}하므로 ${generatedBy[dayElement]}(인성)으로 생조, ${dayElement}(비겁)이 보조`
    };
  }

  return {
    yongsin: generatedBy[dayElement],
    huisin: dayElement,
    gisin: controlling[dayElement],
    method: "억부",
    reasoning: `${strength}으로 균형 잡혀 있으나, ${generatedBy[dayElement]}(인성)이 안정에 도움`
  };
}

// ========== 격국 (월지 지장간 정기 기준) ==========
const MONTH_BRANCH_MAIN_QI: Record<number, number> = {
  0: 9,   // 자(子) → 계(癸水)
  1: 5,   // 축(丑) → 기(己土)
  2: 0,   // 인(寅) → 갑(甲木)
  3: 1,   // 묘(卯) → 을(乙木)
  4: 4,   // 진(辰) → 무(戊土)
  5: 2,   // 사(巳) → 병(丙火)
  6: 3,   // 오(午) → 정(丁火)
  7: 5,   // 미(未) → 기(己土)
  8: 6,   // 신(申) → 경(庚金)
  9: 7,   // 유(酉) → 신(辛金)
  10: 4,  // 술(戌) → 무(戊土)
  11: 8   // 해(亥) → 임(壬水)
};

interface StructureResult {
  name: string;
  tenGod: string;
  tenGodHanja: string;
  reasoning: string;
}

function getStructureType(pillars: ReturnType<typeof calculateSaju>["pillars"]): StructureResult {
  const monthBranch = pillars.month.branch;
  const dayStem = pillars.day.stem;

  const mainQiStem = MONTH_BRANCH_MAIN_QI[monthBranch];
  const tenGodIndex = getTenGod(dayStem, mainQiStem);
  const tenGodName = TEN_GODS[tenGodIndex];
  const tenGodHanja = TEN_GODS_HANJA[tenGodIndex];
  const structureName = tenGodName + "격";

  return {
    name: structureName,
    tenGod: tenGodName,
    tenGodHanja: tenGodHanja,
    reasoning: `월지 ${EARTHLY_BRANCHES[monthBranch]}(${BRANCHES_HANJA[monthBranch]})의 정기는 ${HEAVENLY_STEMS[mainQiStem]}(${STEMS_HANJA[mainQiStem]}), 일간 ${HEAVENLY_STEMS[dayStem]}(${STEMS_HANJA[dayStem]}) 기준 ${tenGodName}(${tenGodHanja}) 관계`
  };
}

// ========== 개인별 분석 정보 생성 ==========
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

function analyzePersonSaju(pillars: ReturnType<typeof calculateSaju>["pillars"]): PersonAnalysis {
  const elementCounts = countElements(pillars);
  const strength = getDayMasterStrength(pillars, elementCounts);
  const dayElement = STEMS_ELEMENTS[pillars.day.stem] as ElementType;
  const structure = getStructureType(pillars);
  const yongsin = getYongsin(dayElement, strength, pillars.month.branch);

  return {
    dayMaster: {
      stem: HEAVENLY_STEMS[pillars.day.stem],
      stemHanja: STEMS_HANJA[pillars.day.stem],
      element: dayElement,
      yinYang: STEMS_YINYANG[pillars.day.stem],
      strength
    },
    structure,
    yongsin,
    elementCounts
  };
}

// 오행 상생상극 관계
const ELEMENT_RELATIONS = {
  generating: { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" } as Record<ElementType, ElementType>,
  controlling: { "목": "토", "화": "금", "토": "수", "금": "목", "수": "화" } as Record<ElementType, ElementType>,
};

function calculateCompatibilityScore(pillars1: ReturnType<typeof calculateSaju>["pillars"], pillars2: ReturnType<typeof calculateSaju>["pillars"]): {
  overall: number;
  love: number;
  communication: number;
  values: number;
  lifestyle: number;
} {
  const elem1 = countElements(pillars1);
  const elem2 = countElements(pillars2);

  const day1 = STEMS_ELEMENTS[pillars1.day.stem] as ElementType;
  const day2 = STEMS_ELEMENTS[pillars2.day.stem] as ElementType;

  let baseScore = 70;

  if (ELEMENT_RELATIONS.generating[day1] === day2 || ELEMENT_RELATIONS.generating[day2] === day1) {
    baseScore += 15;
  } else if (day1 === day2) {
    baseScore += 10;
  } else if (ELEMENT_RELATIONS.controlling[day1] === day2 || ELEMENT_RELATIONS.controlling[day2] === day1) {
    baseScore -= 10;
  }

  let complementScore = 0;
  const elements: ElementType[] = ["목", "화", "토", "금", "수"];
  for (const elem of elements) {
    if (elem1[elem] === 0 && elem2[elem] >= 2) complementScore += 3;
    if (elem2[elem] === 0 && elem1[elem] >= 2) complementScore += 3;
  }

  const branch1 = pillars1.day.branch;
  const branch2 = pillars2.day.branch;

  const sixCombinations = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  let hasSixCombination = false;
  for (const [a, b] of sixCombinations) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      hasSixCombination = true;
      break;
    }
  }
  if (hasSixCombination) baseScore += 10;

  const isClash = Math.abs(branch1 - branch2) === 6;
  if (isClash) baseScore -= 8;

  const overall = Math.min(100, Math.max(50, baseScore + complementScore));

  const randomVariance = () => Math.floor(Math.random() * 10) - 5;

  return {
    overall,
    love: Math.min(100, Math.max(50, overall + randomVariance() + (hasSixCombination ? 5 : 0))),
    communication: Math.min(100, Math.max(50, overall + randomVariance() - (isClash ? 5 : 0))),
    values: Math.min(100, Math.max(50, overall + randomVariance() + (day1 === day2 ? 5 : 0))),
    lifestyle: Math.min(100, Math.max(50, overall + randomVariance() + Math.floor(complementScore / 2))),
  };
}

// 2026년 세운 정보 계산
function getYearlyFortuneInfo(): {
  year: number;
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  pillar: string;
  animal: string;
  element: string;
} {
  // 한국 시간 기준으로 현재 연도 계산
  const koreaTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentYear = koreaTime.getUTCFullYear();

  const yearDiff = currentYear - 1900;
  const stemIndex = ((6 + yearDiff) % 10 + 10) % 10;
  const branchIndex = ((yearDiff) % 12 + 12) % 12;

  const ZODIAC_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

  return {
    year: currentYear,
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    stemHanja: STEMS_HANJA[stemIndex],
    branchHanja: BRANCHES_HANJA[branchIndex],
    pillar: `${HEAVENLY_STEMS[stemIndex]}${EARTHLY_BRANCHES[branchIndex]}`,
    animal: ZODIAC_ANIMALS[branchIndex],
    element: STEMS_ELEMENTS[stemIndex]
  };
}

interface PersonInfo {
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string | null;
  calendarType?: string;
}

interface ConvertedPerson {
  name: string;
  gender: string;
  solarDate: Date;
  birthTime: string | null;
  calendarType: string;
  lunarConversionLog: string | null;
}

function convertPersonToSolar(person: PersonInfo): ConvertedPerson {
  const inputParts = person.birthDate.split("-");
  const inputYear = parseInt(inputParts[0], 10);
  const inputMonth = parseInt(inputParts[1], 10);
  const inputDay = parseInt(inputParts[2], 10);

  let solarYear = inputYear;
  let solarMonth = inputMonth;
  let solarDay = inputDay;
  let lunarConversionLog: string | null = null;

  if (person.calendarType === "lunar") {
    const solarResult = lunarToSolar(inputYear, inputMonth, inputDay, false);
    if (solarResult.isValid) {
      solarYear = solarResult.year;
      solarMonth = solarResult.month;
      solarDay = solarResult.day;
      lunarConversionLog = `음력 ${inputYear}년 ${inputMonth}월 ${inputDay}일 → 양력 ${solarYear}년 ${solarMonth}월 ${solarDay}일`;
    }
  }

  return {
    name: person.name,
    gender: person.gender,
    solarDate: new Date(Date.UTC(solarYear, solarMonth - 1, solarDay, 12, 0, 0)),
    birthTime: person.birthTime,
    calendarType: person.calendarType || "solar",
    lunarConversionLog
  };
}

function generateCompatibilityContext(person1: PersonInfo, person2: PersonInfo, relationType: string): {
  context: string;
  proof1: CalculationProof;
  proof2: CalculationProof;
} {
  // 음력 → 양력 변환 적용
  const converted1 = convertPersonToSolar(person1);
  const converted2 = convertPersonToSolar(person2);

  console.log("Person 1 solar date:", converted1.solarDate, converted1.lunarConversionLog || "양력");
  console.log("Person 2 solar date:", converted2.solarDate, converted2.lunarConversionLog || "양력");

  const birthDate1 = converted1.solarDate;
  const birthDate2 = converted2.solarDate;
  const time1 = parseTimeToHour(converted1.birthTime);
  const time2 = parseTimeToHour(converted2.birthTime);

  const saju1 = calculateSaju(birthDate1, time1?.hour ?? null, time1?.minute ?? 0);
  const saju2 = calculateSaju(birthDate2, time2?.hour ?? null, time2?.minute ?? 0);
  const scores = calculateCompatibilityScore(saju1.pillars, saju2.pillars);

  // 개인별 분석 정보 생성 (격국/용신 포함)
  const analysis1 = analyzePersonSaju(saju1.pillars);
  const analysis2 = analyzePersonSaju(saju2.pillars);

  const relationLabels: Record<string, string> = {
    lover: "연인",
    friend: "친구",
    family: "가족",
    business: "비즈니스",
  };

  const branch1 = saju1.pillars.day.branch;
  const branch2 = saju2.pillars.day.branch;
  const sixCombinations = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  let hasSixCombination = false;
  for (const [a, b] of sixCombinations) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      hasSixCombination = true;
      break;
    }
  }
  const isClash = Math.abs(branch1 - branch2) === 6;

  const branchRelations = hasSixCombination ? "육합(六合) 관계 - 조화롭게 맞물리는 인연" :
    isClash ? "충(沖) 관계 - 긴장과 자극이 있는 관계" : "중립적 관계";

  const context = JSON.stringify({
    relationship_type: relationLabels[relationType] || relationType,
    person_a: {
      name: person1.name,
      gender: person1.gender === 'male' ? '남성' : '여성',
      calendar: converted1.calendarType === "lunar" ? "음력" : "양력",
      original_birth_date: person1.birthDate,
      solar_birth_date: `${birthDate1.getUTCFullYear()}-${String(birthDate1.getUTCMonth() + 1).padStart(2, '0')}-${String(birthDate1.getUTCDate()).padStart(2, '0')}`,
      birth_time: person1.birthTime || null,
      birthplace: null,
      timezone: "Asia/Seoul",
      lunar_conversion: converted1.lunarConversionLog,
      notes: time1 === null ? "출생시간 미입력" : null
    },
    person_b: {
      name: person2.name,
      gender: person2.gender === 'male' ? '남성' : '여성',
      calendar: converted2.calendarType === "lunar" ? "음력" : "양력",
      original_birth_date: person2.birthDate,
      solar_birth_date: `${birthDate2.getUTCFullYear()}-${String(birthDate2.getUTCMonth() + 1).padStart(2, '0')}-${String(birthDate2.getUTCDate()).padStart(2, '0')}`,
      birth_time: person2.birthTime || null,
      birthplace: null,
      timezone: "Asia/Seoul",
      lunar_conversion: converted2.lunarConversionLog,
      notes: time2 === null ? "출생시간 미입력" : null
    },
    provided_chart_optional: {
      a_bazi: {
        year: getPillarString(saju1.pillars.year.stem, saju1.pillars.year.branch),
        month: getPillarString(saju1.pillars.month.stem, saju1.pillars.month.branch),
        day: getPillarString(saju1.pillars.day.stem, saju1.pillars.day.branch),
        hour: saju1.pillars.hour ? getPillarString(saju1.pillars.hour.stem, saju1.pillars.hour.branch) : null
      },
      b_bazi: {
        year: getPillarString(saju2.pillars.year.stem, saju2.pillars.year.branch),
        month: getPillarString(saju2.pillars.month.stem, saju2.pillars.month.branch),
        day: getPillarString(saju2.pillars.day.stem, saju2.pillars.day.branch),
        hour: saju2.pillars.hour ? getPillarString(saju2.pillars.hour.stem, saju2.pillars.hour.branch) : null
      },
      five_elements_summary: `A(${person1.name}): 목${analysis1.elementCounts["목"]} 화${analysis1.elementCounts["화"]} 토${analysis1.elementCounts["토"]} 금${analysis1.elementCounts["금"]} 수${analysis1.elementCounts["수"]} / B(${person2.name}): 목${analysis2.elementCounts["목"]} 화${analysis2.elementCounts["화"]} 토${analysis2.elementCounts["토"]} 금${analysis2.elementCounts["금"]} 수${analysis2.elementCounts["수"]}`,
      branch_relations: branchRelations
    },
    // 개인별 격국/용신 분석 정보
    person_a_analysis: {
      day_master: analysis1.dayMaster,
      structure: {
        name: analysis1.structure.name,
        tenGod: analysis1.structure.tenGod,
        tenGodHanja: analysis1.structure.tenGodHanja,
        reasoning: analysis1.structure.reasoning
      },
      yongsin: {
        element: analysis1.yongsin.yongsin,
        huisin: analysis1.yongsin.huisin,
        gisin: analysis1.yongsin.gisin,
        method: analysis1.yongsin.method,
        reasoning: analysis1.yongsin.reasoning
      }
    },
    person_b_analysis: {
      day_master: analysis2.dayMaster,
      structure: {
        name: analysis2.structure.name,
        tenGod: analysis2.structure.tenGod,
        tenGodHanja: analysis2.structure.tenGodHanja,
        reasoning: analysis2.structure.reasoning
      },
      yongsin: {
        element: analysis2.yongsin.yongsin,
        huisin: analysis2.yongsin.huisin,
        gisin: analysis2.yongsin.gisin,
        method: analysis2.yongsin.method,
        reasoning: analysis2.yongsin.reasoning
      }
    },
    calculated_scores: {
      overall: scores.overall,
      love: scores.love,
      communication: scores.communication,
      values: scores.values,
      lifestyle: scores.lifestyle
    },
    // 2026년 세운 정보 추가
    yearly_fortune: (() => {
      const fortune = getYearlyFortuneInfo();
      return {
        year: fortune.year,
        pillar: fortune.pillar,
        pillarHanja: `${fortune.stemHanja}${fortune.branchHanja}`,
        animal: fortune.animal,
        element: fortune.element,
        description: `${fortune.year}년은 ${fortune.pillar}년(${fortune.stemHanja}${fortune.branchHanja}), ${fortune.animal}띠 해입니다.`
      };
    })(),
    output_options: {
      verbosity: "detailed",
      include_scores: true,
      include_action_plan: true,
      include_yearly_fortune: true
    }
  }, null, 2);

  return { context, proof1: saju1.proof, proof2: saju2.proof };
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
    const url = new URL(req.url);

    // QA 테스트 엔드포인트
    if (url.pathname.endsWith('/qa') || url.searchParams.get('qa') === 'true') {
      console.log("Running QA tests for month pillar calculation...");
      const qaResult = runMonthPillarQA();
      console.log(`QA Results: ${qaResult.passed}/${qaResult.total} passed, ${qaResult.failed} failed`);

      return new Response(JSON.stringify({
        summary: {
          total: qaResult.total,
          passed: qaResult.passed,
          failed: qaResult.failed,
          passRate: `${((qaResult.passed / qaResult.total) * 100).toFixed(1)}%`
        },
        engineVersion: ENGINE_VERSION,
        solarTermDataVersion: SOLAR_TERM_DATA_VERSION,
        supportedYearRange: "1900-2030",
        failedTests: qaResult.results.filter(r => !r.passed),
        allResults: qaResult.results
      }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { person1, person2, relationType } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("Gemini");
    const GPT_API_KEY = Deno.env.get("GPT");

    if (!GEMINI_API_KEY && !GPT_API_KEY) {
      console.error("No AI API keys configured");
      throw new Error("AI service is not configured");
    }

    console.log("Analyzing compatibility for:", person1.name, "and", person2.name);

    const { context: compatibilityContext, proof1, proof2 } = generateCompatibilityContext(person1, person2, relationType);

    // DB에서 활성 프롬프트 조회 (없으면 기본 프롬프트 사용)
    const systemPrompt = await getActivePrompt("compatibility-analysis", "system_prompt", COMPATIBILITY_SYSTEM_PROMPT);

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
              parts: [{ text: systemPrompt + "\n\n" + compatibilityContext }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
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
            { role: "system", content: systemPrompt + "\n\n응답은 반드시 JSON 형식으로 제공해주세요." },
            { role: "user", content: compatibilityContext },
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
    try {
      if (GEMINI_API_KEY) {
        rawContent = await callGeminiAPI();
      } else {
        rawContent = await callGPTAPI();
      }
    } catch (primaryError) {
      console.error("Primary API failed:", primaryError);
      if (GPT_API_KEY) {
        try {
          rawContent = await callGPTAPI();
        } catch (geminiError) {
          console.error("Fallback Gemini also failed:", geminiError);
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

    console.log("AI response received, parsing JSON...");

    // JSON 추출 함수: 중첩 괄호를 올바르게 처리
    function extractJSON(text: string): string | null {
      const startIndex = text.indexOf('{');
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

        if (char === '\\' && inString) {
          escape = true;
          continue;
        }

        if (char === '"' && !escape) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') depth++;
          else if (char === '}') {
            depth--;
            if (depth === 0) {
              return text.substring(startIndex, i + 1);
            }
          }
        }
      }
      return null;
    }

    // JSON 파싱 시도
    let analysisResult;
    try {
      analysisResult = JSON.parse(rawContent);
    } catch {
      console.log("Direct JSON parse failed, attempting bracket-aware extraction...");
      const extractedJson = extractJSON(rawContent);
      if (extractedJson) {
        try {
          analysisResult = JSON.parse(extractedJson);
          console.log("JSON extraction successful");
        } catch (innerError) {
          console.error("JSON extraction also failed:", innerError);
          console.error("Extracted content length:", extractedJson.length);
          throw new Error("AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
        }
      } else {
        throw new Error("AI 응답에서 결과를 찾을 수 없습니다.");
      }
    }

    // GPT 응답에 계산 근거(proof) 병합
    const finalResult = {
      ...analysisResult,
      calculationProof: {
        engineVersion: proof1.engineVersion,
        solarTermDataVersion: proof1.solarTermDataVersion,
        personA: {
          decisionLog: proof1.decisionLog,
          references: proof1.references
        },
        personB: {
          decisionLog: proof2.decisionLog,
          references: proof2.references
        }
      }
    };

    console.log("Compatibility analysis completed");

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("compatibility-analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
