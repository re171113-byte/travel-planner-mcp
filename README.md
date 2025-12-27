# 🚀 Startup Helper MCP

**AI 창업 컨설턴트 - 상권분석부터 정책지원금까지 창업의 모든 것**

> "창업의 모든 질문, 하나의 대화로"

## 📌 소개

Startup Helper MCP는 예비 창업자와 소상공인을 위한 AI 창업 컨설턴트입니다.
카카오맵 API와 공공데이터를 활용하여 **상권분석, 경쟁업체 분석, 정책지원금 추천, 창업 체크리스트, 트렌드 분석**을 한번에 제공합니다.

### 왜 필요한가요?

기존에는 창업 준비를 위해 여러 사이트를 돌아다녀야 했습니다:
- 상권분석: 상권정보시스템
- 경쟁업체: 카카오맵
- 정책지원금: 기업마당
- 인허가 정보: 각 구청 홈페이지

**Startup Helper MCP를 사용하면:**
```
"강남역에서 카페 창업하려는데 분석해줘"
→ 상권분석 + 경쟁업체 + 지원금 + 체크리스트 한번에!
```

## 🛠️ 제공 Tool

### 1. `analyze_commercial_area` - 상권 분석
특정 위치의 상권을 분석합니다. 업종별 밀집도, 포화도, 상권 특성을 제공합니다.

```json
{
  "location": "강남역",
  "business_type": "카페",
  "radius": 500
}
```

### 2. `find_competitors` - 경쟁업체 검색
주변 경쟁업체를 검색하고 프랜차이즈 비율, 시장 진입 여지 등을 분석합니다.

```json
{
  "location": "홍대입구",
  "business_type": "음식점",
  "radius": 300,
  "limit": 10
}
```

### 3. `recommend_policy_funds` - 정책지원금 추천
창업자 조건에 맞는 정부/지자체 정책지원금을 추천합니다.

```json
{
  "business_type": "카페",
  "stage": "예비창업",
  "region": "서울",
  "founder_type": "청년",
  "founder_age": 28
}
```

### 4. `get_startup_checklist` - 창업 체크리스트
업종별 필요 인허가, 예상 비용, 준비 순서를 안내합니다.

```json
{
  "business_type": "음식점",
  "region": "서울"
}
```

### 5. `get_business_trends` - 창업 트렌드
최근 창업 트렌드와 업종별 성장/쇠퇴 현황을 분석합니다.

```json
{
  "region": "전국",
  "category": "카페",
  "period": "6months"
}
```

## 🎯 사용 시나리오

### 시나리오 1: 청년 카페 창업
```
사용자: "나 29살인데 강남역에서 카페 창업하려고 해. 자본금 5천만원 있어."

AI: [5개 Tool 순차 호출]

결과:
📊 강남역 카페 창업 분석 리포트

1️⃣ 트렌드: 일반 카페 -5% 하락세, 스터디카페 +15% 상승세
2️⃣ 상권: 발달상권, 카페 포화도 87% (높음)
3️⃣ 경쟁: 반경 300m 카페 23개, 프랜차이즈 65%
4️⃣ 지원금: 청년창업사관학교 최대 1억, 서울시 청년창업 3천만원
5️⃣ 인허가: 영업신고증, 위생교육, 소방점검 필요

💡 종합: 강남역은 포화 상태. 논현역 방면(포화도 62%) 추천
```

### 시나리오 2: 업종 고민
```
사용자: "요즘 뭐 창업하면 잘될까?"

AI: [get_business_trends 호출]

결과:
🔥 상승 업종: 무인매장 +32%, 반려동물 +28%, 건강식 +18%
📉 하락 업종: 커피전문점 -5%, 치킨 -8%, PC방 -12%
```

## 🔧 설치 및 실행

### 환경 변수 설정
```bash
# .env 파일 생성
KAKAO_API_KEY=your_kakao_api_key
```

### 설치
```bash
pnpm install
```

### 개발 모드 실행
```bash
# stdio 모드
pnpm dev

# HTTP/SSE 모드
pnpm dev:http
```

### 빌드 및 실행
```bash
pnpm build
pnpm start        # stdio 모드
pnpm start:http   # HTTP 모드
```

## 📡 API 엔드포인트 (HTTP 모드)

- `GET /health` - 헬스 체크
- `GET /sse` - SSE 연결
- `POST /messages?sessionId=xxx` - 메시지 전송

## 🔑 사용 API

| API | 용도 | 출처 |
|-----|------|------|
| 카카오맵 로컬 API | 장소 검색, 좌표 변환 | 카카오 개발자센터 |
| 상권정보 API | 업종별 상가 데이터 | 소상공인시장진흥공단 |
| 지원사업 API | 정책지원금 정보 | 기업마당 |

## 📁 프로젝트 구조

```
src/
├── index.ts                 # MCP 서버 메인
├── constants.ts             # 상수 정의
├── types.ts                 # 타입 정의
├── api/
│   └── kakao-api.ts         # 카카오맵 API 클라이언트
├── tools/
│   ├── commercial-area.ts   # 상권 분석
│   ├── competitors.ts       # 경쟁업체 검색
│   ├── policy-funds.ts      # 정책지원금 추천
│   ├── startup-checklist.ts # 창업 체크리스트
│   └── business-trends.ts   # 창업 트렌드
├── utils/
│   └── fetch-with-timeout.ts
└── tests/
    ├── commercial-area.test.ts
    └── policy-funds.test.ts
```

## 🎨 특징

- **원스톱 솔루션**: 4개 사이트 정보를 하나의 대화로
- **카카오 API 중심**: 카카오맵 로컬 API 핵심 활용
- **맥락 기반 분석**: 단순 데이터가 아닌 인사이트 제공
- **실시간 데이터**: 최신 상권/지원금 정보 반영

## 📄 라이선스

MIT License

## 👨‍💻 개발자

Kakao PlayMCP 공모전 출품작
