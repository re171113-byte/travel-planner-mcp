#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { analyzeCommercialArea } from "./tools/commercial-area.js";
import { findCompetitors } from "./tools/competitors.js";
import { recommendPolicyFunds } from "./tools/policy-funds.js";
import { getStartupChecklist } from "./tools/startup-checklist.js";
import { getBusinessTrends } from "./tools/business-trends.js";
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  // Tool 2: 경쟁업체 검색
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  // Tool 3: 정책지원금 추천
  server.tool(
    "recommend_policy_funds",
    "창업자 조건에 맞는 정부/지자체 정책지원금을 추천합니다. 융자, 보조금, 멘토링 프로그램 등을 안내합니다.",
    {
      business_type: z.string().describe("창업 업종 (예: 카페, 음식점, IT서비스)"),
      stage: z.enum(["예비창업", "초기창업", "운영중", "재창업"]).describe("창업 단계"),
      region: z.string().describe("창업 지역 (예: 서울, 경기 성남, 부산)"),
      founder_type: z
        .enum(["청년", "중장년", "여성", "장애인", "일반"])
        .optional()
        .describe("창업자 유형"),
      founder_age: z.number().optional().describe("창업자 나이"),
    },
    async ({ business_type, stage, region, founder_type, founder_age }) => {
      const result = await recommendPolicyFunds(
        business_type,
        stage,
        region,
        founder_type,
        founder_age
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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

  // CORS 설정
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          process.env.NODE_ENV === "development" ||
          allowedOrigins.length === 0 ||
          allowedOrigins.includes(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error("CORS 정책에 의해 차단되었습니다."));
      },
      credentials: true,
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

  // JSON 파싱 (messages 경로 제외)
  app.use((req, res, next) => {
    if (req.path === "/messages") {
      return next();
    }
    express.json()(req, res, next);
  });

  // 세션별 transport 저장
  const transports = new Map<string, SSEServerTransport>();

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      description: APP_CONFIG.description,
    });
  });

  // SSE endpoint
  app.get("/sse", async (req: Request, res: Response) => {
    console.log("New SSE connection");

    if (transports.size >= SERVER_CONFIG.maxSessions) {
      console.error(`Session limit reached: ${transports.size}`);
      res.status(503).json({ error: "서버가 혼잡합니다. 잠시 후 다시 시도해주세요." });
      return;
    }

    const server = createServer();
    const transport = new SSEServerTransport("/messages", res);

    transports.set(transport.sessionId, transport);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      console.log(`SSE connection closed: ${transport.sessionId}`);
      transports.delete(transport.sessionId);
    };

    res.on("close", cleanup);
    res.on("error", (err) => {
      console.error(`SSE connection error: ${transport.sessionId}`, err);
      cleanup();
    });

    await server.connect(transport);
  });

  // Message endpoint
  app.post("/messages", async (req: Request, res: Response) => {
    const { sessionId } = req.query;

    if (typeof sessionId !== "string" || !sessionId) {
      res.status(400).json({ error: "세션 ID가 필요합니다." });
      return;
    }

    const transport = transports.get(sessionId);

    if (!transport) {
      res.status(404).json({ error: "세션을 찾을 수 없습니다. 다시 연결해주세요." });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  const server = app.listen(PORT, () => {
    console.log(`Startup Helper MCP server running on http://localhost:${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
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
