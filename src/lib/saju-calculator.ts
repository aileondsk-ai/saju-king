// DUMMY Saju Calculator
// Real calculation logic has been removed for public release.

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEMS_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];

const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCHES_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

const TIME_RANGES = [
  { label: "자시", range: "23:30~01:29", startHour: 23, startMinute: 30, endHour: 1, endMinute: 29 },
  // ... Simplified
];

export { TIME_RANGES };

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

function createDummyPillar(): PillarInfo {
  return {
    stem: "갑", stemHanja: "甲", stemIndex: 0,
    branch: "자", branchHanja: "子", branchIndex: 0,
    element: "목", combined: "갑자", combinedHanja: "甲子"
  };
}

export function calculateFourPillars(
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number
): FourPillars {
  // Always return Gap-Ja for all pillars (Dummy)
  return {
    year: createDummyPillar(),
    month: createDummyPillar(),
    day: createDummyPillar(),
    hour: hour !== undefined ? createDummyPillar() : null
  };
}

export function calculateDayMaster(year: number, month: number, day: number): DayMasterResult {
  const dummy = createDummyPillar();
  return {
    stem: dummy.stem,
    hanja: dummy.stemHanja,
    index: dummy.stemIndex
  };
}

export function parseDateString(dateStr: string): { year: number; month: number; day: number } | null {
  // Simplified implementation for demo availability
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year) return null;
  return { year, month, day };
}

export function parseTimeRange(timeRange: string): { hour: number; minute: number } | null {
  return { hour: 0, minute: 0 };
}
