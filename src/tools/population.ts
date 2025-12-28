// 상권 인구 분석 Tool
// 상권별 유동인구, 연령대, 시간대 분석
// 출처: 소상공인마당 상권정보 API (실시간) + 서울열린데이터광장, 통계청 (보정)

import { kakaoApi } from "../api/kakao-api.js";
import { semasApi } from "../api/semas-api.js";
import type { ApiResult, PopulationAnalysis, Coordinates } from "../types.js";
import { DISCLAIMERS } from "../constants.js";
import {
  AREA_TYPE_PATTERNS,
  BUSINESS_TARGET_FIT,
  calculateFitScore,
  findAreaData,
  inferAreaType,
  type AreaPopulationData,
} from "../data/population-data.js";
import { normalizeBusinessType } from "../data/startup-cost-data.js";

// 업소 수 기반 유동인구 추정 계수
const STORE_TO_POPULATION_RATIO = {
  역세권: 150, // 업소당 일평균 유동인구
  대학가: 120,
  오피스: 100,
  주거지역: 80,
  관광지: 200,
  유흥가: 180,
  복합: 130,
} as const;

// SEMAS API로 실시간 상권 데이터 조회
async function fetchRealTimeCommercialData(
  coordinates: Coordinates,
  radius: number
): Promise<{
  storeCount: number;
  topCategories: { name: string; count: number }[];
  isRealTime: boolean;
} | null> {
  try {
    const { stores, totalCount } = await semasApi.getStoresByRadius(
      coordinates.lng,
      coordinates.lat,
      radius,
      { numOfRows: 1000 }
    );

    if (!stores || stores.length === 0) return null;

    // 업종별 집계
    const categoryMap = new Map<string, number>();
    for (const store of stores) {
      const category = store.indsLclsNm || "기타";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      storeCount: totalCount || stores.length,
      topCategories,
      isRealTime: true,
    };
  } catch (error) {
    console.log("SEMAS API 조회 실패, 정적 데이터 사용:", error);
    return null;
  }
}

// 업소 수 기반 유동인구 추정
function estimatePopulationFromStores(
  storeCount: number,
  areaType: keyof typeof STORE_TO_POPULATION_RATIO
): number {
  const ratio = STORE_TO_POPULATION_RATIO[areaType] || 130;
  return Math.round(storeCount * ratio);
}

export async function analyzePopulation(
  location: string,
  businessType?: string,
  radius: number = 500
): Promise<ApiResult<PopulationAnalysis>> {
  try {
    // 1. 먼저 알려진 상권 데이터 찾기
    let areaData = findAreaData(location);
    let coordinates: Coordinates | null = null;
    const address: string = location;
    let isKnownArea = false;
    let realTimeData: Awaited<ReturnType<typeof fetchRealTimeCommercialData>> = null;
    let dataConfidence: "high" | "medium" | "low" = "low";

    if (areaData) {
      // 알려진 상권 데이터 사용
      coordinates = areaData.coordinates;
      isKnownArea = true;
      dataConfidence = "high"; // 주요 상권은 신뢰도 높음
    } else {
      // 2. 카카오 API로 좌표 조회
      try {
        coordinates = await kakaoApi.getCoordinates(location);
      } catch (error) {
        console.error("좌표 조회 실패:", error);
      }

      if (!coordinates) {
        return {
          success: false,
          error: {
            code: "LOCATION_NOT_FOUND",
            message: `위치를 찾을 수 없습니다: ${location}`,
            suggestion: "강남역, 홍대입구, 신촌, 건대입구, 명동, 이태원, 여의도, 잠실, 판교, 해운대, 서면 등 주요 상권명을 입력해주세요.",
          },
        };
      }

      // 3. 상권 유형 추론하여 패턴 데이터 사용
      const areaType = inferAreaType(location);
      const patternData = AREA_TYPE_PATTERNS[areaType];

      // 패턴 데이터에 좌표 추가하여 사용
      areaData = {
        ...patternData,
        coordinates,
      } as AreaPopulationData;
      dataConfidence = "low"; // 패턴 기반은 신뢰도 낮음
    }

    // 4. SEMAS API로 실시간 상권 데이터 조회 (업소 수 기반 보정)
    realTimeData = await fetchRealTimeCommercialData(coordinates, radius);

    if (realTimeData) {
      // 실시간 데이터로 유동인구 보정
      const areaType = areaData.areaType as keyof typeof STORE_TO_POPULATION_RATIO;
      const estimatedFromStores = estimatePopulationFromStores(realTimeData.storeCount, areaType);

      // 알려진 상권이면 가중평균, 아니면 추정치 사용
      if (isKnownArea) {
        // 기존 데이터와 추정치의 가중평균 (기존 70%, 추정 30%)
        areaData = {
          ...areaData,
          population: {
            ...areaData.population,
            total: Math.round(areaData.population.total * 0.7 + estimatedFromStores * 0.3),
            floating: Math.round(areaData.population.floating * 0.7 + estimatedFromStores * 0.4 * 0.3),
          },
        };
        dataConfidence = "high";
      } else {
        // 실시간 데이터 기반 추정
        const basePopulation = estimatedFromStores;
        areaData = {
          ...areaData,
          population: {
            total: basePopulation,
            residential: Math.round(basePopulation * 0.2),
            working: Math.round(basePopulation * 0.4),
            floating: Math.round(basePopulation * 0.4),
          },
        };
        dataConfidence = "medium"; // API 데이터 있으면 중간 신뢰도
      }
    }

    // 5. 업종 적합도 분석 (업종이 지정된 경우)
    let businessFit: PopulationAnalysis["businessFit"] | undefined;
    if (businessType) {
      const normalizedType = normalizeBusinessType(businessType);
      if (BUSINESS_TARGET_FIT[normalizedType]) {
        businessFit = calculateFitScore(areaData, normalizedType);
      }
    }

    // 6. 인사이트 생성
    const insights: string[] = [];

    // 실시간 데이터 정보 먼저 표시
    if (realTimeData) {
      insights.push(`[실시간 상권 데이터] 반경 ${radius}m 내 상가업소 ${realTimeData.storeCount.toLocaleString()}개`);
      insights.push(`주요 업종: ${realTimeData.topCategories.map(c => `${c.name}(${c.count})`).join(", ")}`);
      insights.push("");
    }

    // 데이터 신뢰도 표시
    const confidenceLabels = { high: "높음 (주요상권+API)", medium: "중간 (API추정)", low: "낮음 (패턴추정)" };
    insights.push(`[데이터 신뢰도: ${confidenceLabels[dataConfidence]}]`);

    // 인구 구성 분석
    const { population, ageDistribution, genderRatio, timeDistribution } = areaData;

    if (population.working > population.residential) {
      insights.push("직장인구가 거주인구보다 많은 오피스형 상권입니다.");
    } else if (population.residential > population.working * 2) {
      insights.push("거주인구가 많은 주거형 상권입니다.");
    }

    if (population.floating > population.total * 0.4) {
      insights.push("유동인구 비중이 높아 외부 유입이 활발합니다.");
    }

    // 연령대 분석
    if (ageDistribution.twenties + ageDistribution.teens > 50) {
      insights.push("10-20대 비중이 50% 이상으로 젊은 층이 주요 타겟입니다.");
    }
    if (ageDistribution.thirties + ageDistribution.forties > 50) {
      insights.push("30-40대 비중이 50% 이상으로 구매력 있는 층이 많습니다.");
    }

    // 성별 분석
    if (genderRatio.female > 55) {
      insights.push("여성 비율이 높아 뷰티, 카페, 디저트 업종에 유리합니다.");
    }
    if (genderRatio.male > 55) {
      insights.push("남성 비율이 높아 주류, 음식점 업종에 유리합니다.");
    }

    // 시간대 분석
    if (timeDistribution.lunch > 25) {
      insights.push("점심 시간대 유동인구가 집중되어 런치 특화 전략이 유효합니다.");
    }
    if (timeDistribution.evening > 30) {
      insights.push("저녁 시간대 유동인구가 많아 디너/야간 영업이 유리합니다.");
    }
    if (timeDistribution.night > 15) {
      insights.push("야간 유동인구가 있어 심야 영업을 고려해볼 수 있습니다.");
    }

    // 업종 적합도 인사이트
    if (businessFit) {
      if (businessFit.score >= 70) {
        insights.push(`${businessType} 업종에 적합도가 높은 상권입니다 (${businessFit.score}점).`);
      } else if (businessFit.score < 50) {
        insights.push(`${businessType} 업종에 적합도가 낮은 편입니다 (${businessFit.score}점). 다른 상권 검토를 권장합니다.`);
      }
    }

    // 데이터 출처 결정
    const dataSource = realTimeData
      ? "소상공인마당 상권정보 API (실시간) + 통계청 보정"
      : isKnownArea
        ? "서울열린데이터광장, 통계청 기반"
        : "상권 유형 패턴 기반 추정";

    const dataNote = realTimeData
      ? `반경 ${radius}m 내 ${realTimeData.storeCount}개 업소 기반 추정. 신뢰도: ${confidenceLabels[dataConfidence]}. ${DISCLAIMERS.POPULATION}`
      : `반경 ${radius}m 기준 추정치. 신뢰도: ${confidenceLabels[dataConfidence]}. ${DISCLAIMERS.POPULATION}`;

    return {
      success: true,
      data: {
        location: {
          name: location,
          address,
          coordinates: areaData.coordinates,
        },
        population: areaData.population,
        timeDistribution: areaData.timeDistribution,
        ageDistribution: areaData.ageDistribution,
        genderRatio: areaData.genderRatio,
        businessFit,
        characteristics: areaData.characteristics,
        insights,
      },
      meta: {
        source: dataSource,
        timestamp: new Date().toISOString(),
        dataNote,
      },
    };
  } catch (error) {
    console.error("인구 분석 실패:", error);

    return {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: "상권 인구 분석 중 오류가 발생했습니다.",
        suggestion: "위치명을 다시 확인하고 시도해주세요.",
      },
    };
  }
}
