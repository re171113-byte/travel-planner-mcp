// 매출 시뮬레이션 Tool
// 업종별, 지역별, 시간대별 예상 매출 시뮬레이션
// 출처: 소상공인마당, 통계청, 업종별 평균 데이터 기반

import { DISCLAIMERS } from "../constants.js";
import type { ApiResult } from "../types.js";
import { normalizeBusinessType, normalizeRegion, REGIONAL_MULTIPLIER } from "../data/startup-cost-data.js";

// 업종별 기본 일 매출 (15평, 1인 운영 기준, 단위: 만원)
const BASE_DAILY_REVENUE: Record<string, { min: number; avg: number; max: number; avgCustomers: number; avgPrice: number }> = {
  카페: { min: 30, avg: 50, max: 80, avgCustomers: 80, avgPrice: 6000 },
  음식점: { min: 40, avg: 70, max: 120, avgCustomers: 50, avgPrice: 12000 },
  편의점: { min: 80, avg: 120, max: 180, avgCustomers: 200, avgPrice: 6000 },
  미용실: { min: 20, avg: 40, max: 70, avgCustomers: 8, avgPrice: 50000 },
  치킨: { min: 50, avg: 80, max: 130, avgCustomers: 40, avgPrice: 20000 },
  호프: { min: 40, avg: 70, max: 120, avgCustomers: 30, avgPrice: 25000 },
  분식: { min: 25, avg: 45, max: 70, avgCustomers: 60, avgPrice: 7000 },
  베이커리: { min: 35, avg: 60, max: 100, avgCustomers: 70, avgPrice: 8000 },
  무인매장: { min: 15, avg: 25, max: 40, avgCustomers: 50, avgPrice: 5000 },
  스터디카페: { min: 20, avg: 35, max: 55, avgCustomers: 40, avgPrice: 8000 },
  네일샵: { min: 15, avg: 30, max: 50, avgCustomers: 6, avgPrice: 50000 },
  반려동물: { min: 25, avg: 45, max: 75, avgCustomers: 15, avgPrice: 30000 },
};

// 계절별 매출 배수
const SEASON_MULTIPLIER: Record<string, Record<string, number>> = {
  카페: { 봄: 1.0, 여름: 1.2, 가을: 1.0, 겨울: 0.9 },
  음식점: { 봄: 1.0, 여름: 0.9, 가을: 1.1, 겨울: 1.1 },
  편의점: { 봄: 1.0, 여름: 1.1, 가을: 1.0, 겨울: 1.0 },
  치킨: { 봄: 1.0, 여름: 1.2, 가을: 1.0, 겨울: 1.0 },
  호프: { 봄: 1.0, 여름: 1.3, 가을: 1.0, 겨울: 0.9 },
  default: { 봄: 1.0, 여름: 1.0, 가을: 1.0, 겨울: 1.0 },
};

// 매출 시뮬레이션 결과 타입
export interface RevenueSimulation {
  businessType: string;
  region: string;
  conditions: {
    size: number;
    staffCount: number;
    operatingHours: number;
  };
  dailyRevenue: {
    min: number;
    average: number;
    max: number;
  };
  monthlyRevenue: {
    min: number;
    average: number;
    max: number;
  };
  yearlyRevenue: {
    min: number;
    average: number;
    max: number;
  };
  customerAnalysis: {
    dailyCustomers: number;
    averagePrice: number;
    peakHours: string;
    peakDays: string;
  };
  seasonalVariation: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
  profitEstimate: {
    monthlyProfit: number;
    profitMargin: number;
    note: string;
  };
  insights: string[];
}

// 현재 계절 계산
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
}

export async function simulateRevenue(
  businessType: string,
  region: string,
  size: number = 15,
  staffCount: number = 1,
  operatingHours: number = 12
): Promise<ApiResult<RevenueSimulation>> {
  try {
    // 1. 업종 및 지역 정규화
    const normalizedType = normalizeBusinessType(businessType);
    const normalizedRegion = normalizeRegion(region);

    // 2. 기본 매출 데이터 조회
    const baseRevenue = BASE_DAILY_REVENUE[normalizedType];
    if (!baseRevenue) {
      return {
        success: false,
        error: {
          code: "UNKNOWN_BUSINESS_TYPE",
          message: `알 수 없는 업종입니다: ${businessType}`,
          suggestion: "카페, 음식점, 편의점, 미용실, 치킨, 호프, 분식, 베이커리, 무인매장, 스터디카페, 네일샵, 반려동물 중 선택해주세요.",
        },
      };
    }

    // 3. 지역 배수 적용
    const regionData = REGIONAL_MULTIPLIER[normalizedRegion];
    const regionMultiplier = regionData ? regionData.multiplier : 0.8;

    // 4. 규모 배수 (15평 기준)
    const sizeMultiplier = Math.sqrt(size / 15);

    // 5. 인력 배수 (좌석 회전율 증가)
    const staffMultiplier = 1 + (staffCount - 1) * 0.3;

    // 6. 운영시간 배수 (12시간 기준)
    const hoursMultiplier = operatingHours / 12;

    // 7. 일 매출 계산
    const totalMultiplier = regionMultiplier * sizeMultiplier * staffMultiplier * hoursMultiplier;
    const dailyMin = Math.round(baseRevenue.min * totalMultiplier);
    const dailyAvg = Math.round(baseRevenue.avg * totalMultiplier);
    const dailyMax = Math.round(baseRevenue.max * totalMultiplier);

    // 8. 월 매출 (일 매출 × 26일, 주 1일 휴무 가정)
    const monthlyMin = dailyMin * 26;
    const monthlyAvg = dailyAvg * 26;
    const monthlyMax = dailyMax * 26;

    // 9. 연 매출
    const yearlyMin = monthlyMin * 12;
    const yearlyAvg = monthlyAvg * 12;
    const yearlyMax = monthlyMax * 12;

    // 10. 고객 분석
    const dailyCustomers = Math.round(baseRevenue.avgCustomers * sizeMultiplier * staffMultiplier);
    const averagePrice = baseRevenue.avgPrice;

    // 11. 피크 시간/요일
    const peakHours = normalizedType === "카페" ? "오전 8-10시, 오후 2-4시"
      : normalizedType === "음식점" ? "점심 12-1시, 저녁 6-8시"
      : normalizedType === "호프" ? "저녁 7-11시"
      : normalizedType === "편의점" ? "오전 7-9시, 저녁 6-10시"
      : "점심 12-2시, 저녁 6-9시";

    const peakDays = normalizedType === "호프" || normalizedType === "치킨"
      ? "금요일, 토요일"
      : "토요일, 일요일";

    // 12. 계절별 변동
    const seasonMult = SEASON_MULTIPLIER[normalizedType] || SEASON_MULTIPLIER.default;
    const seasonalVariation = {
      spring: Math.round(monthlyAvg * seasonMult.봄),
      summer: Math.round(monthlyAvg * seasonMult.여름),
      fall: Math.round(monthlyAvg * seasonMult.가을),
      winter: Math.round(monthlyAvg * seasonMult.겨울),
    };

    // 13. 수익 추정 (업종별 평균 마진율 적용)
    const marginRates: Record<string, number> = {
      카페: 0.35,
      음식점: 0.25,
      편의점: 0.20,
      미용실: 0.45,
      치킨: 0.25,
      호프: 0.30,
      분식: 0.30,
      베이커리: 0.35,
      무인매장: 0.40,
      스터디카페: 0.45,
      네일샵: 0.50,
      반려동물: 0.35,
    };
    const profitMargin = marginRates[normalizedType] || 0.30;
    const monthlyProfit = Math.round(monthlyAvg * profitMargin);

    // 14. 인사이트 생성
    const insights: string[] = [];
    const currentSeason = getCurrentSeason();
    const currentSeasonMult = seasonMult[currentSeason as keyof typeof seasonMult] || 1.0;

    insights.push(`💰 예상 월 순이익: 약 ${monthlyProfit.toLocaleString()}만원 (마진율 ${(profitMargin * 100).toFixed(0)}%)`);

    if (currentSeasonMult > 1.0) {
      insights.push(`📈 현재 ${currentSeason}철은 ${normalizedType} 업종 성수기입니다. 매출 ${((currentSeasonMult - 1) * 100).toFixed(0)}% 상승 예상.`);
    } else if (currentSeasonMult < 1.0) {
      insights.push(`📉 현재 ${currentSeason}철은 ${normalizedType} 업종 비수기입니다. 매출 ${((1 - currentSeasonMult) * 100).toFixed(0)}% 하락 예상.`);
    }

    if (normalizedRegion.includes("강남") || normalizedRegion.includes("홍대")) {
      insights.push(`🏙️ ${normalizedRegion}은 유동인구가 많아 매출이 높은 편입니다.`);
    }

    if (staffCount >= 2) {
      insights.push(`👥 ${staffCount}인 운영으로 고객 회전율이 높아집니다. 인건비 대비 매출 증가를 계산하세요.`);
    }

    if (operatingHours < 10) {
      insights.push(`⏰ 운영시간이 ${operatingHours}시간으로 짧습니다. 피크 시간대 집중 운영을 권장합니다.`);
    }

    // 손익분기 관점
    const breakEvenDaily = dailyAvg * (1 - profitMargin);
    insights.push(`📊 손익분기를 넘으려면 일 매출 ${Math.round(breakEvenDaily)}만원 이상이 필요합니다.`);

    const profitNote = monthlyProfit > 300
      ? "월 순이익 300만원 이상으로 양호한 수준입니다."
      : monthlyProfit > 200
      ? "월 순이익 200만원 이상으로 적정 수준입니다."
      : "월 순이익이 낮습니다. 비용 절감 또는 매출 증대 방안을 검토하세요.";

    return {
      success: true,
      data: {
        businessType: normalizedType,
        region: normalizedRegion,
        conditions: {
          size,
          staffCount,
          operatingHours,
        },
        dailyRevenue: {
          min: dailyMin,
          average: dailyAvg,
          max: dailyMax,
        },
        monthlyRevenue: {
          min: monthlyMin,
          average: monthlyAvg,
          max: monthlyMax,
        },
        yearlyRevenue: {
          min: yearlyMin,
          average: yearlyAvg,
          max: yearlyMax,
        },
        customerAnalysis: {
          dailyCustomers,
          averagePrice,
          peakHours,
          peakDays,
        },
        seasonalVariation,
        profitEstimate: {
          monthlyProfit,
          profitMargin: Math.round(profitMargin * 100),
          note: profitNote,
        },
        insights,
      },
      meta: {
        source: "소상공인마당, 통계청, 업종별 평균 데이터 기반 추정",
        timestamp: new Date().toISOString(),
        dataNote: `${size}평, ${staffCount}인 운영, ${operatingHours}시간 기준. 🟡 신뢰도: 중간 (통계 기반 추정치). ${DISCLAIMERS.REVENUE_ESTIMATE}`,
      },
    };
  } catch (error) {
    console.error("매출 시뮬레이션 실패:", error);

    return {
      success: false,
      error: {
        code: "SIMULATION_FAILED",
        message: `매출 시뮬레이션 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "입력값을 확인하고 다시 시도해주세요.",
      },
    };
  }
}
