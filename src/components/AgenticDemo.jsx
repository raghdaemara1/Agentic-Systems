import { useEffect, useState } from "react";
import { AGENT_TOOLS, SCENARIOS } from "../data/agenticDemoData.js";

export default function AgenticDemo() {
  const [activeScenario, setActiveScenario] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [memory, setMemory] = useState([
    "User prefers technical depth over summaries",
    "Company: B2B SaaS, Q2 churn risk flagged",
    "Preferred output: markdown with clear sections",
  ]);
  const [activeTool, setActiveTool] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/v1/documents");
      if (!res.ok) return;
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSseEvent = (eventType, data) => {
    if (eventType === "meta") {
      if (data?.conversation_id) setConversationId(data.conversation_id);
      return;
    }

    if (eventType === "step") {
      const step = {
        tool: data?.tool ?? "executor",
        thought: data?.thought ?? "",
      };

      setActiveTool(step.tool);
      setActiveStep(step);
      setCompletedSteps((prev) => [...prev, step]);
      setTimeout(() => setActiveStep(null), 150);

      if (step.tool === "memory" && step.thought) {
        const memItem = step.thought
          .replace("Storing: ", "")
          .replace("Storing incident: ", "")
          .replace("Checking memory: ", "");
        setMemory((prev) => [memItem, ...prev].slice(0, 5));
      }
      return;
    }

    if (eventType === "done") {
      setFinalAnswer(data?.answer ?? "");
      setShowResult(true);
      setIsRunning(false);
      setActiveStep(null);
      setActiveTool(null);
      return;
    }

    if (eventType === "error") {
      setError(data?.message ?? "Backend error");
      setIsRunning(false);
      setActiveStep(null);
      setActiveTool(null);
    }
  };

  const runScenario = async (scenario) => {
    setActiveScenario(scenario);
    setIsRunning(true);
    setCompletedSteps([]);
    setActiveStep(null);
    setShowResult(false);
    setFinalAnswer("");
    setError("");

    const res = await fetch("/api/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: scenario.query,
        conversation_id: conversationId,
      }),
    });

    if (!res.ok || !res.body) {
      setIsRunning(false);
      setError(`Failed to start run (${res.status})`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex = buffer.indexOf("\n\n");
      while (sepIndex !== -1) {
        const raw = buffer.slice(0, sepIndex).trim();
        buffer = buffer.slice(sepIndex + 2);
        sepIndex = buffer.indexOf("\n\n");

        if (!raw) continue;

        const lines = raw.split("\n");
        let eventType = "message";
        const dataLines = [];
        for (const line of lines) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        const dataStr = dataLines.join("\n");
        let data = {};
        try {
          data = JSON.parse(dataStr);
        } catch {
          data = { raw: dataStr };
        }

        handleSseEvent(eventType, data);
      }
    }
  };

  const reset = () => {
    setActiveScenario(null);
    setIsRunning(false);
    setCompletedSteps([]);
    setActiveStep(null);
    setShowResult(false);
    setActiveTool(null);
    setFinalAnswer("");
    setError("");
  };

  const uploadDocument = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/documents/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Upload failed (${res.status})`);
      }
      await loadDocuments();
    } catch (e) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: "#E2E8F0",
        padding: "0",
        overflow: "hidden",
      }}
    >
      <div
        className="grid-bg"
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            borderBottom: "1px solid #1E2130",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(10, 10, 15, 0.9)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{ fontSize: "13px", color: "#64748B", letterSpacing: "0.1em" }}
            >
              AGENTIC_AI_SYSTEM
            </span>
            <span style={{ color: "#1E2130" }}>|</span>
            <span style={{ fontSize: "11px", color: "#475569" }}>
              v2.4.1 — production
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#475569" }}>
            <span>
              LangGraph <span style={{ color: "#10B981" }}>●</span>
            </span>
            <span>
              GPT-4o <span style={{ color: "#10B981" }}>●</span>
            </span>
            <span>
              Claude <span style={{ color: "#10B981" }}>●</span>
            </span>
            <span>
              Memory <span style={{ color: "#10B981" }}>●</span>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              width: "280px",
              borderRight: "1px solid #1E2130",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  letterSpacing: "0.15em",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                }}
              >
                Agent Tools
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(AGENT_TOOLS).map(([key, tool]) => (
                  <div
                    key={key}
                    className={`agent-card ${activeTool === key ? "active-tool-glow" : ""}`}
                    style={{ padding: "10px 12px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>{tool.icon}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: activeTool === key ? tool.color : "#94A3B8",
                        }}
                      >
                        {tool.name}
                      </span>
                      {activeTool === key && (
                        <div
                          className="pulse-dot"
                          style={{ background: tool.color, marginLeft: "auto" }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "#475569", paddingLeft: "22px" }}>
                      {tool.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  letterSpacing: "0.15em",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                }}
              >
                Agent Memory
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {memory.map((item, i) => (
                  <div
                    key={`${i}-${item.slice(0, 16)}`}
                    className="agent-card memory-item"
                    style={{
                      padding: "8px 10px",
                      fontSize: "10px",
                      color: "#64748B",
                      lineHeight: "1.5",
                    }}
                  >
                    <span style={{ color: "#00D4FF", marginRight: "6px" }}>›</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  letterSpacing: "0.15em",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                }}
              >
                Documents (RAG)
              </div>
              <div className="agent-card" style={{ padding: "10px 12px" }}>
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  disabled={uploading || isRunning}
                  onChange={(e) => uploadDocument(e.target.files?.[0])}
                  style={{ width: "100%", fontSize: "11px", color: "#94A3B8" }}
                />
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {documents.length === 0 ? (
                    <div style={{ fontSize: "10px", color: "#475569" }}>No documents indexed yet.</div>
                  ) : (
                    documents.slice(0, 8).map((d) => (
                      <div key={d.id} style={{ fontSize: "10px", color: "#64748B", lineHeight: "1.4" }}>
                        <span style={{ color: "#00D4FF", marginRight: "6px" }}>›</span>
                        {d.filename}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #1E2130",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                Scenarios:
              </span>
              {SCENARIOS.map((s) => (
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
                  style={{
                    width: "auto",
                    padding: "8px 14px",
                    borderColor: "#FF6B35",
                    color: "#FF6B35",
                    marginLeft: "auto",
                  }}
                  disabled={isRunning}
                  onClick={reset}
                >
                  ↺ Reset
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
              {!activeScenario ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "16px",
                    color: "#2D3748",
                  }}
                >
                  <div style={{ fontSize: "48px" }}>⚡</div>
                  <div style={{ fontSize: "14px", letterSpacing: "0.1em" }}>
                    SELECT A SCENARIO TO RUN
                  </div>
                  <div style={{ fontSize: "11px", color: "#1E2130" }}>
                    Agents will reason → plan → execute → remember
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "50%",
                      borderRight: "1px solid #1E2130",
                      padding: "20px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#475569",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                      }}
                    >
                      Execution Trace
                    </div>

                    <div className="agent-card" style={{ padding: "12px", borderColor: "#2D3748" }}>
                      <div style={{ fontSize: "10px", color: "#475569", marginBottom: "6px" }}>
                        USER QUERY
                      </div>
                      <div style={{ fontSize: "12px", color: "#E2E8F0", lineHeight: "1.6" }}>
                        {activeScenario.query}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {completedSteps.map((step, i) => {
                        const tool = AGENT_TOOLS[step.tool] ?? {
                          name: step.tool,
                          icon: "•",
                          color: "#64748B",
                        };
                        return (
                          <div key={i} className="step-enter agent-card" style={{ padding: "10px 12px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                className="tool-chip"
                                style={{
                                  color: tool.color,
                                  borderColor: `${tool.color}40`,
                                  background: `${tool.color}10`,
                                }}
                              >
                                {tool.icon} {tool.name}
                              </span>
                              <span style={{ fontSize: "10px", color: "#10B981", marginLeft: "auto" }}>
                                ✓
                              </span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748B", lineHeight: "1.5", paddingLeft: "2px" }}>
                              {step.thought}
                            </div>
                          </div>
                        );
                      })}

                      {activeStep && (
                        <div
                          className="step-enter agent-card"
                          style={{
                            padding: "10px 12px",
                            borderColor: `${(AGENT_TOOLS[activeStep.tool]?.color ?? "#64748B")}60`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              className="tool-chip"
                              style={{
                                color: AGENT_TOOLS[activeStep.tool]?.color ?? "#64748B",
                                borderColor: `${(AGENT_TOOLS[activeStep.tool]?.color ?? "#64748B")}60`,
                                background: `${(AGENT_TOOLS[activeStep.tool]?.color ?? "#64748B")}15`,
                              }}
                            >
                              {AGENT_TOOLS[activeStep.tool]?.icon ?? "•"} {AGENT_TOOLS[activeStep.tool]?.name ?? activeStep.tool}
                            </span>
                            <div
                              className="pulse-dot"
                              style={{
                                background: AGENT_TOOLS[activeStep.tool]?.color ?? "#64748B",
                                marginLeft: "auto",
                              }}
                            />
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
                    {error && (
                      <div style={{ fontSize: "10px", color: "#EF4444", textAlign: "center", padding: "8px" }}>
                        {error}
                      </div>
                    )}
                  </div>

                  <div style={{ width: "50%", padding: "20px", overflowY: "auto" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#475569",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "16px",
                      }}
                    >
                      Agent Output
                    </div>

                    {!showResult ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "200px",
                          color: "#2D3748",
                          fontSize: "12px",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
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
                      <div className="result-enter agent-card" style={{ padding: "16px", borderColor: "#10B98140" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #1E2130",
                          }}
                        >
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                          <span style={{ fontSize: "10px", color: "#10B981", letterSpacing: "0.1em" }}>
                            COMPLETED — {completedSteps.length} STEPS EXECUTED
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#CBD5E1",
                            lineHeight: "1.8",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {finalAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1E2130",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#334155",
          }}
        >
          <span>LangGraph + Multi-Agent Orchestration + Persistent Memory + Model Routing</span>
          <span>Built by Raghda Emara — Senior AI Engineer</span>
        </div>
      </div>
    </div>
  );
}

