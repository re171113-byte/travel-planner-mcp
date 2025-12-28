import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzePopulation } from "../tools/population.js";

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

import { kakaoApi } from "../api/kakao-api.js";
import { semasApi } from "../api/semas-api.js";

describe("analyzePopulation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when location not found", async () => {
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue(null);

    const result = await analyzePopulation("존재하지않는장소");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("LOCATION_NOT_FOUND");
  });

  it("should analyze known area (강남역) successfully", async () => {
    // 강남역은 알려진 상권이므로 좌표 조회 필요 없음
    const result = await analyzePopulation("강남역");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.location.name).toBe("강남역");
    expect(result.data?.population.total).toBeGreaterThan(0);
  });

  it("should include time distribution", async () => {
    const result = await analyzePopulation("홍대입구");

    expect(result.success).toBe(true);
    expect(result.data?.timeDistribution).toBeDefined();
    expect(result.data?.timeDistribution.morning).toBeGreaterThanOrEqual(0);
    expect(result.data?.timeDistribution.lunch).toBeGreaterThanOrEqual(0);
    expect(result.data?.timeDistribution.afternoon).toBeGreaterThanOrEqual(0);
    expect(result.data?.timeDistribution.evening).toBeGreaterThanOrEqual(0);
    expect(result.data?.timeDistribution.night).toBeGreaterThanOrEqual(0);
  });

  it("should include age distribution", async () => {
    const result = await analyzePopulation("신촌");

    expect(result.success).toBe(true);
    expect(result.data?.ageDistribution).toBeDefined();
    // 대학가는 20대 비율이 높아야 함
    expect(result.data?.ageDistribution.twenties).toBeGreaterThan(20);
  });

  it("should calculate business fit when business type provided", async () => {
    const result = await analyzePopulation("강남역", "카페");

    expect(result.success).toBe(true);
    expect(result.data?.businessFit).toBeDefined();
    expect(result.data?.businessFit?.score).toBeGreaterThanOrEqual(0);
    expect(result.data?.businessFit?.score).toBeLessThanOrEqual(100);
  });

  it("should include SEMAS real-time data when available", async () => {
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue({
      lat: 37.556,
      lng: 126.924,
    });

    vi.mocked(semasApi.getStoresByRadius).mockResolvedValue({
      stores: [
        { bizesNm: "테스트1", indsLclsNm: "음식" } as never,
        { bizesNm: "테스트2", indsLclsNm: "음식" } as never,
        { bizesNm: "테스트3", indsLclsNm: "소매" } as never,
      ],
      totalCount: 100,
    });

    const result = await analyzePopulation("홍대입구", undefined, 500);

    expect(result.success).toBe(true);
    // SEMAS 데이터가 있으면 인사이트에 상권 데이터 표시
    expect(result.data?.insights.some(i => i.includes("상권") || i.includes("업소"))).toBe(true);
  });

  it("should infer area type for unknown locations", async () => {
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue({
      lat: 37.5,
      lng: 127.0,
    });

    vi.mocked(semasApi.getStoresByRadius).mockResolvedValue({
      stores: [],
      totalCount: 0,
    });

    const result = await analyzePopulation("테스트역");

    expect(result.success).toBe(true);
    // 역이 포함된 이름은 역세권으로 추론되거나 특성이 있어야 함
    expect(result.data?.characteristics).toBeDefined();
    expect(result.data?.characteristics.length).toBeGreaterThan(0);
  });

  it("should include gender ratio", async () => {
    const result = await analyzePopulation("명동");

    expect(result.success).toBe(true);
    expect(result.data?.genderRatio).toBeDefined();
    const genderRatio = result.data!.genderRatio;
    expect(genderRatio.male + genderRatio.female).toBe(100);
  });
});
