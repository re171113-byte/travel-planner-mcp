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

  // 2단계: 나이 기반 필터링 및 점수 계산
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

export async function recommendPolicyFunds(
  businessType: string,
  stage: "예비창업" | "초기창업" | "운영중" | "재창업",
  region: string,
  founderType?: "청년" | "중장년" | "여성" | "장애인" | "일반",
  founderAge?: number
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

    // 사용자 조건으로 추가 필터링 (나이 기반 정렬 포함)
    matchedFunds = filterAndSortByUserConditions(matchedFunds, region, effectiveFounderType, founderAge);

    // 최대 10개로 제한
    matchedFunds = matchedFunds.slice(0, 10);

    // 추천 팁 생성 (나이 기반 맞춤 팁)
    const tip = generateTip(matchedFunds, stage, effectiveFounderType, founderAge);

    // 나이 정보 표시용
    const ageInfo = founderAge ? `${founderAge}세` : undefined;

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
        totalCount: matchedFunds.length,
        tip,
      },
      meta: {
        source: DATA_SOURCES.bizinfoApi,
        timestamp: new Date().toISOString(),
        dataNote: founderAge
          ? `${founderAge}세 기준으로 적합한 지원사업을 우선 정렬했습니다.`
          : undefined,
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
