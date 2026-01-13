export interface SajuType {
  ilgan: string;
  ilganKo: string;
  name: string;
  icon: string;
  color: string;
  keywords: { label: string; score: number }[];
  traits: string[];
  description: string;
  quote: string;
}

export const SAJU_TYPES: SajuType[] = [
  {
    ilgan: "甲",
    ilganKo: "갑목",
    name: "성장하는 대나무",
    icon: "🎋",
    color: "from-green-500 to-emerald-600",
    keywords: [
      { label: "리더십", score: 5 },
      { label: "도전정신", score: 5 },
      { label: "고집", score: 4 },
      { label: "융통성", score: 2 },
    ],
    traits: [
      "곧게 뻗어나가는 성장 에너지",
      "한번 정하면 끝까지 밀고 나감",
      "새로운 시작을 두려워하지 않음",
      "주변을 이끄는 리더 기질",
    ],
    description: "곧게 뻗어나가는 대나무처럼 성장을 멈추지 않는 타입이에요. 새로운 도전을 두려워하지 않죠.",
    quote: "멈추지 않으면 반드시 도착한다",
  },
  {
    ilgan: "乙",
    ilganKo: "을목",
    name: "유연한 덩굴",
    icon: "🌿",
    color: "from-lime-500 to-green-500",
    keywords: [
      { label: "적응력", score: 5 },
      { label: "유연함", score: 5 },
      { label: "인내", score: 4 },
      { label: "추진력", score: 2 },
    ],
    traits: [
      "어떤 환경에서도 살아남는 생명력",
      "부드럽게 휘어져도 꺾이지 않음",
      "감성적이고 섬세한 관찰력",
      "주변과 조화를 이루며 성장",
    ],
    description: "어떤 환경에서도 살아남는 덩굴처럼 유연하게 적응하는 타입이에요.",
    quote: "부드러운 것이 결국 단단한 것을 이긴다",
  },
  {
    ilgan: "丙",
    ilganKo: "병화",
    name: "빛나는 태양",
    icon: "☀️",
    color: "from-orange-500 to-red-500",
    keywords: [
      { label: "열정", score: 5 },
      { label: "긍정", score: 5 },
      { label: "카리스마", score: 4 },
      { label: "인내심", score: 2 },
    ],
    traits: [
      "주변을 환하게 밝히는 존재감",
      "에너지가 넘치고 활동적",
      "솔직하고 숨김이 없음",
      "사람들에게 영감을 주는 능력",
    ],
    description: "주변을 환하게 밝히는 태양 같은 존재예요. 에너지가 넘치고 사람들에게 영감을 줍니다.",
    quote: "태양처럼 빛나면 그림자는 저절로 사라진다",
  },
  {
    ilgan: "丁",
    ilganKo: "정화",
    name: "따뜻한 촛불",
    icon: "🕯️",
    color: "from-amber-500 to-orange-500",
    keywords: [
      { label: "섬세함", score: 5 },
      { label: "집중력", score: 5 },
      { label: "따뜻함", score: 4 },
      { label: "추진력", score: 2 },
    ],
    traits: [
      "은은하게 빛나는 내면의 열정",
      "섬세하고 깊은 통찰력",
      "한 곳에 집중하는 몰입력",
      "가까운 사람에게 헌신적",
    ],
    description: "은은하게 빛나는 촛불처럼 주변에 따스함을 전하는 타입이에요.",
    quote: "작은 불꽃이 어둠을 밝힌다",
  },
  {
    ilgan: "戊",
    ilganKo: "무토",
    name: "산 위의 전략가",
    icon: "🏔️",
    color: "from-amber-700 to-yellow-600",
    keywords: [
      { label: "듬직함", score: 5 },
      { label: "신뢰감", score: 5 },
      { label: "고집", score: 4 },
      { label: "속도", score: 2 },
    ],
    traits: [
      "산처럼 묵직하고 안정적",
      "한번 믿으면 끝까지, 한번 아니면 끝까지",
      "겉은 무덤덤, 속은 의외로 따뜻함",
      "급하게 움직이는 거 싫어함",
    ],
    description: "산처럼 듬직하고 한번 정하면 끝까지 가는 타입이에요. 주변에 든든한 존재죠.",
    quote: "흔들리지 않는 존재감, 묵묵히 버티다 결국 이긴다",
  },
  {
    ilgan: "己",
    ilganKo: "기토",
    name: "비옥한 대지",
    icon: "🌾",
    color: "from-yellow-700 to-amber-600",
    keywords: [
      { label: "포용력", score: 5 },
      { label: "겸손", score: 5 },
      { label: "실용성", score: 4 },
      { label: "결단력", score: 2 },
    ],
    traits: [
      "모든 것을 품어주는 넓은 마음",
      "욕심 없이 묵묵히 지원하는 스타일",
      "실용적이고 현실적인 판단",
      "변화에 시간이 걸리지만 확실함",
    ],
    description: "모든 것을 품어주는 대지처럼 포용력이 넓은 타입이에요.",
    quote: "낮은 곳에서 모든 것을 키워낸다",
  },
  {
    ilgan: "庚",
    ilganKo: "경금",
    name: "단단한 강철",
    icon: "⚔️",
    color: "from-slate-400 to-zinc-500",
    keywords: [
      { label: "결단력", score: 5 },
      { label: "정의감", score: 5 },
      { label: "추진력", score: 4 },
      { label: "유연함", score: 2 },
    ],
    traits: [
      "강철처럼 단단한 의지",
      "한번 결정하면 밀고 나가는 추진력",
      "불의를 참지 못하는 정의감",
      "직설적이고 명확한 소통",
    ],
    description: "강철처럼 단단한 의지를 가진 타입이에요. 한번 결정하면 밀고 나가죠.",
    quote: "망설이지 않는다, 결정하고 실행한다",
  },
  {
    ilgan: "辛",
    ilganKo: "신금",
    name: "빛나는 보석",
    icon: "💎",
    color: "from-cyan-400 to-blue-400",
    keywords: [
      { label: "완벽주의", score: 5 },
      { label: "예리함", score: 5 },
      { label: "아름다움", score: 4 },
      { label: "대범함", score: 2 },
    ],
    traits: [
      "보석처럼 빛나는 존재감",
      "디테일에 강한 완벽주의자",
      "날카로운 분석력과 감각",
      "자존심이 높고 품격을 중시",
    ],
    description: "보석처럼 빛나고 예리한 감각을 가진 타입이에요. 디테일에 강합니다.",
    quote: "작은 흠집도 허락하지 않는다",
  },
  {
    ilgan: "壬",
    ilganKo: "임수",
    name: "넓은 바다",
    icon: "🌊",
    color: "from-blue-500 to-cyan-600",
    keywords: [
      { label: "지혜", score: 5 },
      { label: "포용", score: 5 },
      { label: "자유", score: 4 },
      { label: "집중력", score: 2 },
    ],
    traits: [
      "바다처럼 깊고 넓은 마음",
      "어디든 흘러가는 자유로운 영혼",
      "다양한 사람과 잘 어울림",
      "깊은 지식과 통찰력",
    ],
    description: "바다처럼 깊고 넓은 마음을 가진 타입이에요. 자유를 사랑하죠.",
    quote: "물은 막힘없이 흘러 결국 바다에 이른다",
  },
  {
    ilgan: "癸",
    ilganKo: "계수",
    name: "맑은 샘물",
    icon: "💧",
    color: "from-sky-400 to-blue-500",
    keywords: [
      { label: "직관력", score: 5 },
      { label: "창의성", score: 5 },
      { label: "순수함", score: 4 },
      { label: "추진력", score: 2 },
    ],
    traits: [
      "맑은 샘물처럼 순수한 마음",
      "뛰어난 직관력과 영감",
      "창의적이고 독특한 아이디어",
      "조용하지만 깊은 내면 세계",
    ],
    description: "맑은 샘물처럼 순수하고 직관력이 뛰어난 타입이에요.",
    quote: "맑은 물이 깊은 곳까지 비춘다",
  },
];

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export const MBTI_NAMES: Record<string, string> = {
  "INTJ": "전략가",
  "INTP": "논리술사",
  "ENTJ": "통솔자",
  "ENTP": "변론가",
  "INFJ": "옹호자",
  "INFP": "중재자",
  "ENFJ": "선도자",
  "ENFP": "활동가",
  "ISTJ": "현실주의자",
  "ISFJ": "수호자",
  "ESTJ": "경영자",
  "ESFJ": "집정관",
  "ISTP": "장인",
  "ISFP": "모험가",
  "ESTP": "사업가",
  "ESFP": "연예인",
};

export interface MBTICrossInsight {
  category: string;
  sajuLabel: string;
  mbtiLabel: string;
  match: "일치" | "비슷" | "다름";
}

export interface MBTIAnalysis {
  relation: string;
  message: string;
  commonKeywords: string[];
  interestingDifference: string;
  combinedResult: string;
  crossInsights: MBTICrossInsight[];
}

const MBTI_ILGAN_ANALYSIS: Record<string, Record<string, MBTIAnalysis>> = {
  "甲": {
    "ENTJ": {
      relation: "최고의 조합",
      message: "함께라면 못 할 게 없어요!",
      commonKeywords: ["리더십", "목표 지향", "추진력"],
      interestingDifference: "사주는 성장 중심 → ENTJ는 결과 중심",
      combinedResult: "목표를 향해 끊임없이 성장하는 진정한 리더",
      crossInsights: [
        { category: "에너지", sajuLabel: "상승/확장", mbtiLabel: "외향적", match: "일치" },
        { category: "판단", sajuLabel: "직진형", mbtiLabel: "논리적", match: "비슷" },
        { category: "관계", sajuLabel: "이끄는 스타일", mbtiLabel: "지배적", match: "일치" },
        { category: "표현", sajuLabel: "행동으로", mbtiLabel: "직접적", match: "일치" },
      ],
    },
    "INFJ": {
      relation: "흥미로운 조합",
      message: "깊은 대화가 통해요",
      commonKeywords: ["성장 지향", "이상주의", "목표 의식"],
      interestingDifference: "사주는 앞으로 뻗어감 → INFJ는 내면으로 깊어짐",
      combinedResult: "겉으로는 성장하고 속으로는 성찰하는 균형잡힌 인물",
      crossInsights: [
        { category: "에너지", sajuLabel: "상승/확장", mbtiLabel: "내향적", match: "다름" },
        { category: "판단", sajuLabel: "직진형", mbtiLabel: "직관+확신", match: "비슷" },
        { category: "관계", sajuLabel: "이끄는 스타일", mbtiLabel: "소수 정예", match: "다름" },
        { category: "표현", sajuLabel: "행동으로", mbtiLabel: "글/깊은 대화", match: "다름" },
      ],
    },
  },
  "戊": {
    "INFJ": {
      relation: "묵직한 조합",
      message: "평소엔 조용, 신념 앞에선 강철",
      commonKeywords: ["신중함", "깊은 내면", "소수와의 깊은 관계", "묵묵한 실행력"],
      interestingDifference: "사주는 '움직이기 싫어, 버틸래' → INFJ는 '옳은 일이면 나서야지'",
      combinedResult: "평소엔 조용하지만, 신념 건드리면 불도저",
      crossInsights: [
        { category: "에너지", sajuLabel: "안으로 축적", mbtiLabel: "내향적", match: "일치" },
        { category: "판단", sajuLabel: "천천히, 확실하게", mbtiLabel: "직관+확신", match: "비슷" },
        { category: "관계", sajuLabel: "좁고 깊게", mbtiLabel: "소수 정예", match: "일치" },
        { category: "표현", sajuLabel: "말보다 행동", mbtiLabel: "글/깊은 대화", match: "다름" },
      ],
    },
    "ISTJ": {
      relation: "최고의 조합",
      message: "신뢰로 단단해요",
      commonKeywords: ["안정감", "신뢰", "책임감", "일관성"],
      interestingDifference: "둘 다 묵묵하지만, ISTJ가 더 체계적",
      combinedResult: "한번 맡으면 끝까지 책임지는 든든한 버팀목",
      crossInsights: [
        { category: "에너지", sajuLabel: "안으로 축적", mbtiLabel: "내향적", match: "일치" },
        { category: "판단", sajuLabel: "천천히, 확실하게", mbtiLabel: "논리적/체계적", match: "일치" },
        { category: "관계", sajuLabel: "좁고 깊게", mbtiLabel: "신뢰 기반", match: "일치" },
        { category: "표현", sajuLabel: "말보다 행동", mbtiLabel: "행동으로 증명", match: "일치" },
      ],
    },
    "ESTJ": {
      relation: "훌륭한 조합",
      message: "함께 안정을 만들어요",
      commonKeywords: ["책임감", "실행력", "체계", "신뢰"],
      interestingDifference: "사주는 수비형 → ESTJ는 공격형 리더",
      combinedResult: "조직을 든든하게 이끄는 실행형 리더",
      crossInsights: [
        { category: "에너지", sajuLabel: "안으로 축적", mbtiLabel: "외향적", match: "다름" },
        { category: "판단", sajuLabel: "천천히, 확실하게", mbtiLabel: "빠른 결정", match: "다름" },
        { category: "관계", sajuLabel: "좁고 깊게", mbtiLabel: "넓게", match: "다름" },
        { category: "표현", sajuLabel: "말보다 행동", mbtiLabel: "직접적 지시", match: "비슷" },
      ],
    },
  },
};

export function getMBTIAnalysis(ilgan: string, mbti: string): MBTIAnalysis {
  const ilganMap = MBTI_ILGAN_ANALYSIS[ilgan];
  if (ilganMap && ilganMap[mbti]) {
    return ilganMap[mbti];
  }
  
  // Default analysis for non-mapped combinations
  return {
    relation: "탐험적 조합",
    message: "새로운 조합을 탐험해보세요!",
    commonKeywords: ["가능성", "다양성", "탐구"],
    interestingDifference: "서로 다른 점에서 배울 수 있어요",
    combinedResult: "서로를 보완하며 성장하는 관계",
    crossInsights: [
      { category: "에너지", sajuLabel: "고유한 흐름", mbtiLabel: mbti[0] === "E" ? "외향적" : "내향적", match: "비슷" },
      { category: "판단", sajuLabel: "자연스럽게", mbtiLabel: mbti[2] === "T" ? "논리적" : "감성적", match: "비슷" },
      { category: "관계", sajuLabel: "자기만의 방식", mbtiLabel: mbti[3] === "J" ? "계획적" : "자유로운", match: "비슷" },
      { category: "표현", sajuLabel: "상황에 따라", mbtiLabel: "다양하게", match: "비슷" },
    ],
  };
}

// Legacy function for backward compatibility
export function getMBTIRelation(ilgan: string, mbti: string) {
  const analysis = getMBTIAnalysis(ilgan, mbti);
  return {
    relation: analysis.relation,
    message: analysis.message,
  };
}

export function getSajuTypeByIlgan(ilgan: string): SajuType | undefined {
  return SAJU_TYPES.find((t) => t.ilgan === ilgan);
}

// 2026년 운세 데이터
export interface YearlyFortune2026 {
  summary: string;
  firstHalf: { emoji: string; label: string };
  secondHalf: { emoji: string; label: string };
  luckyMonths: number[];
  cautionMonths: number[];
  lucky: {
    color: string;
    number: number[];
    direction: string;
  };
}

export function getYearlyFortune2026(ilgan: string): YearlyFortune2026 {
  const fortuneMap: Record<string, YearlyFortune2026> = {
    "甲": {
      summary: "새로운 시작의 해, 과감히 도전하라",
      firstHalf: { emoji: "🌱", label: "씨앗 뿌리기" },
      secondHalf: { emoji: "🌳", label: "성장 가속" },
      luckyMonths: [3, 5, 9],
      cautionMonths: [6, 12],
      lucky: { color: "초록", number: [3, 8], direction: "동쪽" },
    },
    "乙": {
      summary: "유연함이 기회가 되는 해",
      firstHalf: { emoji: "🌿", label: "적응과 관찰" },
      secondHalf: { emoji: "🌸", label: "꽃피우기" },
      luckyMonths: [2, 6, 10],
      cautionMonths: [4, 8],
      lucky: { color: "연두", number: [2, 7], direction: "동남쪽" },
    },
    "丙": {
      summary: "열정을 불태울 때, 망설이지 마라",
      firstHalf: { emoji: "🔥", label: "열정 폭발" },
      secondHalf: { emoji: "⭐", label: "빛나는 성과" },
      luckyMonths: [1, 5, 11],
      cautionMonths: [3, 9],
      lucky: { color: "빨강", number: [1, 9], direction: "남쪽" },
    },
    "丁": {
      summary: "집중하면 빛난다, 흩어지면 사그라진다",
      firstHalf: { emoji: "🕯️", label: "내면 충전" },
      secondHalf: { emoji: "✨", label: "은은한 빛" },
      luckyMonths: [4, 8, 12],
      cautionMonths: [2, 7],
      lucky: { color: "보라", number: [4, 6], direction: "남동쪽" },
    },
    "戊": {
      summary: "기다린 만큼 온다, 조급함만 버려라",
      firstHalf: { emoji: "🌱", label: "준비와 내실" },
      secondHalf: { emoji: "🎯", label: "기회 포착" },
      luckyMonths: [4, 10],
      cautionMonths: [7],
      lucky: { color: "브라운, 베이지", number: [5, 8], direction: "중앙, 남서" },
    },
    "己": {
      summary: "품어온 것들이 열매 맺는 해",
      firstHalf: { emoji: "🌾", label: "돌봄과 가꿈" },
      secondHalf: { emoji: "🍂", label: "수확의 계절" },
      luckyMonths: [5, 9, 11],
      cautionMonths: [1, 6],
      lucky: { color: "노랑", number: [5, 10], direction: "중앙" },
    },
    "庚": {
      summary: "결단의 해, 칼을 뽑았으면 베어라",
      firstHalf: { emoji: "⚔️", label: "결단과 정리" },
      secondHalf: { emoji: "🏆", label: "승리의 결실" },
      luckyMonths: [2, 7, 10],
      cautionMonths: [4, 11],
      lucky: { color: "흰색, 은색", number: [4, 9], direction: "서쪽" },
    },
    "辛": {
      summary: "빛나려면 다듬어야 한다",
      firstHalf: { emoji: "💎", label: "연마와 정제" },
      secondHalf: { emoji: "👑", label: "진가 발휘" },
      luckyMonths: [3, 8, 12],
      cautionMonths: [5, 9],
      lucky: { color: "금색", number: [1, 6], direction: "서북쪽" },
    },
    "壬": {
      summary: "흐름을 타라, 막히면 돌아가라",
      firstHalf: { emoji: "🌊", label: "탐색과 확장" },
      secondHalf: { emoji: "🚀", label: "도약의 순간" },
      luckyMonths: [1, 6, 11],
      cautionMonths: [3, 8],
      lucky: { color: "검정, 파랑", number: [1, 6], direction: "북쪽" },
    },
    "癸": {
      summary: "직감을 믿어라, 답은 이미 알고 있다",
      firstHalf: { emoji: "💧", label: "침잠과 통찰" },
      secondHalf: { emoji: "🌈", label: "영감 실현" },
      luckyMonths: [2, 7, 10],
      cautionMonths: [4, 12],
      lucky: { color: "하늘색", number: [2, 7], direction: "북동쪽" },
    },
  };

  return fortuneMap[ilgan] || fortuneMap["戊"];
}
