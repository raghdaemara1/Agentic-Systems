# Architecture (Portfolio Read)

## What this project is

This repository is a **frontend-only React demo** that visualizes the architecture patterns of an “agentic AI system”:

- A **Planner** breaks a goal into steps
- A **Memory** layer persists preferences / prior context
- A **Tool layer** (search + executor) performs actions
- A **Router** selects the “best model” for each subtask

The app simulates these behaviors to make the internal trace observable in a UI. It is **not** a backend LangGraph/FastAPI implementation.

## High-level flow

1. User selects a scenario.
2. The UI runs through a scripted step sequence (planner → memory → router → tools…).
3. Each step is displayed in the “Execution Trace”.
4. Memory updates are shown in the “Agent Memory” panel.
5. A final synthesized “Agent Output” is displayed.

## Source layout

```
Agentic-Systems/
├─ docs/
│  └─ ARCHITECTURE.md
├─ src/
│  ├─ components/
│  │  └─ AgenticDemo.jsx        # Main UI + state machine runner
│  ├─ data/
│  │  └─ agenticDemoData.js     # Tools + scenarios (steps + outputs)
│  ├─ main.jsx                  # React entrypoint
│  └─ styles.css                # Global styles + animations
├─ index.html                   # Vite HTML entry
├─ package.json                 # Dependencies + scripts
└─ vite.config.js               # Vite config
```

## Key modules

### `src/data/agenticDemoData.js`

- Defines `AGENT_TOOLS`: the tool palette (name/icon/color/description).
- Defines `SCENARIOS`: demo scenarios with:
  - `query`: the user goal
  - `steps[]`: tool + “thought” + delay
  - `result`: final output shown at the end

### `src/components/AgenticDemo.jsx`

- Owns UI state:
  - `activeScenario`, `isRunning`
  - `completedSteps`, `activeStep`
  - `memory`, `activeTool`
- Executes a scenario by iterating steps with timed delays.
- Updates memory when a step is a “Storing …” memory operation.

### `src/main.jsx` + `index.html`

- Standard Vite + React bootstrap.
- `index.html` loads `/src/main.jsx`.

## Why this architecture reads well in a portfolio

- The **data is separated from the UI** (scenarios/tools live in `src/data/`).
- The UI component focuses on **state + rendering**, not on hardcoded content.
- The repo follows a **standard Vite/React structure**, so reviewers can navigate it quickly.

