// 정책지원금 추천 Tool
// 기업마당 API를 활용한 실시간 정책지원금 매칭

import { bizinfoApi, BizinfoApi } from "../api/bizinfo-api.js";
import { DATA_SOURCES } from "../constants.js";
import type { ApiResult, PolicyFundRecommendation, PolicyFund } from "../types.js";

// 나이 기반 창업자 유형 추론
function inferFounderTypeFromAge(age: number): "청년" | "중장년" | "일반" {
  if (age >= 19 && age <= 39) return "청년";
  if (age >= 40 && age <= 64) return "중장년";
  return "일반";
}

// 업종별 관련 키워드 (적합/부적합)
const BUSINESS_TYPE_KEYWORDS: Record<string, { relevant: string[]; irrelevant: string[] }> = {
  카페: {
    relevant: ["요식", "음식", "외식", "소상공인", "자영업", "프랜차이즈", "창업", "소매", "서비스"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  음식점: {
    relevant: ["요식", "음식", "외식", "소상공인", "자영업", "프랜차이즈", "창업", "서비스", "식품"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  편의점: {
    relevant: ["소상공인", "자영업", "프랜차이즈", "창업", "소매", "유통", "서비스"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  미용실: {
    relevant: ["소상공인", "자영업", "창업", "서비스", "뷰티", "미용"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "의료기기", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  치킨: {
    relevant: ["요식", "음식", "외식", "소상공인", "자영업", "프랜차이즈", "창업", "배달", "서비스"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  호프: {
    relevant: ["요식", "음식", "외식", "소상공인", "자영업", "프랜차이즈", "창업", "서비스", "주류"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  분식: {
    relevant: ["요식", "음식", "외식", "소상공인", "자영업", "프랜차이즈", "창업", "서비스"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  베이커리: {
    relevant: ["요식", "음식", "외식", "소상공인", "자영업", "프랜차이즈", "창업", "서비스", "제과", "제빵"],
    irrelevant: ["수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  무인매장: {
    relevant: ["소상공인", "자영업", "창업", "무인", "스마트", "서비스", "소매"],
    irrelevant: ["수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  스터디카페: {
    relevant: ["소상공인", "자영업", "창업", "서비스", "교육", "학습"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  네일샵: {
    relevant: ["소상공인", "자영업", "창업", "서비스", "뷰티", "미용"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "축산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
  반려동물: {
    relevant: ["소상공인", "자영업", "창업", "서비스", "반려", "펫", "애견", "동물"],
    irrelevant: ["제조", "수출", "R&D", "연구개발", "특허", "공장", "기계", "장비", "농업", "농촌", "수산", "임업", "광업", "건설", "IT", "소프트웨어", "바이오", "의료기기", "반도체", "자동차", "조선", "철강", "화학", "섬유", "목재", "목구조", "넷제로", "탄소중립", "ESG", "기술융복합", "스마트팩토리", "그린뉴딜", "디지털전환", "인공지능", "빅데이터", "클라우드", "블록체인", "메타버스", "로봇", "드론", "자율주행", "전기차", "수소", "태양광", "풍력", "원자력", "우주", "항공", "방위산업", "국방"],
  },
};

// 업종 정규화 (startup-cost-data와 동일한 로직)
function normalizeBusinessTypeForPolicy(businessType: string): string {
  const typeMap: Record<string, string> = {
    커피숍: "카페",
    커피전문점: "카페",
    카페: "카페",
    음식점: "음식점",
    식당: "음식점",
    레스토랑: "음식점",
    편의점: "편의점",
    마트: "편의점",
    미용실: "미용실",
    헤어샵: "미용실",
    치킨: "치킨",
    치킨집: "치킨",
    호프: "호프",
    술집: "호프",
    맥주집: "호프",
    분식: "분식",
    분식집: "분식",
    빵집: "베이커리",
    베이커리: "베이커리",
    제과점: "베이커리",
    무인매장: "무인매장",
    무인점포: "무인매장",
    스터디카페: "스터디카페",
    독서실: "스터디카페",
    네일샵: "네일샵",
    네일아트: "네일샵",
    반려동물: "반려동물",
    펫샵: "반려동물",
    애견샵: "반려동물",
  };
  return typeMap[businessType] || businessType;
}

// 업종 관련성 점수 계산
function getBusinessRelevanceScore(
  fundName: string,
  fundDescription: string,
  businessType: string
): number {
  const normalizedType = normalizeBusinessTypeForPolicy(businessType);
  const keywords = BUSINESS_TYPE_KEYWORDS[normalizedType];

  // 알 수 없는 업종은 기본 점수 반환
  if (!keywords) return 0;

  const text = `${fundName} ${fundDescription}`.toLowerCase();
  let score = 0;

  // 관련 키워드 포함 시 가점
  for (const keyword of keywords.relevant) {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }

  // 비관련 키워드 포함 시 감점
  for (const keyword of keywords.irrelevant) {
    if (text.includes(keyword.toLowerCase())) {
      score -= 30;
    }
  }

  // 일반 창업 지원사업은 기본 점수 부여
  if (text.includes("창업") || text.includes("소상공인")) {
    score += 5;
  }

  return score;
}

// 나이 기반 지원사업 적합도 점수
function getAgeSuitabilityScore(fundName: string, fundDescription: string, age: number): number {
  const text = `${fundName} ${fundDescription}`.toLowerCase();
  let score = 0;

  // 청년 (19-39세)
  if (age >= 19 && age <= 39) {
    if (text.includes("청년")) score += 20;
    if (text.includes("39세") || text.includes("34세")) score += 10;
    // 중장년/시니어 전용은 감점
    if (text.includes("중장년") || text.includes("시니어") || text.includes("50+") || text.includes("40세 이상")) {
      score -= 50;
    }
  }
  // 중장년 (40-64세)
  else if (age >= 40 && age <= 64) {
    if (text.includes("중장년") || text.includes("재도전") || text.includes("재창업")) score += 20;
    if (text.includes("시니어") || text.includes("50+") || text.includes("40세 이상")) score += 15;
    // 청년 전용은 감점
    if (text.includes("청년") && (text.includes("전용") || text.includes("만 39세") || text.includes("만 34세"))) {
      score -= 50;
    }
  }
  // 시니어 (65세 이상)
  else if (age >= 65) {
    if (text.includes("시니어") || text.includes("노인") || text.includes("어르신")) score += 20;
    // 청년/중장년 전용은 감점
    if (text.includes("청년") || (text.includes("중장년") && text.includes("전용"))) {
      score -= 50;
    }
  }

  return score;
}

// 기업마당 API 응답을 PolicyFund 형식으로 변환
function convertBizinfoToFund(item: {
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
}): PolicyFund {
  // 지원금 유형 추정
  let type: PolicyFund["type"] = "복합";
  const summary = item.bsnsSumryCn.toLowerCase();
  const name = item.pblancNm.toLowerCase();

  if (summary.includes("융자") || name.includes("융자")) {
    type = "융자";
  } else if (summary.includes("보조금") || name.includes("보조금") || summary.includes("바우처")) {
    type = "보조금";
  } else if (summary.includes("멘토링") || summary.includes("교육")) {
    type = "멘토링";
  }

  // 지원 금액 추출 (요약에서 추출 시도)
  let amount = "공고문 참조";
  const amountMatch = item.bsnsSumryCn.match(/(\d+[천백만억]+원|\d+,?\d*만원)/);
  if (amountMatch) {
    amount = amountMatch[0];
  }

  // 자격요건 추출 (해시태그 기반)
  const requirements: string[] = [];
  const hashtags = item.hashtags.split(",");

  if (hashtags.includes("청년")) requirements.push("청년");
  if (hashtags.includes("여성")) requirements.push("여성");
  if (hashtags.includes("중소기업")) requirements.push("중소기업");
  if (hashtags.includes("창업기업")) requirements.push("창업기업");
  if (hashtags.includes("예비창업")) requirements.push("예비창업자");
  if (item.trgetNm) requirements.push(item.trgetNm);

  if (requirements.length === 0) {
    requirements.push("공고문 확인 필요");
  }

  return {
    id: item.pblancId,
    name: item.pblancNm,
    organization: item.jrsdInsttNm || item.excInsttNm,
    amount,
    type,
    deadline: BizinfoApi.formatDateRange(item.reqstBeginEndDe),
    requirements,
    applyUrl: `https://www.bizinfo.go.kr${item.pblancUrl}`,
    description: BizinfoApi.stripHtml(item.bsnsSumryCn).slice(0, 200) + "...",
  };
}

// 사용자 조건으로 필터링 및 정렬
function filterAndSortByUserConditions(
  funds: PolicyFund[],
  region: string,
  businessType: string,
  founderType?: string,
  founderAge?: number
): PolicyFund[] {
  // 1단계: 지역 필터링
  let filtered = funds.filter((fund) => {
    const fundName = fund.name.toLowerCase();
    const regionLower = region.toLowerCase();

    // 특정 지역이 명시된 공고
    const regionKeywords = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    const fundRegion = regionKeywords.find((r) => fundName.includes(r));
    if (fundRegion && !regionLower.includes(fundRegion.toLowerCase())) {
      return false;
    }

    return true;
  });

  // 2단계: 업종 관련성 필터링 및 점수 계산
  const scoredByBusiness = filtered.map((fund) => {
    const businessScore = getBusinessRelevanceScore(fund.name, fund.description || "", businessType);
    return { fund, businessScore };
  });

  // 업종 부적합 지원사업 제외 (점수가 -50 이하는 명확히 관련없는 분야)
  filtered = scoredByBusiness
    .filter((item) => item.businessScore > -50)
    .sort((a, b) => b.businessScore - a.businessScore)
    .map((item) => item.fund);

  // 3단계: 나이 기반 필터링 및 점수 계산
  if (founderAge) {
    const scored = filtered.map((fund) => {
      const ageScore = getAgeSuitabilityScore(fund.name, fund.description || "", founderAge);
      return { fund, ageScore };
    });

    // 부적합한 지원사업 제외 (점수가 -30 이하)
    filtered = scored
      .filter((item) => item.ageScore > -30)
      .sort((a, b) => b.ageScore - a.ageScore)
      .map((item) => item.fund);
  }

  return filtered;
}

// 추천 팁 생성
function generateTip(
  matchedFunds: PolicyFund[],
  stage: string,
  founderType?: string,
  founderAge?: number
): string {
  if (matchedFunds.length === 0) {
    return "현재 조건에 맞는 지원사업이 없습니다. 조건을 변경하거나 기업마당(bizinfo.go.kr)에서 직접 검색해보세요.";
  }

  const hasMentoring = matchedFunds.some((f) => f.type === "멘토링" || f.type === "복합");
  const hasGrant = matchedFunds.some((f) => f.type === "보조금");
  const hasLoan = matchedFunds.some((f) => f.type === "융자");

  // 나이 기반 맞춤 팁
  if (founderAge) {
    if (founderAge >= 19 && founderAge <= 34) {
      return `${founderAge}세는 청년창업 지원 대상입니다. 청년전용창업자금, 청년창업사관학교 등 청년 특화 프로그램을 적극 활용하세요.`;
    }
    if (founderAge >= 35 && founderAge <= 39) {
      return `${founderAge}세는 청년창업 지원 마지노선입니다. 만 39세 이하 조건의 청년 지원사업을 서둘러 신청하세요.`;
    }
    if (founderAge >= 40 && founderAge <= 49) {
      return `${founderAge}세는 중장년 창업 지원 대상입니다. 재도전 성공패키지, 중장년기술창업센터 등을 활용하세요.`;
    }
    if (founderAge >= 50 && founderAge <= 64) {
      return `${founderAge}세는 시니어 창업 지원 대상입니다. 생애재설계 창업지원, 시니어기술창업센터 프로그램을 확인하세요.`;
    }
    if (founderAge >= 65) {
      return `${founderAge}세는 노후 창업 지원 대상입니다. 소자본 창업, 생활밀착형 업종 지원 프로그램을 추천드립니다.`;
    }
  }

  if (stage === "예비창업" && hasMentoring) {
    return "예비창업자는 멘토링이 포함된 프로그램을 추천드립니다. 창업 성공률을 높일 수 있습니다.";
  }

  if (hasGrant && hasLoan) {
    return "보조금은 상환 의무가 없어 유리하지만 경쟁률이 높습니다. 융자와 보조금을 함께 준비하세요.";
  }

  if (founderType === "청년") {
    return "청년 대상 지원사업이 많습니다. 여러 개를 동시에 신청하면 선정 확률이 높아집니다.";
  }

  if (founderType === "중장년") {
    return "중장년 재도전/재창업 지원사업을 확인하세요. 경력과 경험을 살린 창업이 성공률이 높습니다.";
  }

  return `${matchedFunds.length}개의 지원사업을 찾았습니다. 신청 기한을 확인하고 서류를 미리 준비하세요.`;
}

// 정렬 기준 타입
type SortBy = "deadline" | "amount" | "match_score";

// 정렬 함수
function sortFunds(funds: PolicyFund[], sortBy: SortBy): PolicyFund[] {
  return [...funds].sort((a, b) => {
    switch (sortBy) {
      case "deadline":
        // 마감일 가까운 순 (없으면 뒤로)
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      case "amount": {
        // 금액 높은 순 (숫자 추출 시도)
        const extractAmount = (str: string): number => {
          const match = str.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        return extractAmount(b.amount) - extractAmount(a.amount);
      }
      case "match_score":
      default:
        // 기본 정렬 (이미 매칭 점수로 정렬됨)
        return 0;
    }
  });
}

export async function recommendPolicyFunds(
  businessType: string,
  stage: "예비창업" | "초기창업" | "운영중" | "재창업",
  region: string,
  founderType?: "청년" | "중장년" | "여성" | "장애인" | "일반",
  founderAge?: number,
  options?: {
    sortBy?: SortBy;
    filterType?: "융자" | "보조금" | "멘토링" | "교육" | "복합";
    page?: number;
    limit?: number;
  }
): Promise<ApiResult<PolicyFundRecommendation>> {
  try {
    // 나이가 있고 창업자 유형이 없으면 자동 추론
    const effectiveFounderType = founderType || (founderAge ? inferFounderTypeFromAge(founderAge) : undefined);

    // 기업마당 API로 실시간 지원사업 검색
    const bizinfoResults = await bizinfoApi.searchStartupFunds({
      region,
      founderType: effectiveFounderType,
      count: 30,
    });

    // API 결과를 PolicyFund 형식으로 변환
    let matchedFunds = bizinfoResults.map(convertBizinfoToFund);

    // 사용자 조건으로 추가 필터링 (업종 및 나이 기반 정렬 포함)
    matchedFunds = filterAndSortByUserConditions(matchedFunds, region, businessType, effectiveFounderType, founderAge);

    // 유형 필터링
    if (options?.filterType) {
      matchedFunds = matchedFunds.filter((f) => f.type === options.filterType);
    }

    // 정렬 적용
    if (options?.sortBy) {
      matchedFunds = sortFunds(matchedFunds, options.sortBy);
    }

    // 전체 개수 저장 (페이지네이션 전)
    const totalCount = matchedFunds.length;

    // 페이지네이션 적용
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startIndex = (page - 1) * limit;
    matchedFunds = matchedFunds.slice(startIndex, startIndex + limit);

    // 추천 팁 생성 (나이 기반 맞춤 팁)
    const tip = generateTip(matchedFunds, stage, effectiveFounderType, founderAge);

    // 나이 정보 표시용
    const ageInfo = founderAge ? `${founderAge}세` : undefined;

    // 페이지 정보 생성
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        userProfile: {
          businessType,
          stage,
          region,
          founderType: effectiveFounderType,
          founderAge: ageInfo,
        },
        matchedFunds,
        totalCount,
        tip,
        pagination: {
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
      meta: {
        source: DATA_SOURCES.bizinfoApi,
        timestamp: new Date().toISOString(),
        dataNote: `신뢰도: 높음 (기업마당 실시간 API). ${founderAge ? `${founderAge}세 기준으로 적합한 지원사업을 우선 정렬. ` : ""}${businessType ? `${normalizeBusinessTypeForPolicy(businessType)} 업종 관련 지원사업 우선 정렬. ` : ""}${options?.sortBy ? `${options.sortBy === "deadline" ? "마감일순" : options.sortBy === "amount" ? "금액순" : "매칭점수순"} 정렬. ` : ""}※ 정확한 신청 조건은 해당 기관에서 확인하세요.`,
      },
    };
  } catch (error) {
    console.error("정책지원금 추천 실패:", error);

    return {
      success: false,
      error: {
        code: "POLICY_FUND_FAILED",
        message: `정책지원금 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "기업마당(bizinfo.go.kr)에서 직접 검색해보세요.",
      },
    };
  }
}
