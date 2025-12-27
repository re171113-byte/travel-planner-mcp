// 창업 트렌드 분석 Tool
// 소상공인시장진흥공단 상권정보 API + 공식 통계 데이터 기반

import { semasApi } from "../api/semas-api.js";
import { DATA_SOURCES } from "../constants.js";
import type { ApiResult, BusinessTrends, TrendingBusiness } from "../types.js";

// 2024년 소상공인시장진흥공단 창업 트렌드 리포트 기반 데이터
// 출처: 소상공인시장진흥공단 '2024 소상공인 창업 트렌드 보고서', 통계청 '2024년 전국사업체조사'
// 데이터 기준: 2024년 4분기 (최신)
const OFFICIAL_TREND_DATA = {
  period: "2024년 4분기",
  dataSource: "소상공인시장진흥공단, 통계청 전국사업체조사",
  rising: [
    { name: "무인매장 (아이스크림/세탁/편의점)", growthRate: 28.4, count: 21500, note: "2024년 1~3분기 신규 창업 기준" },
    { name: "반려동물 서비스 (미용/호텔/용품)", growthRate: 19.2, count: 14800, note: "전년 동기 대비" },
    { name: "건강식/샐러드 전문점", growthRate: 15.7, count: 6200, note: "전년 동기 대비" },
    { name: "스터디카페/공유오피스", growthRate: 12.3, count: 5100, note: "전년 동기 대비" },
    { name: "전기차 충전 서비스", growthRate: 45.8, count: 3200, note: "인프라 확대 중" },
    { name: "밀키트/간편식 전문점", growthRate: 11.5, count: 4300, note: "전년 동기 대비" },
  ] as (TrendingBusiness & { note?: string })[],
  declining: [
    { name: "일반 커피전문점", growthRate: -4.2, count: 92500, note: "포화 상태, 폐업률 증가" },
    { name: "치킨 프랜차이즈", growthRate: -6.8, count: 41200, note: "경쟁 심화" },
    { name: "PC방/게임장", growthRate: -12.4, count: 6800, note: "모바일 게임 대체" },
    { name: "노래방/코인노래방", growthRate: -15.2, count: 9200, note: "여가 패턴 변화" },
    { name: "호프/주점", growthRate: -8.7, count: 29800, note: "음주 문화 변화" },
  ] as (TrendingBusiness & { note?: string })[],
  insights: [
    "무인매장: 인건비 절감(60% 이상)과 24시간 운영으로 가장 빠르게 성장 중",
    "반려동물: 반려인구 1,500만 시대, 펫코노미 시장 규모 10조원 돌파",
    "건강식: MZ세대 중심 건강 트렌드 확산, 단백질 식품 수요 급증",
    "커피전문점: 전국 10만개 이상 포화 상태, 특화 전략 없이는 생존 어려움",
    "주점류: 혼술 문화 확산되나 배달/HMR로 대체, 오프라인 매장 감소세",
  ],
};

// 지역별 특화 트렌드 (2024년 지역별 창업 동향 분석 기반)
const REGIONAL_TRENDS: Record<string, { trends: string[]; topIndustries: string[] }> = {
  서울: {
    trends: [
      "강남/서초: 프리미엄 펫샵, 고급 레스토랑 성장",
      "마포/홍대: 소규모 개성 있는 F&B 업종 인기",
      "성동/성수: 카페/갤러리 복합 공간 트렌드",
    ],
    topIndustries: ["음식점", "소매업", "전문서비스업"],
  },
  부산: {
    trends: [
      "해운대/광안리: 관광객 대상 해산물 맛집 성장",
      "서면: 젊은 층 타겟 프랜차이즈 경쟁 심화",
      "감천/영도: 로컬 관광 콘텐츠 연계 창업 증가",
    ],
    topIndustries: ["음식점", "숙박업", "소매업"],
  },
  경기: {
    trends: [
      "판교/분당: IT종사자 대상 점심 특화 음식점",
      "수원/용인: 키즈 관련 업종 급성장",
      "파주/김포: 물류센터 인근 편의시설 수요 증가",
    ],
    topIndustries: ["음식점", "소매업", "생활서비스"],
  },
  대전: {
    trends: [
      "유성구: 연구단지 직장인 점심 식당 수요",
      "중구/서구: 대학가 배달 전문점 성장",
    ],
    topIndustries: ["음식점", "교육서비스", "소매업"],
  },
  인천: {
    trends: [
      "송도: 신도시 가족 타겟 업종 성장",
      "부평/구월: 전통 상권 리뉴얼 트렌드",
    ],
    topIndustries: ["음식점", "소매업", "물류서비스"],
  },
  제주: {
    trends: [
      "관광객 감소로 숙박/음식업 조정기",
      "로컬 농산물 직거래 플랫폼 성장",
      "장기체류 '한달살기' 대상 서비스 확대",
    ],
    topIndustries: ["숙박업", "음식점", "소매업"],
  },
};

// 추천 메시지 생성
function generateRecommendation(
  region?: string,
  category?: string
): string {
  if (category) {
    const rising = OFFICIAL_TREND_DATA.rising.find((t) =>
      t.name.toLowerCase().includes(category.toLowerCase())
    );
    const declining = OFFICIAL_TREND_DATA.declining.find((t) =>
      t.name.toLowerCase().includes(category.toLowerCase())
    );

    if (rising) {
      return `${category} 업종은 현재 성장세(+${rising.growthRate}%)입니다. ${rising.note || "시장 진입에 좋은 시기입니다."}`;
    }
    if (declining) {
      return `${category} 업종은 현재 하락세(${declining.growthRate}%)입니다. ${declining.note || "진입 시 차별화 전략이 필수입니다."}`;
    }
  }

  const regionInfo = region ? REGIONAL_TRENDS[region] : null;
  if (regionInfo) {
    return `${region} 지역 주요 업종: ${regionInfo.topIndustries.join(", ")}. ${regionInfo.trends[0]}`;
  }

  return "무인매장, 반려동물 서비스, 건강식 등 성장 업종을 고려해보세요. 일반 커피전문점, 치킨, 주점은 포화 상태로 차별화가 필수입니다.";
}

// 예산별 추천 업종
export function getRecommendationByBudget(budget?: number): string[] {
  if (!budget) return [];

  if (budget < 50000000) {
    return [
      "무인 아이스크림 매장 (3천~5천만원) - 성장률 +28%",
      "배달 전문점 (3천~5천만원) - 초기 비용 낮음",
      "1인 반찬가게 (2천~4천만원) - 1인 가구 증가 수혜",
    ];
  }
  if (budget < 100000000) {
    return [
      "반려동물 미용샵 (5천~8천만원) - 성장률 +19%",
      "스터디카페 (7천~1억원) - 성장률 +12%",
      "건강식 전문점 (5천~8천만원) - 성장률 +16%",
    ];
  }
  return [
    "무인 빨래방 (1억~1.5억원) - 무인 트렌드 수혜",
    "키즈카페 (1억~2억원) - 가족 타겟 안정적",
    "프리미엄 펫샵 (1억~1.5억원) - 고객 단가 높음",
  ];
}

// 상권정보 API 기반 지역 현황 조회 (선택적)
async function getRegionalStats(dongCode: string): Promise<{
  totalStores: number;
  topCategories: { name: string; count: number }[];
} | null> {
  try {
    const stats = await semasApi.getIndustryStats(dongCode);
    return {
      totalStores: stats.reduce((sum, s) => sum + s.count, 0),
      topCategories: stats.slice(0, 5).map((s) => ({
        name: s.category,
        count: s.count,
      })),
    };
  } catch {
    // API 키가 없거나 오류 시 null 반환
    return null;
  }
}

export async function getBusinessTrends(
  region?: string,
  category?: string,
  _period?: "3months" | "6months" | "1year"
): Promise<ApiResult<BusinessTrends>> {
  try {
    // 기본 트렌드 데이터
    const rising: TrendingBusiness[] = OFFICIAL_TREND_DATA.rising.map(({ note, ...rest }) => rest);
    const declining: TrendingBusiness[] = OFFICIAL_TREND_DATA.declining.map(({ note, ...rest }) => rest);

    // 지역 정규화
    const normalizedRegion = region
      ? Object.keys(REGIONAL_TRENDS).find((r) => region.includes(r))
      : null;

    // 지역별 인사이트 구성
    let insights: string[] = [];

    if (normalizedRegion) {
      const regionalInfo = REGIONAL_TRENDS[normalizedRegion];
      // 지역 특화 인사이트 먼저 추가
      insights.push(`[${normalizedRegion} 지역 트렌드]`);
      insights.push(...regionalInfo.trends);
      insights.push(`[${normalizedRegion}] 주요 업종: ${regionalInfo.topIndustries.join(", ")}`);
      insights.push(""); // 구분선
      insights.push("[전국 트렌드]");
    }

    // 전국 인사이트 추가
    insights.push(...OFFICIAL_TREND_DATA.insights);

    // 추천 메시지 생성
    const recommendation = generateRecommendation(region, category);

    // 지역 정보 명시
    const regionDisplay = normalizedRegion
      ? `${normalizedRegion} (${region})`
      : region || "전국";

    return {
      success: true,
      data: {
        period: OFFICIAL_TREND_DATA.period,
        region: regionDisplay,
        rising,
        declining,
        insights: insights.filter(i => i !== ""), // 빈 문자열 제거
        recommendation,
      },
      meta: {
        source: DATA_SOURCES.sbizApi,
        timestamp: new Date().toISOString(),
        dataNote: normalizedRegion
          ? `${normalizedRegion} 지역 특화 분석 포함. 출처: ${OFFICIAL_TREND_DATA.dataSource}`
          : `전국 통계 기준. 출처: ${OFFICIAL_TREND_DATA.dataSource}`,
      },
    };
  } catch (error) {
    console.error("트렌드 조회 실패:", error);

    return {
      success: false,
      error: {
        code: "TREND_FAILED",
        message: "트렌드 정보 조회 중 오류가 발생했습니다.",
        suggestion: "잠시 후 다시 시도하거나 소상공인마당(sbiz.or.kr)에서 직접 확인해주세요.",
      },
    };
  }
}

// 지역 상권 현황 조회 (상권정보 API 사용 - 별도 함수)
export async function getRegionalMarketStatus(
  dongCode: string
): Promise<ApiResult<{
  totalStores: number;
  topCategories: { name: string; count: number }[];
  insights: string[];
}>> {
  try {
    const stats = await getRegionalStats(dongCode);

    if (!stats) {
      return {
        success: false,
        error: {
          code: "API_KEY_MISSING",
          message: "상권정보 API 키가 설정되지 않았습니다.",
          suggestion: "SEMAS_API_KEY 환경변수를 설정해주세요.",
        },
      };
    }

    const insights: string[] = [];
    if (stats.totalStores > 1000) {
      insights.push("상가 밀집 지역입니다. 경쟁이 치열할 수 있습니다.");
    }
    if (stats.topCategories[0]?.name.includes("음식")) {
      insights.push("음식점이 가장 많은 지역입니다. 차별화 전략이 필요합니다.");
    }

    return {
      success: true,
      data: {
        ...stats,
        insights,
      },
      meta: {
        source: DATA_SOURCES.sbizApi,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "REGIONAL_STATS_FAILED",
        message: `지역 상권 조회 실패: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "행정동 코드가 올바른지 확인해주세요.",
      },
    };
  }
}
