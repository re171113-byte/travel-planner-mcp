import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeCommercialArea } from "../tools/commercial-area.js";

// kakaoApi 모킹
vi.mock("../api/kakao-api.js", () => ({
  kakaoApi: {
    getCoordinates: vi.fn(),
    countByCategories: vi.fn(),
    findCompetitors: vi.fn(),
  },
}));

import { kakaoApi } from "../api/kakao-api.js";

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

  it("should analyze commercial area successfully", async () => {
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
    vi.mocked(kakaoApi.findCompetitors).mockResolvedValue([
      { id: "1", name: "스타벅스", category: "카페", address: "강남구", distance: 50 },
      { id: "2", name: "투썸", category: "카페", address: "강남구", distance: 100 },
    ]);

    const result = await analyzeCommercialArea("강남역", "카페", 500);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.location.name).toBe("강남역");
    expect(result.data?.density.totalStores).toBe(29);
    expect(result.data?.density.sameCategoryCount).toBe(2);
  });
});
