# 🚀 Startup Helper MCP

<div align="center">

**AI 창업 컨설턴트 - 상권분석부터 정책지원금까지 창업의 모든 것**

[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://startup-helper-mcp.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)

> "창업 준비, 4개 사이트 돌아다니지 마세요. 한 번의 대화로 끝내세요."

[데모 보기](#-데모) • [설치하기](#-설치-및-실행) • [사용법](#-사용-예시)

</div>

---

## 🎯 왜 만들었나요?

### 창업 준비의 현실

예비 창업자 김청년(29세)씨의 하루:

```
09:00 - 상권정보시스템에서 강남역 상권 검색... 회원가입 필요
10:00 - 카카오맵에서 경쟁 카페 하나하나 세기... 23개째...
11:00 - 기업마당에서 청년 창업 지원금 검색... 뭐가 이렇게 많아?
12:00 - 구청 홈페이지에서 카페 인허가 절차 확인... 어디있지?
13:00 - 아직 점심도 못 먹었는데 정보는 반도 못 모음...
```

**4개 사이트, 반나절, 그래도 부족한 정보.**

---

## ✨ Startup Helper MCP를 쓰면

```
사용자: "나 29살인데 강남역에서 카페 창업하려고 해. 자본금 5천만원 있어."

AI: [9개 Tool 자동 호출]

📊 강남역 카페 창업 종합 리포트

1️⃣ 트렌드: 일반 카페 -5% 하락세, 스터디카페 +15% 상승
2️⃣ 상권: 발달상권, 카페 포화도 87% (높음)
3️⃣ 경쟁: 반경 300m 카페 23개, 프랜차이즈 65%
4️⃣ 지원금: 청년창업사관학교 최대 1억, 서울시 청년창업 3천만원
5️⃣ 인허가: 영업신고증, 위생교육, 소방점검 필요

💡 종합: 강남역은 포화 상태. 논현역 방면(포화도 62%) 검토 추천
```

**한 번의 대화, 5분, 완벽한 분석.**

---

## 📊 Before vs After

| 구분 | 기존 방식 | Startup Helper MCP |
|------|----------|-------------------|
| **소요 시간** | 반나절~하루 | 5분 |
| **필요 사이트** | 4개+ | 0개 (대화만) |
| **정보 통합** | 직접 종합 | AI가 자동 분석 |
| **맞춤 추천** | 없음 | 조건별 맞춤 제공 |
| **인사이트** | 데이터만 | 액션 가이드 포함 |

---

## 🛠️ 제공 Tool (9개)

### 📊 상권 분석 도구

#### 1. `analyze_commercial_area` - 상권 분석
특정 위치의 상권을 분석합니다. 업종별 밀집도, 포화도, 상권 특성을 제공합니다.

```json
{ "location": "강남역", "business_type": "카페", "radius": 500 }
```

#### 2. `compare_commercial_areas` - 상권 비교 (신규)
여러 지역의 상권을 비교 분석합니다. 어떤 지역이 창업에 더 적합한지 순위를 제공합니다.

```json
{ "locations": ["강남역", "홍대입구", "건대입구"], "business_type": "카페" }
```

#### 3. `analyze_population` - 상권 인구 분석 (신규)
상권의 유동인구, 연령대, 성별, 시간대별 분포를 분석합니다. 업종 적합도 점수 제공.

```json
{ "location": "강남역", "business_type": "카페", "radius": 500 }
```

### 🔍 경쟁 분석 도구

#### 4. `find_competitors` - 경쟁업체 검색
주변 경쟁업체를 검색하고 분석합니다. SEMAS API 실시간 데이터 연동.

```json
{ "location": "홍대입구", "business_type": "음식점", "radius": 300 }
```

### 💰 비용/수익성 분석 도구

#### 5. `calculate_startup_cost` - 창업 비용 계산기 (신규)
업종별, 지역별, 규모별 예상 창업 비용을 계산합니다.

```json
{ "business_type": "카페", "region": "강남", "size": 15, "premium_level": "standard" }
```

#### 6. `analyze_breakeven` - 손익분기점 분석 (신규)
월 필요 매출, 일 필요 고객수, 투자 회수 기간, 수익 시나리오를 분석합니다.

```json
{ "business_type": "카페", "region": "강남", "monthly_rent": 300, "size": 15 }
```

### 📋 창업 준비 도구

#### 7. `get_startup_checklist` - 창업 체크리스트
업종별 필요 인허가, 예상 비용, 준비 순서를 안내합니다. 실시간 상권 경쟁 데이터 포함.

```json
{ "business_type": "음식점", "region": "서울" }
```

#### 8. `recommend_policy_funds` - 정책지원금 추천
창업자 조건에 맞는 정부/지자체 정책지원금을 추천합니다. 기업마당 API 연동.

```json
{ "business_type": "카페", "stage": "예비창업", "region": "서울", "founder_type": "청년" }
```

#### 9. `get_business_trends` - 창업 트렌드
최근 창업 트렌드와 업종별 성장/쇠퇴 현황을 분석합니다. SEMAS 실시간 데이터.

```json
{ "region": "전국", "category": "카페", "period": "6months" }
```

---

## 💬 사용 예시

### 예시 1: 청년 카페 창업
```
"나 29살인데 강남역에서 카페 창업하려는데 분석해줘"
→ 트렌드 + 상권 + 경쟁 + 지원금 + 체크리스트 종합 분석
```

### 예시 2: 업종 고민
```
"요즘 뭐 창업하면 잘돼?"
→ 성장 업종 TOP 7, 하락 업종, 트렌드 인사이트
```

### 예시 3: 지원금 검색
```
"청년 창업 지원금 뭐 있어?"
→ 조건별 맞춤 지원금 추천
```

### 예시 4: 경쟁 분석
```
"홍대 근처 음식점 경쟁 어때?"
→ 경쟁업체 수, 프랜차이즈 비율, 진입 여지 분석
```

---

## 🎯 타겟 사용자

| 페르소나 | 니즈 | Startup Helper가 주는 가치 |
|---------|------|---------------------------|
| **예비 창업자** | 어디서 뭘 해야 할지 모름 | 원스톱 정보 + 가이드 |
| **소상공인** | 상권 이동/업종 전환 고민 | 데이터 기반 의사결정 |
| **창업 컨설턴트** | 고객 상담 자료 필요 | 빠른 리서치 자동화 |
| **프랜차이즈 본사** | 신규 입점 후보지 분석 | 상권 스크리닝 |

---

## ☁️ 배포

### Render (현재 운영 중)
```
https://startup-helper-mcp.onrender.com
```

### 로컬 설치
```bash
# 설치
pnpm install

# 환경 변수 설정
echo "KAKAO_API_KEY=your_key" > .env

# 실행
pnpm dev        # stdio 모드
pnpm dev:http   # HTTP/SSE 모드
```

### Claude Desktop 연동
`%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "startup-helper": {
      "url": "https://startup-helper-mcp.onrender.com/sse"
    }
  }
}
```

---

## 🔑 사용 API

| API | 용도 | 데이터 |
|-----|------|--------|
| **카카오맵 로컬 API** | 장소 검색, 좌표 변환, 경쟁업체 검색 | 실시간 |
| **소상공인마당 SEMAS API** | 상권정보, 업종별 점포 수, 경쟁 분석 | 실시간 |
| 기업마당 API | 정책지원금 검색 | 준실시간 |

> 📌 API 캐싱 시스템 적용: 동일 요청 5분간 캐시하여 응답 속도 향상

---

## 📁 프로젝트 구조

```
src/
├── index.ts                 # MCP 서버 (stdio + HTTP/SSE)
├── constants.ts             # 상수 정의
├── types.ts                 # TypeScript 타입
├── api/
│   ├── kakao-api.ts         # 카카오맵 API (캐싱 적용)
│   ├── semas-api.ts         # 소상공인마당 SEMAS API
│   └── bizinfo-api.ts       # 기업마당 API
├── data/
│   ├── startup-cost-data.ts # 창업 비용 데이터
│   ├── breakeven-data.ts    # 손익분기점 벤치마크
│   └── population-data.ts   # 상권 인구 데이터
├── tools/
│   ├── commercial-area.ts   # 상권 분석
│   ├── competitors.ts       # 경쟁업체 검색 (SEMAS 연동)
│   ├── policy-funds.ts      # 정책지원금 추천
│   ├── startup-checklist.ts # 창업 체크리스트
│   ├── business-trends.ts   # 창업 트렌드
│   ├── startup-cost.ts      # 창업 비용 계산기
│   ├── breakeven.ts         # 손익분기점 분석
│   └── population.ts        # 상권 인구 분석
├── utils/
│   ├── response-formatter.ts # 응답 포맷터
│   └── cache.ts             # API 캐시 시스템
└── tests/                   # 테스트 코드 (72개)
```

---

## ✅ 품질

| 항목 | 상태 |
|------|------|
| TypeScript | ✅ 타입 안전 |
| ESLint | ✅ 코드 품질 |
| Vitest | ✅ 72개 테스트 통과 |
| Rate Limiting | ✅ 100 req/min |
| Error Handling | ✅ 한글 에러 메시지 |
| Graceful Shutdown | ✅ SIGTERM/SIGINT |

---

## 🏆 차별화 포인트

1. **원스톱 솔루션** - 4개 사이트 정보를 한 번의 대화로
2. **카카오 + SEMAS 연동** - 카카오맵 + 소상공인마당 실시간 데이터
3. **수익성 분석** - 손익분기점, 투자회수기간 계산
4. **맞춤 추천** - 창업자 조건별 지원금/상권 추천
5. **API 캐싱** - 빠른 응답 + 비용 절감
6. **한글 UX** - 모든 메시지 한글화

---

## 📄 라이선스

MIT License

---

<div align="center">

**Kakao PlayMCP 공모전 출품작**

Made with ❤️ for Korean Entrepreneurs

</div>
