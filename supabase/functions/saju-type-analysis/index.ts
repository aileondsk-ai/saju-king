import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========== 만세력 계산 엔진 (saju-analysis와 100% 동일) ==========
const ENGINE_VERSION = "3.2.0";

// ========== 기본 상수 ==========
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

type ElementType = "목" | "화" | "토" | "금" | "수";

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

// ========== 24절기 계산 ==========
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

    const diffStart = angleDiff(solarLongitude(jd1), termAngle);
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

  const dayResult = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const yearResult = month > 2 ? C - 4716 : C - 4715;

  const totalHours = F * 24;
  const hour = Math.floor(totalHours);
  const minute = Math.floor((totalHours - hour) * 60);

  const utcDate = new Date(Date.UTC(yearResult, month - 1, dayResult, hour, minute));
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

// ========== 만세력 계산 상수 ==========
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
const BASE_JD = 2415021;
const BASE_YEAR_STEM = 6;
const BASE_YEAR_BRANCH = 0;
const BASE_DAY_STEM = 0;
const BASE_DAY_BRANCH = 10; // 1900-01-01 = 갑술일

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

  const ipchun = currentYearTerms.find((t) => t.name === "입춘");
  if (ipchun) {
    const ipchunTimestamp = dateToTimestamp(ipchun.date, ipchun.time);
    if (birthTimestamp < ipchunTimestamp) {
      yearAdjust = -1;
      decisionLog.push(`year_boundary: 입춘(${ipchun.date} ${ipchun.time}) 이전 → 전년 귀속`);
    }
  }

  for (let i = 0; i < allJeolTerms.length; i++) {
    const term = allJeolTerms[i];
    const termTimestamp = dateToTimestamp(term.date, term.time);

    if (birthTimestamp >= termTimestamp) {
      currentMonth = term.month;
      currentTerm = term;
      if (i + 1 < allJeolTerms.length) {
        nextTerm = allJeolTerms[i + 1];
      }
      const hourMs = 60 * 60 * 1000;
      if (Math.abs(birthTimestamp - termTimestamp) <= hourMs) {
        isTermBoundary = true;
      }
    } else {
      break;
    }
  }

  return {
    month: currentMonth,
    term: currentTerm,
    nextTerm,
    isTermBoundary,
    yearAdjust,
    decisionLog,
  };
}

// ========== 시주 계산 ==========
function getHourBranch(hour: number): number {
  if (hour >= 23 || hour < 1) return 0;      // 자시
  if (hour >= 1 && hour < 3) return 1;       // 축시
  if (hour >= 3 && hour < 5) return 2;       // 인시
  if (hour >= 5 && hour < 7) return 3;       // 묘시
  if (hour >= 7 && hour < 9) return 4;       // 진시
  if (hour >= 9 && hour < 11) return 5;      // 사시
  if (hour >= 11 && hour < 13) return 6;     // 오시
  if (hour >= 13 && hour < 15) return 7;     // 미시
  if (hour >= 15 && hour < 17) return 8;     // 신시
  if (hour >= 17 && hour < 19) return 9;     // 유시
  if (hour >= 19 && hour < 21) return 10;    // 술시
  return 11;                                  // 해시
}

// ========== 일주 계산 ==========
function getAdjustedDateFromCorrected(
  correctedYear: number,
  correctedMonth: number,
  correctedDay: number,
  correctedHour: number,
): { adjustedYear: number; adjustedMonth: number; adjustedDay: number; dayChange: boolean } {
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

function calculateSaju(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number | null,
  birthMinute: number = 0,
): SajuPillars {
  const effectiveHour = birthHour ?? 12;
  const effectiveMinute = birthMinute;

  // 시간 보정 (DST + KST 30분)
  const corrected = applyTimeCorrections(birthYear, birthMonth, birthDay, effectiveHour, effectiveMinute);
  const correctedBirthDate = new Date(corrected.year, corrected.month - 1, corrected.day);

  // 절기 정보
  const solarTermInfo = findSolarTermInfo(correctedBirthDate, corrected.hour, corrected.minute);

  // 일주 계산
  const { adjustedYear, adjustedMonth, adjustedDay } = getAdjustedDateFromCorrected(
    corrected.year,
    corrected.month,
    corrected.day,
    corrected.hour,
  );
  const days = getDaysBetweenJD(adjustedYear, adjustedMonth, adjustedDay);
  const dayStemIndex = (((BASE_DAY_STEM + days) % 10) + 10) % 10;
  const dayBranchIndex = (((BASE_DAY_BRANCH + days) % 12) + 12) % 12;

  // 연주 계산
  const effectiveYear = correctedBirthDate.getFullYear() + solarTermInfo.yearAdjust;
  const yearDiff = effectiveYear - 1900;
  const yearStemIndex = (((BASE_YEAR_STEM + yearDiff) % 10) + 10) % 10;
  const yearBranchIndex = (((BASE_YEAR_BRANCH + yearDiff) % 12) + 12) % 12;

  // 월주 계산
  const monthBranchIndex = (solarTermInfo.month + 1) % 12;
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthStemIndex = (monthStemStart + solarTermInfo.month - 1) % 10;

  // 시주 계산
  let hourResult: { stem: number; branch: number } | null = null;
  if (birthHour !== null) {
    const hourBranch = getHourBranch(corrected.hour);
    const hourStemIndex = (HOUR_STEM_START[dayStemIndex] + hourBranch) % 10;
    hourResult = { stem: hourStemIndex, branch: hourBranch };
  }

  return {
    year: { stem: yearStemIndex, branch: yearBranchIndex },
    month: { stem: monthStemIndex, branch: monthBranchIndex },
    day: { stem: dayStemIndex, branch: dayBranchIndex },
    hour: hourResult,
  };
}

// ========== 4주를 출력 포맷으로 변환 ==========
interface PillarOutput {
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  element: string;
}

function formatPillar(stem: number, branch: number): PillarOutput {
  return {
    stem: HEAVENLY_STEMS[stem],
    branch: EARTHLY_BRANCHES[branch],
    stemHanja: STEMS_HANJA[stem],
    branchHanja: BRANCHES_HANJA[branch],
    element: STEMS_ELEMENTS[stem],
  };
}

// ========== 오행 밸런스 계산 ==========
interface ElementBalance {
  counts: Record<ElementType, number>;
  percentages: Record<ElementType, number>;
  dominant: ElementType[];
  weak: ElementType[];
  analysis: string;
}

function calculateElementBalance(saju: SajuPillars): ElementBalance {
  const counts: Record<ElementType, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  // 천간 오행 (인덱스 기반 - saju-analysis와 동일)
  counts[STEMS_ELEMENTS[saju.year.stem] as ElementType]++;
  counts[STEMS_ELEMENTS[saju.month.stem] as ElementType]++;
  counts[STEMS_ELEMENTS[saju.day.stem] as ElementType]++;
  if (saju.hour) counts[STEMS_ELEMENTS[saju.hour.stem] as ElementType]++;

  // 지지 오행 (인덱스 기반 - saju-analysis와 동일)
  counts[BRANCHES_ELEMENTS[saju.year.branch] as ElementType]++;
  counts[BRANCHES_ELEMENTS[saju.month.branch] as ElementType]++;
  counts[BRANCHES_ELEMENTS[saju.day.branch] as ElementType]++;
  if (saju.hour) counts[BRANCHES_ELEMENTS[saju.hour.branch] as ElementType]++;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const avg = total > 0 ? total / 5 : 0;
  const safeTotal = total > 0 ? total : 1;

  const percentages: Record<ElementType, number> = {
    목: Math.round((counts.목 / safeTotal) * 100),
    화: Math.round((counts.화 / safeTotal) * 100),
    토: Math.round((counts.토 / safeTotal) * 100),
    금: Math.round((counts.금 / safeTotal) * 100),
    수: Math.round((counts.수 / safeTotal) * 100),
  };

  const elements: ElementType[] = ["목", "화", "토", "금", "수"];
  const dominant = elements.filter(el => counts[el] > avg);
  const weak = elements.filter(el => counts[el] < avg * 0.5 || counts[el] === 0);

  const elementNames: Record<ElementType, string> = {
    목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)"
  };
  
  let analysis = "";
  if (dominant.length === 0 && weak.length === 0) {
    analysis = "오행이 비교적 균형 잡힌 사주예요. 다방면에서 안정적인 에너지를 가졌어요.";
  } else if (dominant.length > 0 && weak.length > 0) {
    const dominantStr = dominant.map(el => elementNames[el]).join(", ");
    const weakStr = weak.map(el => elementNames[el]).join(", ");
    analysis = `${dominantStr}이(가) 강하고, ${weakStr}이(가) 부족해요. 부족한 기운을 보완하면 좋아요.`;
  } else if (dominant.length > 0) {
    const dominantStr = dominant.map(el => elementNames[el]).join(", ");
    analysis = `${dominantStr}의 기운이 강해요. 해당 분야에서 능력을 발휘하기 좋아요.`;
  } else if (weak.length > 0) {
    const weakStr = weak.map(el => elementNames[el]).join(", ");
    analysis = `${weakStr}의 기운이 부족해요. 해당 분야를 의식적으로 보완하면 좋아요.`;
  }

  console.log("Element Balance (Server Calculated):", {
    year: `${STEMS_HANJA[saju.year.stem]}${BRANCHES_HANJA[saju.year.branch]}`,
    month: `${STEMS_HANJA[saju.month.stem]}${BRANCHES_HANJA[saju.month.branch]}`,
    day: `${STEMS_HANJA[saju.day.stem]}${BRANCHES_HANJA[saju.day.branch]}`,
    hour: saju.hour ? `${STEMS_HANJA[saju.hour.stem]}${BRANCHES_HANJA[saju.hour.branch]}` : "없음",
    counts,
    total,
    dominant,
    weak
  });

  return { counts, percentages, dominant, weak, analysis };
}

// ========== AI 프롬프트 ==========
const SAJU_ANALYSIS_PROMPT = `# Role
당신은 20년 경력의 명리학 전문가입니다. 사주팔자를 통해 사람의 본질적 성향, 관계 패턴, 잠재력을 통찰합니다.

# Context
사용자의 사주명식을 분석하여 성격, 장단점, 관계 성향을 도출합니다.

# Task
다음 구조로 사주 분석을 수행하세요:

1. 일간(日干) 본질 분석 - 핵심 정체성과 에너지 특성, 비유적 이미지
2. 성격 특성 - 겉으로 드러나는 성격 3가지, 내면 성격 2가지, 스트레스 반응
3. 강점 3가지 - 명리학적 근거와 실생활 발현
4. 약점 2가지 - "~할 때 주의 필요" 형태로, 극복 방향 제시
5. 관계 성향 - 끌리는 유형, 시너지 좋은 유형, 주의 패턴
6. 2026년 에너지 키워드 - 한 줄 메시지

# Output Format
반드시 아래 JSON 구조로만 응답하세요:
{
  "day_master": {
    "name": "무토(戊土)",
    "element": "토",
    "image": "우뚝 선 산",
    "essence": "..."
  },
  "personality": {
    "visible": ["...", "...", "..."],
    "hidden": ["...", "..."],
    "under_stress": "..."
  },
  "strengths": [
    {"trait": "...", "basis": "...", "manifestation": "..."}
  ],
  "weaknesses": [
    {"trait": "...", "caution": "...", "growth_tip": "..."}
  ],
  "relationship": {
    "attracted_to": "...",
    "synergy_with": "...",
    "caution_pattern": "..."
  },
  "year_2026": {
    "energy": "...",
    "keyword": "...",
    "message": "..."
  }
}`;

const MBTI_ANALYSIS_PROMPT = `# Role
당신은 MBTI 공인 전문가이자 심리상담사입니다. 융(Jung)의 심리유형론을 기반으로 인지 기능을 깊이 이해합니다.

# Context
사용자의 MBTI 유형을 분석하여 성격, 장단점, 관계 성향을 도출합니다.

# Task
다음 구조로 MBTI 분석을 수행하세요:

1. 유형 본질 - 주기능/부기능, 핵심 동기, 키워드 3개
2. 성격 특성 - E/I, S/N, T/F, J/P 각 설명
3. 강점 3가지 - 인지 기능 기반 설명
4. 성장 포인트 2가지 - 열등 기능 관련 도전과 성장 방향
5. 관계 성향 - 이상적 파트너, 주는 것 vs 필요로 하는 것, 갈등 패턴
6. 소통 스타일 - 선호 방식, 오해받기 쉬운 부분, 효과적 소통법

# Output Format
반드시 아래 JSON 구조로만 응답하세요:
{
  "type_essence": {
    "dominant_function": "...",
    "auxiliary_function": "...",
    "core_motivation": "...",
    "keywords": ["...", "...", "..."]
  },
  "personality": {
    "energy": {"direction": "I/E", "description": "..."},
    "perception": {"preference": "S/N", "description": "..."},
    "judgment": {"preference": "T/F", "description": "..."},
    "lifestyle": {"preference": "J/P", "description": "..."}
  },
  "strengths": [
    {"trait": "...", "cognitive_basis": "...", "manifestation": "..."}
  ],
  "growth_points": [
    {"area": "...", "challenge": "...", "growth_direction": "..."}
  ],
  "relationship": {
    "ideal_partners": ["...", "..."],
    "gives": "...",
    "needs": "...",
    "conflict_pattern": "..."
  },
  "communication": {
    "preferred_style": "...",
    "often_misunderstood": "...",
    "effective_approach": "..."
  }
}`;

const INTEGRATED_ANALYSIS_PROMPT = `# Role
당신은 명리학과 현대 심리학을 통합하는 융합 상담 전문가입니다.

# Context
사주 분석과 MBTI 분석을 통합하여:
1. 두 체계의 교차점과 긴장 관계 발견
2. 사용자가 "나를 정확히 알아봤다"고 느끼는 통합 프로필 생성
3. SNS에 공유하고 싶은 매력적인 유형 카드 콘텐츠 제작

# Task

## Part 1: 교차 분석
- 시너지 포인트 3가지 (일치하는 부분)
- 흥미로운 긴장 1-2가지 (다른 부분을 복잡성으로 해석)
- 숨겨진 잠재력

## Part 2: 통합 프로필
- 유형명: 감성적 별명 (예: "어둠을 밝히는 따뜻한 전략가")
- 핵심 문장 (20자 내외)
- 대표 이모지 1개
- 통합 성격 묘사 3-4문장
- 핵심 강점 3가지 (해시태그 키워드)
- 성장 포인트 2가지 (실천 팁 포함)
- 관계 인사이트

## Part 3: 공유용 카드 콘텐츠
- 메인 카드 텍스트
- MBTI 교차 인사이트 카드
- 2026 운세 카드
- 공유 유도 문구 2가지 버전

# Output Format
반드시 아래 JSON 구조로만 응답하세요:
{
  "cross_analysis": {
    "synergy_points": [
      {"point": "...", "saju_basis": "...", "mbti_basis": "...", "interpretation": "..."}
    ],
    "interesting_tensions": [
      {"tension": "...", "interpretation": "..."}
    ],
    "hidden_potential": "..."
  },
  "integrated_profile": {
    "type_name": "...",
    "core_sentence": "...",
    "emoji": "...",
    "description": "...",
    "strengths": [
      {"trait": "...", "hashtag": "..."}
    ],
    "growth_points": [
      {"area": "...", "tip": "..."}
    ],
    "relationship_insight": {
      "best_match": "...",
      "growth_partner": "...",
      "tip": "..."
    }
  },
  "card_contents": {
    "main_card": {
      "title": "...",
      "subtitle": "...",
      "hashtags": ["...", "...", "..."]
    },
    "mbti_cross_card": {
      "insight": "...",
      "fun_point": "..."
    },
    "fortune_card": {
      "keyword": "...",
      "message": "...",
      "lucky_month": "...",
      "lucky_color": "..."
    },
    "share_captions": {
      "self_expression": "...",
      "empathy_inducing": "..."
    }
  }
}`;

// ========== AI 호출 함수들 ==========
async function callGemini(prompt: string, userMessage: string): Promise<any> {
  const GEMINI_API_KEY = Deno.env.get("Gemini");
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  console.log("Calling Gemini API...");
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + "\n\n" + userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error("No content in Gemini response");
  }

  return extractJSON(content);
}

async function callGPT5(prompt: string, userMessage: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log("Calling GPT-5 via Lovable AI Gateway...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded");
    if (response.status === 402) throw new Error("Payment required");
    const text = await response.text();
    console.error("GPT-5 gateway error:", response.status, text);
    throw new Error(`GPT-5 gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) throw new Error("No content in GPT-5 response");
  return extractJSON(content);
}

function extractJSON(content: string): any {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Failed to extract JSON from:", content);
    throw new Error("Failed to extract JSON from AI response");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("JSON parse error:", e, "Content:", jsonMatch[0]);
    throw new Error("Failed to parse AI response as JSON");
  }
}

async function callAI(prompt: string, userMessage: string): Promise<any> {
  try {
    return await callGemini(prompt, userMessage);
  } catch (geminiError) {
    console.error("Gemini failed, trying GPT-5 fallback:", geminiError);
    try {
      return await callGPT5(prompt, userMessage);
    } catch (gptError) {
      console.error("GPT-5 also failed:", gptError);
      throw new Error(`Both AI providers failed. Gemini: ${geminiError}. GPT-5: ${gptError}`);
    }
  }
}

// ========== 입력 인터페이스 ==========
interface SajuTypeInput {
  // 새로운 방식: 생년월일 직접 입력
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number | null;
  birthMinute?: number;
  // 기존 방식 호환성 유지
  yearPillar?: { stem: string; branch: string; stemHanja: string; branchHanja: string; element: string };
  monthPillar?: { stem: string; branch: string; stemHanja: string; branchHanja: string; element: string };
  dayPillar?: { stem: string; branch: string; stemHanja: string; branchHanja: string; element: string };
  hourPillar?: { stem: string; branch: string; stemHanja: string; branchHanja: string; element: string } | null;
  // 공통
  gender: string;
  mbti: string;
  userName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: SajuTypeInput = await req.json();
    const { gender, mbti, userName } = input;

    let yearPillar: PillarOutput;
    let monthPillar: PillarOutput;
    let dayPillar: PillarOutput;
    let hourPillar: PillarOutput | null = null;
    let sajuPillars: SajuPillars;

    // 새로운 방식: 생년월일로 서버에서 직접 4주 계산
    if (input.birthYear && input.birthMonth && input.birthDay) {
      console.log(`Calculating pillars from birth date: ${input.birthYear}-${input.birthMonth}-${input.birthDay} ${input.birthHour ?? '?'}:${input.birthMinute ?? 0}`);
      
      sajuPillars = calculateSaju(
        input.birthYear,
        input.birthMonth,
        input.birthDay,
        input.birthHour ?? null,
        input.birthMinute ?? 0
      );

      yearPillar = formatPillar(sajuPillars.year.stem, sajuPillars.year.branch);
      monthPillar = formatPillar(sajuPillars.month.stem, sajuPillars.month.branch);
      dayPillar = formatPillar(sajuPillars.day.stem, sajuPillars.day.branch);
      if (sajuPillars.hour) {
        hourPillar = formatPillar(sajuPillars.hour.stem, sajuPillars.hour.branch);
      }

      console.log("Server calculated pillars:", {
        year: `${yearPillar.stemHanja}${yearPillar.branchHanja}`,
        month: `${monthPillar.stemHanja}${monthPillar.branchHanja}`,
        day: `${dayPillar.stemHanja}${dayPillar.branchHanja}`,
        hour: hourPillar ? `${hourPillar.stemHanja}${hourPillar.branchHanja}` : "없음"
      });
    } 
    // 기존 방식 호환: 클라이언트에서 계산된 pillars 사용 (deprecated)
    else if (input.yearPillar && input.monthPillar && input.dayPillar) {
      console.log("Using client-provided pillars (deprecated path)");
      yearPillar = input.yearPillar;
      monthPillar = input.monthPillar;
      dayPillar = input.dayPillar;
      hourPillar = input.hourPillar || null;

      // 인덱스 역산 (한자 → 인덱스)
      const yearStemIdx = STEMS_HANJA.indexOf(yearPillar.stemHanja);
      const yearBranchIdx = BRANCHES_HANJA.indexOf(yearPillar.branchHanja);
      const monthStemIdx = STEMS_HANJA.indexOf(monthPillar.stemHanja);
      const monthBranchIdx = BRANCHES_HANJA.indexOf(monthPillar.branchHanja);
      const dayStemIdx = STEMS_HANJA.indexOf(dayPillar.stemHanja);
      const dayBranchIdx = BRANCHES_HANJA.indexOf(dayPillar.branchHanja);
      
      sajuPillars = {
        year: { stem: yearStemIdx, branch: yearBranchIdx },
        month: { stem: monthStemIdx, branch: monthBranchIdx },
        day: { stem: dayStemIdx, branch: dayBranchIdx },
        hour: null
      };
      
      if (hourPillar) {
        const hourStemIdx = STEMS_HANJA.indexOf(hourPillar.stemHanja);
        const hourBranchIdx = BRANCHES_HANJA.indexOf(hourPillar.branchHanja);
        sajuPillars.hour = { stem: hourStemIdx, branch: hourBranchIdx };
      }
    } else {
      throw new Error("생년월일 또는 사주 정보가 필요합니다");
    }

    // 오행 밸런스 계산 (서버에서 직접 - saju-analysis와 동일 로직)
    const elementBalance = calculateElementBalance(sajuPillars);

    // AI 분석용 사주 데이터 포맷
    const sajuDataStr = `
년주: ${yearPillar.stemHanja}${yearPillar.branchHanja} (${yearPillar.stem}${yearPillar.branch})
월주: ${monthPillar.stemHanja}${monthPillar.branchHanja} (${monthPillar.stem}${monthPillar.branch})
일주: ${dayPillar.stemHanja}${dayPillar.branchHanja} (${dayPillar.stem}${dayPillar.branch})
시주: ${hourPillar ? `${hourPillar.stemHanja}${hourPillar.branchHanja} (${hourPillar.stem}${hourPillar.branch})` : '미입력'}
성별: ${gender}
이름: ${userName || '미입력'}
    `.trim();

    console.log("Starting saju-type-analysis for:", sajuDataStr, "MBTI:", mbti);

    // Step 1: Saju Analysis
    console.log("Step 1: Saju Analysis");
    const sajuAnalysis = await callAI(SAJU_ANALYSIS_PROMPT, sajuDataStr);

    // Step 2: MBTI Analysis
    console.log("Step 2: MBTI Analysis");
    const mbtiAnalysis = await callAI(MBTI_ANALYSIS_PROMPT, `MBTI 유형: ${mbti}`);

    // Step 3: Integrated Analysis
    console.log("Step 3: Integrated Analysis");
    const integratedInput = `
사주 분석 결과:
${JSON.stringify(sajuAnalysis, null, 2)}

MBTI 분석 결과:
${JSON.stringify(mbtiAnalysis, null, 2)}

사용자 이름: ${userName || '미입력'}
일간: ${dayPillar.stemHanja}(${dayPillar.stem})
MBTI: ${mbti}
    `.trim();
    
    const integratedAnalysis = await callAI(INTEGRATED_ANALYSIS_PROMPT, integratedInput);
    console.log("Integrated analysis completed");

    const result = {
      saju_analysis: sajuAnalysis,
      mbti_analysis: mbtiAnalysis,
      integrated_analysis: integratedAnalysis,
      element_balance: elementBalance,
      input_summary: {
        pillars: {
          year: yearPillar,
          month: monthPillar,
          day: dayPillar,
          hour: hourPillar,
        },
        gender,
        mbti,
        userName,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in saju-type-analysis:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage.includes("Rate limit") ? 429 : 
                   errorMessage.includes("Payment") ? 402 : 500;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
