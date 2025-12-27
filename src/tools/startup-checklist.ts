// 창업 체크리스트 Tool
// 업종별 인허가 및 창업 준비사항 안내

import type { ApiResult, StartupChecklist, License } from "../types.js";

// 업종별 필요 인허가 데이터베이스
const LICENSE_DB: Record<string, License[]> = {
  카페: [
    {
      name: "영업신고증",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "위생교육이수증", "임대차계약서"],
    },
    {
      name: "위생교육 이수",
      authority: "한국외식산업협회",
      required: true,
      processingDays: 1,
      documents: ["신분증"],
    },
    {
      name: "소방안전점검",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면"],
    },
  ],
  음식점: [
    {
      name: "영업신고증",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "위생교육이수증", "임대차계약서"],
    },
    {
      name: "위생교육 이수",
      authority: "한국외식산업협회",
      required: true,
      processingDays: 1,
      documents: ["신분증"],
    },
    {
      name: "소방안전점검",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면"],
    },
    {
      name: "통신판매업신고 (배달 시)",
      authority: "관할 구청",
      required: false,
      processingDays: 5,
      documents: ["사업자등록증"],
    },
  ],
  편의점: [
    {
      name: "영업신고증 (식품판매)",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "임대차계약서"],
    },
    {
      name: "담배소매업 허가",
      authority: "관할 구청",
      required: false,
      processingDays: 14,
      documents: ["허가신청서", "사업자등록증"],
    },
    {
      name: "주류판매업 신고",
      authority: "관할 세무서",
      required: false,
      processingDays: 7,
      documents: ["사업자등록증", "영업신고증"],
    },
  ],
  미용실: [
    {
      name: "미용업 신고증",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["미용사 면허증", "사업자등록증", "임대차계약서"],
    },
    {
      name: "미용사 면허",
      authority: "시도지사",
      required: true,
      processingDays: 14,
      documents: ["미용사 자격증", "건강진단서"],
    },
  ],
  default: [
    {
      name: "사업자등록",
      authority: "관할 세무서",
      required: true,
      processingDays: 1,
      documents: ["신분증", "임대차계약서"],
    },
  ],
};

// 업종별 체크리스트
const CHECKLIST_DB: Record<string, string[]> = {
  카페: [
    "입지 선정 및 상권 분석",
    "임대차 계약 체결",
    "사업자등록 신청",
    "위생교육 이수 (영업 전 필수)",
    "인테리어 및 설비 공사",
    "소방시설 설치 및 점검",
    "영업신고증 발급",
    "POS 및 결제 시스템 설치",
    "메뉴 개발 및 가격 책정",
    "직원 채용 및 교육 (해당 시)",
    "오픈 마케팅 준비",
  ],
  음식점: [
    "입지 선정 및 상권 분석",
    "임대차 계약 체결",
    "사업자등록 신청",
    "위생교육 이수 (영업 전 필수)",
    "인테리어 및 주방 설비 공사",
    "소방시설 설치 및 점검",
    "영업신고증 발급",
    "식자재 납품업체 계약",
    "배달앱 입점 (해당 시)",
    "직원 채용 및 교육",
    "오픈 마케팅 준비",
  ],
  편의점: [
    "프랜차이즈 가맹 상담",
    "입지 선정 (본사 승인)",
    "가맹계약 체결",
    "사업자등록 신청",
    "인테리어 공사 (본사 시공)",
    "영업신고증 발급",
    "담배/주류 판매 허가 (해당 시)",
    "POS 및 재고관리 시스템 교육",
    "본사 교육 이수",
    "오픈",
  ],
  미용실: [
    "미용사 면허 취득 (필수)",
    "입지 선정 및 상권 분석",
    "임대차 계약 체결",
    "사업자등록 신청",
    "인테리어 및 설비 공사",
    "미용업 신고증 발급",
    "미용 기기 및 제품 구매",
    "예약 시스템 구축",
    "직원 채용 (해당 시)",
    "오픈 마케팅 준비",
  ],
  default: [
    "사업 아이템 검증",
    "사업계획서 작성",
    "자금 조달 계획",
    "입지 선정",
    "임대차 계약",
    "사업자등록",
    "필요 인허가 확인 및 취득",
    "설비 및 비품 준비",
    "직원 채용 (해당 시)",
    "마케팅 및 홍보",
    "오픈",
  ],
};

// 업종별 예상 비용
const COST_DB: Record<string, { min: number; max: number; breakdown: Record<string, number> }> = {
  카페: {
    min: 50000000,
    max: 150000000,
    breakdown: {
      보증금: 30000000,
      인테리어: 40000000,
      설비: 20000000,
      초기재료비: 5000000,
      마케팅: 3000000,
      예비비: 10000000,
    },
  },
  음식점: {
    min: 70000000,
    max: 200000000,
    breakdown: {
      보증금: 40000000,
      인테리어: 50000000,
      주방설비: 30000000,
      초기재료비: 10000000,
      마케팅: 5000000,
      예비비: 15000000,
    },
  },
  편의점: {
    min: 100000000,
    max: 200000000,
    breakdown: {
      가맹비: 30000000,
      보증금: 50000000,
      인테리어: 40000000,
      초기물품비: 30000000,
      예비비: 20000000,
    },
  },
  미용실: {
    min: 30000000,
    max: 100000000,
    breakdown: {
      보증금: 20000000,
      인테리어: 25000000,
      설비: 15000000,
      초기제품비: 5000000,
      마케팅: 3000000,
      예비비: 7000000,
    },
  },
  default: {
    min: 30000000,
    max: 100000000,
    breakdown: {
      보증금: 20000000,
      인테리어: 20000000,
      설비: 15000000,
      초기비용: 10000000,
      마케팅: 5000000,
      예비비: 10000000,
    },
  },
};

// 팁 생성
function generateTips(businessType: string): string[] {
  const commonTips = [
    "창업 전 최소 3개월 운영자금을 별도로 확보하세요.",
    "임대차계약 시 권리금, 관리비, 부가세를 꼼꼼히 확인하세요.",
    "위생교육은 온라인으로도 이수 가능합니다.",
  ];

  const specificTips: Record<string, string[]> = {
    카페: [
      "커피머신은 렌탈로 초기비용을 절감할 수 있습니다.",
      "SNS 마케팅이 중요합니다. 인스타그램 계정을 미리 운영하세요.",
    ],
    음식점: [
      "배달앱 수수료(15~20%)를 감안한 가격 책정이 필요합니다.",
      "식자재 원가율은 30~35%가 적정합니다.",
    ],
    편의점: [
      "프랜차이즈 선정 시 본사 지원 조건을 꼼꼼히 비교하세요.",
      "24시간 운영 시 인건비 부담이 큽니다. 영업시간을 신중히 결정하세요.",
    ],
    미용실: [
      "단골 확보가 핵심입니다. 재방문 할인 등 리텐션 전략을 준비하세요.",
      "인스타그램 포트폴리오가 중요합니다.",
    ],
  };

  return [...commonTips, ...(specificTips[businessType] || [])];
}

export async function getStartupChecklist(
  businessType: string,
  _region?: string
): Promise<ApiResult<StartupChecklist>> {
  try {
    // 업종 정규화
    const normalizedType = businessType.includes("카페") || businessType.includes("커피")
      ? "카페"
      : businessType.includes("음식") || businessType.includes("식당") || businessType.includes("국밥")
        ? "음식점"
        : businessType.includes("편의점")
          ? "편의점"
          : businessType.includes("미용") || businessType.includes("헤어")
            ? "미용실"
            : "default";

    const licenses = LICENSE_DB[normalizedType] || LICENSE_DB.default;
    const checklist = CHECKLIST_DB[normalizedType] || CHECKLIST_DB.default;
    const estimatedCost = COST_DB[normalizedType] || COST_DB.default;
    const tips = generateTips(normalizedType);

    return {
      success: true,
      data: {
        businessType: normalizedType === "default" ? businessType : normalizedType,
        licenses,
        checklist,
        estimatedCost,
        tips,
      },
      meta: {
        source: "창업 가이드 데이터베이스",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("체크리스트 조회 실패:", error);

    return {
      success: false,
      error: {
        code: "CHECKLIST_FAILED",
        message: "체크리스트 조회 중 오류가 발생했습니다.",
        suggestion: "업종명을 다시 확인해주세요.",
      },
    };
  }
}
