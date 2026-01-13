// 오늘의 운세용 로컬스토리지 유틸리티

const STORAGE_KEY = "sajuking_user_birth";
const FORTUNE_CACHE_KEY = "sajuking_daily_fortune";

export interface UserBirthInfo {
  name: string;
  birthDate: string; // YYYY-MM-DD
  savedAt: string;
}

export interface CachedFortune {
  date: string; // YYYY-MM-DD
  data: any;
  cachedAt: string;
}

// 생년월일 저장
export const saveUserBirthInfo = (name: string, birthDate: string): void => {
  const info: UserBirthInfo = {
    name,
    birthDate,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
};

// 생년월일 조회
export const getUserBirthInfo = (): UserBirthInfo | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as UserBirthInfo;
  } catch {
    return null;
  }
};

// 생년월일 파싱 (YYYY-MM-DD → year, month, day)
export const parseBirthDate = (birthDate: string): { year: string; month: string; day: string } | null => {
  try {
    const parts = birthDate.split("-");
    if (parts.length !== 3) return null;
    return {
      year: parts[0],
      month: parts[1].replace(/^0/, ""), // 앞의 0 제거
      day: parts[2].replace(/^0/, ""),   // 앞의 0 제거
    };
  } catch {
    return null;
  }
};

// 생년월일 삭제
export const clearUserBirthInfo = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FORTUNE_CACHE_KEY);
};

// 오늘 날짜 문자열 (한국 시간)
const getTodayString = (): string => {
  const now = new Date();
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaTime = new Date(now.getTime() + koreaOffset);
  return koreaTime.toISOString().split("T")[0];
};

// 운세 캐시 저장
export const cacheDailyFortune = (data: any): void => {
  const cache: CachedFortune = {
    date: getTodayString(),
    data,
    cachedAt: new Date().toISOString(),
  };
  localStorage.setItem(FORTUNE_CACHE_KEY, JSON.stringify(cache));
};

// 캐시된 운세 조회 (오늘 날짜만 유효)
export const getCachedFortune = (): any | null => {
  try {
    const data = localStorage.getItem(FORTUNE_CACHE_KEY);
    if (!data) return null;
    
    const cache = JSON.parse(data) as CachedFortune;
    const today = getTodayString();
    
    // 오늘 날짜가 아니면 캐시 무효
    if (cache.date !== today) {
      localStorage.removeItem(FORTUNE_CACHE_KEY);
      return null;
    }
    
    return cache.data;
  } catch {
    return null;
  }
};

// 운세 캐시 삭제
export const clearFortuneCache = (): void => {
  localStorage.removeItem(FORTUNE_CACHE_KEY);
};
