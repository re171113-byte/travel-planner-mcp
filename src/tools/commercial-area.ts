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

// 벌크 비교 분석 결과 타입
export interface CommercialAreaComparison {
  locations: CommercialAreaData[];
  ranking: {
    location: string;
    score: number;
    recommendation: "추천" | "보통" | "비추천";
  }[];
  bestLocation: string;
  summary: string;
}

// 입지 점수 계산 (세분화된 가중치 적용)
function calculateLocationScore(data: CommercialAreaData): number {
  // 1. 포화도 점수 (0-40점) - 낮을수록 좋음
  const saturationScore = 40 - (data.density.saturationScore / 100) * 40;

  // 2. 상권 활성도 점수 (0-25점) - 상가 수 기반, 유동인구 추정
  const totalStores = data.density.totalStores;
  let activityScore = 0;
  if (totalStores >= 1000) activityScore = 25;
  else if (totalStores >= 500) activityScore = 20;
  else if (totalStores >= 200) activityScore = 15;
  else if (totalStores >= 100) activityScore = 10;
  else activityScore = 5;

  // 3. 경쟁 강도 점수 (0-20점) - 동종업종 적을수록 좋음
  const competitorCount = data.density.sameCategoryCount;
  let competitionScore = 20;
  if (competitorCount >= 20) competitionScore = 5;
  else if (competitorCount >= 15) competitionScore = 10;
  else if (competitorCount >= 10) competitionScore = 15;

  // 4. 업종 다양성 점수 (0-15점) - 다양할수록 좋음
  const categoryCount = Object.keys(data.density.categoryBreakdown).length;
  const diversityScore = Math.min(15, categoryCount * 3);

  // 총점 계산
  const score = saturationScore + activityScore + competitionScore + diversityScore;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// 여러 지역 비교 분석
export async function compareCommercialAreas(
  locations: string[],
  businessType: string,
  radius: number = 500
): Promise<ApiResult<CommercialAreaComparison>> {
  try {
    // 모든 지역 병렬 분석
    const results = await Promise.all(
      locations.map((loc) => analyzeCommercialArea(loc, businessType, radius))
    );

    // 성공한 결과만 필터링
    const successfulResults = results
      .filter((r): r is ApiResult<CommercialAreaData> & { success: true; data: CommercialAreaData } =>
        r.success && !!r.data
      )
      .map((r) => r.data);

    if (successfulResults.length === 0) {
      return {
        success: false,
        error: {
          code: "NO_VALID_LOCATIONS",
          message: "분석 가능한 지역이 없습니다.",
          suggestion: "입력한 지역명을 확인해주세요.",
        },
      };
    }

    // 점수 계산 및 순위 정렬
    const ranking = successfulResults
      .map((data) => ({
        location: data.location.name,
        score: calculateLocationScore(data),
        saturation: data.density.saturationScore,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, _index) => ({
        location: item.location,
        score: item.score,
        recommendation: (item.score >= 70 ? "추천" : item.score >= 40 ? "보통" : "비추천") as "추천" | "보통" | "비추천",
      }));

    const bestLocation = ranking[0].location;

    // 요약 생성
    const summary = generateComparisonSummary(successfulResults, ranking, businessType);

    return {
      success: true,
      data: {
        locations: successfulResults,
        ranking,
        bestLocation,
        summary,
      },
      meta: {
        source: DATA_SOURCES.kakaoLocal,
        timestamp: new Date().toISOString(),
        dataNote: `${locations.length}개 지역 비교 분석 완료 (반경 ${radius}m 기준). 신뢰도: 높음 (카카오맵 실시간 API). ※ 점수는 포화도, 상권활성도, 경쟁강도, 업종다양성 4개 요소로 산출됩니다.`,
      },
    };
  } catch (error) {
    console.error("벌크 비교 분석 실패:", error);

    return {
      success: false,
      error: {
        code: "COMPARISON_FAILED",
        message: `비교 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "잠시 후 다시 시도해주세요.",
      },
    };
  }
}

// 비교 요약 생성
function generateComparisonSummary(
  locations: CommercialAreaData[],
  ranking: { location: string; score: number; recommendation: string }[],
  businessType: string
): string {
  const best = ranking[0];
  const worst = ranking[ranking.length - 1];

  const bestData = locations.find((l) => l.location.name === best.location)!;
  const worstData = locations.find((l) => l.location.name === worst.location)!;

  let summary = `${businessType} 창업 입지 비교 결과:\n\n`;
  summary += `🥇 최적 입지: ${best.location} (점수: ${best.score}점)\n`;
  summary += `   - 포화도: ${bestData.density.saturationScore}%, ${bestData.density.sameCategoryCount}개 업체\n`;
  summary += `   - 상권유형: ${bestData.areaType}\n\n`;

  if (ranking.length > 1) {
    summary += `🥉 최하위: ${worst.location} (점수: ${worst.score}점)\n`;
    summary += `   - 포화도: ${worstData.density.saturationScore}%, ${worstData.density.sameCategoryCount}개 업체\n\n`;
  }

  const recommended = ranking.filter((r) => r.recommendation === "추천");
  if (recommended.length > 0) {
    summary += `✅ 추천 지역: ${recommended.map((r) => r.location).join(", ")}`;
  } else {
    summary += `⚠️ 모든 지역의 포화도가 높습니다. 차별화 전략이 필요합니다.`;
  }

  return summary;
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
        dataNote: `반경 ${radius}m 기준. 신뢰도: 높음 (카카오맵 실시간 API). ${sameCategoryCount > 0 ? `동종 업체 ${sameCategoryCount}개 검색됨.` : ""} ※ 실제 상권 현황은 현장 확인을 권장합니다.`,
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
