// 공통 타입 정의

// API 응답 기본 형태
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    suggestion?: string;
  };
  meta?: {
    source: string;
    timestamp: string;
    cached?: boolean;
    dataNote?: string;
  };
}

// 좌표
export interface Coordinates {
  lat: number;
  lng: number;
}

// 위치 정보
export interface Location {
  name: string;
  address: string;
  coordinates: Coordinates;
}

// 상권 분석 결과
export interface CommercialAreaData {
  location: Location;
  areaType: string;
  characteristics: string[];
  density: {
    totalStores: number;
    categoryBreakdown: Record<string, number>;
    sameCategoryCount: number;
    saturationLevel: string;
    saturationScore: number;
  };
  recommendation: string;
}

// 경쟁업체 정보
export interface Competitor {
  id?: string;
  name: string;
  category: string;
  address: string;
  distance: number;
  phone?: string;
  placeUrl?: string;
}

// 경쟁 분석 결과
export interface CompetitorAnalysis {
  query: string;
  location: string;
  radius: number;
  competitors: Competitor[];
  analysis: {
    totalCount: number;
    franchiseRatio: number;
    marketGap: string;
    topCategories?: { name: string; count: number }[];
    insights?: string[];
  };
}

// 정책지원금 정보
export interface PolicyFund {
  id: string;
  name: string;
  organization: string;
  amount: string;
  type: "융자" | "보조금" | "멘토링" | "교육" | "복합";
  deadline?: string;
  requirements: string[];
  applyUrl: string;
  description?: string;
}

// 정책지원금 추천 결과
export interface PolicyFundRecommendation {
  userProfile: {
    businessType: string;
    stage: string;
    region: string;
    founderType?: string;
    founderAge?: string;
  };
  matchedFunds: PolicyFund[];
  totalCount: number;
  tip: string;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 인허가 정보
export interface License {
  name: string;
  authority: string;
  required: boolean;
  processingDays: number;
  documents?: string[];
  fee?: number;
  note?: string;
}

// 창업 체크리스트 결과
export interface StartupChecklist {
  businessType: string;
  licenses: License[];
  checklist: string[];
  estimatedCost: {
    min: number;
    max: number;
    breakdown: Record<string, number>;
  };
  tips: string[];
}

// 트렌드 업종 정보
export interface TrendingBusiness {
  name: string;
  growthRate: number;
  count: number;
}

// 창업 트렌드 결과
export interface BusinessTrends {
  period: string;
  region: string;
  rising: TrendingBusiness[];
  declining: TrendingBusiness[];
  insights: string[];
  recommendation: string;
}

// 카카오 API 응답 타입
export interface KakaoPlaceResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance?: string;
}

export interface KakaoAddressResponse {
  documents: KakaoAddress[];
  meta: {
    total_count: number;
  };
}

export interface KakaoAddress {
  address_name: string;
  x: string;
  y: string;
  address_type: string;
  address?: {
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
  };
  road_address?: {
    road_name: string;
    building_name: string;
  };
}

// 창업 비용 분석 결과
export interface StartupCostAnalysis {
  businessType: string;
  region: string;
  size: number;
  premiumLevel: string;
  totalCost: {
    min: number;
    max: number;
    estimated: number;
  };
  breakdown: {
    deposit: number;
    interior: number;
    equipment: number;
    initialInventory: number;
    operatingFund: number;
    other: number;
  };
  regionalNote: string;
  tips: string[];
}

// 손익분기점 분석 결과
export interface BreakevenAnalysis {
  businessType: string;
  region: string;
  size: number;
  costs: {
    fixedMonthly: number;
    variableRatio: number;
    breakdown: {
      rent: number;
      labor: number;
      utilities: number;
      other: number;
    };
  };
  breakeven: {
    monthlySales: number;
    dailySales: number;
    dailyCustomers: number;
    averagePrice: number;
    achievability: "쉬움" | "보통" | "어려움";
  };
  scenarios: {
    pessimistic: { monthlySales: number; monthlyProfit: number };
    realistic: { monthlySales: number; monthlyProfit: number };
    optimistic: { monthlySales: number; monthlyProfit: number };
  };
  paybackPeriod: {
    investmentAmount: number;
    months: number;
    note: string;
  };
  insights: string[];
}

// 상권 인구 분석 결과
export interface PopulationAnalysis {
  location: Location;
  population: {
    total: number;
    residential: number;
    working: number;
    floating: number;
  };
  timeDistribution: {
    morning: number;
    lunch: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  ageDistribution: {
    teens: number;
    twenties: number;
    thirties: number;
    forties: number;
    fiftyPlus: number;
  };
  genderRatio: {
    male: number;
    female: number;
  };
  businessFit?: {
    score: number;
    targetAge: string;
    peakHours: string;
    recommendation: string;
  };
  characteristics: string[];
  insights: string[];
}
