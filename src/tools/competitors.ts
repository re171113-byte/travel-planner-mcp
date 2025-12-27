// 경쟁업체 분석 Tool
// 카카오맵 API를 활용한 경쟁업체 검색 및 분석

import { kakaoApi } from "../api/kakao-api.js";
import { DATA_SOURCES } from "../constants.js";
import type { ApiResult, CompetitorAnalysis, Competitor } from "../types.js";

// 프랜차이즈 여부 판단 (이름 기반)
const FRANCHISE_KEYWORDS = [
  "스타벅스", "투썸", "이디야", "메가커피", "빽다방", "컴포즈",
  "맥도날드", "버거킹", "롯데리아", "KFC", "맘스터치",
  "BBQ", "BHC", "교촌", "네네", "굽네",
  "CU", "GS25", "세븐일레븐", "이마트24", "미니스톱",
  "올리브영", "다이소", "아트박스",
  "파리바게뜨", "뚜레쥬르", "성심당",
];

function isFranchise(name: string): boolean {
  return FRANCHISE_KEYWORDS.some((keyword) =>
    name.includes(keyword)
  );
}

// 시장 갭 분석
function analyzeMarketGap(
  competitors: Competitor[],
  franchiseRatio: number,
  totalCount: number
): string {
  if (totalCount === 0) {
    return "해당 업종의 경쟁업체가 없습니다. 선점 기회가 있습니다.";
  }

  if (totalCount <= 3) {
    return "경쟁업체가 적어 진입하기 좋은 환경입니다.";
  }

  if (franchiseRatio >= 0.7) {
    return "프랜차이즈 비중이 높습니다. 개성있는 개인 매장으로 차별화 가능합니다.";
  }

  if (franchiseRatio <= 0.3) {
    return "개인 매장 비중이 높습니다. 브랜드 파워로 경쟁력 확보 가능합니다.";
  }

  if (totalCount >= 10) {
    return "경쟁이 치열합니다. 명확한 차별화 전략이 필요합니다.";
  }

  return "적절한 경쟁 환경입니다. 품질과 서비스로 승부하세요.";
}

export async function findCompetitors(
  location: string,
  businessType: string,
  radius: number = 300,
  limit: number = 10
): Promise<ApiResult<CompetitorAnalysis>> {
  try {
    // 경쟁업체 검색
    const competitors = await kakaoApi.findCompetitors(
      businessType,
      location,
      radius,
      limit
    );

    // 프랜차이즈 비율 계산
    const franchiseCount = competitors.filter((c) => isFranchise(c.name)).length;
    const franchiseRatio = competitors.length > 0
      ? Math.round((franchiseCount / competitors.length) * 100) / 100
      : 0;

    // 시장 갭 분석
    const marketGap = analyzeMarketGap(competitors, franchiseRatio, competitors.length);

    return {
      success: true,
      data: {
        query: businessType,
        location,
        radius,
        competitors,
        analysis: {
          totalCount: competitors.length,
          franchiseRatio,
          marketGap,
        },
      },
      meta: {
        source: DATA_SOURCES.kakaoLocal,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("경쟁업체 검색 실패:", error);

    return {
      success: false,
      error: {
        code: "COMPETITOR_SEARCH_FAILED",
        message: `경쟁업체 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "위치명을 다시 확인하거나 잠시 후 시도해주세요.",
      },
    };
  }
}
