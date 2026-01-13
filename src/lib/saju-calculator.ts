// 사주 4주 계산 유틸리티 (프론트엔드용 경량 버전)

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

// 시간대 정보
const TIME_RANGES = [
  { label: "자시", range: "23:30~01:29", startHour: 23, startMinute: 30, endHour: 1, endMinute: 29 },
  { label: "축시", range: "01:30~03:29", startHour: 1, startMinute: 30, endHour: 3, endMinute: 29 },
  { label: "인시", range: "03:30~05:29", startHour: 3, startMinute: 30, endHour: 5, endMinute: 29 },
  { label: "묘시", range: "05:30~07:29", startHour: 5, startMinute: 30, endHour: 7, endMinute: 29 },
  { label: "진시", range: "07:30~09:29", startHour: 7, startMinute: 30, endHour: 9, endMinute: 29 },
  { label: "사시", range: "09:30~11:29", startHour: 9, startMinute: 30, endHour: 11, endMinute: 29 },
  { label: "오시", range: "11:30~13:29", startHour: 11, startMinute: 30, endHour: 13, endMinute: 29 },
  { label: "미시", range: "13:30~15:29", startHour: 13, startMinute: 30, endHour: 15, endMinute: 29 },
  { label: "신시", range: "15:30~17:29", startHour: 15, startMinute: 30, endHour: 17, endMinute: 29 },
  { label: "유시", range: "17:30~19:29", startHour: 17, startMinute: 30, endHour: 19, endMinute: 29 },
  { label: "술시", range: "19:30~21:29", startHour: 19, startMinute: 30, endHour: 21, endMinute: 29 },
  { label: "해시", range: "21:30~23:29", startHour: 21, startMinute: 30, endHour: 23, endMinute: 29 },
];

export { TIME_RANGES };

// JDN (Julian Day Number) 계산 - UTC 기준
function getJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// 기준일: 1900년 1월 1일 = 갑술일(甲戌) -> 일간 인덱스 0 (갑), 일지 인덱스 10 (술)
// JDN(1900-01-01) = 2415021
const BASE_JDN = 2415021;
const BASE_DAY_STEM_INDEX = 0; // 갑(甲)
const BASE_DAY_BRANCH_INDEX = 10; // 술(戌) - 1900-01-01은 갑술일

// 1900년 = 경자년 -> 년간 인덱스 6 (경), 년지 인덱스 0 (자)
const BASE_YEAR = 1900;
const BASE_YEAR_STEM_INDEX = 6;
const BASE_YEAR_BRANCH_INDEX = 0;

// 월간 시작 인덱스 (년간에 따라)
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 갑기->병, 을경->무, 병신->경, 정임->임, 무계->갑

// 시간 천간 시작 인덱스 (일간에 따라)
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 갑기->갑, 을경->병, 병신->무, 정임->경, 무계->임

export interface PillarInfo {
  stem: string;       // 한글 천간
  stemHanja: string;  // 한자 천간
  stemIndex: number;
  branch: string;     // 한글 지지
  branchHanja: string; // 한자 지지
  branchIndex: number;
  element: string;    // 오행 (천간 기준)
  combined: string;   // 합친 표시 (예: 갑자)
  combinedHanja: string; // 한자 합침 (예: 甲子)
}

export interface FourPillars {
  year: PillarInfo;
  month: PillarInfo;
  day: PillarInfo;
  hour: PillarInfo | null;
}

export interface DayMasterResult {
  stem: string;
  hanja: string;
  index: number;
}

function createPillarInfo(stemIndex: number, branchIndex: number): PillarInfo {
  return {
    stem: HEAVENLY_STEMS[stemIndex],
    stemHanja: STEMS_HANJA[stemIndex],
    stemIndex,
    branch: EARTHLY_BRANCHES[branchIndex],
    branchHanja: BRANCHES_HANJA[branchIndex],
    branchIndex,
    element: STEMS_ELEMENTS[stemIndex],
    combined: HEAVENLY_STEMS[stemIndex] + EARTHLY_BRANCHES[branchIndex],
    combinedHanja: STEMS_HANJA[stemIndex] + BRANCHES_HANJA[branchIndex],
  };
}

// 년주 계산 (간단 버전 - 입춘 무시, 양력 기준)
function calculateYearPillar(year: number): PillarInfo {
  const yearDiff = year - BASE_YEAR;
  let stemIndex = (BASE_YEAR_STEM_INDEX + yearDiff) % 10;
  let branchIndex = (BASE_YEAR_BRANCH_INDEX + yearDiff) % 12;
  if (stemIndex < 0) stemIndex += 10;
  if (branchIndex < 0) branchIndex += 12;
  return createPillarInfo(stemIndex, branchIndex);
}

// 월주 계산 (간단 버전 - 절기 무시, 양력 월 기준)
function calculateMonthPillar(year: number, month: number): PillarInfo {
  const yearPillar = calculateYearPillar(year);
  const yearStemIndex = yearPillar.stemIndex;
  
  // 월지: 인월(1월)=2, 묘월(2월)=3, ... , 축월(12월)=1
  // 양력 월을 음력 월로 근사 매핑 (간단화)
  const monthBranchMap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]; // 1월=축, 2월=인, ...
  const branchIndex = monthBranchMap[month - 1];
  
  // 월간: 년간에 따른 시작점 + (월지 인덱스 - 2)
  // 인월이 시작점
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthOffset = (branchIndex - 2 + 12) % 12;
  const stemIndex = (monthStemStart + monthOffset) % 10;
  
  return createPillarInfo(stemIndex, branchIndex);
}

// 일주 계산
function calculateDayPillar(year: number, month: number, day: number): PillarInfo {
  const jdn = getJDN(year, month, day);
  const daysDiff = jdn - BASE_JDN;
  
  let stemIndex = (BASE_DAY_STEM_INDEX + daysDiff) % 10;
  let branchIndex = (BASE_DAY_BRANCH_INDEX + daysDiff) % 12;
  if (stemIndex < 0) stemIndex += 10;
  if (branchIndex < 0) branchIndex += 12;
  
  return createPillarInfo(stemIndex, branchIndex);
}

// 시주 계산
function calculateHourPillar(dayStemIndex: number, hour: number, minute: number): PillarInfo {
  // 시지 계산 (23:30부터 자시 시작)
  let branchIndex: number;
  const totalMinutes = hour * 60 + minute;
  
  if (totalMinutes >= 23 * 60 + 30 || totalMinutes < 1 * 60 + 30) {
    branchIndex = 0; // 자시
  } else if (totalMinutes < 3 * 60 + 30) {
    branchIndex = 1; // 축시
  } else if (totalMinutes < 5 * 60 + 30) {
    branchIndex = 2; // 인시
  } else if (totalMinutes < 7 * 60 + 30) {
    branchIndex = 3; // 묘시
  } else if (totalMinutes < 9 * 60 + 30) {
    branchIndex = 4; // 진시
  } else if (totalMinutes < 11 * 60 + 30) {
    branchIndex = 5; // 사시
  } else if (totalMinutes < 13 * 60 + 30) {
    branchIndex = 6; // 오시
  } else if (totalMinutes < 15 * 60 + 30) {
    branchIndex = 7; // 미시
  } else if (totalMinutes < 17 * 60 + 30) {
    branchIndex = 8; // 신시
  } else if (totalMinutes < 19 * 60 + 30) {
    branchIndex = 9; // 유시
  } else if (totalMinutes < 21 * 60 + 30) {
    branchIndex = 10; // 술시
  } else {
    branchIndex = 11; // 해시
  }
  
  // 시간 천간 계산
  const hourStemStart = HOUR_STEM_START[dayStemIndex];
  const stemIndex = (hourStemStart + branchIndex) % 10;
  
  return createPillarInfo(stemIndex, branchIndex);
}

// 4주 전체 계산
export function calculateFourPillars(
  year: number, 
  month: number, 
  day: number, 
  hour?: number, 
  minute?: number
): FourPillars {
  // 23:30 이후면 다음 날로 간주
  let adjustedYear = year;
  let adjustedMonth = month;
  let adjustedDay = day;
  
  if (hour !== undefined && minute !== undefined && hour >= 23 && minute >= 30) {
    const nextDate = new Date(year, month - 1, day + 1);
    adjustedYear = nextDate.getFullYear();
    adjustedMonth = nextDate.getMonth() + 1;
    adjustedDay = nextDate.getDate();
  }
  
  const yearPillar = calculateYearPillar(adjustedYear);
  const monthPillar = calculateMonthPillar(adjustedYear, adjustedMonth);
  const dayPillar = calculateDayPillar(adjustedYear, adjustedMonth, adjustedDay);
  
  let hourPillar: PillarInfo | null = null;
  if (hour !== undefined && minute !== undefined) {
    hourPillar = calculateHourPillar(dayPillar.stemIndex, hour, minute);
  }
  
  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
}

// 일간만 계산 (기존 호환)
export function calculateDayMaster(year: number, month: number, day: number): DayMasterResult {
  const dayPillar = calculateDayPillar(year, month, day);
  return {
    stem: dayPillar.stem,
    hanja: dayPillar.stemHanja,
    index: dayPillar.stemIndex,
  };
}

// 날짜 문자열 파싱 (YYYY.MM.DD 또는 YYYY-MM-DD)
export function parseDateString(dateStr: string): { year: number; month: number; day: number } | null {
  const cleaned = dateStr.replace(/[.\-\/]/g, '-');
  const parts = cleaned.split('-').map(p => parseInt(p, 10));
  
  if (parts.length !== 3 || parts.some(isNaN)) {
    return null;
  }
  
  const [year, month, day] = parts;
  
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  
  return { year, month, day };
}

// 시간 문자열 파싱 (HH:MM 또는 범위 형태)
export function parseTimeRange(timeRange: string): { hour: number; minute: number } | null {
  // "23:30~01:29" 형태에서 시작 시간 추출
  const match = timeRange.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      hour: parseInt(match[1], 10),
      minute: parseInt(match[2], 10),
    };
  }
  return null;
}
