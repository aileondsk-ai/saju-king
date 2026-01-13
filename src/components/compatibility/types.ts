// 궁합 분석 결과 타입 정의
// 정규화 레이어와 호환되는 타입

import {
  CompatibilityPersonStyle,
  CompatibilityInteraction,
  CompatibilityRelationshipAdvice,
  CompatibilityYearlyFortune,
  CompatibilityInputSummary,
  CompatibilityDetailScore,
  NormalizedCompatibilityResult,
} from "@/lib/saju-result-normalizer";

// Re-export normalized types for convenience
export type PersonStyle = CompatibilityPersonStyle;
export type Interaction = CompatibilityInteraction;
export type RelationshipAdvice = CompatibilityRelationshipAdvice;
export type YearlyFortune = CompatibilityYearlyFortune;
export type InputSummary = CompatibilityInputSummary;
export type DetailScore = CompatibilityDetailScore;
export type CompatibilityResult = NormalizedCompatibilityResult;

export interface PersonFormData {
  name: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour?: string;
}

export interface CompatibilityFormDataWithId {
  id: string;
  relationType: string;
  person1: PersonFormData;
  person2: PersonFormData;
}

export const RELATION_LABELS: Record<string, string> = {
  lover: "연인",
  friend: "친구",
  family: "가족",
  business: "비즈니스 파트너",
};
