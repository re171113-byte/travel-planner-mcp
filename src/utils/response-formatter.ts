// 응답 포맷터 - JSON을 읽기 좋은 텍스트로 변환

import type {
  ApiResult,
  CommercialAreaData,
  CompetitorAnalysis,
  PolicyFundRecommendation,
  StartupChecklist,
  BusinessTrends,
} from "../types.js";

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
    ``,
    `🏆 주변 경쟁업체 TOP ${d.competitors.length}`,
  ];

  d.competitors.forEach((c, i) => {
    lines.push(`   ${i + 1}. ${c.name}`);
    lines.push(`      📍 ${c.address} (${c.distance}m)`);
    if (c.phone) lines.push(`      📞 ${c.phone}`);
  });

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
    lines.push(`     발급: ${l.authority} | 소요: ${l.processingDays}일`);
    if (l.documents && l.documents.length > 0) {
      lines.push(`     서류: ${l.documents.join(", ")}`);
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

  return lines.join("\n");
}
