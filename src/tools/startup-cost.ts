// 창업 비용 계산기 Tool
// 업종별, 지역별, 규모별 예상 창업 비용 산출
// 출처: 소상공인진흥공단, 창업진흥원, 프랜차이즈 정보공개서

import type { ApiResult, StartupCostAnalysis } from "../types.js";
import {
  BUSINESS_COST_DATA,
  REGIONAL_MULTIPLIER,
  COST_SAVING_TIPS,
  normalizeBusinessType,
  normalizeRegion,
} from "../data/startup-cost-data.js";
import { DISCLAIMERS } from "../constants.js";

export async function calculateStartupCost(
  businessType: string,
  region: string,
  size: number = 15,
  premiumLevel: "basic" | "standard" | "premium" = "standard"
): Promise<ApiResult<StartupCostAnalysis>> {
  try {
    // 업종 및 지역 정규화
    const normalizedType = normalizeBusinessType(businessType);
    const normalizedRegion = normalizeRegion(region);

    // 업종 데이터 조회
    const businessData = BUSINESS_COST_DATA[normalizedType];
    if (!businessData) {
      return {
        success: false,
        error: {
          code: "UNKNOWN_BUSINESS_TYPE",
          message: `알 수 없는 업종입니다: ${businessType}`,
          suggestion: "카페, 음식점, 편의점, 미용실, 치킨, 호프, 분식, 베이커리, 무인매장, 스터디카페, 네일샵, 반려동물 중 선택해주세요.",
        },
      };
    }

    // 지역 배수 조회
    const regionalData = REGIONAL_MULTIPLIER[normalizedRegion];
    if (!regionalData) {
      return {
        success: false,
        error: {
          code: "UNKNOWN_REGION",
          message: `알 수 없는 지역입니다: ${region}`,
          suggestion: "서울, 강남, 홍대, 명동, 경기, 인천, 부산, 대구, 대전, 광주, 울산, 세종, 제주 등을 입력해주세요.",
        },
      };
    }

    const multiplier = regionalData.multiplier;

    // 인테리어 비용 계산 (평당)
    const interiorPerPyeong = businessData.interior[premiumLevel];
    const interiorCost = interiorPerPyeong * size * multiplier;

    // 보증금 계산 (지역 배수 적용)
    const depositMin = businessData.deposit.min * multiplier;
    const depositMax = businessData.deposit.max * multiplier;
    const depositEstimate = (depositMin + depositMax) / 2;

    // 장비 비용 (지역 무관)
    const equipmentMin = businessData.equipment.min;
    const equipmentMax = businessData.equipment.max;
    const equipmentEstimate = (equipmentMin + equipmentMax) / 2;

    // 초기 재고
    const inventoryMin = businessData.inventory.min;
    const inventoryMax = businessData.inventory.max;
    const inventoryEstimate = (inventoryMin + inventoryMax) / 2;

    // 운영자금 (6개월)
    const monthlyOperating = businessData.monthlyOperating * multiplier;
    const operatingFund = monthlyOperating * 6;

    // 기타 비용 (인허가, 마케팅 등) - 전체 비용의 약 5%
    const subtotal = depositEstimate + interiorCost + equipmentEstimate + inventoryEstimate + operatingFund;
    const otherCost = Math.round(subtotal * 0.05);

    // 총 비용 계산
    const totalMin = Math.round(
      depositMin + interiorPerPyeong * size * multiplier * 0.8 + equipmentMin + inventoryMin + monthlyOperating * 4 + otherCost * 0.7
    );
    const totalMax = Math.round(
      depositMax + interiorPerPyeong * size * multiplier * 1.2 + equipmentMax + inventoryMax + monthlyOperating * 8 + otherCost * 1.3
    );
    const totalEstimate = Math.round(subtotal + otherCost);

    // 비용 절감 팁 가져오기
    const tips = [
      ...(COST_SAVING_TIPS[normalizedType] || []),
      ...COST_SAVING_TIPS["공통"],
    ];

    // 프리미엄 레벨 한글 변환
    const premiumLabels: Record<string, string> = {
      basic: "기본",
      standard: "중급",
      premium: "고급",
    };

    return {
      success: true,
      data: {
        businessType: normalizedType,
        region: normalizedRegion,
        size,
        premiumLevel: premiumLabels[premiumLevel],
        totalCost: {
          min: totalMin,
          max: totalMax,
          estimated: totalEstimate,
        },
        breakdown: {
          deposit: Math.round(depositEstimate),
          interior: Math.round(interiorCost),
          equipment: Math.round(equipmentEstimate),
          initialInventory: Math.round(inventoryEstimate),
          operatingFund: Math.round(operatingFund),
          other: otherCost,
        },
        regionalNote: `${normalizedRegion}: ${regionalData.note}`,
        tips,
      },
      meta: {
        source: "소상공인진흥공단, 창업진흥원 통계 기반 추정",
        timestamp: new Date().toISOString(),
        dataNote: `${size}평 기준, ${premiumLabels[premiumLevel]} 인테리어 수준. 🟡 신뢰도: 중간 (통계 기반 추정치). ${DISCLAIMERS.STARTUP_COST}`,
      },
    };
  } catch (error) {
    console.error("창업 비용 계산 실패:", error);

    return {
      success: false,
      error: {
        code: "CALCULATION_FAILED",
        message: "창업 비용 계산 중 오류가 발생했습니다.",
        suggestion: "입력값을 확인하고 다시 시도해주세요.",
      },
    };
  }
}
