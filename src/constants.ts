// 애플리케이션 상수 정의

export const APP_CONFIG = {
  name: "startup-helper",
  version: "1.4.0",
  description: "AI 창업 컨설턴트 - 상권분석, 비용계산, 손익분기, 인구분석, 경쟁업체, 정책지원금, 트렌드, 편의시설, 임대료시세, 매출시뮬레이션까지 12가지 도구 제공",
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

// 면책 문구 (Disclaimers)
export const DISCLAIMERS = {
  STARTUP_COST: "※ 본 비용은 통계 기반 추정치이며, 실제 비용은 입지·시세·협상에 따라 30% 이상 차이날 수 있습니다. 정확한 비용은 현장 조사 후 확정하시기 바랍니다.",
  BREAKEVEN: "※ 본 손익분기점 분석은 업종별 평균 데이터 기반 추정치입니다. 실제 수익은 운영 능력, 입지, 경쟁 상황, 계절 요인 등에 따라 크게 달라질 수 있습니다.",
  POPULATION: "※ 본 인구 데이터는 주요 상권 통계 기반 추정치이며, 실제 유동인구는 날씨, 요일, 이벤트 등에 따라 변동될 수 있습니다.",
  COMPETITION: "※ 경쟁업체 정보는 API 조회 시점 기준이며, 실시간으로 변동될 수 있습니다.",
  POLICY_FUND: "※ 정책지원금 정보는 기업마당 API 기준이며, 정확한 신청 조건과 마감일은 해당 기관에서 확인하시기 바랍니다.",
  GENERAL: "※ 본 분석 결과는 참고용이며, 실제 창업 결정 시에는 전문가 상담을 권장합니다.",
} as const;
