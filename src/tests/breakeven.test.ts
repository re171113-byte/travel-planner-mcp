import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeBreakeven } from "../tools/breakeven.js";

// API 모킹
vi.mock("../api/kakao-api.js", () => ({
  kakaoApi: {
    getCoordinates: vi.fn(),
  },
}));

vi.mock("../api/semas-api.js", () => ({
  semasApi: {
    getStoresByRadius: vi.fn(),
  },
}));

vi.mock("../tools/startup-cost.js", () => ({
  calculateStartupCost: vi.fn(),
}));

import { kakaoApi } from "../api/kakao-api.js";
import { semasApi } from "../api/semas-api.js";
import { calculateStartupCost } from "../tools/startup-cost.js";

describe("analyzeBreakeven", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 모킹 설정
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue({
      lat: 37.497942,
      lng: 127.027619,
    });

    vi.mocked(semasApi.getStoresByRadius).mockResolvedValue({
      stores: [
        { bizesNm: "테스트카페", indsMclsNm: "커피", indsLclsNm: "음식" } as never,
        { bizesNm: "스타벅스", indsMclsNm: "커피", indsLclsNm: "음식" } as never,
      ],
      totalCount: 2,
    });

    vi.mocked(calculateStartupCost).mockResolvedValue({
      success: true,
      data: {
        businessType: "카페",
        region: "강남",
        size: 15,
        premiumLevel: "standard",
        totalCost: { min: 5000, max: 10000, estimated: 7500 },
        breakdown: {
          deposit: 3000,
          interior: 2000,
          equipment: 1500,
          initialInventory: 300,
          operatingFund: 500,
          other: 200,
        },
        regionalNote: "강남 지역",
        tips: [],
      },
    });
  });

  it("should handle unknown business type gracefully", async () => {
    // 알 수 없는 업종도 기본값으로 처리하거나 에러 반환
    const result = await analyzeBreakeven("xyz업종테스트123", "서울", undefined, 15);

    // 에러를 반환하거나 성공하더라도 데이터가 있어야 함
    if (!result.success) {
      expect(result.error?.code).toBe("UNKNOWN_BUSINESS_TYPE");
    } else {
      expect(result.data).toBeDefined();
    }
  });

  it("should analyze breakeven for cafe successfully", async () => {
    const result = await analyzeBreakeven("카페", "강남역", undefined, 15);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.businessType).toBe("카페");
    expect(result.data?.breakeven.monthlySales).toBeGreaterThan(0);
    expect(result.data?.breakeven.dailyCustomers).toBeGreaterThan(0);
  });

  it("should include SEMAS competition data when available", async () => {
    const result = await analyzeBreakeven("카페", "강남역", undefined, 15);

    expect(result.success).toBe(true);
    // SEMAS 데이터가 있으면 인사이트에 경쟁 정보 포함
    expect(result.data?.insights.some(i => i.includes("경쟁"))).toBe(true);
  });

  it("should calculate scenarios correctly", async () => {
    const result = await analyzeBreakeven("카페", "서울", 200, 15);

    expect(result.success).toBe(true);
    expect(result.data?.scenarios.pessimistic.monthlyProfit).toBeLessThan(
      result.data!.scenarios.realistic.monthlyProfit
    );
    expect(result.data?.scenarios.realistic.monthlyProfit).toBeLessThan(
      result.data!.scenarios.optimistic.monthlyProfit
    );
  });

  it("should handle custom rent input", async () => {
    const customRent = 300; // 300만원
    const result = await analyzeBreakeven("카페", "서울", customRent, 15);

    expect(result.success).toBe(true);
    expect(result.data?.costs.breakdown.rent).toBe(customRent);
  });

  it("should handle custom average price", async () => {
    const customPrice = 7000; // 7000원
    const result = await analyzeBreakeven("카페", "서울", undefined, 15, customPrice);

    expect(result.success).toBe(true);
    expect(result.data?.breakeven.averagePrice).toBe(customPrice);
  });
});
