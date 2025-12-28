// 애플리케이션 상수 정의

export const APP_CONFIG = {
  name: "startup-helper",
  version: "1.1.0",
  description: "AI 창업 컨설턴트 - 상권분석, 지역비교, 경쟁업체, 정책지원금, 트렌드까지 6가지 도구 제공",
} as const;

export const SERVER_CONFIG = {
  defaultPort: 3000,
  maxSessions: 1000,
  requestTimeout: 10000,
} as const;

export const API_DEFAULTS = {
  searchRadius: 500,
  competitorLimit: 10,
  policyFundLimit: 10,
  trendPeriod: "6months",
} as const;

export const DATA_SOURCES = {
  kakaoLocal: "카카오맵 로컬 API",
  sbizApi: "소상공인시장진흥공단 상권정보 API",
  bizinfoApi: "기업마당 지원사업정보 API",
} as const;

// 업종 카테고리 코드 (카카오맵)
export const CATEGORY_CODES = {
  대형마트: "MT1",
  편의점: "CS2",
  음식점: "FD6",
  카페: "CE7",
  병원: "HP8",
  약국: "PM9",
  문화시설: "CT1",
  숙박: "AD5",
} as const;

// 상권 유형
export const AREA_TYPES = {
  DEVELOPED: "발달상권",
  ALLEY: "골목상권",
  TRADITIONAL: "전통시장",
  TOURIST: "관광특구",
} as const;

// 포화도 레벨
export const SATURATION_LEVELS = {
  LOW: { label: "낮음", min: 0, max: 40 },
  MEDIUM: { label: "보통", min: 40, max: 60 },
  HIGH: { label: "높음", min: 60, max: 80 },
  SATURATED: { label: "포화", min: 80, max: 100 },
} as const;

// 정책지원금 분야
export const POLICY_CATEGORIES = {
  STARTUP: "창업",
  FINANCE: "금융",
  TECH: "기술",
  HR: "인력",
  EXPORT: "수출",
  DOMESTIC: "내수",
  MANAGEMENT: "경영",
  OTHER: "기타",
} as const;
