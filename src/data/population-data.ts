// 상권 인구 분석 데이터
// 출처: 서울열린데이터광장, 통계청, 소상공인마당 참고 추정치

import type { Coordinates } from "../types.js";

// 주요 상권별 인구 데이터
export interface AreaPopulationData {
  coordinates: Coordinates;
  population: {
    total: number; // 일평균 유동인구
    residential: number; // 거주인구
    working: number; // 직장인구
    floating: number; // 순수 유동인구
  };
  timeDistribution: {
    morning: number; // 06-11시 (%)
    lunch: number; // 11-14시 (%)
    afternoon: number; // 14-18시 (%)
    evening: number; // 18-22시 (%)
    night: number; // 22-06시 (%)
  };
  ageDistribution: {
    teens: number; // 10대 (%)
    twenties: number; // 20대 (%)
    thirties: number; // 30대 (%)
    forties: number; // 40대 (%)
    fiftyPlus: number; // 50대 이상 (%)
  };
  genderRatio: {
    male: number; // 남성 (%)
    female: number; // 여성 (%)
  };
  peakHours: string[];
  characteristics: string[];
  areaType: "역세권" | "대학가" | "오피스" | "주거지역" | "관광지" | "유흥가" | "복합";
}

export const MAJOR_AREA_DATA: Record<string, AreaPopulationData> = {
  강남역: {
    coordinates: { lat: 37.498095, lng: 127.02761 },
    population: {
      total: 180000,
      residential: 25000,
      working: 95000,
      floating: 60000,
    },
    timeDistribution: {
      morning: 15,
      lunch: 25,
      afternoon: 20,
      evening: 30,
      night: 10,
    },
    ageDistribution: {
      teens: 5,
      twenties: 30,
      thirties: 35,
      forties: 20,
      fiftyPlus: 10,
    },
    genderRatio: { male: 48, female: 52 },
    peakHours: ["12-14시", "18-21시"],
    characteristics: ["직장인 밀집", "IT/스타트업 중심", "유흥가 인접", "높은 소비력"],
    areaType: "복합",
  },
  홍대입구: {
    coordinates: { lat: 37.557527, lng: 126.9244669 },
    population: {
      total: 150000,
      residential: 20000,
      working: 40000,
      floating: 90000,
    },
    timeDistribution: {
      morning: 10,
      lunch: 20,
      afternoon: 25,
      evening: 30,
      night: 15,
    },
    ageDistribution: {
      teens: 15,
      twenties: 45,
      thirties: 25,
      forties: 10,
      fiftyPlus: 5,
    },
    genderRatio: { male: 45, female: 55 },
    peakHours: ["14-18시", "19-23시"],
    characteristics: ["대학가", "문화예술 중심", "젊은층 밀집", "야간 상권 활성화"],
    areaType: "대학가",
  },
  신촌: {
    coordinates: { lat: 37.555946, lng: 126.9368 },
    population: {
      total: 120000,
      residential: 30000,
      working: 25000,
      floating: 65000,
    },
    timeDistribution: {
      morning: 12,
      lunch: 22,
      afternoon: 25,
      evening: 28,
      night: 13,
    },
    ageDistribution: {
      teens: 10,
      twenties: 50,
      thirties: 20,
      forties: 12,
      fiftyPlus: 8,
    },
    genderRatio: { male: 48, female: 52 },
    peakHours: ["12-14시", "18-22시"],
    characteristics: ["대학가", "저렴한 가격대", "학생 위주", "음식점 밀집"],
    areaType: "대학가",
  },
  건대입구: {
    coordinates: { lat: 37.540372, lng: 127.069276 },
    population: {
      total: 130000,
      residential: 35000,
      working: 30000,
      floating: 65000,
    },
    timeDistribution: {
      morning: 12,
      lunch: 23,
      afternoon: 22,
      evening: 30,
      night: 13,
    },
    ageDistribution: {
      teens: 12,
      twenties: 42,
      thirties: 25,
      forties: 13,
      fiftyPlus: 8,
    },
    genderRatio: { male: 47, female: 53 },
    peakHours: ["12-14시", "19-22시"],
    characteristics: ["대학가", "쇼핑몰 인접", "젊은층 밀집", "맛집 밀집"],
    areaType: "대학가",
  },
  명동: {
    coordinates: { lat: 37.560977, lng: 126.986325 },
    population: {
      total: 200000,
      residential: 5000,
      working: 45000,
      floating: 150000,
    },
    timeDistribution: {
      morning: 8,
      lunch: 25,
      afternoon: 35,
      evening: 25,
      night: 7,
    },
    ageDistribution: {
      teens: 15,
      twenties: 35,
      thirties: 25,
      forties: 15,
      fiftyPlus: 10,
    },
    genderRatio: { male: 40, female: 60 },
    peakHours: ["13-17시", "18-20시"],
    characteristics: ["관광특구", "외국인 비중 높음", "화장품/패션 중심", "주말 집중"],
    areaType: "관광지",
  },
  이태원: {
    coordinates: { lat: 37.534685, lng: 126.994831 },
    population: {
      total: 80000,
      residential: 15000,
      working: 20000,
      floating: 45000,
    },
    timeDistribution: {
      morning: 5,
      lunch: 15,
      afternoon: 20,
      evening: 35,
      night: 25,
    },
    ageDistribution: {
      teens: 5,
      twenties: 40,
      thirties: 35,
      forties: 15,
      fiftyPlus: 5,
    },
    genderRatio: { male: 50, female: 50 },
    peakHours: ["18-22시", "22-02시"],
    characteristics: ["외국인 밀집", "유흥가", "다양한 음식문화", "야간 특화"],
    areaType: "유흥가",
  },
  여의도: {
    coordinates: { lat: 37.521597, lng: 126.924173 },
    population: {
      total: 140000,
      residential: 20000,
      working: 100000,
      floating: 20000,
    },
    timeDistribution: {
      morning: 20,
      lunch: 30,
      afternoon: 25,
      evening: 20,
      night: 5,
    },
    ageDistribution: {
      teens: 3,
      twenties: 20,
      thirties: 35,
      forties: 30,
      fiftyPlus: 12,
    },
    genderRatio: { male: 55, female: 45 },
    peakHours: ["12-13시", "18-19시"],
    characteristics: ["금융 중심", "직장인 특화", "주말 한산", "높은 객단가"],
    areaType: "오피스",
  },
  서울역: {
    coordinates: { lat: 37.555946, lng: 126.972317 },
    population: {
      total: 160000,
      residential: 10000,
      working: 50000,
      floating: 100000,
    },
    timeDistribution: {
      morning: 25,
      lunch: 20,
      afternoon: 20,
      evening: 25,
      night: 10,
    },
    ageDistribution: {
      teens: 8,
      twenties: 25,
      thirties: 30,
      forties: 22,
      fiftyPlus: 15,
    },
    genderRatio: { male: 52, female: 48 },
    peakHours: ["08-10시", "17-19시"],
    characteristics: ["교통 요충지", "출퇴근 인구 집중", "관광객", "다양한 연령대"],
    areaType: "역세권",
  },
  잠실: {
    coordinates: { lat: 37.513281, lng: 127.100159 },
    population: {
      total: 170000,
      residential: 60000,
      working: 50000,
      floating: 60000,
    },
    timeDistribution: {
      morning: 15,
      lunch: 22,
      afternoon: 25,
      evening: 28,
      night: 10,
    },
    ageDistribution: {
      teens: 12,
      twenties: 25,
      thirties: 28,
      forties: 22,
      fiftyPlus: 13,
    },
    genderRatio: { male: 48, female: 52 },
    peakHours: ["12-14시", "18-21시"],
    characteristics: ["쇼핑몰 밀집", "가족 단위", "주거+상업 복합", "주말 활성화"],
    areaType: "복합",
  },
  판교: {
    coordinates: { lat: 37.394761, lng: 127.111172 },
    population: {
      total: 100000,
      residential: 40000,
      working: 50000,
      floating: 10000,
    },
    timeDistribution: {
      morning: 18,
      lunch: 30,
      afternoon: 22,
      evening: 25,
      night: 5,
    },
    ageDistribution: {
      teens: 5,
      twenties: 20,
      thirties: 45,
      forties: 25,
      fiftyPlus: 5,
    },
    genderRatio: { male: 58, female: 42 },
    peakHours: ["12-13시", "18-20시"],
    characteristics: ["IT/스타트업 밀집", "젊은 직장인", "높은 소득수준", "주말 한산"],
    areaType: "오피스",
  },
  해운대: {
    coordinates: { lat: 35.158698, lng: 129.16016 },
    population: {
      total: 130000,
      residential: 50000,
      working: 30000,
      floating: 50000,
    },
    timeDistribution: {
      morning: 10,
      lunch: 20,
      afternoon: 30,
      evening: 30,
      night: 10,
    },
    ageDistribution: {
      teens: 10,
      twenties: 30,
      thirties: 25,
      forties: 20,
      fiftyPlus: 15,
    },
    genderRatio: { male: 48, female: 52 },
    peakHours: ["14-18시", "19-22시"],
    characteristics: ["관광지", "계절 편차 큼", "해변 상권", "주말/휴가 집중"],
    areaType: "관광지",
  },
  서면: {
    coordinates: { lat: 35.157896, lng: 129.059118 },
    population: {
      total: 140000,
      residential: 30000,
      working: 60000,
      floating: 50000,
    },
    timeDistribution: {
      morning: 12,
      lunch: 25,
      afternoon: 22,
      evening: 30,
      night: 11,
    },
    ageDistribution: {
      teens: 12,
      twenties: 35,
      thirties: 28,
      forties: 15,
      fiftyPlus: 10,
    },
    genderRatio: { male: 47, female: 53 },
    peakHours: ["12-14시", "18-22시"],
    characteristics: ["부산 최대 상권", "젊은층 밀집", "쇼핑+유흥 복합", "교통 요충지"],
    areaType: "복합",
  },
};

// 상권 유형별 기본 패턴 (알려진 상권이 아닐 경우 사용)
export const AREA_TYPE_PATTERNS: Record<string, Omit<AreaPopulationData, "coordinates">> = {
  역세권: {
    population: { total: 100000, residential: 20000, working: 40000, floating: 40000 },
    timeDistribution: { morning: 25, lunch: 20, afternoon: 18, evening: 27, night: 10 },
    ageDistribution: { teens: 10, twenties: 25, thirties: 30, forties: 22, fiftyPlus: 13 },
    genderRatio: { male: 50, female: 50 },
    peakHours: ["08-10시", "17-20시"],
    characteristics: ["출퇴근 인구 집중", "다양한 연령대", "빠른 회전"],
    areaType: "역세권",
  },
  대학가: {
    population: { total: 80000, residential: 25000, working: 15000, floating: 40000 },
    timeDistribution: { morning: 10, lunch: 25, afternoon: 25, evening: 28, night: 12 },
    ageDistribution: { teens: 15, twenties: 50, thirties: 20, forties: 10, fiftyPlus: 5 },
    genderRatio: { male: 48, female: 52 },
    peakHours: ["12-14시", "18-22시"],
    characteristics: ["젊은층 밀집", "저가 선호", "방학 영향"],
    areaType: "대학가",
  },
  오피스: {
    population: { total: 90000, residential: 10000, working: 70000, floating: 10000 },
    timeDistribution: { morning: 20, lunch: 35, afternoon: 20, evening: 20, night: 5 },
    ageDistribution: { teens: 3, twenties: 22, thirties: 38, forties: 28, fiftyPlus: 9 },
    genderRatio: { male: 55, female: 45 },
    peakHours: ["12-13시"],
    characteristics: ["점심 특화", "주말 한산", "직장인 중심"],
    areaType: "오피스",
  },
  주거지역: {
    population: { total: 50000, residential: 40000, working: 5000, floating: 5000 },
    timeDistribution: { morning: 15, lunch: 15, afternoon: 20, evening: 35, night: 15 },
    ageDistribution: { teens: 15, twenties: 15, thirties: 25, forties: 25, fiftyPlus: 20 },
    genderRatio: { male: 48, female: 52 },
    peakHours: ["18-21시"],
    characteristics: ["저녁 시간 활성화", "가족 단위", "안정적 수요"],
    areaType: "주거지역",
  },
  관광지: {
    population: { total: 120000, residential: 5000, working: 25000, floating: 90000 },
    timeDistribution: { morning: 10, lunch: 25, afternoon: 35, evening: 25, night: 5 },
    ageDistribution: { teens: 12, twenties: 30, thirties: 25, forties: 20, fiftyPlus: 13 },
    genderRatio: { male: 45, female: 55 },
    peakHours: ["13-17시"],
    characteristics: ["주말/휴일 집중", "계절 편차", "관광객 중심"],
    areaType: "관광지",
  },
  유흥가: {
    population: { total: 70000, residential: 10000, working: 15000, floating: 45000 },
    timeDistribution: { morning: 5, lunch: 10, afternoon: 15, evening: 40, night: 30 },
    ageDistribution: { teens: 5, twenties: 40, thirties: 35, forties: 15, fiftyPlus: 5 },
    genderRatio: { male: 55, female: 45 },
    peakHours: ["20-24시"],
    characteristics: ["야간 특화", "주류업 활성화", "주말 집중"],
    areaType: "유흥가",
  },
};

// 업종별 최적 타겟 조건
export const BUSINESS_TARGET_FIT: Record<
  string,
  {
    preferredAgeGroups: string[];
    preferredGender: "남성" | "여성" | "무관";
    preferredAreaTypes: string[];
    preferredTimeSlots: string[];
    fitNote: string;
  }
> = {
  카페: {
    preferredAgeGroups: ["twenties", "thirties"],
    preferredGender: "여성",
    preferredAreaTypes: ["대학가", "오피스", "복합"],
    preferredTimeSlots: ["afternoon", "evening"],
    fitNote: "20-30대 여성, 오후 시간대 유동인구 중요",
  },
  음식점: {
    preferredAgeGroups: ["thirties", "forties"],
    preferredGender: "무관",
    preferredAreaTypes: ["역세권", "오피스", "주거지역"],
    preferredTimeSlots: ["lunch", "evening"],
    fitNote: "점심/저녁 피크타임, 직장인+가족 수요",
  },
  편의점: {
    preferredAgeGroups: ["twenties", "thirties"],
    preferredGender: "무관",
    preferredAreaTypes: ["역세권", "주거지역", "대학가"],
    preferredTimeSlots: ["morning", "night"],
    fitNote: "24시간 수요, 출퇴근/야간 수요 중요",
  },
  미용실: {
    preferredAgeGroups: ["twenties", "thirties", "forties"],
    preferredGender: "여성",
    preferredAreaTypes: ["주거지역", "역세권"],
    preferredTimeSlots: ["afternoon", "evening"],
    fitNote: "여성 비율, 주거지 접근성 중요",
  },
  치킨: {
    preferredAgeGroups: ["twenties", "thirties"],
    preferredGender: "무관",
    preferredAreaTypes: ["주거지역", "대학가"],
    preferredTimeSlots: ["evening", "night"],
    fitNote: "야간 배달 수요, 주거지 인접 유리",
  },
  호프: {
    preferredAgeGroups: ["twenties", "thirties"],
    preferredGender: "남성",
    preferredAreaTypes: ["유흥가", "역세권", "오피스"],
    preferredTimeSlots: ["evening", "night"],
    fitNote: "야간 수요, 직장인/젊은층 밀집 지역",
  },
  분식: {
    preferredAgeGroups: ["teens", "twenties"],
    preferredGender: "무관",
    preferredAreaTypes: ["대학가", "역세권"],
    preferredTimeSlots: ["lunch", "afternoon"],
    fitNote: "학생/젊은층, 저가 메뉴 선호 지역",
  },
  베이커리: {
    preferredAgeGroups: ["twenties", "thirties", "forties"],
    preferredGender: "여성",
    preferredAreaTypes: ["역세권", "주거지역", "복합"],
    preferredTimeSlots: ["morning", "afternoon"],
    fitNote: "아침/오후 수요, 여성 비율 중요",
  },
  무인매장: {
    preferredAgeGroups: ["twenties", "thirties"],
    preferredGender: "무관",
    preferredAreaTypes: ["주거지역", "역세권"],
    preferredTimeSlots: ["night"],
    fitNote: "야간/새벽 수요, 주거지 인접 유리",
  },
  스터디카페: {
    preferredAgeGroups: ["teens", "twenties"],
    preferredGender: "무관",
    preferredAreaTypes: ["대학가", "주거지역"],
    preferredTimeSlots: ["afternoon", "evening", "night"],
    fitNote: "학생 밀집, 시험 시즌 고려",
  },
  네일샵: {
    preferredAgeGroups: ["twenties", "thirties"],
    preferredGender: "여성",
    preferredAreaTypes: ["역세권", "주거지역", "복합"],
    preferredTimeSlots: ["afternoon", "evening"],
    fitNote: "여성 비율 높을수록 유리",
  },
  반려동물: {
    preferredAgeGroups: ["thirties", "forties"],
    preferredGender: "무관",
    preferredAreaTypes: ["주거지역"],
    preferredTimeSlots: ["afternoon", "evening"],
    fitNote: "반려인 밀집 주거지, 주말 수요",
  },
};

// 인구 적합도 점수 계산 도우미
export function calculateFitScore(
  areaData: AreaPopulationData,
  businessType: string
): {
  score: number;
  targetAge: string;
  peakHours: string;
  recommendation: string;
} {
  const fit = BUSINESS_TARGET_FIT[businessType] || BUSINESS_TARGET_FIT["카페"];

  let score = 50; // 기본 점수

  // 연령대 적합도 (+0~20점)
  const ageScore = fit.preferredAgeGroups.reduce((sum, age) => {
    const ageKey = age as keyof typeof areaData.ageDistribution;
    return sum + (areaData.ageDistribution[ageKey] || 0);
  }, 0);
  score += Math.min(ageScore * 0.4, 20);

  // 성별 적합도 (+0~10점)
  if (fit.preferredGender === "여성" && areaData.genderRatio.female > 50) {
    score += (areaData.genderRatio.female - 50) * 0.5;
  } else if (fit.preferredGender === "남성" && areaData.genderRatio.male > 50) {
    score += (areaData.genderRatio.male - 50) * 0.5;
  } else if (fit.preferredGender === "무관") {
    score += 5;
  }

  // 상권 유형 적합도 (+0~15점)
  if (fit.preferredAreaTypes.includes(areaData.areaType)) {
    score += 15;
  }

  // 시간대 적합도 (+0~10점)
  const timeScore = fit.preferredTimeSlots.reduce((sum, time) => {
    const timeKey = time as keyof typeof areaData.timeDistribution;
    return sum + (areaData.timeDistribution[timeKey] || 0);
  }, 0);
  score += Math.min(timeScore * 0.2, 10);

  // 점수 범위 조정
  score = Math.min(Math.max(Math.round(score), 0), 100);

  // 타겟 연령층 결정
  const ageLabels: Record<string, string> = {
    teens: "10대",
    twenties: "20대",
    thirties: "30대",
    forties: "40대",
    fiftyPlus: "50대 이상",
  };
  const targetAge = fit.preferredAgeGroups.map((a) => ageLabels[a]).join(", ");

  // 추천 메시지
  let recommendation: string;
  if (score >= 80) {
    recommendation = "이 상권은 해당 업종에 매우 적합합니다";
  } else if (score >= 60) {
    recommendation = "이 상권은 해당 업종에 적합한 편입니다";
  } else if (score >= 40) {
    recommendation = "이 상권은 해당 업종에 보통 수준입니다";
  } else {
    recommendation = "이 상권은 해당 업종에 다소 불리할 수 있습니다";
  }

  return {
    score,
    targetAge,
    peakHours: areaData.peakHours.join(", "),
    recommendation,
  };
}

// 위치명 별칭 매핑 (다양한 표현 → 표준 상권명)
export const LOCATION_ALIASES: Record<string, string> = {
  // 홍대 계열
  홍대: "홍대입구",
  홍대역: "홍대입구",
  홍익대: "홍대입구",
  홍익대학교: "홍대입구",
  상수: "홍대입구",
  상수역: "홍대입구",
  합정: "홍대입구",

  // 강남 계열
  강남: "강남역",
  "강남구 역삼동": "강남역",
  역삼: "강남역",
  역삼역: "강남역",

  // 건대 계열
  건대: "건대입구",
  건대역: "건대입구",
  건국대: "건대입구",
  건국대학교: "건대입구",

  // 신촌 계열
  신촌역: "신촌",
  연세대: "신촌",
  연세대학교: "신촌",
  이대: "신촌",
  이화여대: "신촌",

  // 잠실 계열
  잠실역: "잠실",
  잠실새내: "잠실",
  송파: "잠실",
  롯데월드: "잠실",

  // 명동 계열
  명동역: "명동",
  을지로: "명동",
  충무로: "명동",

  // 이태원 계열
  이태원역: "이태원",
  경리단길: "이태원",
  해방촌: "이태원",

  // 여의도 계열
  여의도역: "여의도",
  여의나루: "여의도",
  국회의사당: "여의도",

  // 서울역 계열
  서울역광장: "서울역",
  남대문: "서울역",
  남대문시장: "서울역",

  // 판교 계열
  판교역: "판교",
  판교테크노밸리: "판교",

  // 해운대 계열
  해운대역: "해운대",
  해운대해수욕장: "해운대",
  마린시티: "해운대",

  // 서면 계열
  서면역: "서면",
  부산서면: "서면",
};

// 상권명 정규화 (별칭 + 부분 일치 허용)
export function findAreaData(locationName: string): AreaPopulationData | null {
  const normalized = locationName.replace(/\s/g, "").toLowerCase();

  // 1. 별칭 매핑 확인
  for (const [alias, standardName] of Object.entries(LOCATION_ALIASES)) {
    if (normalized.includes(alias.replace(/\s/g, "").toLowerCase())) {
      const data = MAJOR_AREA_DATA[standardName];
      if (data) return data;
    }
  }

  // 2. 정확한 매칭 시도
  for (const [key, data] of Object.entries(MAJOR_AREA_DATA)) {
    if (normalized.includes(key.replace(/\s/g, "").toLowerCase())) {
      return data;
    }
  }

  return null;
}

// 상권 유형 추론
export function inferAreaType(
  locationName: string
): "역세권" | "대학가" | "오피스" | "주거지역" | "관광지" | "유흥가" | "복합" {
  const lower = locationName.toLowerCase();

  if (lower.includes("역") || lower.includes("station")) return "역세권";
  if (lower.includes("대학") || lower.includes("학교") || lower.includes("캠퍼스")) return "대학가";
  if (
    lower.includes("오피스") ||
    lower.includes("빌딩") ||
    lower.includes("센터") ||
    lower.includes("테크노")
  )
    return "오피스";
  if (
    lower.includes("아파트") ||
    lower.includes("주공") ||
    lower.includes("동") ||
    lower.includes("마을")
  )
    return "주거지역";
  if (
    lower.includes("해변") ||
    lower.includes("관광") ||
    lower.includes("공원") ||
    lower.includes("명소")
  )
    return "관광지";
  if (lower.includes("유흥") || lower.includes("클럽") || lower.includes("바")) return "유흥가";

  return "복합";
}
