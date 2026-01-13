// Saju Analysis Response Types (Prompt 1)
export interface SajuAnalysisResult {
  day_master: {
    name: string;
    element: string;
    image: string;
    essence: string;
  };
  personality: {
    visible: string[];
    hidden: string[];
    under_stress: string;
  };
  strengths: Array<{
    trait: string;
    basis: string;
    manifestation: string;
  }>;
  weaknesses: Array<{
    trait: string;
    caution: string;
    growth_tip: string;
  }>;
  relationship: {
    attracted_to: string;
    synergy_with: string;
    caution_pattern: string;
  };
  year_2026: {
    energy: string;
    keyword: string;
    message: string;
  };
}

// MBTI Analysis Response Types (Prompt 2)
export interface MBTIAnalysisResult {
  type_essence: {
    dominant_function: string;
    auxiliary_function: string;
    core_motivation: string;
    keywords: string[];
  };
  personality: {
    energy: { direction: string; description: string };
    perception: { preference: string; description: string };
    judgment: { preference: string; description: string };
    lifestyle: { preference: string; description: string };
  };
  strengths: Array<{
    trait: string;
    cognitive_basis: string;
    manifestation: string;
  }>;
  growth_points: Array<{
    area: string;
    challenge: string;
    growth_direction: string;
  }>;
  relationship: {
    ideal_partners: string[];
    gives: string;
    needs: string;
    conflict_pattern: string;
  };
  communication: {
    preferred_style: string;
    often_misunderstood: string;
    effective_approach: string;
  };
}

// Integrated Analysis Response Types (Prompt 3)
export interface IntegratedAnalysisResult {
  cross_analysis: {
    synergy_points: Array<{
      point: string;
      saju_basis: string;
      mbti_basis: string;
      interpretation: string;
    }>;
    interesting_tensions: Array<{
      tension: string;
      interpretation: string;
    }>;
    hidden_potential: string;
  };
  integrated_profile: {
    type_name: string;
    core_sentence: string;
    emoji: string;
    description: string;
    strengths: Array<{
      trait: string;
      hashtag: string;
    }>;
    growth_points: Array<{
      area: string;
      tip: string;
    }>;
    relationship_insight: {
      best_match: string;
      growth_partner: string;
      tip: string;
    };
  };
  card_contents: {
    main_card: {
      title: string;
      subtitle: string;
      hashtags: string[];
    };
    mbti_cross_card: {
      insight: string;
      fun_point: string;
    };
    fortune_card: {
      keyword: string;
      message: string;
      lucky_month: string;
      lucky_color: string;
    };
    share_captions: {
      self_expression: string;
      empathy_inducing: string;
    };
  };
}

// Element Balance (서버에서 계산된 오행 밸런스)
export interface ElementBalance {
  counts: Record<string, number>;
  percentages: Record<string, number>;
  dominant: string[];
  weak: string[];
  analysis: string;
}

// Full API Response
export interface SajuTypeAnalysisResponse {
  saju_analysis: SajuAnalysisResult;
  mbti_analysis: MBTIAnalysisResult;
  integrated_analysis: IntegratedAnalysisResult;
  element_balance?: ElementBalance; // 서버에서 계산된 오행 밸런스
  input_summary: {
    pillars: {
      year: PillarData;
      month: PillarData;
      day: PillarData;
      hour?: PillarData;
    };
    gender: string;
    mbti: string;
    userName?: string;
  };
}

export interface PillarData {
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  element: string;
}
