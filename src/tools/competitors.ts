// 경쟁업체 분석 Tool
// 카카오맵 API + SEMAS 상권정보 API를 활용한 경쟁업체 검색 및 분석

import { kakaoApi } from "../api/kakao-api.js";
import { semasApi, type StoreInfo } from "../api/semas-api.js";
import { DATA_SOURCES } from "../constants.js";
import type { ApiResult, CompetitorAnalysis, Competitor, Coordinates } from "../types.js";

// 프랜차이즈 여부 판단 (이름 기반)
const FRANCHISE_KEYWORDS = [
  "스타벅스", "투썸", "이디야", "메가커피", "빽다방", "컴포즈",
  "맥도날드", "버거킹", "롯데리아", "KFC", "맘스터치",
  "BBQ", "BHC", "교촌", "네네", "굽네",
  "CU", "GS25", "세븐일레븐", "이마트24", "미니스톱",
  "올리브영", "다이소", "아트박스",
  "파리바게뜨", "뚜레쥬르", "성심당",
];

function isFranchise(name: string): boolean {
  return FRANCHISE_KEYWORDS.some((keyword) =>
    name.includes(keyword)
  );
}

// 업종별 검색 키워드 (SEMAS 필터링용)
const BUSINESS_KEYWORDS: Record<string, string[]> = {
  카페: ["커피", "카페", "음료", "디저트"],
  음식점: ["음식", "식당", "레스토랑", "한식", "중식", "일식", "양식"],
  편의점: ["편의점", "마트", "슈퍼"],
  미용실: ["미용", "헤어", "살롱", "뷰티"],
  치킨: ["치킨", "닭", "후라이드"],
  호프: ["호프", "맥주", "주점", "술집"],
  분식: ["분식", "떡볶이", "라면", "김밥"],
  베이커리: ["빵", "베이커리", "제과", "케이크"],
  무인매장: ["무인", "셀프", "코인"],
  스터디카페: ["스터디", "독서실", "공부"],
  네일샵: ["네일", "손톱", "매니큐어"],
  반려동물: ["반려", "펫", "애견", "동물"],
};

function getBusinessKeywords(businessType: string): string[] {
  const normalized = businessType.toLowerCase();
  for (const [key, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    if (normalized.includes(key.toLowerCase())) {
      return keywords;
    }
  }
  return [businessType];
}

// SEMAS API로 실시간 경쟁업체 데이터 조회
async function fetchSemasCompetitors(
  coordinates: Coordinates,
  businessType: string,
  radius: number
): Promise<{
  stores: StoreInfo[];
  totalCount: number;
  topCategories: { name: string; count: number }[];
} | null> {
  try {
    const { stores, totalCount } = await semasApi.getStoresByRadius(
      coordinates.lng,
      coordinates.lat,
      radius,
      { numOfRows: 500 }
    );

    if (!stores || stores.length === 0) return null;

    // 업종 키워드로 필터링
    const keywords = getBusinessKeywords(businessType);
    const filteredStores = stores.filter(store => {
      const storeName = `${store.bizesNm || ""} ${store.indsMclsNm || ""} ${store.indsLclsNm || ""}`.toLowerCase();
      return keywords.some(kw => storeName.includes(kw.toLowerCase()));
    });

    // 업종별 집계
    const categoryMap = new Map<string, number>();
    for (const store of filteredStores) {
      const category = store.indsMclsNm || store.indsLclsNm || "기타";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      stores: filteredStores,
      totalCount: filteredStores.length,
      topCategories,
    };
  } catch (error) {
    console.log("SEMAS 경쟁업체 조회 실패:", error);
    return null;
  }
}

// SEMAS 데이터를 Competitor 형식으로 변환
function convertSemasToCompetitor(store: StoreInfo): Competitor {
  return {
    name: store.bizesNm + (store.brchNm ? ` ${store.brchNm}` : ""),
    address: store.rdnmAdr || store.lnoAdr || "",
    category: store.indsMclsNm || store.indsLclsNm || "",
    distance: 0, // SEMAS는 거리 정보 없음
  };
}

// 시장 갭 분석 (franchiseRatio는 0-100 퍼센트)
function analyzeMarketGap(
  competitors: Competitor[],
  franchiseRatio: number,
  totalCount: number
): string {
  if (totalCount === 0) {
    return "해당 업종의 경쟁업체가 없습니다. 선점 기회가 있습니다.";
  }

  if (totalCount <= 3) {
    return "경쟁업체가 적어 진입하기 좋은 환경입니다.";
  }

  if (franchiseRatio >= 70) {
    return "프랜차이즈 비중이 높습니다. 개성있는 개인 매장으로 차별화 가능합니다.";
  }

  if (franchiseRatio <= 30) {
    return "개인 매장 비중이 높습니다. 브랜드 파워로 경쟁력 확보 가능합니다.";
  }

  if (totalCount >= 10) {
    return "경쟁이 치열합니다. 명확한 차별화 전략이 필요합니다.";
  }

  return "적절한 경쟁 환경입니다. 품질과 서비스로 승부하세요.";
}

export async function findCompetitors(
  location: string,
  businessType: string,
  radius: number = 300,
  limit: number = 10
): Promise<ApiResult<CompetitorAnalysis>> {
  try {
    // 1. 좌표 조회
    const coordinates = await kakaoApi.getCoordinates(location);

    // 2. Kakao API로 경쟁업체 검색 (기본)
    const kakaoCompetitors = await kakaoApi.findCompetitors(
      businessType,
      location,
      radius,
      limit
    );

    // 3. SEMAS API로 실시간 데이터 조회 (보강)
    let semasData: Awaited<ReturnType<typeof fetchSemasCompetitors>> = null;
    let isRealTime = false;

    if (coordinates) {
      semasData = await fetchSemasCompetitors(coordinates, businessType, radius);
      if (semasData) {
        isRealTime = true;
      }
    }

    // 4. 데이터 병합 (Kakao 기본 + SEMAS 보강)
    let competitors = kakaoCompetitors;
    let totalRealCount = kakaoCompetitors.length;
    let topCategories: { name: string; count: number }[] = [];

    if (semasData) {
      // SEMAS 데이터가 있으면 더 정확한 총 개수 사용
      totalRealCount = semasData.totalCount;
      topCategories = semasData.topCategories;

      // Kakao 결과에 없는 SEMAS 업체 추가 (limit까지)
      if (competitors.length < limit) {
        const kakaoNames = new Set(competitors.map(c => c.name.toLowerCase()));
        const additionalCompetitors = semasData.stores
          .filter(store => !kakaoNames.has(store.bizesNm.toLowerCase()))
          .slice(0, limit - competitors.length)
          .map(convertSemasToCompetitor);

        competitors = [...competitors, ...additionalCompetitors];
      }
    }

    // 5. 프랜차이즈 비율 계산 (퍼센트, 0-100)
    const franchiseCount = competitors.filter((c) => isFranchise(c.name)).length;
    const franchiseRatio = competitors.length > 0
      ? Math.round((franchiseCount / competitors.length) * 100)
      : 0;

    // 6. 시장 갭 분석
    const marketGap = analyzeMarketGap(competitors, franchiseRatio, totalRealCount);

    // 7. 인사이트 생성
    const insights: string[] = [];

    if (isRealTime && semasData) {
      insights.push(`[실시간 상권 데이터] 반경 ${radius}m 내 동종업계 ${totalRealCount}개`);
      if (topCategories.length > 0) {
        insights.push(`세부 업종: ${topCategories.map(c => `${c.name}(${c.count}개)`).join(", ")}`);
      }
    }

    if (franchiseRatio >= 70) {
      insights.push("프랜차이즈 비중이 높아 개성 있는 개인 매장으로 차별화 가능");
    } else if (franchiseRatio <= 30) {
      insights.push("개인 매장 비중이 높아 브랜드 파워로 경쟁력 확보 가능");
    }

    if (totalRealCount >= 20) {
      insights.push("경쟁이 매우 치열합니다. 명확한 차별화 전략 필수");
    } else if (totalRealCount <= 5) {
      insights.push("경쟁업체가 적어 선점 기회가 있습니다");
    }

    return {
      success: true,
      data: {
        query: businessType,
        location,
        radius,
        competitors,
        analysis: {
          totalCount: totalRealCount,
          franchiseRatio,
          marketGap,
          topCategories: topCategories.length > 0 ? topCategories : undefined,
          insights: insights.length > 0 ? insights : undefined,
        },
      },
      meta: {
        source: isRealTime
          ? `${DATA_SOURCES.kakaoLocal} + 소상공인마당 상권정보 API (실시간)`
          : DATA_SOURCES.kakaoLocal,
        timestamp: new Date().toISOString(),
        dataNote: isRealTime
          ? `반경 ${radius}m 내 실시간 경쟁업체 ${totalRealCount}개 감지. 소상공인마당 상권정보 API 기반.`
          : undefined,
      },
    };
  } catch (error) {
    console.error("경쟁업체 검색 실패:", error);

    return {
      success: false,
      error: {
        code: "COMPETITOR_SEARCH_FAILED",
        message: `경쟁업체 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "위치명을 다시 확인하거나 잠시 후 시도해주세요.",
      },
    };
  }
}
