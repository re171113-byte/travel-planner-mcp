import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeCommercialArea } from "../tools/commercial-area.js";

// kakaoApi 모킹
vi.mock("../api/kakao-api.js", () => ({
  kakaoApi: {
    getCoordinates: vi.fn(),
    countByCategories: vi.fn(),
    findCompetitors: vi.fn(),
    getCategoryTotalCount: vi.fn(),
  },
}));

// semasApi 모킹
vi.mock("../api/semas-api.js", () => ({
  semasApi: {
    getStoresByRadius: vi.fn(),
  },
}));

import { kakaoApi } from "../api/kakao-api.js";
import { semasApi } from "../api/semas-api.js";

describe("analyzeCommercialArea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when location not found", async () => {
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue(null);

    const result = await analyzeCommercialArea("존재하지않는장소", "카페", 500);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("LOCATION_NOT_FOUND");
  });

  it("should analyze commercial area successfully with SEMAS data", async () => {
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue({
      lat: 37.497942,
      lng: 127.027619,
    });
    vi.mocked(kakaoApi.countByCategories).mockResolvedValue({
      음식점: 15,
      카페: 10,
      편의점: 3,
      대형마트: 1,
    });
    // SEMAS API로 카페 12개 조회 (실시간 데이터)
    vi.mocked(semasApi.getStoresByRadius).mockResolvedValue({
      stores: [
        { bizesId: "1", bizesNm: "스타벅스 강남점", indsMclsNm: "커피", indsLclsNm: "카페" },
        { bizesId: "2", bizesNm: "투썸플레이스", indsMclsNm: "커피", indsLclsNm: "카페" },
      ] as any,
      totalCount: 12,
    });

    const result = await analyzeCommercialArea("강남역", "카페", 500);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.location.name).toBe("강남역");
    expect(result.data?.density.totalStores).toBe(29);
    // SEMAS에서 카페 2개 필터링됨
    expect(result.data?.density.sameCategoryCount).toBe(2);
    // 실시간 데이터 표시 확인
    expect(result.meta?.dataNote).toContain("SEMAS");
  });

  it("should fallback to Kakao API when SEMAS fails", async () => {
    vi.mocked(kakaoApi.getCoordinates).mockResolvedValue({
      lat: 37.497942,
      lng: 127.027619,
    });
    vi.mocked(kakaoApi.countByCategories).mockResolvedValue({
      음식점: 15,
      카페: 10,
      편의점: 3,
      대형마트: 1,
    });
    // SEMAS 실패
    vi.mocked(semasApi.getStoresByRadius).mockRejectedValue(new Error("API Error"));
    // 카카오 폴백
    vi.mocked(kakaoApi.getCategoryTotalCount).mockResolvedValue(8);

    const result = await analyzeCommercialArea("강남역", "카페", 500);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.density.sameCategoryCount).toBe(8);
    // 카카오 데이터 사용
    expect(result.meta?.dataNote).toContain("카카오");
  });
});
