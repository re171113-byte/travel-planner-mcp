// 소상공인시장진흥공단 상권정보 API 클라이언트
// API 문서: https://www.data.go.kr/data/15012005/openapi.do

import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";
import { apiCache, CACHE_TTL, CACHE_KEYS } from "../utils/cache.js";

const SEMAS_API_KEY = process.env.SEMAS_API_KEY || "";
const SEMAS_API_BASE = "https://apis.data.go.kr/B553077/api/open/sdsc2";

// 업종 대분류 코드
export const INDUSTRY_CATEGORIES = {
  음식: "I2",
  소매: "D1",
  생활서비스: "D2",
  숙박: "D3",
  스포츠: "D4",
  오락여가: "N1",
  학문교육: "L1",
  부동산: "L2",
} as const;

// 상가업소 정보
export interface StoreInfo {
  bizesId: string;
  bizesNm: string;
  brchNm: string;
  indsLclsCd: string;
  indsLclsNm: string;
  indsMclsCd: string;
  indsMclsNm: string;
  indsSclsCd: string;
  indsSclsNm: string;
  ksicCd: string;
  ksicNm: string;
  ctprvnCd: string;
  ctprvnNm: string;
  signguCd: string;
  signguNm: string;
  adongCd: string;
  adongNm: string;
  ldongCd: string;
  ldongNm: string;
  lnoCd: string;
  plotSctCd: string;
  plotSctNm: string;
  lnoMnno: string;
  lnoSlno: string;
  lnoAdr: string;
  rdnmCd: string;
  rdnm: string;
  bldMnno: string;
  bldSlno: string;
  bldMngNo: string;
  bldNm: string;
  rdnmAdr: string;
  oldZipcd: string;
  newZipcd: string;
  dongNo: string;
  flrNo: string;
  hoNo: string;
  lon: string;
  lat: string;
}

interface SemasResponse {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: StoreInfo[];
    totalCount: number;
    numOfRows: number;
    pageNo: number;
  };
}

// 업종별 상가 수 통계
export interface IndustryStats {
  category: string;
  categoryCode: string;
  count: number;
  subcategories: {
    name: string;
    code: string;
    count: number;
  }[];
}

export class SemasApi {
  private apiKey: string;

  constructor() {
    this.apiKey = SEMAS_API_KEY;
  }

  private checkApiKey(): void {
    if (!this.apiKey) {
      throw new Error("SEMAS_API_KEY가 설정되지 않았습니다.");
    }
  }

  // 행정동 코드로 상가업소 조회
  async getStoresByDong(
    dongCode: string,
    options?: {
      industryCd?: string;
      pageNo?: number;
      numOfRows?: number;
    }
  ): Promise<{ stores: StoreInfo[]; totalCount: number }> {
    this.checkApiKey();

    const params = new URLSearchParams({
      ServiceKey: this.apiKey,
      pageNo: String(options?.pageNo || 1),
      numOfRows: String(options?.numOfRows || 1000),
      divId: "adongCd",
      key: dongCode,
      type: "json",
    });

    if (options?.industryCd) {
      if (options.industryCd.length === 2) {
        params.append("indsLclsCd", options.industryCd);
      } else if (options.industryCd.length === 4) {
        params.append("indsMclsCd", options.industryCd);
      } else if (options.industryCd.length === 6) {
        params.append("indsSclsCd", options.industryCd);
      }
    }

    const url = `${SEMAS_API_BASE}/storeListInDong?${params}`;

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`상권정보 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as SemasResponse;

    if (data.header.resultCode !== "00") {
      throw new Error(`상권정보 API 오류: ${data.header.resultMsg}`);
    }

    return {
      stores: data.body.items || [],
      totalCount: data.body.totalCount || 0,
    };
  }

  // 반경 내 상가업소 조회 (캐시 적용)
  async getStoresByRadius(
    lon: number,
    lat: number,
    radius: number,
    options?: {
      industryCd?: string;
      pageNo?: number;
      numOfRows?: number;
    }
  ): Promise<{ stores: StoreInfo[]; totalCount: number }> {
    this.checkApiKey();

    // 캐시 확인 (좌표를 소수점 3자리로 반올림하여 유사 위치 캐시 활용)
    const roundedLon = Math.round(lon * 1000) / 1000;
    const roundedLat = Math.round(lat * 1000) / 1000;
    const cacheKey = apiCache.generateKey(CACHE_KEYS.SEMAS_STORES, {
      lon: roundedLon,
      lat: roundedLat,
      radius,
      industryCd: options?.industryCd,
      numOfRows: options?.numOfRows || 1000,
    });

    const cached = apiCache.get<{ stores: StoreInfo[]; totalCount: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams({
      ServiceKey: this.apiKey,
      pageNo: String(options?.pageNo || 1),
      numOfRows: String(options?.numOfRows || 1000),
      radius: String(radius),
      cx: String(lon),
      cy: String(lat),
      type: "json",
    });

    if (options?.industryCd) {
      if (options.industryCd.length === 2) {
        params.append("indsLclsCd", options.industryCd);
      } else if (options.industryCd.length === 4) {
        params.append("indsMclsCd", options.industryCd);
      }
    }

    const url = `${SEMAS_API_BASE}/storeListInRadius?${params}`;

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`상권정보 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as SemasResponse;

    if (data.header.resultCode !== "00") {
      throw new Error(`상권정보 API 오류: ${data.header.resultMsg}`);
    }

    const result = {
      stores: data.body.items || [],
      totalCount: data.body.totalCount || 0,
    };

    // 상권 데이터는 5분간 캐시 (매장 정보는 자주 변하지 않음)
    apiCache.set(cacheKey, result, CACHE_TTL.MEDIUM);

    return result;
  }

  // 업종별 상가 수 집계 (특정 지역)
  async getIndustryStats(
    dongCode: string
  ): Promise<IndustryStats[]> {
    const { stores } = await this.getStoresByDong(dongCode, {
      numOfRows: 10000,
    });

    // 업종 대분류별 집계
    const statsMap = new Map<string, {
      category: string;
      categoryCode: string;
      count: number;
      subcategories: Map<string, { name: string; code: string; count: number }>;
    }>();

    for (const store of stores) {
      const lclsKey = store.indsLclsCd;
      if (!statsMap.has(lclsKey)) {
        statsMap.set(lclsKey, {
          category: store.indsLclsNm,
          categoryCode: store.indsLclsCd,
          count: 0,
          subcategories: new Map(),
        });
      }

      const stats = statsMap.get(lclsKey)!;
      stats.count++;

      const mclsKey = store.indsMclsCd;
      if (!stats.subcategories.has(mclsKey)) {
        stats.subcategories.set(mclsKey, {
          name: store.indsMclsNm,
          code: store.indsMclsCd,
          count: 0,
        });
      }
      stats.subcategories.get(mclsKey)!.count++;
    }

    // Map을 배열로 변환
    return Array.from(statsMap.values())
      .map((stat) => ({
        category: stat.category,
        categoryCode: stat.categoryCode,
        count: stat.count,
        subcategories: Array.from(stat.subcategories.values())
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count);
  }
}

export const semasApi = new SemasApi();
