
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

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

function getJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}


const BASE_JDN = 2415021;
const BASE_DAY_STEM_INDEX = 0; 
const BASE_DAY_BRANCH_INDEX = 10; 

const BASE_YEAR = 1900;
const BASE_YEAR_STEM_INDEX = 6;
const BASE_YEAR_BRANCH_INDEX = 0;

const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; 

// 시간 천간 시작 인덱스 (일간에 따라)
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; 

export interface PillarInfo {
  stem: string;       
  stemHanja: string;  
  stemIndex: number;
  branch: string;     
  branchHanja: string; 
  branchIndex: number;
  element: string;    
  combined: string;   
  combinedHanja: string; 
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

function calculateYearPillar(year: number): PillarInfo {
  const yearDiff = year - BASE_YEAR;
  let stemIndex = (BASE_YEAR_STEM_INDEX + yearDiff) % 10;
  let branchIndex = (BASE_YEAR_BRANCH_INDEX + yearDiff) % 12;
  if (stemIndex < 0) stemIndex += 10;
  if (branchIndex < 0) branchIndex += 12;
  return createPillarInfo(stemIndex, branchIndex);
}

function calculateMonthPillar(year: number, month: number): PillarInfo {
  const yearPillar = calculateYearPillar(year);
  const yearStemIndex = yearPillar.stemIndex;
  
  const monthBranchMap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]; 
  const branchIndex = monthBranchMap[month - 1];
  
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthOffset = (branchIndex - 2 + 12) % 12;
  const stemIndex = (monthStemStart + monthOffset) % 10;
  
  return createPillarInfo(stemIndex, branchIndex);
}

function calculateDayPillar(year: number, month: number, day: number): PillarInfo {
  const jdn = getJDN(year, month, day);
  const daysDiff = jdn - BASE_JDN;
  
  let stemIndex = (BASE_DAY_STEM_INDEX + daysDiff) % 10;
  let branchIndex = (BASE_DAY_BRANCH_INDEX + daysDiff) % 12;
  if (stemIndex < 0) stemIndex += 10;
  if (branchIndex < 0) branchIndex += 12;
  
  return createPillarInfo(stemIndex, branchIndex);
}

function calculateHourPillar(dayStemIndex: number, hour: number, minute: number): PillarInfo {
  let branchIndex: number;
  const totalMinutes = hour * 60 + minute;
  
  if (totalMinutes >= 23 * 60 + 30 || totalMinutes < 1 * 60 + 30) {
    branchIndex = 0; 
  } else if (totalMinutes < 3 * 60 + 30) {
    branchIndex = 1; 
  } else if (totalMinutes < 5 * 60 + 30) {
    branchIndex = 2; 
  } else if (totalMinutes < 7 * 60 + 30) {
    branchIndex = 3; 
  } else if (totalMinutes < 9 * 60 + 30) {
    branchIndex = 4; 
  } else if (totalMinutes < 11 * 60 + 30) {
    branchIndex = 5; 
  } else if (totalMinutes < 13 * 60 + 30) {
    branchIndex = 6; 
  } else if (totalMinutes < 15 * 60 + 30) {
    branchIndex = 7;
  } else if (totalMinutes < 17 * 60 + 30) {
    branchIndex = 8; 
  } else if (totalMinutes < 19 * 60 + 30) {
    branchIndex = 9; 
  } else if (totalMinutes < 21 * 60 + 30) {
    branchIndex = 10; 
  } else {
    branchIndex = 11; 
  }
  
  const hourStemStart = HOUR_STEM_START[dayStemIndex];
  const stemIndex = (hourStemStart + branchIndex) % 10;
  
  return createPillarInfo(stemIndex, branchIndex);
}

export function calculateFourPillars(
  year: number, 
  month: number, 
  day: number, 
  hour?: number, 
  minute?: number
): FourPillars {
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

export function parseTimeRange(timeRange: string): { hour: number; minute: number } | null {
  const match = timeRange.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      hour: parseInt(match[1], 10),
      minute: parseInt(match[2], 10),
    };
  }
  return null;
}
