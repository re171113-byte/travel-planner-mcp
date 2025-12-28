import { describe, it, expect } from "vitest";
import { calculateStartupCost } from "../tools/startup-cost.js";

describe("calculateStartupCost", () => {
  it("should handle unknown business type gracefully", async () => {
    // 정규화되지 않는 완전히 다른 업종 사용
    const result = await calculateStartupCost("xyz테스트업종123", "서울", 15, "standard");

    // 에러를 반환하거나 성공하더라도 데이터가 있어야 함
    if (!result.success) {
      expect(result.error?.code).toBe("UNKNOWN_BUSINESS_TYPE");
    } else {
      expect(result.data).toBeDefined();
    }
  });

  it("should calculate cost for cafe successfully", async () => {
    const result = await calculateStartupCost("카페", "서울", 15, "standard");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.businessType).toBe("카페");
    expect(result.data?.totalCost.estimated).toBeGreaterThan(0);
  });

  it("should apply regional multiplier", async () => {
    const seoulResult = await calculateStartupCost("카페", "강남", 15, "standard");
    const busanResult = await calculateStartupCost("카페", "부산", 15, "standard");

    expect(seoulResult.success).toBe(true);
    expect(busanResult.success).toBe(true);
    // 서울/강남이 부산보다 비용이 높아야 함
    expect(seoulResult.data!.totalCost.estimated).toBeGreaterThan(
      busanResult.data!.totalCost.estimated
    );
  });

  it("should apply size multiplier", async () => {
    const smallResult = await calculateStartupCost("카페", "서울", 10, "standard");
    const largeResult = await calculateStartupCost("카페", "서울", 30, "standard");

    expect(smallResult.success).toBe(true);
    expect(largeResult.success).toBe(true);
    // 큰 매장이 더 비용이 높아야 함
    expect(largeResult.data!.totalCost.estimated).toBeGreaterThan(
      smallResult.data!.totalCost.estimated
    );
  });

  it("should apply premium level multiplier", async () => {
    const basicResult = await calculateStartupCost("카페", "서울", 15, "basic");
    const premiumResult = await calculateStartupCost("카페", "서울", 15, "premium");

    expect(basicResult.success).toBe(true);
    expect(premiumResult.success).toBe(true);
    // 프리미엄이 베이직보다 비용이 높아야 함
    expect(premiumResult.data!.totalCost.estimated).toBeGreaterThan(
      basicResult.data!.totalCost.estimated
    );
  });

  it("should include all cost breakdown items", async () => {
    const result = await calculateStartupCost("카페", "서울", 15, "standard");

    expect(result.success).toBe(true);
    expect(result.data?.breakdown).toBeDefined();
    expect(result.data?.breakdown.deposit).toBeGreaterThan(0);
    expect(result.data?.breakdown.interior).toBeGreaterThan(0);
    expect(result.data?.breakdown.equipment).toBeGreaterThan(0);
    expect(result.data?.breakdown.initialInventory).toBeGreaterThanOrEqual(0);
    expect(result.data?.breakdown.operatingFund).toBeGreaterThan(0);
  });

  it("should provide tips", async () => {
    const result = await calculateStartupCost("카페", "서울", 15, "standard");

    expect(result.success).toBe(true);
    expect(result.data?.tips).toBeDefined();
    expect(result.data?.tips.length).toBeGreaterThan(0);
  });

  it("should normalize business type variations", async () => {
    const cafeResult1 = await calculateStartupCost("카페", "서울", 15, "standard");
    const cafeResult2 = await calculateStartupCost("커피", "서울", 15, "standard");
    const cafeResult3 = await calculateStartupCost("커피숍", "서울", 15, "standard");

    expect(cafeResult1.success).toBe(true);
    expect(cafeResult2.success).toBe(true);
    expect(cafeResult3.success).toBe(true);
    // 모두 카페로 정규화되어야 함
    expect(cafeResult1.data?.businessType).toBe("카페");
    expect(cafeResult2.data?.businessType).toBe("카페");
    expect(cafeResult3.data?.businessType).toBe("카페");
  });

  it("should calculate for different business types", async () => {
    const businessTypes = ["음식점", "편의점", "미용실", "치킨"];

    for (const type of businessTypes) {
      const result = await calculateStartupCost(type, "서울", 15, "standard");
      expect(result.success).toBe(true);
      expect(result.data?.totalCost.estimated).toBeGreaterThan(0);
    }
  });

  it("should include regional note", async () => {
    const result = await calculateStartupCost("카페", "강남", 15, "standard");

    expect(result.success).toBe(true);
    expect(result.data?.regionalNote).toBeDefined();
    expect(result.data?.regionalNote.length).toBeGreaterThan(0);
  });

  it("should ensure min <= estimated <= max", async () => {
    const result = await calculateStartupCost("카페", "서울", 15, "standard");

    expect(result.success).toBe(true);
    expect(result.data?.totalCost.min).toBeLessThanOrEqual(result.data!.totalCost.estimated);
    expect(result.data?.totalCost.estimated).toBeLessThanOrEqual(result.data!.totalCost.max);
  });
});
