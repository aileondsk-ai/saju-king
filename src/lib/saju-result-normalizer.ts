/**
 * Saju Analysis Result Normalizer
 * 백엔드 raw 응답을 프론트엔드 모델로 변환
 */

// ============= Frontend Model Types =============

export interface PillarData {
  gan: string;
  ji: string;
  ganHanja: string;
  jiHanja: string;
  korean?: string;
  tenStar?: string;
}

export interface SajuChartData {
  yearPillar: PillarData;
  monthPillar: PillarData;
  dayPillar: PillarData;
  hourPillar: PillarData;
}

export interface DayMasterData {
  stem: string;
  stemHanja?: string;
  element: string;
  yinYang: string;
  strength?: string;
  image?: string;
  description?: string;
  characteristics?: string;
  strengths?: string[];
  weakPoints?: string[];
  watchPoints?: string[];
  coreTraits?: string[];
}

export interface StructureData {
  name?: string;
  type?: string;
  description: string;
  detailedExplanation?: string;
  yongsin: {
    element: string;
    reason?: string;
    practicalTips?: string;
    description?: string;
  };
  wonsin: {
    element: string;
    description?: string;
  };
  huisin: {
    element: string;
    description?: string;
  };
  gisin: {
    element: string;
    description?: string;
  };
}

export interface TenGodDetail {
  position: string;
  stem: string;
  stemHanja: string;
  element: string;
  tenGod: string;
  tenGodHanja: string;
}

export interface TenGodDistribution {
  details: TenGodDetail[];
  counts: Record<string, number>;
  dominant: string[];
  analysis: {
    bigyeop: number;
    siksang: number;
    jaecaeung: number;
    gwanseong: number;
    inseong: number;
  };
}

export interface DaeunPillarData {
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

export interface DaeunData {
  startAge: number;
  direction: string;
  pillars: DaeunPillarData[];
  current: {
    pillar: string;
    pillarHanja: string;
    element: string;
    period: string;
    yearsRemaining: number;
  } | null;
}

export interface SaeunData {
  year: number;
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  element: string;
}

export interface AreaFortuneData {
  grade: number;
  gradeLabel?: string;
  description: string;
  advice: string;
  opportunities?: string[];
  risks?: string[];
}

export interface AreaFortunes {
  wealth: AreaFortuneData;
  career: AreaFortuneData;
  health: AreaFortuneData;
  relationship: AreaFortuneData;
}

export interface LuckyElements {
  colors: string[];
  numbers: number[];
  directions: string[];
  seasons: string[];
}

export interface YearlyFortune {
  year: number;
  pillar?: string;
  pillarKorean?: string;
  theme: string;
  description: string;
  monthlyHighlights?: Array<{ month: string; fortune: string; keyword: string }>;
  keyMonths?: Array<{ month: number; theme: string }>;
}

export interface CurrentLuckCycle {
  period: string | null;
  pillar: string | null;
  pillarKorean?: string;
  description: string;
  opportunities?: string[];
  challenges?: string[];
  cautions?: string[];
  actionTips?: string[];
}

export interface OverallAdvice {
  coreMessage: string;
  actionItems: string[];
  cautions: string[];
}

export interface CalculationProof {
  engineVersion: string;
  solarTermDataVersion: string;
  decisionLog: Array<{ key: string; value: string }>;
  references: {
    ipchunAt: string | null;
    monthTermStart: string | null;
    monthTermEnd: string | null;
    baseEpoch: string;
  };
}

export interface NormalizedSajuResult {
  sajuChart: SajuChartData | null;
  dayMaster: DayMasterData | null;
  elementBalance: Record<string, { count: number; percentage: number }>;
  elementBalanceAnalysis: string | null;
  structure: StructureData | null;
  tenGodDistribution: TenGodDistribution | null;
  daeun: DaeunData | null;
  saeun: SaeunData | null;
  currentLuckCycle: CurrentLuckCycle | null;
  yearlyFortune: YearlyFortune | null;
  areaFortunes: AreaFortunes | null;
  luckyElements: LuckyElements | null;
  overallAdvice: OverallAdvice | null;
  calculationProof: CalculationProof | null;
  disclaimer: string | null;
  narrativeDescription: string | null;
  fullResultMarkdown: string | null;
}

// ============= Normalization Functions =============

function normalizePillar(raw: unknown): PillarData {
  const r = raw as Record<string, unknown> || {};
  return {
    gan: String(r.gan || r.stem || ""),
    ji: String(r.ji || r.branch || ""),
    ganHanja: String(r.ganHanja || r.stemHanja || ""),
    jiHanja: String(r.jiHanja || r.branchHanja || ""),
    korean: r.korean as string | undefined,
    tenStar: r.tenStar as string | undefined,
  };
}

function normalizeSajuChart(raw: unknown): SajuChartData | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  // 직접 pillars 구조 또는 yearPillar 등이 있는 구조 모두 지원
  const pillars = r.pillars as Record<string, unknown> | undefined;
  
  return {
    yearPillar: normalizePillar(pillars?.year || r.yearPillar || r.year),
    monthPillar: normalizePillar(pillars?.month || r.monthPillar || r.month),
    dayPillar: normalizePillar(pillars?.day || r.dayPillar || r.day),
    hourPillar: normalizePillar(pillars?.hour || r.hourPillar || r.hour),
  };
}

function normalizeDayMaster(raw: unknown): DayMasterData | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  // strengths 필드 정규화 (배열 또는 객체)
  let strengths: string[] = [];
  if (Array.isArray(r.strengths)) {
    strengths = r.strengths.map(String);
  } else if (r.strengths && typeof r.strengths === "object") {
    strengths = Object.values(r.strengths).map(String);
  }

  // watchPoints 또는 watchAreas 지원
  let watchPoints: string[] = [];
  const watchRaw = r.watchPoints || r.watchAreas || r.weaknesses;
  if (Array.isArray(watchRaw)) {
    watchPoints = watchRaw.map(String);
  }

  // coreTraits 지원
  let coreTraits: string[] = [];
  if (Array.isArray(r.coreTraits)) {
    coreTraits = r.coreTraits.map(String);
  }

  return {
    stem: String(r.stem || ""),
    stemHanja: r.stemHanja as string | undefined,
    element: String(r.element || ""),
    yinYang: String(r.yinYang || ""),
    strength: r.strength as string | undefined,
    image: r.image as string | undefined,
    description: r.description as string | undefined,
    characteristics: r.characteristics as string | undefined,
    strengths: strengths.length > 0 ? strengths : undefined,
    watchPoints: watchPoints.length > 0 ? watchPoints : undefined,
    coreTraits: coreTraits.length > 0 ? coreTraits : undefined,
  };
}

function extractElementToken(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/[목화토금수]/);
  return match ? match[0] : trimmed;
}

function normalizeElementToken(raw: unknown): string {
  if (!raw) return "";
  return extractElementToken(String(raw));
}

function getEulReulParticle(element: string): string {
  const t = extractElementToken(element);
  // 오행 1글자 기준: 목/금은 받침이 있어 '을', 그 외는 '를'
  return t === "목" || t === "금" ? "을" : "를";
}

function normalizeYongsinLike(raw: unknown): { element: string; reason?: string; description?: string; practicalTips?: string } {
  if (!raw) return { element: "" };
  if (typeof raw === "string") return { element: normalizeElementToken(raw) };
  const r = raw as Record<string, unknown>;
  return {
    element: normalizeElementToken(r.element ?? r.name),
    reason: (r.reason ?? r.reasoning) as string | undefined,
    description: r.description as string | undefined,
    practicalTips: (r.practicalTips ?? r.practical_tips) as string | undefined,
  };
}

// 원신 계산: 용신을 생하는 오행
function calculateWonsin(yongsinElement: string): string {
  const y = extractElementToken(yongsinElement);
  const generatingMap: Record<string, string> = {
    "목": "수", // 수생목
    "화": "목", // 목생화
    "토": "화", // 화생토
    "금": "토", // 토생금
    "수": "금", // 금생수
  };
  return generatingMap[y] || "";
}

function isYongsinBundle(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return "yongsin" in r || "huisin" in r || "gisin" in r;
}

function normalizeStructure(raw: unknown, yongsinRaw?: unknown): StructureData | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;

  const bundle = isYongsinBundle(yongsinRaw) ? (yongsinRaw as Record<string, unknown>) : null;

  // 1) 최신 응답: structure 안에 yongsin/huisin/gisin 객체가 있는 형태
  // 2) 구형 응답: analysis.yongsin = { yongsin, huisin, gisin, reasoning, method } 형태
  const yongsin = r.yongsin
    ? normalizeYongsinLike(r.yongsin)
    : bundle
      ? {
          element: normalizeElementToken(bundle.yongsin),
          reason: [bundle.method, bundle.reasoning].filter(Boolean).map(String).join(" · ") || undefined,
        }
      : normalizeYongsinLike(yongsinRaw);

  const huisin = r.huisin
    ? normalizeYongsinLike(r.huisin)
    : bundle
      ? { element: normalizeElementToken(bundle.huisin) }
      : normalizeYongsinLike((yongsinRaw as Record<string, unknown>)?.huisin);

  const gisin = r.gisin
    ? normalizeYongsinLike(r.gisin)
    : bundle
      ? { element: normalizeElementToken(bundle.gisin) }
      : normalizeYongsinLike((yongsinRaw as Record<string, unknown>)?.gisin);

  // 원신 계산
  const wonsinElement = calculateWonsin(yongsin.element);
  const wonsin = {
    element: wonsinElement,
    description: wonsinElement
      ? `${wonsinElement}(${getElementDescription(wonsinElement)})은 용신인 ${extractElementToken(yongsin.element)}${getEulReulParticle(yongsin.element)} 생하여 간접적으로 도움을 줍니다.`
      : undefined,
  };

  return {
    name: (r.name || r.type) as string | undefined,
    type: r.type as string | undefined,
    description: String(r.description || r.reasoning || ""),
    detailedExplanation: r.detailedExplanation as string | undefined,
    yongsin,
    wonsin,
    huisin,
    gisin,
  };
}

// 오행 한글 설명
function getElementDescription(element: string): string {
  const descriptions: Record<string, string> = {
    "목": "나무",
    "화": "불",
    "토": "흙",
    "금": "쇠",
    "수": "물",
  };
  return descriptions[element] || element;
}

function normalizeTenGodDistribution(raw: unknown): TenGodDistribution | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  const details: TenGodDetail[] = [];
  if (Array.isArray(r.details)) {
    for (const d of r.details) {
      const item = d as Record<string, unknown>;
      details.push({
        position: String(item.position || ""),
        stem: String(item.stem || ""),
        stemHanja: String(item.stemHanja || ""),
        element: String(item.element || ""),
        tenGod: String(item.tenGod || ""),
        tenGodHanja: String(item.tenGodHanja || ""),
      });
    }
  }

  const analysis = r.analysis as Record<string, unknown> || {};
  
  return {
    details,
    counts: (r.counts as Record<string, number>) || {},
    dominant: Array.isArray(r.dominant) ? r.dominant.map(String) : [],
    analysis: {
      bigyeop: Number(analysis.bigyeop || 0),
      siksang: Number(analysis.siksang || 0),
      jaecaeung: Number(analysis.jaecaeung || 0),
      gwanseong: Number(analysis.gwanseong || 0),
      inseong: Number(analysis.inseong || 0),
    },
  };
}

function normalizeDaeun(raw: unknown): DaeunData | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  const pillars: DaeunPillarData[] = [];
  if (Array.isArray(r.pillars)) {
    for (const p of r.pillars) {
      const item = p as Record<string, unknown>;
      pillars.push({
        stem: String(item.stem || ""),
        branch: String(item.branch || ""),
        stemHanja: String(item.stemHanja || item.stem_hanja || ""),
        branchHanja: String(item.branchHanja || item.branch_hanja || ""),
        element: String(item.element || ""),
        startAge: Number(item.startAge || item.start_age || 0),
        endAge: Number(item.endAge || item.end_age || 0),
        startYear: Number(item.startYear || item.start_year || 0),
        endYear: Number(item.endYear || item.end_year || 0),
      });
    }
  }

  let current: DaeunData["current"] = null;
  if (r.current) {
    const c = r.current as Record<string, unknown>;
    current = {
      pillar: String(c.pillar || ""),
      pillarHanja: String(c.pillarHanja || c.pillar_hanja || ""),
      element: String(c.element || ""),
      period: String(c.period || ""),
      yearsRemaining: Number(c.years_remaining || c.yearsRemaining || 0),
    };
  }

  return {
    startAge: Number(r.start_age || r.startAge || 0),
    direction: String(r.direction || ""),
    pillars,
    current,
  };
}

function normalizeSaeun(raw: unknown): SaeunData | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  return {
    year: Number(r.year || 2026),
    stem: String(r.stem || ""),
    branch: String(r.branch || ""),
    stemHanja: String(r.stemHanja || r.stem_hanja || ""),
    branchHanja: String(r.branchHanja || r.branch_hanja || ""),
    element: String(r.element || ""),
  };
}

function normalizeAreaFortune(raw: unknown): AreaFortuneData {
  if (!raw) return { grade: 0, description: "", advice: "" };
  const r = raw as Record<string, unknown>;
  return {
    grade: Number(r.grade || r.score || 0),
    gradeLabel: r.gradeLabel as string | undefined,
    description: String(r.description || ""),
    advice: String(r.advice || r.recommendation || ""),
    opportunities: Array.isArray(r.opportunities) ? r.opportunities.map(String) : undefined,
    risks: Array.isArray(r.risks) ? r.risks.map(String) : undefined,
  };
}

function normalizeAreaFortunes(raw: unknown): AreaFortunes | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  return {
    wealth: normalizeAreaFortune(r.wealth || r.finance || r.money),
    career: normalizeAreaFortune(r.career || r.work || r.job),
    health: normalizeAreaFortune(r.health),
    relationship: normalizeAreaFortune(r.relationship || r.love || r.romance),
  };
}

function normalizeLuckyElements(raw: unknown): LuckyElements | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  // colors 정규화
  let colors: string[] = [];
  if (Array.isArray(r.colors)) {
    colors = r.colors.map(c => typeof c === "string" ? c : (c as Record<string, unknown>)?.name as string || "").filter(Boolean);
  } else if (r.colors && typeof r.colors === "object") {
    const c = r.colors as Record<string, unknown>;
    if (c.primary) colors.push(typeof c.primary === "string" ? c.primary : (c.primary as Record<string, unknown>)?.name as string || "");
    if (c.secondary) colors.push(typeof c.secondary === "string" ? c.secondary : (c.secondary as Record<string, unknown>)?.name as string || "");
  }

  // numbers 정규화
  let numbers: number[] = [];
  if (Array.isArray(r.numbers)) {
    numbers = r.numbers.map(Number).filter(n => !isNaN(n));
  } else if (r.numbers && typeof r.numbers === "object") {
    const n = r.numbers as Record<string, unknown>;
    if (n.primary) numbers.push(Number(n.primary));
    if (n.secondary) numbers.push(Number(n.secondary));
  }

  // directions 정규화
  let directions: string[] = [];
  if (Array.isArray(r.directions)) {
    directions = r.directions.map(String);
  } else if (r.direction) {
    directions = [String(r.direction)];
  }

  // seasons 정규화
  let seasons: string[] = [];
  if (Array.isArray(r.seasons)) {
    seasons = r.seasons.map(String);
  } else if (r.season) {
    seasons = [String(r.season)];
  }

  return { colors, numbers, directions, seasons };
}

function normalizeYearlyFortune(raw: unknown): YearlyFortune | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  return {
    year: Number(r.year || 2026),
    pillar: r.pillar as string | undefined,
    pillarKorean: r.pillarKorean as string | undefined,
    theme: String(r.theme || ""),
    description: String(r.description || ""),
    monthlyHighlights: r.monthlyHighlights as YearlyFortune["monthlyHighlights"],
    keyMonths: r.keyMonths as YearlyFortune["keyMonths"],
  };
}

function normalizeCurrentLuckCycle(raw: unknown): CurrentLuckCycle | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  return {
    period: r.period as string | null,
    pillar: r.pillar as string | null,
    pillarKorean: r.pillarKorean as string | undefined,
    description: String(r.description || ""),
    opportunities: Array.isArray(r.opportunities) ? r.opportunities.map(String) : undefined,
    challenges: Array.isArray(r.challenges) ? r.challenges.map(String) : undefined,
    cautions: Array.isArray(r.cautions) ? r.cautions.map(String) : undefined,
    actionTips: Array.isArray(r.actionTips) ? r.actionTips.map(String) : undefined,
  };
}

function normalizeOverallAdvice(raw: unknown): OverallAdvice | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  
  return {
    coreMessage: String(r.coreMessage || r.core_message || ""),
    actionItems: Array.isArray(r.actionItems) ? r.actionItems.map(String) : [],
    cautions: Array.isArray(r.cautions) ? r.cautions.map(String) : [],
  };
}

function normalizeElementBalance(raw: unknown): Record<string, { count: number; percentage: number }> {
  if (!raw) return {};
  const r = raw as Record<string, unknown>;
  
  // elementBalance.distribution 또는 직접 객체 지원
  const dist = (r.distribution || r) as Record<string, unknown>;
  const result: Record<string, { count: number; percentage: number }> = {};
  
  for (const [key, val] of Object.entries(dist)) {
    if (["목", "화", "토", "금", "수"].includes(key)) {
      const v = val as Record<string, unknown>;
      result[key] = {
        count: Number(v.count || 0),
        percentage: Number(v.percentage || 0),
      };
    }
  }
  
  return result;
}

function normalizeCalculationProof(raw: unknown): CalculationProof | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  const refs = (r.references || {}) as Record<string, unknown>;
  
  // decisionLog 정규화 (배열 또는 객체)
  let decisionLog: Array<{ key: string; value: string }> = [];
  if (Array.isArray(r.decisionLog)) {
    decisionLog = r.decisionLog as CalculationProof["decisionLog"];
  } else if (r.decision_log && Array.isArray(r.decision_log)) {
    decisionLog = r.decision_log as CalculationProof["decisionLog"];
  }
  
  return {
    engineVersion: String(r.engineVersion || r.engine_version || ""),
    solarTermDataVersion: String(r.solarTermDataVersion || r.solar_term_data_version || ""),
    decisionLog,
    references: {
      ipchunAt: (refs.ipchunAt || refs.ipchun_at) as string | null,
      monthTermStart: (refs.monthTermStart || refs.month_term_start) as string | null,
      monthTermEnd: (refs.monthTermEnd || refs.month_term_end) as string | null,
      baseEpoch: String(refs.baseEpoch || refs.base_epoch || ""),
    },
  };
}

// ============= Main Normalizer =============

export function normalizeSajuResult(raw: unknown): NormalizedSajuResult {
  if (!raw || typeof raw !== "object") {
    return {
      sajuChart: null,
      dayMaster: null,
      elementBalance: {},
      elementBalanceAnalysis: null,
      structure: null,
      tenGodDistribution: null,
      daeun: null,
      saeun: null,
      currentLuckCycle: null,
      yearlyFortune: null,
      areaFortunes: null,
      luckyElements: null,
      overallAdvice: null,
      calculationProof: null,
      disclaimer: null,
      narrativeDescription: null,
      fullResultMarkdown: null,
    };
  }

  const r = raw as Record<string, unknown>;
  
  // elementBalance에서 analysis 필드 추출
  const elementBalanceRaw = r.elementBalance || r.element_balance || (r.chart as Record<string, unknown>)?.five_elements;
  const elementBalanceAnalysis = elementBalanceRaw && typeof elementBalanceRaw === "object" 
    ? (elementBalanceRaw as Record<string, unknown>).analysis as string | null
    : null;

  return {
    sajuChart: normalizeSajuChart(r.sajuChart || r.chart),
    dayMaster: normalizeDayMaster(r.dayMaster || r.day_master || (r.chart as Record<string, unknown>)?.day_master),
    elementBalance: normalizeElementBalance(r.elementBalance || r.element_balance || (r.chart as Record<string, unknown>)?.five_elements),
    elementBalanceAnalysis,
    structure: normalizeStructure(r.structure, r.yongsin),
    tenGodDistribution: normalizeTenGodDistribution(r.tenGodDistribution || r.ten_gods),
    daeun: normalizeDaeun(r.daeun),
    saeun: normalizeSaeun(r.saeun),
    currentLuckCycle: normalizeCurrentLuckCycle(r.currentLuckCycle || r.current_luck_cycle),
    yearlyFortune: normalizeYearlyFortune(r.yearlyFortune || r.yearly_fortune),
    areaFortunes: normalizeAreaFortunes(r.areaFortunes || r.area_fortunes),
    luckyElements: normalizeLuckyElements(r.luckyElements || r.lucky_elements),
    overallAdvice: normalizeOverallAdvice(r.overallAdvice || r.overall_advice),
    calculationProof: normalizeCalculationProof(r.calculationProof || r.calculation_proof),
    disclaimer: r.disclaimer as string | null,
    narrativeDescription: r.narrativeDescription as string | null,
    fullResultMarkdown: normalizeFullResultMarkdown(r.fullResultMarkdown || r.full_result_markdown),
  };
}

// fullResultMarkdown 정규화 (생략/빈값 처리)
function normalizeFullResultMarkdown(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  // "생략", 빈 문자열, 또는 너무 짧은 값은 null 처리
  if (!trimmed || trimmed === "생략" || trimmed.length < 10) return null;
  return trimmed;
}

// ============= Compatibility Result Types =============

export interface CompatibilityPersonStyle {
  strength: string;
  stressTrigger: string;
  wantsInRelationship: string;
}

export interface CompatibilityInteraction {
  synergies: string[];
  conflictTriggers: string[];
  adjustmentTips: string[];
}

export interface CompatibilityRelationshipAdvice {
  goodPatterns: string[];
  avoidPatterns: string[];
  twoWeekPlan: string[];
}

export interface CompatibilityYearlyFortune {
  year: number;
  theme: string;
  opportunities: string[];
  challenges: string[];
  advice: string;
}

export interface CompatibilityInputSummary {
  relationshipType: string;
  personA: string;
  personB: string;
  assumptions: string | null;
}

export interface CompatibilityDetailScore {
  label: string;
  score: number;
  description: string;
}

export interface NormalizedCompatibilityResult {
  overallScore: number;
  overallComment: string;
  details: CompatibilityDetailScore[];
  personAStyle: CompatibilityPersonStyle | null;
  personBStyle: CompatibilityPersonStyle | null;
  interaction: CompatibilityInteraction | null;
  relationshipAdvice: CompatibilityRelationshipAdvice | null;
  yearlyFortune: CompatibilityYearlyFortune | null;
  inputSummary: CompatibilityInputSummary | null;
  ethicsNotice: string | null;
}

// ============= Compatibility Normalization Functions =============

function normalizePersonStyle(raw: unknown): CompatibilityPersonStyle | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  return {
    strength: String(r.strength || ""),
    stressTrigger: String(r.stressTrigger || r.stress_trigger || ""),
    wantsInRelationship: String(r.wantsInRelationship || r.wants_in_relationship || ""),
  };
}

function normalizeInteraction(raw: unknown, fallbackData?: Record<string, unknown>): CompatibilityInteraction | null {
  const asStringArray = (v: unknown): string[] => 
    Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim().length > 0) : [];

  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    return {
      synergies: asStringArray(r.synergies),
      conflictTriggers: asStringArray(r.conflictTriggers || r.conflict_triggers),
      adjustmentTips: asStringArray(r.adjustmentTips || r.adjustment_tips),
    };
  }

  // 이전 스키마 지원 (strengths[], watchouts[], chemistry_points)
  if (fallbackData) {
    const strengths = (fallbackData.strengths as any[]) ?? [];
    const watchouts = (fallbackData.watchouts as any[]) ?? [];
    const chemistryPoints = fallbackData.chemistry_points as Record<string, any> | undefined;

    const synergies = strengths.map((s: any) => s?.title ?? "").filter(Boolean);
    const conflictTriggers = watchouts.map((w: any) => w?.title ?? "").filter(Boolean);
    const adjustmentTips: string[] = [];
    if (chemistryPoints?.emotional_bond?.tip) adjustmentTips.push(chemistryPoints.emotional_bond.tip);
    if (chemistryPoints?.communication_style?.tip) adjustmentTips.push(chemistryPoints.communication_style.tip);
    if (chemistryPoints?.conflict_pattern?.repair_tip) adjustmentTips.push(chemistryPoints.conflict_pattern.repair_tip);

    if (synergies.length === 0 && conflictTriggers.length === 0 && adjustmentTips.length === 0) return null;
    return { synergies, conflictTriggers, adjustmentTips };
  }

  return null;
}

function normalizeRelationshipAdvice(raw: unknown, fallbackData?: Record<string, unknown>): CompatibilityRelationshipAdvice | null {
  const asStringArray = (v: unknown): string[] => 
    Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim().length > 0) : [];

  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    return {
      goodPatterns: asStringArray(r.goodPatterns || r.good_patterns),
      avoidPatterns: asStringArray(r.avoidPatterns || r.avoid_patterns),
      twoWeekPlan: asStringArray(r.twoWeekPlan || r.two_week_plan),
    };
  }

  // 이전 스키마 지원
  if (fallbackData) {
    const strengths = (fallbackData.strengths as any[]) ?? [];
    const watchouts = (fallbackData.watchouts as any[]) ?? [];
    const actionPlan = fallbackData.action_plan as Record<string, any> | undefined;

    const goodPatterns = strengths.slice(0, 3).map((s: any) => s?.practical_tip ?? "").filter(Boolean);
    const avoidPatterns = watchouts.slice(0, 3).map((w: any) => w?.practical_tip ?? "").filter(Boolean);
    const twoWeekPlan: string[] = [];
    if (actionPlan?.week_1) twoWeekPlan.push(...asStringArray(actionPlan.week_1));
    if (actionPlan?.week_2) twoWeekPlan.push(...asStringArray(actionPlan.week_2));

    if (goodPatterns.length === 0 && avoidPatterns.length === 0 && twoWeekPlan.length === 0) return null;
    return { goodPatterns, avoidPatterns, twoWeekPlan };
  }

  return null;
}

function normalizeCompatibilityYearlyFortune(raw: unknown): CompatibilityYearlyFortune | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  
  const asStringArray = (v: unknown): string[] => 
    Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim().length > 0) : [];

  return {
    year: Number(r.year) || new Date().getFullYear(),
    theme: String(r.theme || r.pillar || ""),
    opportunities: asStringArray(r.opportunities),
    challenges: asStringArray(r.challenges),
    advice: String(r.advice || r.disclaimer || ""),
  };
}

function normalizeInputSummary(raw: unknown): CompatibilityInputSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  
  return {
    relationshipType: String(r.relationshipType || r.relationship_type || ""),
    personA: String(r.personA || r.person_a || ""),
    personB: String(r.personB || r.person_b || ""),
    assumptions: r.assumptions as string | null,
  };
}

function normalizeDetailScores(raw: unknown, fallbackScores?: Record<string, unknown>): CompatibilityDetailScore[] {
  const toNumber = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const normalizeScore = (v: unknown): number => {
    const n = toNumber(v);
    return n > 5 ? Math.round(n / 20) : Math.round(n);
  };

  // 새 스키마: details[] 배열
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((d: any) => ({
      label: String(d?.label ?? ""),
      score: clamp(toNumber(d?.score) ?? 0, 0, 5),
      description: String(d?.description ?? ""),
    }));
  }

  // 이전 스키마: scores.love 등
  if (fallbackScores) {
    const details: CompatibilityDetailScore[] = [];
    if (fallbackScores.love !== undefined) details.push({ label: "사랑/정서", score: clamp(normalizeScore(fallbackScores.love), 0, 5), description: "" });
    if (fallbackScores.communication !== undefined) details.push({ label: "의사소통", score: clamp(normalizeScore(fallbackScores.communication), 0, 5), description: "" });
    if (fallbackScores.values !== undefined) details.push({ label: "가치관", score: clamp(normalizeScore(fallbackScores.values), 0, 5), description: "" });
    if (fallbackScores.lifestyle !== undefined) details.push({ label: "생활방식", score: clamp(normalizeScore(fallbackScores.lifestyle), 0, 5), description: "" });
    return details;
  }

  return [];
}

// ============= Main Compatibility Normalizer =============

export function normalizeCompatibilityResult(raw: unknown): NormalizedCompatibilityResult {
  const emptyResult: NormalizedCompatibilityResult = {
    overallScore: 0,
    overallComment: "",
    details: [],
    personAStyle: null,
    personBStyle: null,
    interaction: null,
    relationshipAdvice: null,
    yearlyFortune: null,
    inputSummary: null,
    ethicsNotice: null,
  };

  if (!raw || typeof raw !== "object") {
    return emptyResult;
  }

  const r = raw as Record<string, unknown>;

  const toNumber = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  // Overall Score 읽기 (여러 경로 지원)
  const readOverallScore = (): number => {
    const candidates = [
      toNumber(r.overallScore),
      toNumber(r.overall_score),
      toNumber((r.scores as any)?.overall),
      toNumber((r.compatibility_summary as any)?.score?.overall),
    ];
    return candidates.find((v) => v > 0) ?? 0;
  };

  // Overall Comment 읽기
  const readOverallComment = (): string => {
    const candidates: unknown[] = [
      r.overallComment,
      r.overall_comment,
      (r.scores as any)?.interpretation,
      (r.storytelling_overview as any)?.narrative,
      r.summary,
    ];
    const v = candidates.find((x) => typeof x === "string" && x.trim().length > 0) as string | undefined;
    return v ?? "";
  };

  // Ethics Notice 읽기
  const readEthicsNotice = (): string | null => {
    const notice = r.ethicsNotice ?? r.ethics_notice ?? (r.meta as any)?.note ?? (r.meta as any)?.disclaimer;
    if (Array.isArray(notice)) return notice.join(" ");
    return typeof notice === "string" && notice.trim() ? notice : null;
  };

  return {
    overallScore: clamp(Math.round(readOverallScore()), 0, 100),
    overallComment: readOverallComment(),
    details: normalizeDetailScores(r.details, r.scores as Record<string, unknown>),
    personAStyle: normalizePersonStyle(r.personAStyle || r.person_a_style),
    personBStyle: normalizePersonStyle(r.personBStyle || r.person_b_style),
    interaction: normalizeInteraction(r.interaction, r),
    relationshipAdvice: normalizeRelationshipAdvice(r.relationshipAdvice || r.relationship_advice, r),
    yearlyFortune: normalizeCompatibilityYearlyFortune(r.yearlyFortune || r.yearly_fortune),
    inputSummary: normalizeInputSummary(r.inputSummary || r.input_summary),
    ethicsNotice: readEthicsNotice(),
  };
}
