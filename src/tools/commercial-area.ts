// 상권 분석 Tool
// 카카오맵 API를 활용한 상권 분석

import { kakaoApi } from "../api/kakao-api.js";
import { SATURATION_LEVELS, DATA_SOURCES } from "../constants.js";
import type { ApiResult, CommercialAreaData } from "../types.js";

// 포화도 레벨 계산
function getSaturationLevel(score: number): string {
  if (score >= SATURATION_LEVELS.SATURATED.min) return SATURATION_LEVELS.SATURATED.label;
  if (score >= SATURATION_LEVELS.HIGH.min) return SATURATION_LEVELS.HIGH.label;
  if (score >= SATURATION_LEVELS.MEDIUM.min) return SATURATION_LEVELS.MEDIUM.label;
  return SATURATION_LEVELS.LOW.label;
}

// 상권 유형 추정
function estimateAreaType(categoryBreakdown: Record<string, number>): string {
  const total = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

  if (total > 50) return "발달상권";
  if (categoryBreakdown["음식점"] > 20) return "먹자골목";
  if (categoryBreakdown["카페"] > 10) return "카페거리";
  if (total < 20) return "골목상권";
  return "일반상권";
}

// 상권 특성 분석
function analyzeCharacteristics(
  categoryBreakdown: Record<string, number>,
  location: string
): string[] {
  const characteristics: string[] = [];

  const total = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

  if (total > 40) characteristics.push("유동인구 많음");
  if (categoryBreakdown["카페"] > 8) characteristics.push("카페 밀집지역");
  if (categoryBreakdown["음식점"] > 15) characteristics.push("음식점 밀집지역");
  if (categoryBreakdown["편의점"] > 3) characteristics.push("편의시설 양호");

  // 지역명 기반 추정
  if (location.includes("역")) characteristics.push("역세권");
  if (location.includes("대학") || location.includes("학교")) characteristics.push("학생 상권");

  if (characteristics.length === 0) {
    characteristics.push("조용한 주거지역");
  }

  return characteristics;
}

// 추천 메시지 생성
function generateRecommendation(
  businessType: string,
  saturationScore: number,
  _sameCategoryCount: number
): string {
  if (saturationScore >= 80) {
    return `${businessType} 포화도가 ${saturationScore}%로 매우 높습니다. 차별화 전략이 필수이며, 인근 다른 지역도 검토해보세요.`;
  }
  if (saturationScore >= 60) {
    return `${businessType} 포화도가 ${saturationScore}%로 높은 편입니다. 경쟁이 있지만 차별화된 컨셉으로 진입 가능합니다.`;
  }
  if (saturationScore >= 40) {
    return `${businessType} 포화도가 ${saturationScore}%로 적정 수준입니다. 진입 여지가 있습니다.`;
  }
  return `${businessType} 포화도가 ${saturationScore}%로 낮습니다. 새로운 ${businessType} 창업에 좋은 입지입니다.`;
}

// 포화도 점수 계산 (업종별 기준)
function calculateSaturationScore(
  businessType: string,
  sameCategoryCount: number,
  _totalStores: number
): number {
  // 업종별 적정 개수 기준 (반경 500m 기준)
  const optimalCounts: Record<string, number> = {
    카페: 10,
    음식점: 20,
    편의점: 5,
    미용실: 8,
    default: 10,
  };

  const optimal = optimalCounts[businessType] || optimalCounts.default;
  const ratio = (sameCategoryCount / optimal) * 100;

  return Math.min(100, Math.round(ratio));
}

export async function analyzeCommercialArea(
  location: string,
  businessType: string,
  radius: number = 500
): Promise<ApiResult<CommercialAreaData>> {
  try {
    // 1. 위치 좌표 얻기
    const coords = await kakaoApi.getCoordinates(location);
    if (!coords) {
      return {
        success: false,
        error: {
          code: "LOCATION_NOT_FOUND",
          message: `입력하신 위치를 찾을 수 없습니다: ${location}`,
          suggestion: "강남역, 홍대입구 등 구체적인 지명을 입력해주세요.",
        },
      };
    }

    // 2. 업종별 업체 수 조회
    const categoryBreakdown = await kakaoApi.countByCategories(
      String(coords.lng),
      String(coords.lat),
      radius
    );

    // 3. 해당 업종 업체 검색
    const competitors = await kakaoApi.findCompetitors(
      businessType,
      location,
      radius,
      15
    );
    const sameCategoryCount = competitors.length;

    // 4. 분석 결과 계산
    const totalStores = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
    const saturationScore = calculateSaturationScore(businessType, sameCategoryCount, totalStores);
    const areaType = estimateAreaType(categoryBreakdown);
    const characteristics = analyzeCharacteristics(categoryBreakdown, location);
    const recommendation = generateRecommendation(businessType, saturationScore, sameCategoryCount);

    return {
      success: true,
      data: {
        location: {
          name: location,
          address: location,
          coordinates: coords,
        },
        areaType,
        characteristics,
        density: {
          totalStores,
          categoryBreakdown,
          sameCategoryCount,
          saturationLevel: getSaturationLevel(saturationScore),
          saturationScore,
        },
        recommendation,
      },
      meta: {
        source: DATA_SOURCES.kakaoLocal,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("상권 분석 실패:", error);

    return {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: `상권 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "잠시 후 다시 시도해주세요.",
      },
    };
  }
}
