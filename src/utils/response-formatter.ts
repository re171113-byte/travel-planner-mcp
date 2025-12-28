// 응답 포맷터 - JSON을 읽기 좋은 텍스트로 변환

import type {
  ApiResult,
  CommercialAreaData,
  CompetitorAnalysis,
  PolicyFundRecommendation,
  StartupChecklist,
  BusinessTrends,
  StartupCostAnalysis,
  BreakevenAnalysis,
  PopulationAnalysis,
} from "../types.js";
import type { CommercialAreaComparison } from "../tools/commercial-area.js";
import type { NearbyFacilitiesAnalysis } from "../tools/nearby-facilities.js";
import type { RentEstimateAnalysis } from "../tools/rent-estimate.js";
import type { RevenueSimulation } from "../tools/revenue-simulation.js";

// 상권 분석 결과 포맷
export function formatCommercialArea(result: ApiResult<CommercialAreaData>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `📊 ${d.location.name} 상권 분석 리포트`,
    ``,
    `📍 위치: ${d.location.address}`,
    `🏪 상권 유형: ${d.areaType}`,
    ``,
    `📈 포화도 분석`,
    `   • 포화도 점수: ${d.density.saturationScore}% (${d.density.saturationLevel})`,
    `   • 동종 업종: ${d.density.sameCategoryCount}개`,
    `   • 전체 상가: ${d.density.totalStores}개`,
    ``,
    `🏷️ 업종별 현황`,
  ];

  for (const [category, count] of Object.entries(d.density.categoryBreakdown)) {
    lines.push(`   • ${category}: ${count}개`);
  }

  lines.push(``);
  lines.push(`✨ 상권 특성`);
  for (const char of d.characteristics) {
    lines.push(`   • ${char}`);
  }

  lines.push(``);
  lines.push(`💡 추천`);
  lines.push(`   ${d.recommendation}`);

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
  }

  return lines.join("\n");
}

// 경쟁업체 분석 결과 포맷
export function formatCompetitors(result: ApiResult<CompetitorAnalysis>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `🏪 ${d.location} 경쟁업체 분석`,
    ``,
    `📊 경쟁 현황`,
    `   • 총 경쟁업체: ${d.analysis.totalCount}개`,
    `   • 프랜차이즈 비율: ${d.analysis.franchiseRatio}%`,
    `   • 시장 진입 여지: ${d.analysis.marketGap}`,
  ];

  // 세부 업종 분포 (SEMAS 데이터)
  if (d.analysis.topCategories && d.analysis.topCategories.length > 0) {
    lines.push(``);
    lines.push(`📈 세부 업종 분포`);
    d.analysis.topCategories.forEach((cat) => {
      lines.push(`   • ${cat.name}: ${cat.count}개`);
    });
  }

  lines.push(``);
  lines.push(`🏆 주변 경쟁업체 TOP ${d.competitors.length}`);

  d.competitors.forEach((c, i) => {
    lines.push(`   ${i + 1}. ${c.name}`);
    const distanceInfo = c.distance > 0 ? ` (${c.distance}m)` : "";
    lines.push(`      📍 ${c.address}${distanceInfo}`);
    if (c.phone) lines.push(`      📞 ${c.phone}`);
  });

  // 인사이트 표시
  if (d.analysis.insights && d.analysis.insights.length > 0) {
    lines.push(``);
    lines.push(`💡 인사이트`);
    d.analysis.insights.forEach((insight) => {
      lines.push(`   • ${insight}`);
    });
  }

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 정책지원금 결과 포맷
export function formatPolicyFunds(result: ApiResult<PolicyFundRecommendation>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `💰 맞춤 정책지원금 추천`,
    ``,
    `👤 신청자 조건`,
    `   • 업종: ${d.userProfile.businessType}`,
    `   • 단계: ${d.userProfile.stage}`,
    `   • 지역: ${d.userProfile.region}`,
  ];

  if (d.userProfile.founderType) {
    lines.push(`   • 유형: ${d.userProfile.founderType}`);
  }

  lines.push(``);
  lines.push(`📋 추천 지원금 ${d.totalCount}건`);

  d.matchedFunds.forEach((f, i) => {
    lines.push(``);
    lines.push(`${i + 1}. ${f.name}`);
    lines.push(`   💵 지원금액: ${f.amount}`);
    lines.push(`   🏛️ 지원기관: ${f.organization}`);
    lines.push(`   📌 유형: ${f.type}`);
    if (f.deadline) {
      lines.push(`   📅 신청기간: ${f.deadline}`);
    }
    lines.push(`   ✅ 자격요건: ${f.requirements.join(", ")}`);
    lines.push(`   🔗 신청: ${f.applyUrl}`);
  });

  lines.push(``);
  lines.push(`💡 TIP`);
  lines.push(`   ${d.tip}`);

  // 페이지네이션 정보 표시
  if (d.pagination) {
    lines.push(``);
    lines.push(`📄 페이지 정보`);
    lines.push(`   • 현재 페이지: ${d.pagination.page}/${d.pagination.totalPages}`);
    lines.push(`   • 전체 ${d.totalCount}건 중 ${d.matchedFunds.length}건 표시`);
    if (d.pagination.hasNextPage) {
      lines.push(`   • 다음 페이지가 있습니다 (page=${d.pagination.page + 1})`);
    }
  }

  lines.push(``);
  lines.push(`⚠️ 참고: 최신 지원금 정보는 기업마당(bizinfo.go.kr)에서 확인하세요.`);

  return lines.join("\n");
}

// 창업 체크리스트 포맷
export function formatChecklist(result: ApiResult<StartupChecklist>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `📋 ${d.businessType} 창업 체크리스트`,
    ``,
    `💰 예상 비용`,
    `   • 최소: ${(d.estimatedCost.min / 10000).toLocaleString()}만원`,
    `   • 최대: ${(d.estimatedCost.max / 10000).toLocaleString()}만원`,
    ``,
    `📊 비용 상세`,
  ];

  for (const [item, cost] of Object.entries(d.estimatedCost.breakdown)) {
    lines.push(`   • ${item}: ${(cost / 10000).toLocaleString()}만원`);
  }

  lines.push(``);
  lines.push(`📜 필요 인허가`);

  d.licenses.forEach((l) => {
    const status = l.required ? "필수" : "선택";
    lines.push(`   • [${status}] ${l.name}`);
    let infoLine = `     발급: ${l.authority} | 소요: ${l.processingDays}일`;
    if (l.fee && l.fee > 0) {
      infoLine += ` | 수수료: ${l.fee.toLocaleString()}원`;
    }
    lines.push(infoLine);
    if (l.documents && l.documents.length > 0) {
      lines.push(`     서류: ${l.documents.join(", ")}`);
    }
    if (l.note) {
      lines.push(`     참고: ${l.note}`);
    }
  });

  lines.push(``);
  lines.push(`✅ 준비 체크리스트`);

  d.checklist.forEach((item) => {
    lines.push(`   ☐ ${item}`);
  });

  lines.push(``);
  lines.push(`💡 창업 TIP`);
  d.tips.forEach((tip) => {
    lines.push(`   • ${tip}`);
  });

  return lines.join("\n");
}

// 창업 트렌드 포맷
export function formatTrends(result: ApiResult<BusinessTrends>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `📈 창업 트렌드 리포트 (${d.period})`,
    ``,
    `📍 지역: ${d.region}`,
    ``,
    `🔥 성장 업종 TOP ${d.rising.length}`,
  ];

  d.rising.forEach((t, i) => {
    lines.push(`   ${i + 1}. ${t.name} (+${t.growthRate}%)`);
    lines.push(`      현재 ${t.count.toLocaleString()}개 운영 중`);
  });

  lines.push(``);
  lines.push(`📉 하락 업종`);

  d.declining.forEach((t, i) => {
    lines.push(`   ${i + 1}. ${t.name} (${t.growthRate}%)`);
    lines.push(`      현재 ${t.count.toLocaleString()}개 운영 중`);
  });

  lines.push(``);
  lines.push(`💡 트렌드 인사이트`);
  d.insights.forEach((insight) => {
    lines.push(`   • ${insight}`);
  });

  lines.push(``);
  lines.push(`🎯 추천`);
  lines.push(`   ${d.recommendation}`);

  lines.push(``);
  lines.push(`⚠️ 참고: 통계 기반 추정치이며, 실제 창업 결정 시 공식 출처(소상공인마당, 통계청) 확인을 권장합니다.`);

  return lines.join("\n");
}

// 상권 비교 분석 결과 포맷
export function formatComparison(result: ApiResult<CommercialAreaComparison>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `📊 상권 비교 분석 리포트`,
    ``,
    `🏆 종합 순위`,
  ];

  d.ranking.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    const status = r.recommendation === "추천" ? "✅" : r.recommendation === "보통" ? "⚠️" : "❌";
    lines.push(`   ${medal} ${r.location}: ${r.score}점 ${status} ${r.recommendation}`);
  });

  lines.push(``);
  lines.push(`📍 지역별 상세 분석`);

  d.locations.forEach((loc) => {
    lines.push(``);
    lines.push(`▸ ${loc.location.name}`);
    lines.push(`   • 상권 유형: ${loc.areaType}`);
    lines.push(`   • 포화도: ${loc.density.saturationScore}% (${loc.density.saturationLevel})`);
    lines.push(`   • 동종 업종: ${loc.density.sameCategoryCount}개`);
    lines.push(`   • 전체 상가: ${loc.density.totalStores}개`);
  });

  lines.push(``);
  lines.push(`📝 분석 요약`);
  lines.push(d.summary);

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 창업 비용 분석 결과 포맷
export function formatStartupCost(result: ApiResult<StartupCostAnalysis>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `💰 ${d.businessType} 창업 비용 분석`,
    ``,
    `📍 조건`,
    `   • 지역: ${d.region}`,
    `   • 규모: ${d.size}평`,
    `   • 인테리어: ${d.premiumLevel}`,
    ``,
    `💵 총 예상 비용`,
    `   • 최소: ${d.totalCost.min.toLocaleString()}만원`,
    `   • 예상: ${d.totalCost.estimated.toLocaleString()}만원`,
    `   • 최대: ${d.totalCost.max.toLocaleString()}만원`,
    ``,
    `📊 비용 상세 내역`,
    `   • 보증금: ${d.breakdown.deposit.toLocaleString()}만원`,
    `   • 인테리어: ${d.breakdown.interior.toLocaleString()}만원`,
    `   • 장비/설비: ${d.breakdown.equipment.toLocaleString()}만원`,
    `   • 초기 재고: ${d.breakdown.initialInventory.toLocaleString()}만원`,
    `   • 운영자금(6개월): ${d.breakdown.operatingFund.toLocaleString()}만원`,
    `   • 기타(인허가/마케팅): ${d.breakdown.other.toLocaleString()}만원`,
    ``,
    `📌 지역 특성`,
    `   ${d.regionalNote}`,
    ``,
    `💡 비용 절감 TIP`,
  ];

  d.tips.forEach((tip) => {
    lines.push(`   • ${tip}`);
  });

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 손익분기점 분석 결과 포맷
export function formatBreakeven(result: ApiResult<BreakevenAnalysis>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const achievabilityEmoji = d.breakeven.achievability === "쉬움" ? "✅" : d.breakeven.achievability === "보통" ? "⚠️" : "❌";

  const lines = [
    `📈 ${d.businessType} 손익분기점 분석`,
    ``,
    `📍 조건`,
    `   • 지역: ${d.region}`,
    `   • 규모: ${d.size}평`,
    `   • 객단가: ${d.breakeven.averagePrice.toLocaleString()}원`,
    ``,
    `💸 월 고정비 구조`,
    `   • 임대료: ${d.costs.breakdown.rent.toLocaleString()}만원`,
    `   • 인건비: ${d.costs.breakdown.labor.toLocaleString()}만원`,
    `   • 공과금: ${d.costs.breakdown.utilities.toLocaleString()}만원`,
    `   • 기타: ${d.costs.breakdown.other.toLocaleString()}만원`,
    `   • 합계: ${d.costs.fixedMonthly.toLocaleString()}만원/월`,
    ``,
    `📊 원가율: ${(d.costs.variableRatio * 100).toFixed(0)}%`,
    ``,
    `🎯 손익분기점`,
    `   • 월 필요 매출: ${d.breakeven.monthlySales.toLocaleString()}만원`,
    `   • 일 필요 매출: ${d.breakeven.dailySales.toLocaleString()}만원`,
    `   • 일 필요 고객: ${d.breakeven.dailyCustomers}명`,
    `   • 달성 가능성: ${achievabilityEmoji} ${d.breakeven.achievability}`,
    ``,
    `📉 수익 시나리오`,
    `   비관적 (매출 ${(d.scenarios.pessimistic.monthlySales / 10000).toFixed(0)}만원)`,
    `      → 월 수익: ${d.scenarios.pessimistic.monthlyProfit.toLocaleString()}만원`,
    `   현실적 (매출 ${(d.scenarios.realistic.monthlySales / 10000).toFixed(0)}만원)`,
    `      → 월 수익: ${d.scenarios.realistic.monthlyProfit.toLocaleString()}만원`,
    `   낙관적 (매출 ${(d.scenarios.optimistic.monthlySales / 10000).toFixed(0)}만원)`,
    `      → 월 수익: ${d.scenarios.optimistic.monthlyProfit.toLocaleString()}만원`,
    ``,
    `⏱️ 투자 회수 기간`,
    `   • 투자금: ${d.paybackPeriod.investmentAmount.toLocaleString()}만원`,
    `   • 예상 회수: ${d.paybackPeriod.months > 100 ? "회수 어려움" : `약 ${d.paybackPeriod.months}개월`}`,
    `   • 평가: ${d.paybackPeriod.note}`,
    ``,
    `💡 인사이트`,
  ];

  d.insights.forEach((insight) => {
    lines.push(`   • ${insight}`);
  });

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 상권 인구 분석 결과 포맷
export function formatPopulation(result: ApiResult<PopulationAnalysis>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `👥 ${d.location.name} 상권 인구 분석`,
    ``,
    `📍 위치: ${d.location.address}`,
    ``,
    `📊 인구 현황 (일 평균)`,
    `   • 총 유동인구: ${d.population.total.toLocaleString()}명`,
    `   • 거주인구: ${d.population.residential.toLocaleString()}명`,
    `   • 직장인구: ${d.population.working.toLocaleString()}명`,
    `   • 유동인구: ${d.population.floating.toLocaleString()}명`,
    ``,
    `⏰ 시간대별 분포`,
    `   • 오전(06-11시): ${d.timeDistribution.morning}%`,
    `   • 점심(11-14시): ${d.timeDistribution.lunch}%`,
    `   • 오후(14-18시): ${d.timeDistribution.afternoon}%`,
    `   • 저녁(18-22시): ${d.timeDistribution.evening}%`,
    `   • 야간(22-06시): ${d.timeDistribution.night}%`,
    ``,
    `👤 연령대별 분포`,
    `   • 10대: ${d.ageDistribution.teens}%`,
    `   • 20대: ${d.ageDistribution.twenties}%`,
    `   • 30대: ${d.ageDistribution.thirties}%`,
    `   • 40대: ${d.ageDistribution.forties}%`,
    `   • 50대+: ${d.ageDistribution.fiftyPlus}%`,
    ``,
    `⚧️ 성별 비율`,
    `   • 남성: ${d.genderRatio.male}%`,
    `   • 여성: ${d.genderRatio.female}%`,
  ];

  if (d.businessFit) {
    lines.push(``);
    lines.push(`🎯 업종 적합도`);
    lines.push(`   • 적합도 점수: ${d.businessFit.score}점/100점`);
    lines.push(`   • 주요 타겟층: ${d.businessFit.targetAge}`);
    lines.push(`   • 피크 시간대: ${d.businessFit.peakHours}`);
    lines.push(`   • 평가: ${d.businessFit.recommendation}`);
  }

  lines.push(``);
  lines.push(`✨ 상권 특성`);
  d.characteristics.forEach((char) => {
    lines.push(`   • ${char}`);
  });

  lines.push(``);
  lines.push(`💡 인사이트`);
  d.insights.forEach((insight) => {
    lines.push(`   • ${insight}`);
  });

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 주변 편의시설 분석 결과 포맷
export function formatNearbyFacilities(result: ApiResult<NearbyFacilitiesAnalysis>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `🏢 ${d.location.name} 주변 편의시설 분석`,
    ``,
    `📍 분석 조건`,
    `   • 위치: ${d.location.name}`,
    `   • 반경: ${d.radius}m`,
    ``,
    `📊 편의시설 현황 (총 ${d.summary.totalCount}개)`,
    `   • 접근성 등급: ${d.summary.accessibility}`,
    ``,
    `🏗️ 시설별 상세`,
  ];

  for (const facility of d.facilities) {
    if (facility.count > 0) {
      lines.push(``);
      lines.push(`▸ ${facility.category} (${facility.count}개)`);
      facility.items.slice(0, 3).forEach((item) => {
        lines.push(`   • ${item.name} - ${item.distance}`);
      });
    }
  }

  if (d.summary.highlights.length > 0) {
    lines.push(``);
    lines.push(`⭐ 주요 시설 (가장 가까운)`);
    d.summary.highlights.forEach((highlight) => {
      lines.push(`   • ${highlight}`);
    });
  }

  lines.push(``);
  lines.push(`💡 입지 인사이트`);
  d.insights.forEach((insight) => {
    lines.push(`   ${insight}`);
  });

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 임대료 시세 분석 결과 포맷
export function formatRentEstimate(result: ApiResult<RentEstimateAnalysis>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `🏠 ${d.location.name} 임대료 시세 분석`,
    ``,
    `📍 조건`,
    `   • 지역: ${d.location.region}`,
    `   • 규모: ${d.conditions.size}평`,
    `   • 층수: ${d.conditions.floor}`,
    `   • 건물유형: ${d.conditions.buildingType}`,
    ``,
    `💰 보증금 추정`,
    `   • 최소: ${d.estimate.deposit.min.toLocaleString()}만원`,
    `   • 평균: ${d.estimate.deposit.average.toLocaleString()}만원`,
    `   • 최대: ${d.estimate.deposit.max.toLocaleString()}만원`,
    ``,
    `📅 월 임대료 추정`,
    `   • 최소: ${d.estimate.monthlyRent.min.toLocaleString()}만원`,
    `   • 평균: ${d.estimate.monthlyRent.average.toLocaleString()}만원`,
    `   • 최대: ${d.estimate.monthlyRent.max.toLocaleString()}만원`,
    ``,
    `🧾 월 총 비용`,
    `   • 관리비: 약 ${d.estimate.managementFee.toLocaleString()}만원`,
    `   • 총액: 약 ${d.estimate.totalMonthlyCost.toLocaleString()}만원/월`,
    ``,
    `📊 시세 비교`,
    `   • ${d.comparison.vsSeoul}`,
    `   • ${d.comparison.vsRegionAverage}`,
  ];

  lines.push(``);
  lines.push(`💡 인사이트`);
  d.insights.forEach((insight) => {
    lines.push(`   ${insight}`);
  });

  lines.push(``);
  lines.push(`✨ 비용 절감 TIP`);
  d.tips.forEach((tip) => {
    lines.push(`   • ${tip}`);
  });

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}

// 매출 시뮬레이션 결과 포맷
export function formatRevenueSimulation(result: ApiResult<RevenueSimulation>): string {
  if (!result.success) {
    return `❌ 오류: ${result.error?.message}\n💡 ${result.error?.suggestion || ""}`;
  }

  const d = result.data!;
  const lines = [
    `📈 ${d.businessType} 매출 시뮬레이션 (${d.region})`,
    ``,
    `📍 운영 조건`,
    `   • 규모: ${d.conditions.size}평`,
    `   • 인력: ${d.conditions.staffCount}인`,
    `   • 운영시간: ${d.conditions.operatingHours}시간/일`,
    ``,
    `💰 일 매출 예상`,
    `   • 최소: ${d.dailyRevenue.min.toLocaleString()}만원`,
    `   • 평균: ${d.dailyRevenue.average.toLocaleString()}만원`,
    `   • 최대: ${d.dailyRevenue.max.toLocaleString()}만원`,
    ``,
    `📅 월 매출 예상 (26일 영업 기준)`,
    `   • 최소: ${d.monthlyRevenue.min.toLocaleString()}만원`,
    `   • 평균: ${d.monthlyRevenue.average.toLocaleString()}만원`,
    `   • 최대: ${d.monthlyRevenue.max.toLocaleString()}만원`,
    ``,
    `📆 연 매출 예상`,
    `   • 최소: ${d.yearlyRevenue.min.toLocaleString()}만원`,
    `   • 평균: ${d.yearlyRevenue.average.toLocaleString()}만원`,
    `   • 최대: ${d.yearlyRevenue.max.toLocaleString()}만원`,
    ``,
    `👥 고객 분석`,
    `   • 일 평균 고객수: ${d.customerAnalysis.dailyCustomers}명`,
    `   • 평균 객단가: ${d.customerAnalysis.averagePrice.toLocaleString()}원`,
    `   • 피크 시간대: ${d.customerAnalysis.peakHours}`,
    `   • 피크 요일: ${d.customerAnalysis.peakDays}`,
    ``,
    `🌡️ 계절별 월 매출 변동`,
    `   • 봄: ${d.seasonalVariation.spring.toLocaleString()}만원`,
    `   • 여름: ${d.seasonalVariation.summer.toLocaleString()}만원`,
    `   • 가을: ${d.seasonalVariation.fall.toLocaleString()}만원`,
    `   • 겨울: ${d.seasonalVariation.winter.toLocaleString()}만원`,
    ``,
    `💵 수익 추정`,
    `   • 월 순이익: 약 ${d.profitEstimate.monthlyProfit.toLocaleString()}만원`,
    `   • 마진율: ${d.profitEstimate.profitMargin}%`,
    `   • ${d.profitEstimate.note}`,
  ];

  lines.push(``);
  lines.push(`💡 인사이트`);
  d.insights.forEach((insight) => {
    lines.push(`   ${insight}`);
  });

  if (result.meta) {
    lines.push(``);
    lines.push(`📅 데이터 출처: ${result.meta.source}`);
    if (result.meta.dataNote) {
      lines.push(`📌 ${result.meta.dataNote}`);
    }
  }

  return lines.join("\n");
}
