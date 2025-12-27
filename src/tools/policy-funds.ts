// 정책지원금 추천 Tool
// 기업마당 API + 자체 데이터를 활용한 정책지원금 매칭

import { DATA_SOURCES } from "../constants.js";
import type { ApiResult, PolicyFundRecommendation, PolicyFund } from "../types.js";

// 정책지원금 데이터베이스 (실제 데이터 기반)
// 실제 운영 시 기업마당 API 연동
const POLICY_FUNDS_DB: PolicyFund[] = [
  {
    id: "1",
    name: "청년창업사관학교",
    organization: "중소벤처기업부",
    amount: "최대 1억원 (융자)",
    type: "복합",
    deadline: "연중 수시",
    requirements: ["만 39세 이하", "예비창업자 또는 3년 이내 창업자"],
    applyUrl: "https://start.kosmes.or.kr",
    description: "창업교육, 멘토링, 사업화 자금을 패키지로 지원",
  },
  {
    id: "2",
    name: "소상공인 정책자금",
    organization: "소상공인시장진흥공단",
    amount: "최대 7천만원",
    type: "융자",
    deadline: "예산 소진시까지",
    requirements: ["소상공인 (상시근로자 5인 미만)", "사업자등록증 보유"],
    applyUrl: "https://ols.semas.or.kr",
    description: "저금리 정책자금 융자",
  },
  {
    id: "3",
    name: "서울시 청년창업지원",
    organization: "서울시",
    amount: "최대 3천만원 (보조금)",
    type: "보조금",
    deadline: "2025-03-31",
    requirements: ["서울 거주 또는 서울 창업", "만 39세 이하"],
    applyUrl: "https://youth.seoul.go.kr",
    description: "서울시 청년 대상 창업 보조금",
  },
  {
    id: "4",
    name: "여성창업경진대회",
    organization: "중소벤처기업부",
    amount: "최대 5천만원 (보조금)",
    type: "보조금",
    deadline: "2025-06-30",
    requirements: ["여성 창업자", "사업계획서 제출"],
    applyUrl: "https://www.wbiz.or.kr",
    description: "여성 창업자 대상 사업화 지원금",
  },
  {
    id: "5",
    name: "소상공인 새출발기금",
    organization: "소상공인시장진흥공단",
    amount: "채무조정 + 재창업지원",
    type: "복합",
    requirements: ["폐업 소상공인", "재창업 의지"],
    applyUrl: "https://newfund.kr",
    description: "폐업 경험자 재창업 종합 지원",
  },
  {
    id: "6",
    name: "기술창업 아이디어 사업화 지원",
    organization: "창업진흥원",
    amount: "최대 1억원",
    type: "보조금",
    deadline: "2025-04-30",
    requirements: ["기술 기반 창업", "예비창업자 또는 3년 이내 창업자"],
    applyUrl: "https://www.k-startup.go.kr",
    description: "기술 기반 스타트업 사업화 자금",
  },
  {
    id: "7",
    name: "신사업창업사관학교",
    organization: "중소벤터기업부",
    amount: "최대 1억원",
    type: "복합",
    deadline: "연중 수시",
    requirements: ["40세 이상", "퇴직자 또는 경력단절자"],
    applyUrl: "https://newbiz.kosmes.or.kr",
    description: "중장년 창업 교육 및 자금 지원",
  },
  {
    id: "8",
    name: "소상공인 디지털전환 지원",
    organization: "소상공인시장진흥공단",
    amount: "최대 500만원 (바우처)",
    type: "보조금",
    requirements: ["소상공인", "디지털 전환 필요"],
    applyUrl: "https://www.sbiz.or.kr",
    description: "스마트 기기, 키오스크 등 디지털 전환 비용 지원",
  },
];

// 사용자 조건에 맞는 지원금 필터링
function matchFunds(
  businessType: string,
  stage: string,
  region: string,
  founderType?: string,
  founderAge?: number
): PolicyFund[] {
  return POLICY_FUNDS_DB.filter((fund) => {
    // 청년 조건 체크
    if (fund.requirements.some((r) => r.includes("39세 이하"))) {
      if (founderAge && founderAge > 39) return false;
      if (founderType && !["청년", "일반"].includes(founderType)) {
        // 청년이 아니면 제외할 수 있지만, 나이 정보 없으면 포함
        if (founderType === "중장년") return false;
      }
    }

    // 중장년 조건 체크
    if (fund.requirements.some((r) => r.includes("40세 이상"))) {
      if (founderAge && founderAge < 40) return false;
      if (founderType === "청년") return false;
    }

    // 여성 조건 체크
    if (fund.requirements.some((r) => r.includes("여성"))) {
      if (founderType && founderType !== "여성") return false;
    }

    // 지역 조건 체크
    if (fund.requirements.some((r) => r.includes("서울"))) {
      if (region && !region.includes("서울")) return false;
    }

    // 폐업자 조건 체크
    if (fund.requirements.some((r) => r.includes("폐업"))) {
      if (stage !== "재창업") return false;
    }

    return true;
  });
}

// 추천 팁 생성
function generateTip(
  matchedFunds: PolicyFund[],
  stage: string,
  founderType?: string
): string {
  if (matchedFunds.length === 0) {
    return "현재 조건에 맞는 지원사업이 없습니다. 조건을 변경하거나 기업마당(bizinfo.go.kr)에서 직접 검색해보세요.";
  }

  const hasMentoring = matchedFunds.some((f) => f.type === "복합" || f.type === "멘토링");
  const hasGrant = matchedFunds.some((f) => f.type === "보조금");
  const hasLoan = matchedFunds.some((f) => f.type === "융자");

  if (stage === "예비창업" && hasMentoring) {
    return "예비창업자는 멘토링이 포함된 프로그램(창업사관학교 등)을 추천드립니다. 창업 성공률을 높일 수 있습니다.";
  }

  if (hasGrant && hasLoan) {
    return "보조금은 상환 의무가 없어 유리하지만 경쟁률이 높습니다. 융자와 보조금을 함께 준비하세요.";
  }

  if (founderType === "청년") {
    return "청년 대상 지원사업이 많습니다. 여러 개를 동시에 신청하면 선정 확률이 높아집니다.";
  }

  return "신청 기한을 확인하고 서류를 미리 준비하세요. 사업계획서 작성이 가장 중요합니다.";
}

export async function recommendPolicyFunds(
  businessType: string,
  stage: "예비창업" | "초기창업" | "운영중" | "재창업",
  region: string,
  founderType?: "청년" | "중장년" | "여성" | "장애인" | "일반",
  founderAge?: number
): Promise<ApiResult<PolicyFundRecommendation>> {
  try {
    // 조건에 맞는 지원금 매칭
    const matchedFunds = matchFunds(
      businessType,
      stage,
      region,
      founderType,
      founderAge
    );

    // 추천 팁 생성
    const tip = generateTip(matchedFunds, stage, founderType);

    return {
      success: true,
      data: {
        userProfile: {
          businessType,
          stage,
          region,
          founderType,
        },
        matchedFunds,
        totalCount: matchedFunds.length,
        tip,
      },
      meta: {
        source: DATA_SOURCES.bizinfoApi,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("정책지원금 추천 실패:", error);

    return {
      success: false,
      error: {
        code: "POLICY_FUND_FAILED",
        message: `정책지원금 조회 중 오류가 발생했습니다.`,
        suggestion: "기업마당(bizinfo.go.kr)에서 직접 검색해보세요.",
      },
    };
  }
}
