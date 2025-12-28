// 손익분기점 분석 Tool
// 업종별 손익분기점 및 수익성 시뮬레이션
// 출처: 소상공인마당 상권정보 API (실시간 경쟁도) + 소상공인진흥공단 원가 분석

import { kakaoApi } from "../api/kakao-api.js";
import { semasApi } from "../api/semas-api.js";
import type { ApiResult, BreakevenAnalysis, Coordinates } from "../types.js";
import { DISCLAIMERS } from "../constants.js";
import {
  BUSINESS_BENCHMARKS,
  RENT_MULTIPLIER,
  ACHIEVABILITY_CRITERIA,
  SCENARIO_MULTIPLIERS,
  PAYBACK_CRITERIA,
  BREAKEVEN_INSIGHTS,
  normalizeBusinessTypeForBreakeven,
} from "../data/breakeven-data.js";
import { normalizeRegion } from "../data/startup-cost-data.js";
import { calculateStartupCost } from "./startup-cost.js";

// 경쟁도 기반 매출 조정 계수
const COMPETITION_SALES_MULTIPLIER = {
  low: 1.15, // 경쟁 낮음: 매출 15% 상향
  medium: 1.0, // 경쟁 보통: 기준
  high: 0.85, // 경쟁 높음: 매출 15% 하향
  saturated: 0.7, // 포화: 매출 30% 하향
} as const;

// 경쟁도 판단 기준 (반경 500m 내 동종업계 수)
const COMPETITION_THRESHOLDS = {
  low: 5,
  medium: 15,
  high: 30,
};

// SEMAS API로 경쟁업체 수 조회
async function fetchCompetitorCount(
  coordinates: Coordinates,
  businessType: string,
  radius: number = 500
): Promise<{
  competitorCount: number;
  competitionLevel: keyof typeof COMPETITION_SALES_MULTIPLIER;
  topCompetitors: { name: string; count: number }[];
  isRealTime: boolean;
} | null> {
  try {
    const { stores } = await semasApi.getStoresByRadius(
      coordinates.lng,
      coordinates.lat,
      radius,
      { numOfRows: 500 }
    );

    if (!stores || stores.length === 0) return null;

    // 동종 업계 필터링 (업종명 포함 여부)
    const keywords = getBusinessKeywords(businessType);
    const competitors = stores.filter(store => {
      const storeName = (store.indsMclsNm || store.indsLclsNm || "").toLowerCase();
      return keywords.some(kw => storeName.includes(kw));
    });

    const competitorCount = competitors.length;

    // 경쟁도 판단
    let competitionLevel: keyof typeof COMPETITION_SALES_MULTIPLIER;
    if (competitorCount <= COMPETITION_THRESHOLDS.low) {
      competitionLevel = "low";
    } else if (competitorCount <= COMPETITION_THRESHOLDS.medium) {
      competitionLevel = "medium";
    } else if (competitorCount <= COMPETITION_THRESHOLDS.high) {
      competitionLevel = "high";
    } else {
      competitionLevel = "saturated";
    }

    // 상위 경쟁업체 (업종별 집계)
    const categoryMap = new Map<string, number>();
    for (const store of competitors) {
      const category = store.indsMclsNm || store.indsLclsNm || "기타";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    const topCompetitors = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      competitorCount,
      competitionLevel,
      topCompetitors,
      isRealTime: true,
    };
  } catch (error) {
    console.log("경쟁업체 조회 실패:", error);
    return null;
  }
}

// 업종별 검색 키워드
function getBusinessKeywords(businessType: string): string[] {
  const keywordMap: Record<string, string[]> = {
    카페: ["커피", "카페", "음료"],
    음식점: ["음식", "식당", "레스토랑"],
    편의점: ["편의점", "마트", "슈퍼"],
    미용실: ["미용", "헤어", "살롱"],
    치킨: ["치킨", "닭"],
    호프: ["호프", "맥주", "주점"],
    분식: ["분식", "떡볶이", "라면"],
    베이커리: ["빵", "베이커리", "제과"],
    무인매장: ["무인", "셀프"],
    스터디카페: ["스터디", "독서실"],
    네일샵: ["네일", "손톱"],
    반려동물: ["반려", "펫", "애견"],
  };
  return keywordMap[businessType] || [businessType];
}

export async function analyzeBreakeven(
  businessType: string,
  region: string,
  monthlyRent?: number,
  size: number = 15,
  averagePrice?: number
): Promise<ApiResult<BreakevenAnalysis>> {
  try {
    // 업종 및 지역 정규화
    const normalizedType = normalizeBusinessTypeForBreakeven(businessType);
    const normalizedRegion = normalizeRegion(region);

    // 벤치마크 데이터 조회
    const benchmark = BUSINESS_BENCHMARKS[normalizedType];
    if (!benchmark) {
      return {
        success: false,
        error: {
          code: "UNKNOWN_BUSINESS_TYPE",
          message: `알 수 없는 업종입니다: ${businessType}`,
          suggestion: "카페, 음식점, 편의점, 미용실, 치킨, 호프, 분식, 베이커리, 무인매장, 스터디카페, 네일샵, 반려동물 중 선택해주세요.",
        },
      };
    }

    // 좌표 조회 (경쟁도 분석용)
    let coordinates: Coordinates | null = null;
    let competitorData: Awaited<ReturnType<typeof fetchCompetitorCount>> = null;
    let dataConfidence: "high" | "medium" | "low" = "low";

    try {
      coordinates = await kakaoApi.getCoordinates(region);
      if (coordinates) {
        competitorData = await fetchCompetitorCount(coordinates, normalizedType, 500);
        if (competitorData) {
          dataConfidence = "high"; // 실시간 경쟁 데이터 있음
        }
      }
    } catch (error) {
      console.log("좌표/경쟁도 조회 실패, 기본값 사용:", error);
    }

    // 지역별 임대료 배수
    const rentMultiplier = RENT_MULTIPLIER[normalizedRegion] || 0.5;

    // 임대료 계산 (입력값 또는 추정값)
    const calculatedRent = monthlyRent || Math.round(benchmark.rentPerPyeong * size * rentMultiplier);

    // 인건비 계산
    const laborCost = benchmark.laborPerPerson * benchmark.minStaff;

    // 공과금 (면적 비례 조정)
    const utilities = Math.round(benchmark.utilities * (size / 15));

    // 기타 고정비
    const otherFixed = benchmark.otherFixed;

    // 총 고정비
    const fixedMonthly = calculatedRent + laborCost + utilities + otherFixed;

    // 변동비율
    const variableRatio = benchmark.variableRatio;

    // 객단가 (입력값 또는 벤치마크)
    const usedAveragePrice = averagePrice || benchmark.averagePrice;

    // 손익분기점 계산: BEP = 고정비 / (1 - 변동비율)
    const breakevenMonthlySales = Math.round(fixedMonthly / (1 - variableRatio));
    const breakevenDailySales = Math.round(breakevenMonthlySales / 30);
    const breakevenDailyCustomers = Math.round(breakevenDailySales / usedAveragePrice * 10000);

    // 달성 가능성 판단
    let achievability: "쉬움" | "보통" | "어려움";
    if (breakevenDailyCustomers <= ACHIEVABILITY_CRITERIA["쉬움"].maxDailyCustomers) {
      achievability = "쉬움";
    } else if (breakevenDailyCustomers <= ACHIEVABILITY_CRITERIA["보통"].maxDailyCustomers) {
      achievability = "보통";
    } else {
      achievability = "어려움";
    }

    // 경쟁도 기반 매출 조정 계수
    const competitionMultiplier = competitorData
      ? COMPETITION_SALES_MULTIPLIER[competitorData.competitionLevel]
      : 1.0;

    // 시나리오별 수익 계산 (경쟁도 반영)
    const calculateProfit = (salesMultiplier: number): { monthlySales: number; monthlyProfit: number } => {
      const baseSales = breakevenMonthlySales * salesMultiplier;
      const adjustedSales = Math.round(baseSales * competitionMultiplier);
      const variableCost = Math.round(adjustedSales * variableRatio);
      const monthlyProfit = adjustedSales - variableCost - fixedMonthly;
      return { monthlySales: adjustedSales, monthlyProfit };
    };

    const scenarios = {
      pessimistic: calculateProfit(SCENARIO_MULTIPLIERS.pessimistic),
      realistic: calculateProfit(SCENARIO_MULTIPLIERS.realistic),
      optimistic: calculateProfit(SCENARIO_MULTIPLIERS.optimistic),
    };

    // 투자금 회수 기간 계산 (창업비용 조회)
    const costResult = await calculateStartupCost(businessType, region, size, "standard");
    const investmentAmount = costResult.success && costResult.data
      ? costResult.data.totalCost.estimated
      : fixedMonthly * 12; // 실패 시 고정비 12개월로 추정

    const monthlyRealisticProfit = scenarios.realistic.monthlyProfit;
    let paybackMonths: number;
    let paybackNote: string;

    if (monthlyRealisticProfit <= 0) {
      paybackMonths = 999;
      paybackNote = "현실적 시나리오에서 수익이 발생하지 않아 투자 회수가 어렵습니다. 비용 구조 재검토 필요.";
    } else {
      paybackMonths = Math.ceil(investmentAmount / monthlyRealisticProfit);

      if (paybackMonths <= PAYBACK_CRITERIA.excellent.maxMonths) {
        paybackNote = PAYBACK_CRITERIA.excellent.note;
      } else if (paybackMonths <= PAYBACK_CRITERIA.good.maxMonths) {
        paybackNote = PAYBACK_CRITERIA.good.note;
      } else if (paybackMonths <= PAYBACK_CRITERIA.average.maxMonths) {
        paybackNote = PAYBACK_CRITERIA.average.note;
      } else {
        paybackNote = PAYBACK_CRITERIA.poor.note;
      }
    }

    // 인사이트 생성
    const insights: string[] = [];

    // 경쟁도 정보 먼저 표시
    if (competitorData) {
      const competitionLabels = { low: "낮음", medium: "보통", high: "높음", saturated: "포화" };
      insights.push(`[실시간 경쟁 분석] 반경 500m 내 동종업계 ${competitorData.competitorCount}개`);
      insights.push(`경쟁 강도: ${competitionLabels[competitorData.competitionLevel]} (매출 ${Math.round((competitionMultiplier - 1) * 100)}% 조정)`);
      if (competitorData.topCompetitors.length > 0) {
        insights.push(`주요 경쟁업종: ${competitorData.topCompetitors.map(c => `${c.name}(${c.count})`).join(", ")}`);
      }
      insights.push("");
    }

    // 데이터 신뢰도 표시
    const confidenceLabels = { high: "높음 (API 실시간)", medium: "중간", low: "낮음 (벤치마크 기반)" };
    insights.push(`[데이터 신뢰도: ${confidenceLabels[dataConfidence]}]`);

    // 업종별 인사이트
    insights.push(...(BREAKEVEN_INSIGHTS[normalizedType] || []));
    insights.push(...BREAKEVEN_INSIGHTS["공통"]);

    // 추가 상황별 인사이트
    if (achievability === "어려움") {
      insights.unshift("일 필요 고객수가 많습니다. 입지 선정 시 유동인구가 많은 곳을 우선 검토하세요.");
    }
    if (laborCost > calculatedRent) {
      insights.unshift("인건비가 임대료보다 높습니다. 운영 효율화나 무인화를 검토해보세요.");
    }
    if (paybackMonths > 36) {
      insights.unshift("투자 회수 기간이 3년을 초과합니다. 초기 투자 비용 절감 방안을 검토하세요.");
    }
    if (competitorData?.competitionLevel === "saturated") {
      insights.unshift("⚠️ 경쟁 포화 상태입니다. 강력한 차별화 전략 없이는 생존이 어려울 수 있습니다.");
    }

    return {
      success: true,
      data: {
        businessType: normalizedType,
        region: normalizedRegion,
        size,
        costs: {
          fixedMonthly,
          variableRatio,
          breakdown: {
            rent: calculatedRent,
            labor: laborCost,
            utilities,
            other: otherFixed,
          },
        },
        breakeven: {
          monthlySales: breakevenMonthlySales,
          dailySales: breakevenDailySales,
          dailyCustomers: breakevenDailyCustomers,
          averagePrice: usedAveragePrice,
          achievability,
        },
        scenarios,
        paybackPeriod: {
          investmentAmount,
          months: paybackMonths,
          note: paybackNote,
        },
        insights,
      },
      meta: {
        source: competitorData
          ? "소상공인마당 상권정보 API (실시간 경쟁도) + 소상공인진흥공단 원가 분석"
          : "소상공인진흥공단 업종별 원가 분석 기반 추정",
        timestamp: new Date().toISOString(),
        dataNote: competitorData
          ? `${size}평 기준. 반경 500m 내 경쟁업체 ${competitorData.competitorCount}개 반영. 신뢰도: ${confidenceLabels[dataConfidence]}. ${DISCLAIMERS.BREAKEVEN}`
          : `${size}평 기준, 객단가 ${usedAveragePrice.toLocaleString()}원 기준. 신뢰도: ${confidenceLabels[dataConfidence]}. ${DISCLAIMERS.BREAKEVEN}`,
      },
    };
  } catch (error) {
    console.error("손익분기점 분석 실패:", error);

    return {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: "손익분기점 분석 중 오류가 발생했습니다.",
        suggestion: "입력값을 확인하고 다시 시도해주세요.",
      },
    };
  }
}
