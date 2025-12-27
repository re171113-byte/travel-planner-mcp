// 기업마당 API 클라이언트
// API 문서: https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do

import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

const BIZINFO_API_KEY = process.env.BIZINFO_API_KEY || "";
const BIZINFO_API_BASE = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

// 분야 코드
export const BIZINFO_CATEGORIES = {
  금융: "PLD0001",
  기술: "PLD0002",
  인력: "PLD0003",
  수출: "PLD0004",
  내수: "PLD0005",
  창업: "PLD0006",
  경영: "PLD0007",
  기타: "PLD0008",
} as const;

// API 응답 타입
export interface BizinfoItem {
  pblancId: string;
  pblancNm: string;
  bsnsSumryCn: string;
  reqstBeginEndDe: string;
  jrsdInsttNm: string;
  excInsttNm: string;
  refrncNm: string;
  pblancUrl: string;
  hashtags: string;
  trgetNm: string;
  pldirSportRealmLclasCodeNm: string;
  pldirSportRealmMlsfcCodeNm: string;
  creatPnttm: string;
  totCnt: number;
}

interface BizinfoResponse {
  jsonArray: BizinfoItem[];
  reqErr?: string;
}

export class BizinfoApi {
  private apiKey: string;

  constructor() {
    this.apiKey = BIZINFO_API_KEY;
  }

  private checkApiKey(): void {
    if (!this.apiKey) {
      throw new Error("BIZINFO_API_KEY가 설정되지 않았습니다.");
    }
  }

  // 지원사업 검색
  async searchFunds(options?: {
    category?: keyof typeof BIZINFO_CATEGORIES;
    hashtags?: string;
    count?: number;
  }): Promise<BizinfoItem[]> {
    this.checkApiKey();

    // 카테고리 없이 전체 검색 (카테고리 필터가 너무 제한적임)
    const params = new URLSearchParams({
      crtfcKey: this.apiKey,
      dataType: "json",
      searchCnt: String(options?.count || 100),
    });

    // hashtags로 검색 키워드 추가
    if (options?.hashtags) {
      params.append("hashtags", options.hashtags);
    }

    const url = `${BIZINFO_API_BASE}?${params}`;

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`기업마당 API 요청 실패: ${response.status}`);
    }

    const data = (await response.json()) as BizinfoResponse;

    if (data.reqErr) {
      throw new Error(`기업마당 API 오류: ${data.reqErr}`);
    }

    let results = data.jsonArray || [];

    // 클라이언트 측에서 카테고리 필터링 (창업 관련 키워드로)
    if (options?.category) {
      const categoryKeywords: Record<string, string[]> = {
        창업: ["창업", "스타트업", "예비창업", "초기창업", "신규사업", "소상공인"],
        금융: ["융자", "대출", "보증", "투자", "펀드"],
        기술: ["기술", "R&D", "연구개발", "특허", "혁신"],
        인력: ["인력", "채용", "고용", "인턴", "일자리"],
        수출: ["수출", "해외", "글로벌", "무역"],
        내수: ["내수", "국내", "판로", "마케팅"],
        경영: ["경영", "컨설팅", "멘토링", "교육"],
      };

      const keywords = categoryKeywords[options.category] || [];
      if (keywords.length > 0) {
        results = results.filter(item => {
          const text = `${item.pblancNm} ${item.bsnsSumryCn} ${item.hashtags} ${item.pldirSportRealmLclasCodeNm}`;
          return keywords.some(kw => text.includes(kw));
        });
      }
    }

    return results;
  }

  // 창업 관련 지원사업 검색
  async searchStartupFunds(options?: {
    region?: string;
    founderType?: string;
    count?: number;
  }): Promise<BizinfoItem[]> {
    // 전체 검색 후 창업 관련 키워드로 필터링
    let results = await this.searchFunds({
      count: options?.count || 100,
    });

    // 창업 관련 키워드로 필터링
    const startupKeywords = ["창업", "스타트업", "예비창업", "초기창업", "소상공인", "중소기업", "신규사업", "사업화"];
    results = results.filter(item => {
      const text = `${item.pblancNm} ${item.bsnsSumryCn} ${item.hashtags} ${item.trgetNm}`;
      return startupKeywords.some(kw => text.includes(kw));
    });

    // 클라이언트 측 필터링 (너무 엄격하지 않게)
    let filtered = results;

    // 지역 필터링 (해당 지역 또는 전국 사업) - 완화된 조건
    if (options?.region) {
      const regionKeywords = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
      const userRegion = regionKeywords.find(r => options.region?.includes(r));

      if (userRegion) {
        const regionFiltered = filtered.filter(item => {
          const text = `${item.pblancNm} ${item.bsnsSumryCn} ${item.hashtags} ${item.jrsdInsttNm}`;
          // 특정 다른 지역이 명시된 사업만 제외 (지역 특화 사업)
          const otherRegions = regionKeywords.filter(r => r !== userRegion);
          // 명확히 다른 지역만 대상으로 한 경우에만 제외
          const isOtherRegionOnly = otherRegions.some(r =>
            item.pblancNm.includes(r) || item.jrsdInsttNm.includes(r)
          );
          const isMyRegion = text.includes(userRegion);
          // 내 지역이거나, 다른 지역 전용이 아니면 포함
          return isMyRegion || !isOtherRegionOnly;
        });
        // 필터링 후에도 결과가 있으면 적용
        if (regionFiltered.length > 0) {
          filtered = regionFiltered;
        }
      }
    }

    // 창업자 유형 필터링 (완화된 조건 - 전용 사업만 제외)
    if (options?.founderType === "청년") {
      const typeFiltered = filtered.filter(item => {
        const name = item.pblancNm;
        // "중장년 전용", "시니어 전용" 같은 명확한 제한만 제외
        return !name.includes("중장년") && !name.includes("시니어") && !name.includes("50+");
      });
      if (typeFiltered.length > 0) filtered = typeFiltered;
    } else if (options?.founderType === "여성") {
      // 여성 대상 사업 우선 정렬 (제외하지 않음)
      filtered.sort((a, b) => {
        const aWoman = `${a.pblancNm} ${a.hashtags}`.includes("여성") ? 1 : 0;
        const bWoman = `${b.pblancNm} ${b.hashtags}`.includes("여성") ? 1 : 0;
        return bWoman - aWoman;
      });
    } else if (options?.founderType === "중장년") {
      const typeFiltered = filtered.filter(item => {
        const name = item.pblancNm;
        // "청년 전용" 같은 명확한 제한만 제외
        return !name.includes("청년전용") && !name.includes("청년 전용");
      });
      if (typeFiltered.length > 0) filtered = typeFiltered;
    }

    return filtered;
  }

  // HTML 태그 제거
  static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // 신청기간 파싱 (YYYYMMDD ~ YYYYMMDD -> 읽기 좋은 형식)
  static formatDateRange(dateRange: string): string {
    if (!dateRange || dateRange === "추후 공지") return "추후 공지";

    const parts = dateRange.split("~").map((d) => d.trim());
    if (parts.length !== 2) return dateRange;

    const formatDate = (d: string) => {
      if (d.length !== 8) return d;
      return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
    };

    return `${formatDate(parts[0])} ~ ${formatDate(parts[1])}`;
  }
}

export const bizinfoApi = new BizinfoApi();
