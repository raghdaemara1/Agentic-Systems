export const AGENT_TOOLS = {
  memory: {
    name: "Memory Store",
    icon: "🧠",
    color: "#00D4FF",
    description: "Persistent context across turns",
  },
  planner: {
    name: "Task Planner",
    icon: "📋",
    color: "#FF6B35",
    description: "Breaks goals into executable steps",
  },
  search: {
    name: "Web Search",
    icon: "🔍",
    color: "#7C3AED",
    description: "Retrieves real-time information",
  },
  executor: {
    name: "Code Executor",
    icon: "⚡",
    color: "#10B981",
    description: "Runs code and returns results",
  },
  router: {
    name: "LLM Router",
    icon: "🔀",
    color: "#F59E0B",
    description: "Routes to optimal model per task",
  },
};

export const SCENARIOS = [
  {
    id: 1,
    label: "Research & Summarize",
    query:
      "Research the latest advances in RAG systems and create a summary report",
    steps: [
      {
        tool: "planner",
        thought:
          "Breaking this into: search → extract key findings → synthesize → format report",
        duration: 800,
      },
      {
        tool: "memory",
        thought: "Checking memory: user prefers technical depth, markdown format",
        duration: 400,
      },
      {
        tool: "router",
        thought: "Routing search subtask to GPT-4o for web retrieval capability",
        duration: 300,
      },
      {
        tool: "search",
        thought: "Querying: 'RAG advances 2024 2025 GraphRAG hybrid retrieval'",
        duration: 1200,
      },
      {
        tool: "search",
        thought:
          "Querying: 'LangChain LlamaIndex retrieval benchmarks production'",
        duration: 900,
      },
      {
        tool: "executor",
        thought:
          "Extracting and deduplicating results, ranking by recency and citation count",
        duration: 700,
      },
      {
        tool: "memory",
        thought:
          "Storing: user researched RAG systems — flag for future personalization",
        duration: 300,
      },
      {
        tool: "router",
        thought:
          "Routing synthesis to Claude 3.5 Sonnet for long-form report generation",
        duration: 400,
      },
    ],
    result: `## RAG Systems: State of the Art (2025)

**Key Advances Identified:**

**1. GraphRAG (Microsoft)** — Combines knowledge graphs with vector retrieval. Reduces hallucination by 40% on multi-hop queries by grounding answers in explicit entity relationships rather than semantic similarity alone.

**2. Hybrid Retrieval Fusion** — BM25 sparse + dense vector + graph traversal running in parallel, merged via Reciprocal Rank Fusion. Industry benchmark: 35% recall improvement over single-method.

**3. Agentic RAG** — Multi-step retrieval where agents decide *when* to retrieve, *what* to retrieve, and *how many times* to iterate. Enables complex reasoning chains impossible with single-pass RAG.

**4. Contextual Compression** — LLM-driven chunk reranking that reduces prompt tokens by 60% while preserving answer quality.

**Production Recommendation:** Hybrid GraphRAG with agentic orchestration for complex domains. Pure vector for FAQ/simple lookups.`,
  },
  {
    id: 2,
    label: "Multi-Step Reasoning",
    query: "Analyze our Q3 sales data, identify trends, and recommend actions for Q4",
    steps: [
      {
        tool: "planner",
        thought:
          "Plan: retrieve data → statistical analysis → trend detection → generate recommendations",
        duration: 700,
      },
      {
        tool: "memory",
        thought:
          "Loading context: company is in B2B SaaS, previous Q2 analysis flagged churn risk",
        duration: 500,
      },
      {
        tool: "router",
        thought: "Data analysis task → routing to GPT-4 with code interpreter capability",
        duration: 300,
      },
      {
        tool: "executor",
        thought:
          "Running: revenue_by_segment.groupby('month').agg({'mrr': 'sum', 'churn': 'mean'})",
        duration: 1100,
      },
      {
        tool: "executor",
        thought: "Running: trend_analysis(df, window=90, method='linear_regression')",
        duration: 800,
      },
      {
        tool: "search",
        thought:
          "Querying market context: 'B2B SaaS Q3 2025 industry benchmarks churn rates'",
        duration: 900,
      },
      {
        tool: "memory",
        thought:
          "Storing: Q3 analysis complete — MRR growth +12%, churn increased 2.1%",
        duration: 300,
      },
      {
        tool: "router",
        thought:
          "Switching to Claude for strategic narrative and recommendation generation",
        duration: 400,
      },
    ],
    result: `## Q3 Analysis & Q4 Strategy

**Trends Detected:**
- MRR Growth: +12% QoQ ✅ (above industry avg of 8%)
- Churn Rate: 4.3% → 6.4% ⚠️ (flagged: 2.1% increase)
- Top Performing Segment: Enterprise (>500 seats) — 94% retention
- Risk Segment: SMB (<50 seats) — 71% retention, down from 81%

**Root Cause (cross-referenced with Q2 memory):**
SMB churn spike correlates with onboarding friction identified in Q2. Users who don't complete setup in week 1 have 3x higher 90-day churn.

**Q4 Recommended Actions:**
1. **Immediate:** Deploy guided onboarding flow for SMB segment — projected churn reduction: 1.8%
2. **30 days:** Launch SMB success program with proactive check-ins at Day 7, 30
3. **60 days:** Introduce SMB-specific pricing tier to reduce sticker shock
4. **Revenue protection:** Focus enterprise expansion — upsell opportunity in 23 accounts`,
  },
  {
    id: 3,
    label: "Autonomous Task Execution",
    query: "Monitor our API, detect any anomalies, fix the issue, and notify the team",
    steps: [
      {
        tool: "planner",
        thought:
          "Decomposing: monitor → detect → diagnose → fix → test → notify. Setting up loop.",
        duration: 600,
      },
      {
        tool: "executor",
        thought:
          "Running health_check() on API endpoints — checking latency, error rates, uptime",
        duration: 1000,
      },
      {
        tool: "memory",
        thought: "Loading baseline: normal p95 latency = 120ms, error rate < 0.5%",
        duration: 400,
      },
      {
        tool: "executor",
        thought:
          "ANOMALY DETECTED: /api/v2/search endpoint — p95 latency: 4200ms, error rate: 12.3%",
        duration: 800,
      },
      {
        tool: "executor",
        thought: "Pulling logs: tail -n 1000 /var/log/api/search.log | grep ERROR",
        duration: 700,
      },
      {
        tool: "router",
        thought: "Diagnosis task — routing to GPT-4 for log pattern analysis",
        duration: 300,
      },
      {
        tool: "executor",
        thought:
          "Identified: vector DB connection pool exhausted — max_connections=10, current=10/10",
        duration: 600,
      },
      {
        tool: "executor",
        thought:
          "Applying fix: UPDATE config SET max_connections=50 WHERE service='pinecone'",
        duration: 500,
      },
      {
        tool: "executor",
        thought: "Restarting search service, running validation tests...",
        duration: 900,
      },
      {
        tool: "memory",
        thought:
          "Storing incident: Search API outage 14:32-14:41 UTC, root cause: connection pool, fix applied",
        duration: 300,
      },
    ],
    result: `## Incident Report — Auto-Resolved ✅

**Incident:** Search API Degradation
**Duration:** 14:32 - 14:41 UTC (9 minutes)
**Impact:** 12.3% error rate on /api/v2/search

**Root Cause:**
Pinecone vector DB connection pool exhausted (limit: 10 concurrent connections). Traffic spike at 14:30 UTC triggered by scheduled batch job competing with user requests.

**Fix Applied (automated):**
- Connection pool limit increased: 10 → 50
- Search service restarted cleanly
- Post-fix validation: ✅ latency back to 118ms p95, error rate 0.2%

**Preventive Actions Queued:**
1. Add connection pool monitoring alert (threshold: 80% utilization)
2. Schedule batch jobs to off-peak hours (02:00-04:00 UTC)
3. Implement circuit breaker on search endpoint

**Team Notified:** Slack #incidents + PagerDuty resolved
**Status: RESOLVED** — No human intervention required`,
  },
];

