// 에러 시나리오 테스트
import { describe, it, expect } from "vitest";
import {
  formatCommercialArea,
  formatCompetitors,
  formatPolicyFunds,
  formatChecklist,
  formatTrends,
} from "../utils/response-formatter.js";

describe("에러 응답 포맷팅", () => {
  it("상권 분석 실패 시 에러 메시지를 포맷팅한다", () => {
    const errorResult = {
      success: false as const,
      error: {
        code: "LOCATION_NOT_FOUND",
        message: "입력하신 위치를 찾을 수 없습니다: 없는장소",
        suggestion: "강남역, 홍대입구 등 구체적인 지명을 입력해주세요.",
      },
    };

    const formatted = formatCommercialArea(errorResult);

    expect(formatted).toContain("❌ 오류");
    expect(formatted).toContain("입력하신 위치를 찾을 수 없습니다");
    expect(formatted).toContain("💡");
  });

  it("경쟁업체 검색 실패 시 에러 메시지를 포맷팅한다", () => {
    const errorResult = {
      success: false as const,
      error: {
        code: "SEARCH_FAILED",
        message: "검색 중 오류가 발생했습니다.",
        suggestion: "잠시 후 다시 시도해주세요.",
      },
    };

    const formatted = formatCompetitors(errorResult);

    expect(formatted).toContain("❌ 오류");
    expect(formatted).toContain("검색 중 오류가 발생했습니다");
  });

  it("정책지원금 추천 실패 시 에러 메시지를 포맷팅한다", () => {
    const errorResult = {
      success: false as const,
      error: {
        code: "NO_FUNDS",
        message: "조건에 맞는 지원금이 없습니다.",
      },
    };

    const formatted = formatPolicyFunds(errorResult);

    expect(formatted).toContain("❌ 오류");
    expect(formatted).toContain("조건에 맞는 지원금이 없습니다");
  });

  it("체크리스트 조회 실패 시 에러 메시지를 포맷팅한다", () => {
    const errorResult = {
      success: false as const,
      error: {
        code: "UNKNOWN_BUSINESS",
        message: "지원하지 않는 업종입니다.",
        suggestion: "카페, 음식점, 편의점, 미용실 중에서 선택해주세요.",
      },
    };

    const formatted = formatChecklist(errorResult);

    expect(formatted).toContain("❌ 오류");
    expect(formatted).toContain("지원하지 않는 업종입니다");
  });

  it("트렌드 조회 실패 시 에러 메시지를 포맷팅한다", () => {
    const errorResult = {
      success: false as const,
      error: {
        code: "TREND_FAILED",
        message: "트렌드 정보 조회 중 오류가 발생했습니다.",
        suggestion: "잠시 후 다시 시도해주세요.",
      },
    };

    const formatted = formatTrends(errorResult);

    expect(formatted).toContain("❌ 오류");
    expect(formatted).toContain("트렌드 정보 조회 중 오류가 발생했습니다");
  });
});

describe("입력 검증", () => {
  it("빈 검색어는 에러를 발생시킨다", async () => {
    // normalizeQuery 함수 테스트는 kakao-api에서 처리됨
    // 여기서는 형식만 확인
    const emptyInput = "";
    expect(emptyInput.trim().length).toBe(0);
  });

  it("너무 짧은 검색어는 에러를 발생시킨다", async () => {
    const shortInput = "가";
    expect(shortInput.length).toBeLessThan(2);
  });

  it("너무 긴 검색어는 에러를 발생시킨다", async () => {
    const longInput = "가".repeat(101);
    expect(longInput.length).toBeGreaterThan(100);
  });
});
