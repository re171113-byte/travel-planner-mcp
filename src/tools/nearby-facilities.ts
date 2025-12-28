// 주변 편의시설 조회 Tool
// 카카오맵 API를 활용한 상권 주변 편의시설 분석
// 지하철역, 버스정류장, 은행, 주차장 등 창업에 필요한 시설 정보 제공

import { kakaoApi } from "../api/kakao-api.js";
import { DATA_SOURCES, DISCLAIMERS } from "../constants.js";
import type { ApiResult, Coordinates } from "../types.js";

// 편의시설 카테고리 코드 (카카오맵)
const FACILITY_CATEGORIES = {
  지하철역: "SW8",
  버스정류장: "BS8", // 버스정류장은 키워드 검색 사용
  은행: "BK9",
  주차장: "PK6",
  병원: "HP8",
  약국: "PM9",
  편의점: "CS2",
  대형마트: "MT1",
  학교: "SC4",
  공공기관: "PO3",
} as const;

// 편의시설 타입
export interface NearbyFacility {
  name: string;
  category: string;
  address: string;
  distance: string;
  phone?: string;
}

// 편의시설 분석 결과 타입
export interface NearbyFacilitiesAnalysis {
  location: {
    name: string;
    coordinates: Coordinates;
  };
  radius: number;
  facilities: {
    category: string;
    count: number;
    items: NearbyFacility[];
  }[];
  summary: {
    totalCount: number;
    accessibility: "우수" | "양호" | "보통" | "미흡";
    highlights: string[];
  };
  insights: string[];
}

// 접근성 점수 계산
function calculateAccessibilityScore(facilities: { category: string; count: number }[]): {
  score: number;
  level: "우수" | "양호" | "보통" | "미흡";
} {
  let score = 0;

  for (const facility of facilities) {
    switch (facility.category) {
      case "지하철역":
        score += facility.count > 0 ? 30 : 0; // 지하철 있으면 30점
        break;
      case "버스정류장":
        score += Math.min(facility.count * 5, 15); // 최대 15점
        break;
      case "주차장":
        score += Math.min(facility.count * 3, 10); // 최대 10점
        break;
      case "은행":
        score += facility.count > 0 ? 10 : 0;
        break;
      case "편의점":
        score += Math.min(facility.count * 2, 10);
        break;
      case "병원":
      case "약국":
        score += facility.count > 0 ? 5 : 0;
        break;
      default:
        score += facility.count > 0 ? 3 : 0;
    }
  }

  let level: "우수" | "양호" | "보통" | "미흡";
  if (score >= 60) level = "우수";
  else if (score >= 40) level = "양호";
  else if (score >= 20) level = "보통";
  else level = "미흡";

  return { score: Math.min(score, 100), level };
}

// 인사이트 생성
function generateInsights(
  facilities: { category: string; count: number; items: NearbyFacility[] }[],
  accessibilityLevel: string
): string[] {
  const insights: string[] = [];

  const subway = facilities.find((f) => f.category === "지하철역");
  const bus = facilities.find((f) => f.category === "버스정류장");
  const parking = facilities.find((f) => f.category === "주차장");
  const bank = facilities.find((f) => f.category === "은행");
  const convenience = facilities.find((f) => f.category === "편의점");

  // 교통 접근성
  if (subway && subway.count > 0) {
    const nearestSubway = subway.items[0];
    insights.push(`🚇 ${nearestSubway.name}이(가) ${nearestSubway.distance}에 있어 대중교통 접근성이 우수합니다.`);
  } else {
    insights.push("🚇 반경 내 지하철역이 없습니다. 버스 노선이나 주차 편의성을 확인하세요.");
  }

  if (bus && bus.count >= 3) {
    insights.push(`🚌 버스정류장 ${bus.count}개로 대중교통 이용이 편리합니다.`);
  }

  // 주차
  if (parking && parking.count >= 2) {
    insights.push(`🅿️ 주차장 ${parking.count}개로 차량 이용 고객도 편리하게 방문 가능합니다.`);
  } else if (!parking || parking.count === 0) {
    insights.push("🅿️ 주변 주차장이 부족합니다. 주차 불편 시 고객 유입에 영향이 있을 수 있습니다.");
  }

  // 금융
  if (bank && bank.count >= 2) {
    insights.push(`🏦 은행 ${bank.count}개로 금융 업무가 편리합니다.`);
  }

  // 생활 편의
  if (convenience && convenience.count >= 3) {
    insights.push(`🏪 편의점 ${convenience.count}개로 생활 편의시설이 밀집해 있습니다.`);
  }

  // 종합 평가
  if (accessibilityLevel === "우수") {
    insights.push("✅ 종합 접근성이 우수하여 고객 유입에 유리한 입지입니다.");
  } else if (accessibilityLevel === "미흡") {
    insights.push("⚠️ 편의시설이 부족합니다. 목적 방문형 업종이 아니라면 입지를 재검토하세요.");
  }

  return insights;
}

export async function analyzeNearbyFacilities(
  location: string,
  radius: number = 500,
  categories?: string[]
): Promise<ApiResult<NearbyFacilitiesAnalysis>> {
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

    // 2. 조회할 카테고리 결정
    const targetCategories = categories && categories.length > 0
      ? categories.filter((c) => c in FACILITY_CATEGORIES)
      : Object.keys(FACILITY_CATEGORIES);

    // 3. 각 카테고리별 시설 검색
    const facilitiesResults: { category: string; count: number; items: NearbyFacility[] }[] = [];

    for (const category of targetCategories) {
      const categoryCode = FACILITY_CATEGORIES[category as keyof typeof FACILITY_CATEGORIES];

      try {
        let places;

        // 버스정류장은 키워드 검색 사용
        if (category === "버스정류장") {
          places = await kakaoApi.searchByKeyword("버스정류장", {
            x: String(coords.lng),
            y: String(coords.lat),
            radius,
            size: 5,
            sort: "distance",
          });
        } else {
          places = await kakaoApi.searchByCategory(categoryCode, String(coords.lng), String(coords.lat), {
            radius,
            size: 5,
          });
        }

        const items: NearbyFacility[] = places.map((place) => ({
          name: place.place_name,
          category,
          address: place.road_address_name || place.address_name,
          distance: place.distance ? `${place.distance}m` : "거리 정보 없음",
          phone: place.phone || undefined,
        }));

        facilitiesResults.push({
          category,
          count: items.length,
          items,
        });
      } catch {
        // 개별 카테고리 검색 실패 시 빈 결과로 처리
        facilitiesResults.push({
          category,
          count: 0,
          items: [],
        });
      }
    }

    // 4. 접근성 점수 계산
    const { score, level } = calculateAccessibilityScore(facilitiesResults);

    // 5. 하이라이트 생성
    const highlights: string[] = [];
    for (const facility of facilitiesResults) {
      if (facility.count > 0 && facility.items[0]) {
        highlights.push(`${facility.category}: ${facility.items[0].name} (${facility.items[0].distance})`);
      }
    }

    // 6. 인사이트 생성
    const insights = generateInsights(facilitiesResults, level);

    // 7. 총 개수 계산
    const totalCount = facilitiesResults.reduce((sum, f) => sum + f.count, 0);

    return {
      success: true,
      data: {
        location: {
          name: location,
          coordinates: coords,
        },
        radius,
        facilities: facilitiesResults,
        summary: {
          totalCount,
          accessibility: level,
          highlights: highlights.slice(0, 5),
        },
        insights,
      },
      meta: {
        source: DATA_SOURCES.kakaoLocal,
        timestamp: new Date().toISOString(),
        dataNote: `반경 ${radius}m 기준. 신뢰도: 높음 (카카오맵 실시간 API). 접근성 점수: ${score}점. ${DISCLAIMERS.GENERAL}`,
      },
    };
  } catch (error) {
    console.error("편의시설 분석 실패:", error);

    return {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: `편의시설 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "잠시 후 다시 시도해주세요.",
      },
    };
  }
}
