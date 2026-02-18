import { useState, useRef, useEffect } from "react";

const AGENT_TOOLS = {
  memory: {
    name: "Memory Store",
    icon: "🧠",
    color: "#00D4FF",
    description: "Persistent context across turns"
  },
  planner: {
    name: "Task Planner",
    icon: "📋",
    color: "#FF6B35",
    description: "Breaks goals into executable steps"
  },
  search: {
    name: "Web Search",
    icon: "🔍",
    color: "#7C3AED",
    description: "Retrieves real-time information"
  },
  executor: {
    name: "Code Executor",
    icon: "⚡",
    color: "#10B981",
    description: "Runs code and returns results"
  },
  router: {
    name: "LLM Router",
    icon: "🔀",
    color: "#F59E0B",
    description: "Routes to optimal model per task"
  }
};

const SCENARIOS = [
  {
    id: 1,
    label: "Research & Summarize",
    query: "Research the latest advances in RAG systems and create a summary report",
    steps: [
      { tool: "planner", thought: "Breaking this into: search → extract key findings → synthesize → format report", duration: 800 },
      { tool: "memory", thought: "Checking memory: user prefers technical depth, markdown format", duration: 400 },
      { tool: "router", thought: "Routing search subtask to GPT-4o for web retrieval capability", duration: 300 },
      { tool: "search", thought: "Querying: 'RAG advances 2024 2025 GraphRAG hybrid retrieval'", duration: 1200 },
      { tool: "search", thought: "Querying: 'LangChain LlamaIndex retrieval benchmarks production'", duration: 900 },
      { tool: "executor", thought: "Extracting and deduplicating results, ranking by recency and citation count", duration: 700 },
      { tool: "memory", thought: "Storing: user researched RAG systems — flag for future personalization", duration: 300 },
      { tool: "router", thought: "Routing synthesis to Claude 3.5 Sonnet for long-form report generation", duration: 400 },
    ],
    result: `## RAG Systems: State of the Art (2025)

**Key Advances Identified:**

**1. GraphRAG (Microsoft)** — Combines knowledge graphs with vector retrieval. Reduces hallucination by 40% on multi-hop queries by grounding answers in explicit entity relationships rather than semantic similarity alone.

**2. Hybrid Retrieval Fusion** — BM25 sparse + dense vector + graph traversal running in parallel, merged via Reciprocal Rank Fusion. Industry benchmark: 35% recall improvement over single-method.

**3. Agentic RAG** — Multi-step retrieval where agents decide *when* to retrieve, *what* to retrieve, and *how many times* to iterate. Enables complex reasoning chains impossible with single-pass RAG.

**4. Contextual Compression** — LLM-driven chunk reranking that reduces prompt tokens by 60% while preserving answer quality.

**Production Recommendation:** Hybrid GraphRAG with agentic orchestration for complex domains. Pure vector for FAQ/simple lookups.`
  },
  {
    id: 2,
    label: "Multi-Step Reasoning",
    query: "Analyze our Q3 sales data, identify trends, and recommend actions for Q4",
    steps: [
      { tool: "planner", thought: "Plan: retrieve data → statistical analysis → trend detection → generate recommendations", duration: 700 },
      { tool: "memory", thought: "Loading context: company is in B2B SaaS, previous Q2 analysis flagged churn risk", duration: 500 },
      { tool: "router", thought: "Data analysis task → routing to GPT-4 with code interpreter capability", duration: 300 },
      { tool: "executor", thought: "Running: revenue_by_segment.groupby('month').agg({'mrr': 'sum', 'churn': 'mean'})", duration: 1100 },
      { tool: "executor", thought: "Running: trend_analysis(df, window=90, method='linear_regression')", duration: 800 },
      { tool: "search", thought: "Querying market context: 'B2B SaaS Q3 2025 industry benchmarks churn rates'", duration: 900 },
      { tool: "memory", thought: "Storing: Q3 analysis complete — MRR growth +12%, churn increased 2.1%", duration: 300 },
      { tool: "router", thought: "Switching to Claude for strategic narrative and recommendation generation", duration: 400 },
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
4. **Revenue protection:** Focus enterprise expansion — upsell opportunity in 23 accounts`
  },
  {
    id: 3,
    label: "Autonomous Task Execution",
    query: "Monitor our API, detect any anomalies, fix the issue, and notify the team",
    steps: [
      { tool: "planner", thought: "Decomposing: monitor → detect → diagnose → fix → test → notify. Setting up loop.", duration: 600 },
      { tool: "executor", thought: "Running health_check() on API endpoints — checking latency, error rates, uptime", duration: 1000 },
      { tool: "memory", thought: "Loading baseline: normal p95 latency = 120ms, error rate < 0.5%", duration: 400 },
      { tool: "executor", thought: "ANOMALY DETECTED: /api/v2/search endpoint — p95 latency: 4200ms, error rate: 12.3%", duration: 800 },
      { tool: "executor", thought: "Pulling logs: tail -n 1000 /var/log/api/search.log | grep ERROR", duration: 700 },
      { tool: "router", thought: "Diagnosis task — routing to GPT-4 for log pattern analysis", duration: 300 },
      { tool: "executor", thought: "Identified: vector DB connection pool exhausted — max_connections=10, current=10/10", duration: 600 },
      { tool: "executor", thought: "Applying fix: UPDATE config SET max_connections=50 WHERE service='pinecone'", duration: 500 },
      { tool: "executor", thought: "Restarting search service, running validation tests...", duration: 900 },
      { tool: "memory", thought: "Storing incident: Search API outage 14:32-14:41 UTC, root cause: connection pool, fix applied", duration: 300 },
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
**Status: RESOLVED** — No human intervention required`
  }
];

export default function AgenticDemo() {
  const [activeScenario, setActiveScenario] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [memory, setMemory] = useState([
    "User prefers technical depth over summaries",
    "Company: B2B SaaS, Q2 churn risk flagged",
    "Preferred output: markdown with clear sections"
  ]);
  const [activeTool, setActiveTool] = useState(null);
  const stepsRef = useRef(null);

  const runScenario = async (scenario) => {
    setActiveScenario(scenario);
    setIsRunning(true);
    setCompletedSteps([]);
    setActiveStep(null);
    setShowResult(false);

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      setActiveStep({ ...step, index: i });
      setActiveTool(step.tool);
      await new Promise(r => setTimeout(r, step.duration));
      setCompletedSteps(prev => [...prev, { ...step, index: i }]);

      if (step.tool === "memory" && step.thought.includes("Storing")) {
        const memItem = step.thought.replace("Storing: ", "").replace("Storing incident: ", "");
        setMemory(prev => [memItem, ...prev.slice(0, 4)]);
      }
    }

    setActiveStep(null);
    setActiveTool(null);
    setShowResult(true);
    setIsRunning(false);
  };

  const reset = () => {
    setActiveScenario(null);
    setIsRunning(false);
    setCompletedSteps([]);
    setActiveStep(null);
    setShowResult(false);
    setActiveTool(null);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#E2E8F0",
      padding: "0",
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0A0F; }
        ::-webkit-scrollbar-thumb { background: #2D3748; border-radius: 2px; }

        .agent-card {
          background: #111118;
          border: 1px solid #1E2130;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .agent-card:hover {
          border-color: #2D3748;
          transform: translateY(-1px);
        }

        .tool-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1px solid;
          transition: all 0.3s ease;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .step-enter {
          animation: slideIn 0.3s ease forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .result-enter {
          animation: fadeUp 0.5s ease forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .grid-bg {
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .scenario-btn {
          background: #111118;
          border: 1px solid #1E2130;
          border-radius: 6px;
          padding: 12px 16px;
          color: #94A3B8;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }

        .scenario-btn:hover:not(:disabled) {
          border-color: #00D4FF;
          color: #00D4FF;
          background: rgba(0, 212, 255, 0.05);
        }

        .scenario-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .run-btn {
          background: linear-gradient(135deg, #00D4FF, #7C3AED);
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          color: white;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          width: 100%;
        }

        .run-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .memory-item {
          animation: memoryFlash 0.5s ease;
        }

        @keyframes memoryFlash {
          0% { background: rgba(0, 212, 255, 0.15); }
          100% { background: transparent; }
        }

        .active-tool-glow {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
          border-color: #00D4FF !important;
        }
      `}</style>

      <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{
          borderBottom: "1px solid #1E2130",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10, 10, 15, 0.9)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px #10B981",
              animation: "pulse 2s infinite"
            }} />
            <span style={{ fontSize: "13px", color: "#64748B", letterSpacing: "0.1em" }}>
              AGENTIC_AI_SYSTEM
            </span>
            <span style={{ color: "#1E2130" }}>|</span>
            <span style={{ fontSize: "11px", color: "#475569" }}>
              v2.4.1 — production
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#475569" }}>
            <span>LangGraph <span style={{ color: "#10B981" }}>●</span></span>
            <span>GPT-4o <span style={{ color: "#10B981" }}>●</span></span>
            <span>Claude <span style={{ color: "#10B981" }}>●</span></span>
            <span>Memory <span style={{ color: "#10B981" }}>●</span></span>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* Left Panel */}
          <div style={{
            width: "280px",
            borderRight: "1px solid #1E2130",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
            flexShrink: 0
          }}>
            
            {/* Tools */}
            <div>
              <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em", marginBottom: "12px", textTransform: "uppercase" }}>
                Agent Tools
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(AGENT_TOOLS).map(([key, tool]) => (
                  <div
                    key={key}
                    className={`agent-card ${activeTool === key ? 'active-tool-glow' : ''}`}
                    style={{ padding: "10px 12px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px" }}>{tool.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: activeTool === key ? tool.color : "#94A3B8" }}>
                        {tool.name}
                      </span>
                      {activeTool === key && (
                        <div className="pulse-dot" style={{ background: tool.color, marginLeft: "auto" }} />
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "#475569", paddingLeft: "22px" }}>
                      {tool.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory */}
            <div>
              <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em", marginBottom: "12px", textTransform: "uppercase" }}>
                Agent Memory
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {memory.map((item, i) => (
                  <div
                    key={i}
                    className={`agent-card memory-item`}
                    style={{ padding: "8px 10px", fontSize: "10px", color: "#64748B", lineHeight: "1.5" }}
                  >
                    <span style={{ color: "#00D4FF", marginRight: "6px" }}>›</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Scenarios */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #1E2130",
              display: "flex",
              gap: "12px",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0 }}>
                Scenarios:
              </span>
              {SCENARIOS.map(s => (
                <button
                  key={s.id}
                  className="scenario-btn"
                  style={{ width: "auto", padding: "8px 14px" }}
                  disabled={isRunning}
                  onClick={() => runScenario(s)}
                >
                  {s.label}
                </button>
              ))}
              {activeScenario && (
                <button
                  className="scenario-btn"
                  style={{ width: "auto", padding: "8px 14px", borderColor: "#FF6B35", color: "#FF6B35", marginLeft: "auto" }}
                  disabled={isRunning}
                  onClick={reset}
                >
                  ↺ Reset
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
              
              {!activeScenario ? (
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "16px",
                  color: "#2D3748"
                }}>
                  <div style={{ fontSize: "48px" }}>⚡</div>
                  <div style={{ fontSize: "14px", letterSpacing: "0.1em" }}>SELECT A SCENARIO TO RUN</div>
                  <div style={{ fontSize: "11px", color: "#1E2130" }}>
                    Agents will reason → plan → execute → remember
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                  
                  {/* Execution Trace */}
                  <div style={{
                    width: "50%",
                    borderRight: "1px solid #1E2130",
                    padding: "20px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      Execution Trace
                    </div>
                    
                    {/* Query */}
                    <div className="agent-card" style={{ padding: "12px", borderColor: "#2D3748" }}>
                      <div style={{ fontSize: "10px", color: "#475569", marginBottom: "6px" }}>USER QUERY</div>
                      <div style={{ fontSize: "12px", color: "#E2E8F0", lineHeight: "1.6" }}>
                        {activeScenario.query}
                      </div>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {completedSteps.map((step, i) => {
                        const tool = AGENT_TOOLS[step.tool];
                        return (
                          <div key={i} className="step-enter agent-card" style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span className="tool-chip" style={{
                                color: tool.color,
                                borderColor: tool.color + "40",
                                background: tool.color + "10"
                              }}>
                                {tool.icon} {tool.name}
                              </span>
                              <span style={{ fontSize: "10px", color: "#10B981", marginLeft: "auto" }}>✓</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748B", lineHeight: "1.5", paddingLeft: "2px" }}>
                              {step.thought}
                            </div>
                          </div>
                        );
                      })}

                      {activeStep && (
                        <div className="step-enter agent-card" style={{
                          padding: "10px 12px",
                          borderColor: AGENT_TOOLS[activeStep.tool].color + "60"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span className="tool-chip" style={{
                              color: AGENT_TOOLS[activeStep.tool].color,
                              borderColor: AGENT_TOOLS[activeStep.tool].color + "60",
                              background: AGENT_TOOLS[activeStep.tool].color + "15"
                            }}>
                              {AGENT_TOOLS[activeStep.tool].icon} {AGENT_TOOLS[activeStep.tool].name}
                            </span>
                            <div className="pulse-dot" style={{
                              background: AGENT_TOOLS[activeStep.tool].color,
                              marginLeft: "auto"
                            }} />
                          </div>
                          <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.5" }}>
                            {activeStep.thought}
                          </div>
                        </div>
                      )}
                    </div>

                    {isRunning && (
                      <div style={{ fontSize: "10px", color: "#475569", textAlign: "center", padding: "8px" }}>
                        agent reasoning in progress...
                      </div>
                    )}
                  </div>

                  {/* Result Panel */}
                  <div style={{
                    width: "50%",
                    padding: "20px",
                    overflowY: "auto"
                  }}>
                    <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
                      Agent Output
                    </div>

                    {!showResult ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "200px",
                        color: "#2D3748",
                        fontSize: "12px",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        {isRunning ? (
                          <>
                            <div style={{ fontSize: "24px", animation: "pulse 1s infinite" }}>⚡</div>
                            <span>generating response...</span>
                          </>
                        ) : (
                          <span>awaiting execution</span>
                        )}
                      </div>
                    ) : (
                      <div className="result-enter agent-card" style={{ padding: "16px", borderColor: "#10B981" + "40" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1E2130" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                          <span style={{ fontSize: "10px", color: "#10B981", letterSpacing: "0.1em" }}>
                            COMPLETED — {activeScenario.steps.length} STEPS EXECUTED
                          </span>
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#CBD5E1",
                          lineHeight: "1.8",
                          whiteSpace: "pre-line"
                        }}>
                          {activeScenario.result}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid #1E2130",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#334155"
        }}>
          <span>LangGraph + Multi-Agent Orchestration + Persistent Memory + Model Routing</span>
          <span>Built by Raghda Emara — Senior AI Engineer</span>
        </div>
      </div>
    </div>
  );
}
