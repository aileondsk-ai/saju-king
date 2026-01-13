// 사주 서비스 프롬프트 시스템 설정
// PRD 기반 프롬프트 구조

export const SAJU_PROMPTS = {
  version: "1.0.0",
  service: "saju_fortune_service",
  
  // 챗봇 페르소나
  chatbot: {
    name: "운세도우미",
    personality: "따뜻하고 친근하며, 전문성과 공감 능력을 겸비",
    speakingStyle: "존댓말, 이모지 적절히 활용, 전문용어 쉽게 설명",
    conversationFlow: ["경청", "공감", "분석", "조언", "격려"],
    
    initialGreeting: `안녕하세요! 😊 사주 분석 결과를 바탕으로 상담해드릴 운세도우미예요.
분석 결과에 대해 궁금한 점이 있으시거나, 특정 영역(재물, 직업, 연애 등)에 대해 더 자세히 알고 싶으신 부분이 있으시면 편하게 질문해주세요~`,
    
    suggestedTopics: [
      "올해 재물운이 궁금해요",
      "직장을 옮겨도 될까요?",
      "연애운은 어떤가요?",
      "건강 관리 조언 부탁해요",
    ],
  },
  
  // 오행 의미
  elementMeanings: {
    목: { organ: "간/담", direction: "동쪽", color: "청색/녹색", season: "봄" },
    화: { organ: "심장/소장", direction: "남쪽", color: "적색", season: "여름" },
    토: { organ: "비장/위", direction: "중앙", color: "황색", season: "환절기" },
    금: { organ: "폐/대장", direction: "서쪽", color: "백색", season: "가을" },
    수: { organ: "신장/방광", direction: "북쪽", color: "흑색", season: "겨울" },
  },
  
  // 십신 정의
  tenGods: {
    비견: { hanja: "比肩", meaning: "동등한 존재, 동료/경쟁자" },
    겁재: { hanja: "劫財", meaning: "재물 경쟁자, 추진력" },
    식신: { hanja: "食神", meaning: "재능, 표현, 자녀" },
    상관: { hanja: "傷官", meaning: "창의성, 반항, 표현" },
    편재: { hanja: "偏財", meaning: "유동재산, 사업수완" },
    정재: { hanja: "正財", meaning: "안정수입, 저축" },
    편관: { hanja: "偏官/七殺", meaning: "도전, 권위, 투쟁" },
    정관: { hanja: "正官", meaning: "직장, 명예, 규범" },
    편인: { hanja: "偏印/梟神", meaning: "특수지식, 직관" },
    정인: { hanja: "正印", meaning: "학습, 보호, 어머니" },
  },
  
  // 운세 등급
  fortuneGradeScale: {
    1: "매우 주의 필요",
    2: "주의 필요", 
    3: "보통",
    4: "좋음",
    5: "매우 좋음",
  },
  
  // 윤리적 경계
  ethicalBoundaries: {
    medicalLegalFinancial: "해당 전문가 상담을 권유드려요.",
    deterministicPrediction: "사주는 참고 도구일 뿐, 결정은 본인께서 하시는 거예요.",
    thirdPartyAnalysis: "다른 분의 사주는 개인정보 보호 원칙상 분석해드리기 어려워요.",
    excessiveDependency: "사주는 참고용으로 활용하시고, 중요한 결정은 다양한 요소를 고려해주세요.",
  },
};

// 샘플 사용자 프로필 (데모용)
export const SAMPLE_USER_PROFILE = {
  name: "현정",
  birthDate: "1987년 5월 15일",
  birthTime: "오전 9시",
  calendarType: "solar" as const,
  gender: "female" as const,
  
  // 사주 원국
  fourPillars: {
    year: { gan: "정", ji: "묘", element: "화목" },
    month: { gan: "을", ji: "사", element: "목화" },
    day: { gan: "무", ji: "진", element: "토토" },
    hour: { gan: "병", ji: "진", element: "화토" },
  },
  
  // 오행 분포
  fiveElements: {
    wood: { count: 2, percentage: 20 },
    fire: { count: 3, percentage: 30 },
    earth: { count: 4, percentage: 40 },
    metal: { count: 0, percentage: 0 },
    water: { count: 1, percentage: 10 },
  },
  
  // 일간 분석
  dayMaster: "무토",
  strength: "신강" as const,
  structure: "비견격",
  usefulGod: "금",
  
  // 운세 등급
  fortuneGrades: {
    wealth: 4,
    career: 4,
    health: 3,
    relationship: 5,
  },
  
  // 현재 대운
  currentLuckCycle: "경오 (2020-2029)",
  yearFortune: "을사년 (2025)",
  
  // 행운 요소
  luckyElements: {
    color: "흰색, 은색",
    number: "4, 9",
    direction: "서쪽",
  },
};

export type UserProfile = typeof SAMPLE_USER_PROFILE;
