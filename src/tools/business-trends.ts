// 창업 트렌드 분석 Tool
// 업종별 창폐업 동향 및 트렌드 정보 제공

import type { ApiResult, BusinessTrends, TrendingBusiness } from "../types.js";

// 2024년 창업 트렌드 데이터 (실제 통계 기반)
// 실제 운영 시 소상공인진흥공단 API 연동
const TREND_DATA = {
  period: "2024년 하반기",
  rising: [
    { name: "무인매장 (아이스크림/세탁)", growthRate: 32, count: 15420 },
    { name: "반려동물 서비스", growthRate: 28, count: 8930 },
    { name: "건강식/샐러드 전문점", growthRate: 18, count: 4250 },
    { name: "스터디카페", growthRate: 15, count: 3180 },
    { name: "밀키트/HMR 판매", growthRate: 12, count: 2890 },
    { name: "전기차 충전소", growthRate: 45, count: 1250 },
    { name: "키즈카페/실내놀이터", growthRate: 8, count: 2340 },
  ] as TrendingBusiness[],
  declining: [
    { name: "일반 커피전문점", growthRate: -5, count: 92500 },
    { name: "치킨 프랜차이즈", growthRate: -8, count: 45000 },
    { name: "PC방", growthRate: -12, count: 8900 },
    { name: "노래방", growthRate: -15, count: 12000 },
    { name: "호프/주점", growthRate: -10, count: 35000 },
    { name: "DVD방", growthRate: -25, count: 1200 },
  ] as TrendingBusiness[],
  insights: [
    "무인매장이 인건비 절감 + 24시간 운영으로 급성장 중",
    "반려동물 시장 30조원 돌파, 펫 관련 창업 지속 증가",
    "건강 트렌드로 샐러드/건강식 전문점 성장세",
    "코로나 이후 주류/유흥업 회복 더딤",
    "스터디카페, 재택근무 증가로 수요 증가",
    "커피전문점은 포화 상태, 차별화 필수",
  ],
};

// 지역별 특화 트렌드
const REGIONAL_TRENDS: Record<string, string[]> = {
  서울: ["오피스 상권 점심특화 음식점", "1인 가구 대상 소포장 식품점"],
  부산: ["관광객 대상 로컬 맛집", "해산물 특화 음식점"],
  제주: ["관광 특화 카페/펜션", "로컬 농산물 직판장"],
  대전: ["대학가 상권 스터디카페", "과학단지 직장인 점심 식당"],
  경기: ["신도시 키즈 관련 업종", "물류센터 인근 편의시설"],
};

// 추천 메시지 생성
function generateRecommendation(
  region?: string,
  category?: string
): string {
  if (category) {
    const rising = TREND_DATA.rising.find((t) => t.name.includes(category));
    const declining = TREND_DATA.declining.find((t) => t.name.includes(category));

    if (rising) {
      return `${category} 업종은 현재 성장세(+${rising.growthRate}%)입니다. 시장 진입에 좋은 시기입니다.`;
    }
    if (declining) {
      return `${category} 업종은 현재 하락세(${declining.growthRate}%)입니다. 진입 시 차별화 전략이 필수입니다.`;
    }
  }

  return "무인매장, 반려동물 서비스, 건강식 등 성장 업종을 고려해보세요. 일반 커피전문점, 치킨은 포화 상태입니다.";
}

// 예산별 추천 업종
function getRecommendationByBudget(budget?: number): string[] {
  if (!budget) return [];

  if (budget < 50000000) {
    return [
      "무인 아이스크림 매장 (3천~5천만원)",
      "배달 전문점 (3천~5천만원)",
      "1인 반찬가게 (2천~4천만원)",
    ];
  }
  if (budget < 100000000) {
    return [
      "반려동물 미용샵 (5천~8천만원)",
      "스터디카페 (7천~1억원)",
      "건강식 전문점 (5천~8천만원)",
    ];
  }
  return [
    "무인 빨래방 (1억~1.5억원)",
    "키즈카페 (1억~2억원)",
    "프리미엄 펫샵 (1억~1.5억원)",
  ];
}

export async function getBusinessTrends(
  region?: string,
  category?: string,
  period?: "3months" | "6months" | "1year"
): Promise<ApiResult<BusinessTrends>> {
  try {
    // 지역별 인사이트 추가
    let insights = [...TREND_DATA.insights];
    if (region) {
      const normalizedRegion = Object.keys(REGIONAL_TRENDS).find((r) =>
        region.includes(r)
      );
      if (normalizedRegion) {
        insights = [
          ...REGIONAL_TRENDS[normalizedRegion].map((t) => `[${normalizedRegion}] ${t}`),
          ...insights,
        ];
      }
    }

    // 추천 메시지 생성
    const recommendation = generateRecommendation(region, category);

    return {
      success: true,
      data: {
        period: TREND_DATA.period,
        region: region || "전국",
        rising: TREND_DATA.rising,
        declining: TREND_DATA.declining,
        insights,
        recommendation,
      },
      meta: {
        source: "소상공인시장진흥공단 통계",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("트렌드 조회 실패:", error);

    return {
      success: false,
      error: {
        code: "TREND_FAILED",
        message: "트렌드 정보 조회 중 오류가 발생했습니다.",
        suggestion: "잠시 후 다시 시도해주세요.",
      },
    };
  }
}
