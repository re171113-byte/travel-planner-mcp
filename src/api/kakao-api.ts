// 카카오맵 로컬 API 클라이언트
// API 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide

import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";
import type {
  KakaoPlaceResponse,
  KakaoPlace,
  KakaoAddressResponse,
  Coordinates,
  Competitor,
} from "../types.js";

const KAKAO_API_KEY = process.env.KAKAO_API_KEY || "";
const KAKAO_API_BASE = "https://dapi.kakao.com/v2/local";

// 검색어 정규화
function normalizeQuery(input: string): string {
  const normalized = input.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error("검색어를 입력해주세요.");
  if (normalized.length < 2) throw new Error("검색어는 2글자 이상 입력해주세요.");
  if (normalized.length > 100) throw new Error("검색어가 너무 깁니다. (최대 100자)");
  return normalized;
}

class KakaoLocalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = KAKAO_API_KEY;
  }

  private checkApiKey(): void {
    if (!this.apiKey) {
      throw new Error("KAKAO_API_KEY가 설정되지 않았습니다.");
    }
  }

  // 주소/장소명으로 좌표 검색
  async getCoordinates(query: string): Promise<Coordinates | null> {
    this.checkApiKey();
    const normalizedQuery = normalizeQuery(query);

    // 먼저 주소 검색 시도
    const addressUrl = `${KAKAO_API_BASE}/search/address.json?query=${encodeURIComponent(normalizedQuery)}`;

    try {
      const response = await fetchWithTimeout(addressUrl, {
        headers: { Authorization: `KakaoAK ${this.apiKey}` },
      });

      if (response.ok) {
        const data = (await response.json()) as KakaoAddressResponse;
        if (data.documents.length > 0) {
          const doc = data.documents[0];
          return {
            lat: parseFloat(doc.y),
            lng: parseFloat(doc.x),
          };
        }
      }
    } catch {
      // 주소 검색 실패 시 키워드 검색으로 폴백
    }

    // 키워드 검색으로 폴백
    const keywordUrl = `${KAKAO_API_BASE}/search/keyword.json?query=${encodeURIComponent(normalizedQuery)}&size=1`;

    const response = await fetchWithTimeout(keywordUrl, {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as KakaoPlaceResponse;
    if (data.documents.length === 0) {
      return null;
    }

    const doc = data.documents[0];
    return {
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
    };
  }

  // 키워드로 장소 검색
  async searchByKeyword(
    query: string,
    options?: {
      x?: string;
      y?: string;
      radius?: number;
      size?: number;
      sort?: "distance" | "accuracy";
    }
  ): Promise<KakaoPlace[]> {
    this.checkApiKey();
    const normalizedQuery = normalizeQuery(query);

    const params = new URLSearchParams({
      query: normalizedQuery,
      size: String(options?.size || 15),
    });

    if (options?.x) params.append("x", options.x);
    if (options?.y) params.append("y", options.y);
    if (options?.radius) params.append("radius", String(options.radius));
    if (options?.sort) params.append("sort", options.sort);

    const url = `${KAKAO_API_BASE}/search/keyword.json?${params}`;

    const response = await fetchWithTimeout(url, {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as KakaoPlaceResponse;
    return data.documents;
  }

  // 카테고리로 장소 검색
  async searchByCategory(
    categoryCode: string,
    x: string,
    y: string,
    options?: {
      radius?: number;
      size?: number;
    }
  ): Promise<KakaoPlace[]> {
    this.checkApiKey();

    const params = new URLSearchParams({
      category_group_code: categoryCode,
      x,
      y,
      radius: String(options?.radius || 500),
      size: String(options?.size || 15),
      sort: "distance",
    });

    const url = `${KAKAO_API_BASE}/search/category.json?${params}`;

    const response = await fetchWithTimeout(url, {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as KakaoPlaceResponse;
    return data.documents;
  }

  // 특정 업종 경쟁업체 검색
  async findCompetitors(
    businessType: string,
    location: string,
    radius: number = 1000,
    limit: number = 15
  ): Promise<Competitor[]> {
    // 업종 키워드 정규화 (치킨 -> 치킨집 등)
    const normalizedType = this.normalizeBusinessType(businessType);

    // 먼저 위치 좌표 얻기 (거리 계산용)
    const coords = await this.getCoordinates(location);

    // 좌표 기반 검색 (거리 정보 포함)
    let places: KakaoPlace[] = [];
    if (coords) {
      places = await this.searchByKeyword(`${normalizedType}`, {
        x: String(coords.lng),
        y: String(coords.lat),
        radius,
        size: limit,
        sort: "distance",
      });
    }

    // 결과 없으면 위치+업종 키워드로 검색
    if (places.length === 0) {
      places = await this.searchByKeyword(`${location} ${normalizedType}`, {
        size: limit,
      });
    }

    // 여전히 없으면 원본 키워드로 재시도
    if (places.length === 0 && normalizedType !== businessType) {
      places = await this.searchByKeyword(`${location} ${businessType}`, {
        size: limit,
      });
    }

    return places.map((place) => ({
      id: place.id,
      name: place.place_name,
      category: place.category_name,
      address: place.road_address_name || place.address_name,
      distance: place.distance ? parseInt(place.distance, 10) : this.calculateDistance(coords, place),
      phone: place.phone || undefined,
      placeUrl: place.place_url,
    }));
  }

  // 거리 계산 (좌표가 있을 경우)
  private calculateDistance(from: Coordinates | null, place: KakaoPlace): number {
    if (!from) return 0;
    const lat1 = from.lat;
    const lon1 = from.lng;
    const lat2 = parseFloat(place.y);
    const lon2 = parseFloat(place.x);

    // Haversine formula
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }

  // 업종 키워드 정규화
  private normalizeBusinessType(type: string): string {
    const typeMap: Record<string, string> = {
      치킨: "치킨집",
      카페: "카페",
      커피: "카페",
      음식점: "맛집",
      식당: "맛집",
      미용실: "미용실",
      헤어샵: "미용실",
      편의점: "편의점",
      마트: "마트",
      약국: "약국",
      병원: "병원",
      피자: "피자",
      햄버거: "버거",
      중식: "중국집",
      일식: "일식당",
      분식: "분식집",
    };
    return typeMap[type] || type;
  }

  // 상권 내 업종별 업체 수 조회 (실제 전체 개수 반환)
  async countByCategories(
    x: string,
    y: string,
    radius: number = 500
  ): Promise<Record<string, number>> {
    const categories = [
      { code: "FD6", name: "음식점" },
      { code: "CE7", name: "카페" },
      { code: "CS2", name: "편의점" },
      { code: "MT1", name: "대형마트" },
    ];

    const counts: Record<string, number> = {};

    // 병렬로 조회 - meta.total_count 사용
    const results = await Promise.all(
      categories.map(async (cat) => {
        try {
          const count = await this.getCategoryTotalCount(cat.code, x, y, radius);
          return { name: cat.name, count };
        } catch {
          return { name: cat.name, count: 0 };
        }
      })
    );

    for (const result of results) {
      counts[result.name] = result.count;
    }

    return counts;
  }

  // 카테고리별 전체 개수 조회 (meta.total_count 활용)
  async getCategoryTotalCount(
    categoryCode: string,
    x: string,
    y: string,
    radius: number = 500
  ): Promise<number> {
    this.checkApiKey();

    const params = new URLSearchParams({
      category_group_code: categoryCode,
      x,
      y,
      radius: String(radius),
      size: "1", // 최소한으로 조회
      sort: "distance",
    });

    const url = `${KAKAO_API_BASE}/search/category.json?${params}`;

    const response = await fetchWithTimeout(url, {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as KakaoPlaceResponse;
    // meta.total_count에 실제 전체 개수가 있음
    return data.meta?.total_count || data.documents.length;
  }
}

export const kakaoApi = new KakaoLocalApi();
