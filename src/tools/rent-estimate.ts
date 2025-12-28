// 임대료 시세 조회 Tool
// 지역별, 업종별 상가 임대료 시세 추정
// 출처: 소상공인진흥공단, 국토부 상업용부동산 통계 기반 추정

import { kakaoApi } from "../api/kakao-api.js";
import { DISCLAIMERS } from "../constants.js";
import type { ApiResult, Coordinates } from "../types.js";
import { REGIONAL_MULTIPLIER, normalizeRegion } from "../data/startup-cost-data.js";

// 지역별 기본 임대료 (평당 만원, 1층 기준)
const BASE_RENT_PER_PYEONG: Record<string, { deposit: number; monthly: number }> = {
  "서울 강남": { deposit: 500, monthly: 35 },
  "서울 홍대": { deposit: 400, monthly: 30 },
  "서울 명동": { deposit: 450, monthly: 32 },
  서울: { deposit: 300, monthly: 22 },
  경기: { deposit: 200, monthly: 15 },
  인천: { deposit: 180, monthly: 13 },
  부산: { deposit: 200, monthly: 14 },
  대구: { deposit: 170, monthly: 12 },
  대전: { deposit: 160, monthly: 11 },
  광주: { deposit: 160, monthly: 11 },
  울산: { deposit: 180, monthly: 12 },
  세종: { deposit: 180, monthly: 13 },
  제주: { deposit: 220, monthly: 16 },
  지방: { deposit: 120, monthly: 8 },
};

// 층별 임대료 배수
const FLOOR_MULTIPLIER: Record<string, number> = {
  "1층": 1.0,
  "2층": 0.7,
  "지하1층": 0.5,
  "3층이상": 0.6,
};

// 건물 유형별 배수
const BUILDING_TYPE_MULTIPLIER: Record<string, number> = {
  상가: 1.0,
  오피스텔: 0.85,
  주상복합: 1.1,
  단독건물: 0.9,
};

// 임대료 분석 결과 타입
export interface RentEstimateAnalysis {
  location: {
    name: string;
    region: string;
    coordinates?: Coordinates;
  };
  conditions: {
    size: number;
    floor: string;
    buildingType: string;
  };
  estimate: {
    deposit: {
      min: number;
      average: number;
      max: number;
    };
    monthlyRent: {
      min: number;
      average: number;
      max: number;
    };
    managementFee: number; // 관리비 추정
    totalMonthlyCost: number; // 월 총 비용 (임대료 + 관리비)
  };
  comparison: {
    vsSeoul: string;
    vsRegionAverage: string;
  };
  insights: string[];
  tips: string[];
}

// 관리비 추정 (평당)
function estimateManagementFee(size: number, floor: string): number {
  const baseFee = 3; // 평당 3만원 기준
  const floorAdjust = floor === "1층" ? 1.0 : floor === "지하1층" ? 1.2 : 0.9;
  return Math.round(size * baseFee * floorAdjust);
}

export async function estimateRent(
  location: string,
  size: number = 15,
  floor: string = "1층",
  buildingType: string = "상가"
): Promise<ApiResult<RentEstimateAnalysis>> {
  try {
    // 1. 지역 정규화
    const normalizedRegion = normalizeRegion(location);

    // 2. 좌표 조회 (선택적)
    let coordinates: Coordinates | undefined;
    try {
      const coords = await kakaoApi.getCoordinates(location);
      if (coords) coordinates = coords;
    } catch {
      // 좌표 조회 실패해도 계속 진행
    }

    // 3. 기본 임대료 조회
    const baseRent = BASE_RENT_PER_PYEONG[normalizedRegion] || BASE_RENT_PER_PYEONG["지방"];

    // 4. 층별 배수 적용
    const floorMult = FLOOR_MULTIPLIER[floor] || 1.0;

    // 5. 건물 유형별 배수 적용
    const buildingMult = BUILDING_TYPE_MULTIPLIER[buildingType] || 1.0;

    // 6. 최종 임대료 계산
    const avgDeposit = Math.round(baseRent.deposit * size * floorMult * buildingMult);
    const avgMonthly = Math.round(baseRent.monthly * size * floorMult * buildingMult);

    // 7. 최소/최대 범위 (±20%)
    const minDeposit = Math.round(avgDeposit * 0.8);
    const maxDeposit = Math.round(avgDeposit * 1.2);
    const minMonthly = Math.round(avgMonthly * 0.8);
    const maxMonthly = Math.round(avgMonthly * 1.2);

    // 8. 관리비 추정
    const managementFee = estimateManagementFee(size, floor);

    // 9. 월 총 비용
    const totalMonthlyCost = avgMonthly + managementFee;

    // 10. 서울 대비 비교
    const seoulBase = BASE_RENT_PER_PYEONG["서울"];
    const vsSeoulRatio = ((baseRent.monthly / seoulBase.monthly) * 100).toFixed(0);
    const vsSeoul =
      Number(vsSeoulRatio) > 100
        ? `서울 평균 대비 ${Number(vsSeoulRatio) - 100}% 높음`
        : Number(vsSeoulRatio) < 100
        ? `서울 평균 대비 ${100 - Number(vsSeoulRatio)}% 저렴`
        : "서울 평균과 동일";

    // 11. 지역 평균 대비
    const regionalData = REGIONAL_MULTIPLIER[normalizedRegion];
    const vsRegionAverage = regionalData
      ? regionalData.note
      : "지역 평균 수준";

    // 12. 인사이트 생성
    const insights: string[] = [];

    if (normalizedRegion.includes("강남") || normalizedRegion.includes("홍대") || normalizedRegion.includes("명동")) {
      insights.push(`🏙️ ${normalizedRegion}은 전국 최고 임대료 지역입니다. 권리금도 높게 형성됩니다.`);
    }

    if (floor === "1층") {
      insights.push("📍 1층은 유동인구 접근성이 좋아 임대료가 가장 높습니다.");
    } else if (floor === "2층") {
      insights.push("📍 2층은 1층 대비 약 30% 저렴하지만, 접근성이 떨어집니다.");
    } else if (floor === "지하1층") {
      insights.push("📍 지하는 1층 대비 약 50% 저렴하지만, 환기/채광에 주의하세요.");
    }

    if (size >= 20) {
      insights.push(`📐 ${size}평은 중형 매장입니다. 규모 대비 효율성을 검토하세요.`);
    } else if (size <= 10) {
      insights.push(`📐 ${size}평은 소형 매장입니다. 테이크아웃/배달 업종에 적합합니다.`);
    }

    // 연간 임대료 비중
    const yearlyRent = avgMonthly * 12;
    insights.push(`💰 연간 임대료 약 ${Math.round(yearlyRent / 100) * 100}만원. 매출의 10% 이내가 적정 수준입니다.`);

    // 13. 비용 절감 팁
    const tips = [
      "권리금 협상: 신규 상가, 공실 장기화 매물 노리기",
      "프리렌트: 입점 초기 1-3개월 무상 임대 협상 가능",
      "임대료 인상률: 연 5% 이내로 계약서 명시하세요",
      "상가 경매/공매: 시세 50-70% 수준 가능",
    ];

    if (floor !== "1층") {
      tips.push("2층 이상은 간판 크기/위치 협상이 중요합니다");
    }

    return {
      success: true,
      data: {
        location: {
          name: location,
          region: normalizedRegion,
          coordinates,
        },
        conditions: {
          size,
          floor,
          buildingType,
        },
        estimate: {
          deposit: {
            min: minDeposit,
            average: avgDeposit,
            max: maxDeposit,
          },
          monthlyRent: {
            min: minMonthly,
            average: avgMonthly,
            max: maxMonthly,
          },
          managementFee,
          totalMonthlyCost,
        },
        comparison: {
          vsSeoul,
          vsRegionAverage,
        },
        insights,
        tips,
      },
      meta: {
        source: "소상공인진흥공단, 국토부 상업용부동산 통계 기반 추정",
        timestamp: new Date().toISOString(),
        dataNote: `${size}평, ${floor} 기준. 신뢰도: 중간 (통계 기반 추정치). ${DISCLAIMERS.STARTUP_COST}`,
      },
    };
  } catch (error) {
    console.error("임대료 시세 조회 실패:", error);

    return {
      success: false,
      error: {
        code: "ESTIMATE_FAILED",
        message: `임대료 시세 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "입력값을 확인하고 다시 시도해주세요.",
      },
    };
  }
}
