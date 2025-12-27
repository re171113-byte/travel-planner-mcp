import { describe, it, expect } from "vitest";
import { recommendPolicyFunds } from "../tools/policy-funds.js";

describe("recommendPolicyFunds", () => {
  it("should recommend funds for young entrepreneur", async () => {
    const result = await recommendPolicyFunds(
      "카페",
      "예비창업",
      "서울",
      "청년",
      28
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.matchedFunds.length).toBeGreaterThan(0);
    expect(result.data?.userProfile.founderType).toBe("청년");
  });

  it("should filter out youth programs for middle-aged founder", async () => {
    const result = await recommendPolicyFunds(
      "음식점",
      "초기창업",
      "부산",
      "중장년",
      50
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // 청년 전용 프로그램은 제외되어야 함
    const hasYouthOnlyProgram = result.data?.matchedFunds.some(
      (f) => f.requirements.some((r) => r.includes("39세 이하"))
    );
    expect(hasYouthOnlyProgram).toBe(false);
  });

  it("should include women programs for female founder", async () => {
    const result = await recommendPolicyFunds(
      "미용실",
      "예비창업",
      "서울",
      "여성"
    );

    expect(result.success).toBe(true);
    expect(result.data?.matchedFunds.some((f) => f.name.includes("여성"))).toBe(true);
  });
});
