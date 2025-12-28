// 창업 체크리스트 Tool
// 업종별 인허가 및 창업 준비사항 안내
// 출처: 소상공인마당(sbiz.or.kr), 정부24 인허가 포털, 각 지자체 창업 가이드

import { DATA_SOURCES } from "../constants.js";
import type { ApiResult, StartupChecklist, License } from "../types.js";

// 업종별 필요 인허가 데이터베이스
// 출처: 정부24 인허가 자가진단(https://www.gov.kr/portal/license)
const LICENSE_DB: Record<string, License[]> = {
  카페: [
    {
      name: "식품위생교육 이수",
      authority: "한국외식산업협회/온라인",
      required: true,
      processingDays: 1,
      documents: ["신분증"],
      fee: 40000,
      note: "온라인 교육 가능 (www.kfoodedu.or.kr)",
    },
    {
      name: "휴게음식점 영업신고",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "위생교육이수증", "임대차계약서", "평면도"],
      fee: 28000,
      note: "영업면적 300㎡ 이상 시 추가 서류 필요",
    },
    {
      name: "소방시설 완비증명",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면", "소방시설 점검표"],
      fee: 0,
      note: "66㎡ 이상 시 필수",
    },
  ],
  음식점: [
    {
      name: "식품위생교육 이수",
      authority: "한국외식산업협회",
      required: true,
      processingDays: 1,
      documents: ["신분증"],
      fee: 40000,
    },
    {
      name: "일반음식점 영업허가",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 5,
      documents: ["사업자등록증", "위생교육이수증", "임대차계약서", "시설평면도"],
      fee: 28000,
      note: "주류 판매 시 별도 신고 필요",
    },
    {
      name: "소방시설 완비증명",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면"],
      fee: 0,
    },
    {
      name: "통신판매업신고",
      authority: "관할 구청",
      required: false,
      processingDays: 5,
      documents: ["사업자등록증"],
      fee: 0,
      note: "배달앱 입점 시 필수",
    },
  ],
  무인매장: [
    {
      name: "사업자등록",
      authority: "관할 세무서",
      required: true,
      processingDays: 1,
      documents: ["신분증", "임대차계약서"],
      fee: 0,
    },
    {
      name: "식품자동판매기 신고 (아이스크림)",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "기기 설치장소 도면"],
      fee: 10000,
      note: "무인 아이스크림 판매 시",
    },
    {
      name: "세탁업 신고 (코인빨래방)",
      authority: "관할 구청",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "시설현황도"],
      fee: 10000,
      note: "셀프빨래방 운영 시",
    },
    {
      name: "CCTV 설치 신고",
      authority: "관할 경찰서",
      required: false,
      processingDays: 3,
      documents: ["설치계획서"],
      fee: 0,
      note: "개인정보보호법에 따른 고지 필수",
    },
  ],
  반려동물: [
    {
      name: "동물판매업 등록",
      authority: "관할 시군구청",
      required: true,
      processingDays: 14,
      documents: ["사업자등록증", "시설설치도면", "반려동물행동지도사 자격증"],
      fee: 50000,
      note: "동물 판매 시 필수, 인력기준 충족 필요",
    },
    {
      name: "동물미용업 등록",
      authority: "관할 시군구청",
      required: true,
      processingDays: 14,
      documents: ["사업자등록증", "시설설치도면", "인력기준 증빙"],
      fee: 50000,
      note: "반려동물미용사 자격 권장",
    },
    {
      name: "동물위탁관리업 등록 (호텔)",
      authority: "관할 시군구청",
      required: true,
      processingDays: 14,
      documents: ["사업자등록증", "시설설치도면", "운영계획서"],
      fee: 50000,
      note: "펫호텔 운영 시",
    },
  ],
  스터디카페: [
    {
      name: "사업자등록",
      authority: "관할 세무서",
      required: true,
      processingDays: 1,
      documents: ["신분증", "임대차계약서"],
      fee: 0,
    },
    {
      name: "학원등록 (선택)",
      authority: "관할 교육청",
      required: false,
      processingDays: 14,
      documents: ["시설평면도", "운영계획서"],
      fee: 0,
      note: "교육서비스 제공 시에만 해당",
    },
    {
      name: "소방시설 완비증명",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면"],
      fee: 0,
      note: "66㎡ 이상 시 필수",
    },
    {
      name: "음료 판매 시 영업신고",
      authority: "관할 구청 위생과",
      required: false,
      processingDays: 3,
      documents: ["사업자등록증"],
      fee: 10000,
      note: "자판기 또는 음료 판매 시",
    },
  ],
  편의점: [
    {
      name: "식품판매업 신고",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["사업자등록증", "임대차계약서"],
      fee: 28000,
    },
    {
      name: "담배소매인 지정",
      authority: "관할 구청",
      required: false,
      processingDays: 14,
      documents: ["허가신청서", "사업자등록증", "건물배치도"],
      fee: 0,
      note: "학교 50m 이내 불가, 경쟁률 있음",
    },
    {
      name: "주류판매업 신고",
      authority: "관할 세무서",
      required: false,
      processingDays: 7,
      documents: ["사업자등록증", "영업신고증"],
      fee: 0,
      note: "학교 200m 이내 제한",
    },
    {
      name: "통신판매업신고",
      authority: "관할 구청",
      required: false,
      processingDays: 5,
      documents: ["사업자등록증"],
      fee: 0,
      note: "택배발송 서비스 시",
    },
  ],
  미용실: [
    {
      name: "미용사 면허",
      authority: "시도지사 (보건소)",
      required: true,
      processingDays: 14,
      documents: ["미용사 자격증", "건강진단서", "신분증"],
      fee: 5000,
      note: "미용사 자격증 필수",
    },
    {
      name: "미용업 신고",
      authority: "관할 구청 위생과",
      required: true,
      processingDays: 3,
      documents: ["미용사 면허증", "사업자등록증", "임대차계약서", "시설평면도"],
      fee: 10000,
    },
    {
      name: "소방시설 완비증명",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면"],
      fee: 0,
      note: "66㎡ 이상 시 필수",
    },
  ],
  키즈카페: [
    {
      name: "어린이놀이시설 설치검사",
      authority: "안전관리공단/지정검사기관",
      required: true,
      processingDays: 14,
      documents: ["시설설치도면", "안전검사신청서"],
      fee: 300000,
      note: "어린이놀이시설안전관리법 의무",
    },
    {
      name: "안전관리자 배치/교육",
      authority: "안전관리공단",
      required: true,
      processingDays: 2,
      documents: ["안전관리자 교육이수증"],
      fee: 50000,
      note: "영업 중 안전관리자 상시 배치 필수",
    },
    {
      name: "휴게음식점 영업신고 (식음료 제공 시)",
      authority: "관할 구청 위생과",
      required: false,
      processingDays: 3,
      documents: ["사업자등록증", "위생교육이수증"],
      fee: 28000,
    },
    {
      name: "소방안전점검",
      authority: "관할 소방서",
      required: true,
      processingDays: 7,
      documents: ["소방시설 설치도면"],
      fee: 0,
    },
  ],
  default: [
    {
      name: "사업자등록",
      authority: "관할 세무서 / 홈택스",
      required: true,
      processingDays: 1,
      documents: ["신분증", "임대차계약서"],
      fee: 0,
      note: "홈택스에서 온라인 신청 가능",
    },
    {
      name: "업종별 인허가 확인",
      authority: "정부24 인허가 자가진단",
      required: true,
      processingDays: 1,
      documents: [],
      fee: 0,
      note: "gov.kr/portal/license 에서 확인",
    },
  ],
};

// 업종별 체크리스트
const CHECKLIST_DB: Record<string, string[]> = {
  카페: [
    "상권 분석 및 입지 선정 (유동인구, 경쟁점포 분석)",
    "임대차 계약 체결 (권리금, 관리비, 원상복구 조건 확인)",
    "사업자등록 신청 (홈택스 온라인 가능)",
    "식품위생교육 이수 (온라인 교육 가능, 6시간)",
    "인테리어 설계 및 공사 (평당 80~150만원 예상)",
    "커피머신 및 설비 계약 (구매 vs 렌탈 비교)",
    "소방시설 설치 및 점검 (66㎡ 이상 필수)",
    "휴게음식점 영업신고 발급",
    "POS 및 결제 시스템 설치",
    "메뉴 개발 및 원가 계산 (원가율 25~30% 권장)",
    "SNS 계정 개설 및 오픈 마케팅 준비",
  ],
  음식점: [
    "상권 분석 및 입지 선정",
    "임대차 계약 체결",
    "사업자등록 신청",
    "식품위생교육 이수 (6시간)",
    "주방 설계 및 공사 (동선, 환기 중요)",
    "소방시설 설치 및 점검",
    "일반음식점 영업허가 발급",
    "식자재 납품업체 계약 (원가율 30~35% 목표)",
    "배달앱 입점 신청 (통신판매업신고 필요)",
    "직원 채용 및 교육",
    "오픈 프로모션 준비",
  ],
  무인매장: [
    "업종 선택 (아이스크림, 빨래방, 편의점 등)",
    "상권 분석 (야간 유동인구 중요)",
    "임대차 계약 (전기용량, 급배수 확인)",
    "사업자등록",
    "업종별 인허가 취득",
    "키오스크 및 무인결제 시스템 설치",
    "CCTV 설치 및 모니터링 시스템 구축",
    "원격 관리 시스템 구축 (앱 알림 등)",
    "초기 재고 입고",
    "테스트 운영 및 오픈",
  ],
  반려동물: [
    "업종 결정 (판매/미용/호텔/유치원 등)",
    "관련 자격증 취득 (반려동물관리사, 미용사 등)",
    "상권 분석 (아파트 단지, 반려인 밀집 지역)",
    "임대차 계약 (소음, 냄새 관련 동의 확인)",
    "사업자등록",
    "동물관련업 등록 (시군구청)",
    "시설 설비 (케이지, 미용도구, 운동시설 등)",
    "동물의료기관 협력관계 구축",
    "반려동물 커뮤니티 마케팅",
    "오픈",
  ],
  스터디카페: [
    "상권 분석 (학원가, 대학가, 오피스 인근)",
    "임대차 계약 (방음, 전기용량 확인)",
    "사업자등록",
    "좌석 배치 및 인테리어 설계 (1인석, 그룹석, 스터디룸)",
    "출입관리 시스템 구축 (키오스크, 앱)",
    "소방시설 점검",
    "음료 자판기 설치 (영업신고 확인)",
    "Wi-Fi 및 충전시설 설치",
    "정기권/시간권 요금체계 설정",
    "오픈 프로모션 (무료체험, 할인권)",
  ],
  편의점: [
    "프랜차이즈 본사 비교 (GS25, CU, 세븐일레븐, 이마트24)",
    "가맹 상담 및 입지 선정 (본사 승인 필요)",
    "가맹계약 체결 (가맹비, 로열티, 지원사항 확인)",
    "사업자등록",
    "인테리어 공사 (본사 시공)",
    "식품판매업 신고",
    "담배/주류 판매 허가 신청",
    "본사 교육 이수 (2~4주)",
    "POS 및 재고관리 시스템 교육",
    "오픈",
  ],
  미용실: [
    "미용사 자격증 취득 (국가기술자격)",
    "미용사 면허 취득 (보건소)",
    "상권 분석 및 입지 선정",
    "임대차 계약",
    "사업자등록",
    "인테리어 및 설비 공사",
    "미용업 신고",
    "미용 기기 및 제품 구매",
    "예약 시스템 구축 (네이버 예약 등)",
    "포트폴리오 SNS 운영",
    "오픈 프로모션",
  ],
  키즈카페: [
    "상권 분석 (가족 단위 유동인구, 아파트 단지)",
    "임대차 계약 (넓은 면적, 1층 권장)",
    "사업자등록",
    "어린이놀이시설 설계 및 시공",
    "어린이놀이시설 설치검사 (안전관리공단)",
    "안전관리자 교육 이수 및 배치",
    "소방시설 점검",
    "식음료 제공 시 영업신고",
    "보험 가입 (배상책임보험 필수)",
    "오픈 프로모션",
  ],
  default: [
    "사업 아이템 검증 및 시장조사",
    "사업계획서 작성",
    "자금 조달 계획 수립",
    "정부24에서 필요 인허가 확인",
    "입지 선정 및 임대차 계약",
    "사업자등록",
    "필요 인허가 취득",
    "설비 및 비품 준비",
    "직원 채용 (해당 시)",
    "마케팅 및 홍보 준비",
    "오픈",
  ],
};

// 업종별 예상 비용 (2024년 소상공인시장진흥공단 창업비용 조사 기반)
const COST_DB: Record<string, { min: number; max: number; breakdown: Record<string, number>; note?: string }> = {
  카페: {
    min: 50000000,
    max: 150000000,
    breakdown: {
      "보증금 (10~15평 기준)": 30000000,
      "인테리어 (평당 100만원)": 40000000,
      "커피머신/설비": 20000000,
      "초기재료비": 3000000,
      "마케팅": 2000000,
      "예비운영자금 (3개월)": 15000000,
    },
    note: "커피머신 렌탈 시 설비비 절감 가능",
  },
  음식점: {
    min: 70000000,
    max: 200000000,
    breakdown: {
      "보증금 (15~20평 기준)": 40000000,
      "인테리어 (평당 120만원)": 50000000,
      "주방설비": 30000000,
      "초기재료비": 8000000,
      "마케팅": 5000000,
      "예비운영자금 (3개월)": 20000000,
    },
    note: "주방설비는 중고 구매로 절감 가능",
  },
  무인매장: {
    min: 30000000,
    max: 100000000,
    breakdown: {
      "보증금 (5~10평 기준)": 15000000,
      "인테리어": 15000000,
      "무인결제 시스템/키오스크": 10000000,
      "설비 (냉동고/세탁기 등)": 20000000,
      "CCTV/관리시스템": 5000000,
      "초기재고/운영자금": 10000000,
    },
    note: "인건비 최소화로 월 고정비 낮음",
  },
  반려동물: {
    min: 50000000,
    max: 150000000,
    breakdown: {
      "보증금 (10~15평 기준)": 25000000,
      "인테리어 (방음 중요)": 35000000,
      "미용도구/케이지/설비": 15000000,
      "자격증 취득비용": 2000000,
      "초기운영자금": 15000000,
    },
    note: "전문성이 수익에 직접 연결됨",
  },
  스터디카페: {
    min: 70000000,
    max: 150000000,
    breakdown: {
      "보증금 (30~50평 기준)": 30000000,
      "인테리어 (방음 부스)": 50000000,
      "가구/책상/의자": 15000000,
      "출입관리/결제시스템": 8000000,
      "예비운영자금": 15000000,
    },
    note: "넓은 면적 필요, 방음이 핵심",
  },
  편의점: {
    min: 100000000,
    max: 200000000,
    breakdown: {
      "가맹비": 20000000,
      "보증금": 50000000,
      "인테리어 (본사 시공)": 40000000,
      "초기물품비": 30000000,
      "예비운영자금": 20000000,
    },
    note: "본사별 지원조건 상이, 비교 필수",
  },
  미용실: {
    min: 30000000,
    max: 100000000,
    breakdown: {
      "보증금 (5~10평 기준)": 15000000,
      "인테리어": 25000000,
      "미용설비/도구": 10000000,
      "미용제품": 3000000,
      "마케팅": 3000000,
      "예비운영자금": 10000000,
    },
    note: "1인 샵으로 시작 시 비용 절감",
  },
  키즈카페: {
    min: 150000000,
    max: 300000000,
    breakdown: {
      "보증금 (50평 이상)": 50000000,
      "인테리어/놀이시설": 100000000,
      "안전검사비용": 3000000,
      "식음료설비 (선택)": 15000000,
      "보험료": 2000000,
      "예비운영자금": 30000000,
    },
    note: "넓은 면적과 안전시설 필수",
  },
  default: {
    min: 30000000,
    max: 100000000,
    breakdown: {
      "보증금": 15000000,
      "인테리어/시설": 25000000,
      "설비/비품": 10000000,
      "초기운영자금": 10000000,
      "마케팅": 5000000,
      "예비비": 10000000,
    },
  },
};

// 팁 생성
function generateTips(businessType: string): string[] {
  const commonTips = [
    "창업 전 최소 3개월 운영자금을 별도로 확보하세요.",
    "임대차계약 시 권리금, 관리비, 부가세, 원상복구 조건을 꼼꼼히 확인하세요.",
    "소상공인시장진흥공단(sbiz.or.kr)에서 무료 창업교육을 받을 수 있습니다.",
    "창업 전 정부지원금(창업지원금, 청년창업지원금 등)을 먼저 확인하세요.",
  ];

  const specificTips: Record<string, string[]> = {
    카페: [
      "커피머신은 렌탈(월 20~30만원)로 초기비용을 절감할 수 있습니다.",
      "배달앱 수수료(12~20%)를 감안한 가격 책정이 필요합니다.",
      "인스타그램 계정을 오픈 1~2개월 전부터 운영하세요.",
      "원가율 25~30%를 유지해야 수익성이 있습니다.",
    ],
    음식점: [
      "배달앱 수수료(15~20%)를 감안한 가격 책정이 필요합니다.",
      "식자재 원가율은 30~35%가 적정합니다.",
      "점심/저녁 회전율이 수익에 직결됩니다.",
      "초기에는 메뉴를 단순화하여 효율을 높이세요.",
    ],
    무인매장: [
      "CCTV 원격 모니터링과 즉시 알림 시스템이 필수입니다.",
      "현금 없는 매장으로 운영하면 도난 위험이 줄어듭니다.",
      "정기 순찰(청소, 재고보충)을 체계화하세요.",
      "인근 상가와의 협력관계(긴급상황 대응)를 구축하세요.",
    ],
    반려동물: [
      "자격증(반려동물관리사, 미용사)이 신뢰도를 높입니다.",
      "인근 동물병원과 협력관계를 구축하세요.",
      "단골 확보가 핵심입니다. 반려동물 커뮤니티 마케팅이 효과적입니다.",
      "소음/냄새 관련 이웃 민원에 대비하세요.",
    ],
    스터디카페: [
      "방음이 가장 중요합니다. 시공 전 방음테스트를 하세요.",
      "24시간 무인 운영 시 보안시스템을 강화하세요.",
      "정기권/시간권 비율을 잘 설계하면 수익이 안정됩니다.",
      "시험기간 특수에 대비한 좌석 확장 계획을 세우세요.",
    ],
    편의점: [
      "24시간 운영 시 인건비 부담이 큽니다. 영업시간을 신중히 결정하세요.",
      "본사별 지원조건(인테리어, 물류, 로열티)을 꼼꼼히 비교하세요.",
      "담배/주류 허가가 매출에 큰 영향을 줍니다.",
      "점주 직접 운영 시간을 최대한 늘려 인건비를 절감하세요.",
    ],
    미용실: [
      "단골 확보가 핵심입니다. 재방문 할인 등 리텐션 전략을 준비하세요.",
      "인스타그램 포트폴리오가 신규 고객 유치에 효과적입니다.",
      "네이버 예약/리뷰 관리가 중요합니다.",
      "1인 샵으로 시작해 경력을 쌓은 후 확장하세요.",
    ],
    키즈카페: [
      "안전사고 대비가 최우선입니다. 배상책임보험 가입 필수!",
      "안전관리자 배치 의무를 반드시 준수하세요.",
      "주말/공휴일 집중 매출 구조입니다. 평일 이벤트로 분산하세요.",
      "부모 편의시설(카페공간, Wi-Fi)도 중요합니다.",
    ],
  };

  return [...(specificTips[businessType] || []), ...commonTips];
}

// 업종 정규화 (구체적인 업종을 먼저 체크)
function normalizeBusinessType(input: string): string {
  const inputLower = input.toLowerCase();

  // 구체적인 업종을 먼저 체크 (스터디카페, 키즈카페 등)
  if (inputLower.includes("스터디") || inputLower.includes("독서실") || inputLower.includes("공유오피스")) return "스터디카페";
  if (inputLower.includes("키즈") || inputLower.includes("놀이")) return "키즈카페";
  // 일반 카페는 나중에 체크
  if (inputLower.includes("카페") || inputLower.includes("커피")) return "카페";
  if (inputLower.includes("음식") || inputLower.includes("식당") || inputLower.includes("레스토랑")) return "음식점";
  if (inputLower.includes("무인") || inputLower.includes("셀프") || inputLower.includes("코인")) return "무인매장";
  if (inputLower.includes("반려") || inputLower.includes("펫") || inputLower.includes("애완")) return "반려동물";
  if (inputLower.includes("편의점") || inputLower.includes("마트")) return "편의점";
  if (inputLower.includes("미용") || inputLower.includes("헤어") || inputLower.includes("네일")) return "미용실";

  return "default";
}

// 지역별 비용 배율 및 특화 팁
const REGIONAL_INFO: Record<string, { costMultiplier: number; tips: string[] }> = {
  서울: {
    costMultiplier: 1.3,
    tips: [
      "[서울] 보증금/임대료가 전국 평균 대비 30~50% 높습니다.",
      "[서울] 강남/홍대/이태원 등 핫플레이스는 권리금이 추가로 발생합니다.",
      "[서울] 서울신용보증재단 창업지원 프로그램을 활용하세요.",
    ],
  },
  부산: {
    costMultiplier: 0.85,
    tips: [
      "[부산] 서면/해운대 상권은 관광객 시즌 영향이 큽니다.",
      "[부산] 부산신용보증재단 소상공인 지원사업을 확인하세요.",
      "[부산] 임대료는 서울 대비 15~25% 저렴합니다.",
    ],
  },
  경기: {
    costMultiplier: 1.1,
    tips: [
      "[경기] 신도시(판교/동탄/광교)는 서울과 비슷한 임대료 수준입니다.",
      "[경기] 경기도 청년창업지원센터를 활용하세요.",
      "[경기] 지역에 따라 비용 편차가 큽니다.",
    ],
  },
  대전: {
    costMultiplier: 0.75,
    tips: [
      "[대전] 유성구 대학가/연구단지 상권이 활발합니다.",
      "[대전] 임대료는 서울 대비 25~35% 저렴합니다.",
      "[대전] 대전창조경제혁신센터 창업 프로그램을 활용하세요.",
    ],
  },
  인천: {
    costMultiplier: 0.9,
    tips: [
      "[인천] 송도/청라 신도시는 임대료가 높은 편입니다.",
      "[인천] 인천신용보증재단 소상공인 지원사업을 확인하세요.",
    ],
  },
  제주: {
    costMultiplier: 1.0,
    tips: [
      "[제주] 관광 시즌(여름/겨울) 매출 편차가 큽니다.",
      "[제주] 물류비용이 육지 대비 높습니다.",
      "[제주] 제주창조경제혁신센터 창업 지원을 활용하세요.",
    ],
  },
  대구: {
    costMultiplier: 0.8,
    tips: [
      "[대구] 동성로 상권이 가장 활발합니다.",
      "[대구] 임대료는 서울 대비 20~30% 저렴합니다.",
    ],
  },
  광주: {
    costMultiplier: 0.75,
    tips: [
      "[광주] 충장로/상무지구 상권이 핵심입니다.",
      "[광주] 임대료는 서울 대비 25~35% 저렴합니다.",
    ],
  },
};

export async function getStartupChecklist(
  businessType: string,
  region?: string
): Promise<ApiResult<StartupChecklist>> {
  try {
    const normalizedType = normalizeBusinessType(businessType);

    // 지역 정규화
    const normalizedRegion = region
      ? Object.keys(REGIONAL_INFO).find((r) => region.includes(r))
      : null;

    const licenses = LICENSE_DB[normalizedType] || LICENSE_DB.default;
    const checklist = CHECKLIST_DB[normalizedType] || CHECKLIST_DB.default;
    const costData = COST_DB[normalizedType] || COST_DB.default;

    // 지역별 비용 배율 적용
    const costMultiplier = normalizedRegion
      ? REGIONAL_INFO[normalizedRegion].costMultiplier
      : 1;

    const estimatedCost = {
      min: Math.round(costData.min * costMultiplier),
      max: Math.round(costData.max * costMultiplier),
      breakdown: Object.fromEntries(
        Object.entries(costData.breakdown).map(([key, value]) => [
          key,
          Math.round(value * costMultiplier),
        ])
      ),
    };

    // 지역별 팁 추가
    let tips = generateTips(normalizedType);
    if (normalizedRegion) {
      tips = [...REGIONAL_INFO[normalizedRegion].tips, ...tips];
    }

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
        source: DATA_SOURCES.sbizApi,
        timestamp: new Date().toISOString(),
        dataNote: normalizedRegion
          ? `${normalizedRegion} 지역 기준 비용 산정. 출처: 소상공인마당, 정부24.`
          : "전국 평균 기준. 지역별로 상이할 수 있으니 관할 관청에 확인 권장.",
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
