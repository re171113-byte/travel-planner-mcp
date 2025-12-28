#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { analyzeCommercialArea, compareCommercialAreas } from "./tools/commercial-area.js";
import { findCompetitors } from "./tools/competitors.js";
import { recommendPolicyFunds } from "./tools/policy-funds.js";
import { getStartupChecklist } from "./tools/startup-checklist.js";
import { getBusinessTrends } from "./tools/business-trends.js";
import { calculateStartupCost } from "./tools/startup-cost.js";
import { analyzeBreakeven } from "./tools/breakeven.js";
import { analyzePopulation } from "./tools/population.js";
import { analyzeNearbyFacilities } from "./tools/nearby-facilities.js";
import { estimateRent } from "./tools/rent-estimate.js";
import { simulateRevenue } from "./tools/revenue-simulation.js";
import {
  formatCommercialArea,
  formatCompetitors,
  formatPolicyFunds,
  formatChecklist,
  formatTrends,
  formatComparison,
  formatStartupCost,
  formatBreakeven,
  formatPopulation,
  formatNearbyFacilities,
  formatRentEstimate,
  formatRevenueSimulation,
} from "./utils/response-formatter.js";
import { APP_CONFIG, SERVER_CONFIG } from "./constants.js";

function createServer() {
  const server = new McpServer({
    name: APP_CONFIG.name,
    version: APP_CONFIG.version,
  });

  // Tool 1: 상권 분석
  server.tool(
    "analyze_commercial_area",
    "특정 위치의 상권을 분석합니다. 업종별 밀집도, 포화도, 상권 특성을 제공합니다. 카카오맵 데이터를 기반으로 합니다.",
    {
      location: z.string().describe("분석할 위치 (예: 강남역, 홍대입구, 부산 서면)"),
      business_type: z.string().describe("창업 예정 업종 (예: 카페, 음식점, 편의점, 미용실)"),
      radius: z.number().optional().default(500).describe("분석 반경 (m), 기본값: 500"),
    },
    async ({ location, business_type, radius }) => {
      const result = await analyzeCommercialArea(location, business_type, radius);
      return {
        content: [{ type: "text", text: formatCommercialArea(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 2: 상권 비교 분석 (신규)
  server.tool(
    "compare_commercial_areas",
    "여러 지역의 상권을 비교 분석합니다. 어떤 지역이 창업에 더 적합한지 순위와 점수를 제공합니다.",
    {
      locations: z.array(z.string()).min(2).max(5).describe("비교할 지역 목록 (2~5개, 예: ['강남역', '홍대입구', '건대입구'])"),
      business_type: z.string().describe("창업 예정 업종 (예: 카페, 음식점, 편의점)"),
      radius: z.number().optional().default(500).describe("분석 반경 (m), 기본값: 500"),
    },
    async ({ locations, business_type, radius }) => {
      const result = await compareCommercialAreas(locations, business_type, radius);
      return {
        content: [{ type: "text", text: formatComparison(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 3: 경쟁업체 검색
  server.tool(
    "find_competitors",
    "주변 경쟁업체를 검색하고 분석합니다. 프랜차이즈 비율, 시장 진입 여지 등을 분석합니다.",
    {
      location: z.string().describe("검색할 위치 (예: 강남역, 홍대입구)"),
      business_type: z.string().describe("검색할 업종 (예: 카페, 음식점)"),
      radius: z.number().optional().default(300).describe("검색 반경 (m), 기본값: 300"),
      limit: z.number().optional().default(10).describe("결과 개수, 기본값: 10"),
    },
    async ({ location, business_type, radius, limit }) => {
      const result = await findCompetitors(location, business_type, radius, limit);
      return {
        content: [{ type: "text", text: formatCompetitors(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 4: 정책지원금 추천
  server.tool(
    "recommend_policy_funds",
    "창업자 조건에 맞는 정부/지자체 정책지원금을 추천합니다. 융자, 보조금, 멘토링 프로그램 등을 안내합니다. 정렬, 필터, 페이지네이션을 지원합니다.",
    {
      business_type: z.string().describe("창업 업종 (예: 카페, 음식점, IT서비스)"),
      stage: z.enum(["예비창업", "초기창업", "운영중", "재창업"]).describe("창업 단계"),
      region: z.string().describe("창업 지역 (예: 서울, 경기 성남, 부산)"),
      founder_type: z
        .enum(["청년", "중장년", "여성", "장애인", "일반"])
        .optional()
        .describe("창업자 유형"),
      founder_age: z.number().optional().describe("창업자 나이"),
      sort_by: z
        .enum(["deadline", "amount", "match_score"])
        .optional()
        .describe("정렬 기준 (deadline: 마감일순, amount: 금액순, match_score: 매칭점수순)"),
      filter_type: z
        .enum(["융자", "보조금", "멘토링", "교육", "복합"])
        .optional()
        .describe("지원금 유형 필터"),
      page: z.number().optional().default(1).describe("페이지 번호, 기본값: 1"),
      limit: z.number().optional().default(10).describe("페이지당 결과 수, 기본값: 10"),
    },
    async ({ business_type, stage, region, founder_type, founder_age, sort_by, filter_type, page, limit }) => {
      const result = await recommendPolicyFunds(
        business_type,
        stage,
        region,
        founder_type,
        founder_age,
        { sortBy: sort_by, filterType: filter_type, page, limit }
      );
      return {
        content: [{ type: "text", text: formatPolicyFunds(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 4: 창업 체크리스트
  server.tool(
    "get_startup_checklist",
    "업종별 창업 체크리스트와 필요 인허가를 안내합니다. 예상 비용과 준비 순서도 제공합니다.",
    {
      business_type: z.string().describe("창업 업종 (예: 카페, 음식점, 편의점, 미용실)"),
      region: z.string().optional().describe("창업 지역 (선택)"),
    },
    async ({ business_type, region }) => {
      const result = await getStartupChecklist(business_type, region);
      return {
        content: [{ type: "text", text: formatChecklist(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 5: 창업 트렌드
  server.tool(
    "get_business_trends",
    "최근 창업 트렌드와 업종별 성장/쇠퇴 현황을 분석합니다. 어떤 업종이 뜨고 있는지 알려드립니다.",
    {
      region: z.string().optional().describe("지역 (선택, 예: 서울, 부산, 전국)"),
      category: z.string().optional().describe("관심 업종 카테고리 (선택)"),
      period: z
        .enum(["3months", "6months", "1year"])
        .optional()
        .default("6months")
        .describe("분석 기간, 기본값: 6개월"),
    },
    async ({ region, category, period }) => {
      const result = await getBusinessTrends(region, category, period);
      return {
        content: [{ type: "text", text: formatTrends(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 6: 창업 비용 계산기
  server.tool(
    "calculate_startup_cost",
    "업종별, 지역별, 규모별 예상 창업 비용을 계산합니다. 보증금, 인테리어, 장비, 운영자금 등 상세 내역을 제공합니다.",
    {
      business_type: z.string().describe("창업 업종 (예: 카페, 음식점, 편의점, 미용실, 치킨, 베이커리)"),
      region: z.string().describe("창업 지역 (예: 서울, 강남, 홍대, 부산, 경기)"),
      size: z.number().optional().default(15).describe("매장 크기 (평수), 기본값: 15평"),
      premium_level: z
        .enum(["basic", "standard", "premium"])
        .optional()
        .default("standard")
        .describe("인테리어 수준 (basic: 기본, standard: 중급, premium: 고급)"),
    },
    async ({ business_type, region, size, premium_level }) => {
      const result = await calculateStartupCost(business_type, region, size, premium_level);
      return {
        content: [{ type: "text", text: formatStartupCost(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 7: 손익분기점 분석
  server.tool(
    "analyze_breakeven",
    "업종별 손익분기점을 분석합니다. 월 필요 매출, 일 필요 고객수, 투자 회수 기간, 수익 시나리오를 제공합니다.",
    {
      business_type: z.string().describe("창업 업종 (예: 카페, 음식점, 편의점, 미용실)"),
      region: z.string().describe("창업 지역 (예: 서울, 강남, 부산)"),
      monthly_rent: z.number().optional().describe("월 임대료 (만원), 미입력 시 자동 추정"),
      size: z.number().optional().default(15).describe("매장 크기 (평수), 기본값: 15평"),
      average_price: z.number().optional().describe("평균 객단가 (원), 미입력 시 업종 평균 사용"),
    },
    async ({ business_type, region, monthly_rent, size, average_price }) => {
      const result = await analyzeBreakeven(business_type, region, monthly_rent, size, average_price);
      return {
        content: [{ type: "text", text: formatBreakeven(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 8: 상권 인구 분석
  server.tool(
    "analyze_population",
    "상권의 유동인구, 연령대, 성별, 시간대별 분포를 분석합니다. 업종 적합도 점수도 제공합니다.",
    {
      location: z.string().describe("분석할 위치 (예: 강남역, 홍대입구, 신촌, 명동, 해운대)"),
      business_type: z.string().optional().describe("창업 예정 업종 (선택, 입력 시 적합도 분석 제공)"),
      radius: z.number().optional().default(500).describe("분석 반경 (m), 기본값: 500"),
    },
    async ({ location, business_type, radius }) => {
      const result = await analyzePopulation(location, business_type, radius);
      return {
        content: [{ type: "text", text: formatPopulation(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 10: 주변 편의시설 분석
  server.tool(
    "get_nearby_facilities",
    "상권 주변 편의시설을 분석합니다. 지하철역, 버스정류장, 주차장, 은행, 편의점 등 접근성을 평가합니다.",
    {
      location: z.string().describe("분석할 위치 (예: 강남역, 홍대입구, 부산 서면)"),
      radius: z.number().optional().default(500).describe("분석 반경 (m), 기본값: 500"),
      categories: z.array(z.string()).optional().describe("조회할 시설 카테고리 (예: ['지하철역', '주차장', '은행']). 미입력 시 전체 조회"),
    },
    async ({ location, radius, categories }) => {
      const result = await analyzeNearbyFacilities(location, radius, categories);
      return {
        content: [{ type: "text", text: formatNearbyFacilities(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 11: 임대료 시세 조회
  server.tool(
    "estimate_rent",
    "지역별 상가 임대료 시세를 조회합니다. 보증금, 월 임대료, 관리비를 추정하고 비용 절감 팁을 제공합니다.",
    {
      location: z.string().describe("조회할 위치 (예: 강남역, 홍대입구, 부산 서면)"),
      size: z.number().optional().default(15).describe("매장 크기 (평수), 기본값: 15평"),
      floor: z.enum(["1층", "2층", "지하1층", "3층이상"]).optional().default("1층").describe("매장 층수, 기본값: 1층"),
      building_type: z.enum(["상가", "오피스텔", "주상복합", "단독건물"]).optional().default("상가").describe("건물 유형, 기본값: 상가"),
    },
    async ({ location, size, floor, building_type }) => {
      const result = await estimateRent(location, size, floor, building_type);
      return {
        content: [{ type: "text", text: formatRentEstimate(result) }],
        isError: !result.success,
      };
    }
  );

  // Tool 12: 매출 시뮬레이션
  server.tool(
    "simulate_revenue",
    "업종별 예상 매출을 시뮬레이션합니다. 일/월/연 매출, 계절별 변동, 예상 순이익을 분석합니다.",
    {
      business_type: z.string().describe("창업 업종 (예: 카페, 음식점, 편의점, 미용실)"),
      region: z.string().describe("창업 지역 (예: 서울 강남, 홍대, 부산)"),
      size: z.number().optional().default(15).describe("매장 크기 (평수), 기본값: 15평"),
      staff_count: z.number().optional().default(1).describe("운영 인원 수, 기본값: 1인"),
      operating_hours: z.number().optional().default(12).describe("일 운영 시간, 기본값: 12시간"),
    },
    async ({ business_type, region, size, staff_count, operating_hours }) => {
      const result = await simulateRevenue(business_type, region, size, staff_count, operating_hours);
      return {
        content: [{ type: "text", text: formatRevenueSimulation(result) }],
        isError: !result.success,
      };
    }
  );

  return server;
}

// stdio 모드로 실행
async function runStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Startup Helper MCP server running on stdio");
}

// HTTP/SSE 모드로 실행
async function runHttp() {
  const app = express();
  const PORT = process.env.PORT || SERVER_CONFIG.defaultPort;

  // CORS 설정 - PlayMCP 및 모든 도메인 허용
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "mcp-session-id"],
      exposedHeaders: ["mcp-session-id"],
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // JSON 파싱 (messages, mcp 경로 제외 - 별도 처리)
  app.use((req, res, next) => {
    if (req.path === "/messages" || req.path === "/mcp") {
      return next();
    }
    express.json()(req, res, next);
  });

  // 세션별 transport 저장 (SSE용)
  const sseTransports = new Map<string, SSEServerTransport>();

  // Streamable HTTP용 transport 저장
  const httpTransports: Record<string, StreamableHTTPServerTransport> = {};

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      description: APP_CONFIG.description,
      transports: {
        sse: "/sse",
        streamableHttp: "/mcp",
      },
    });
  });

  // ===== Streamable HTTP Transport (신규 방식) =====
  app.post("/mcp", express.json(), async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && httpTransports[sessionId]) {
      // 기존 세션 재사용
      transport = httpTransports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // 새 세션 초기화
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          httpTransports[id] = transport;
          console.log("Streamable HTTP session initialized:", id);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete httpTransports[transport.sessionId];
          console.log("Streamable HTTP session closed:", transport.sessionId);
        }
      };

      const server = createServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID or not an initialize request" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = httpTransports[sessionId];
    if (transport) {
      await transport.handleRequest(req, res);
    } else {
      res.status(400).json({ error: "Invalid session" });
    }
  });

  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = httpTransports[sessionId];
    if (transport) {
      await transport.handleRequest(req, res);
    } else {
      res.status(400).json({ error: "Invalid session" });
    }
  });

  // ===== SSE Transport (레거시 호환) =====
  app.get("/sse", async (req: Request, res: Response) => {
    console.log("New SSE connection");

    // SSE 필수 헤더 설정
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (sseTransports.size >= SERVER_CONFIG.maxSessions) {
      console.error(`Session limit reached: ${sseTransports.size}`);
      res.status(503).json({ error: "서버가 혼잡합니다. 잠시 후 다시 시도해주세요." });
      return;
    }

    const server = createServer();
    const transport = new SSEServerTransport("/messages", res);

    sseTransports.set(transport.sessionId, transport);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      console.log(`SSE connection closed: ${transport.sessionId}`);
      sseTransports.delete(transport.sessionId);
    };

    res.on("close", cleanup);
    res.on("error", (err) => {
      console.error(`SSE connection error: ${transport.sessionId}`, err);
      cleanup();
    });

    await server.connect(transport);
  });

  // SSE Message endpoint (레거시)
  app.post("/messages", async (req: Request, res: Response) => {
    const { sessionId } = req.query;

    if (typeof sessionId !== "string" || !sessionId) {
      res.status(400).json({ error: "세션 ID가 필요합니다." });
      return;
    }

    const transport = sseTransports.get(sessionId);

    if (!transport) {
      res.status(404).json({ error: "세션을 찾을 수 없습니다. 다시 연결해주세요." });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  const server = app.listen(PORT, () => {
    console.log(`Startup Helper MCP server running on http://localhost:${PORT}`);
    console.log(`Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`SSE endpoint (legacy): http://localhost:${PORT}/sse`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// 메인 함수
async function main() {
  const mode = process.argv[2] || "stdio";

  if (mode === "http" || mode === "server") {
    await runHttp();
  } else {
    await runStdio();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
