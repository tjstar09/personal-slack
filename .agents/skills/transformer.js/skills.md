# Technical Skills Profile: Local AI Web Extensions (MV3)

A specialized competency blueprint for engineering high-performance, private, client-side AI browser extensions using **Transformers.js**, **Manifest V3 (MV3)**, and autonomous agent loops.

---

## 🧠 Architectural Competencies & State Orchestration

### 1. Decoupled Multi-Runtime Orchestration (MV3)
*   **Asymmetric Architecture Control Plane:** Isolating computationally intensive WebML inference and agent lifecycles within an ephemeral Background Service Worker to maintain fluid UI frame rates.
*   **Context Isolation & Script Bridging:** Coordinating safe DOM data extraction, dynamic element injecting, and highlighting via `chrome.scripting` from isolated Content Script contexts.
*   **Strict Asynchronous Messaging Contracts:** Structuring strongly-typed, bidirectional communication pipelines (`BackgroundTasks`, `BackgroundMessages`, `ContentTasks`) using TypeScript enums across runtime boundaries.

### 2. High-Performance WebML & Inference Optimization
*   **Hardware-Accelerated ONNX Execution:** Configuring ONNX Runtime Web targets using Transformers.js to execute quantized models (`q4f16`, `fp32`) via the `device: "webgpu"` API.
*   **Heterogeneous Model Routing:** Allocating distinct client-side models to balance RAM/compute footprints:
    *   *Autoregressive Generation:* Utilizing LLMs (e.g., `gemma-4-E2B-it-ONNX`) for reasoning, orchestration, and chat templates.
    *   *Feature Extraction:* Utilizing lightweight embedders (e.g., `all-MiniLM-L6-v2-ONNX`) for real-time semantic similarity.
*   **State-Saving KV Caching:** Implementing state-recomputation protection using key-value caching (e.g., `DynamicCache`) across long-context generation turns.
*   **Extension-Origin Registry Caching:** Localizing downloaded model files securely under the extension origin (`chrome-extension://<id>`) to provide a single, persistent asset registry shared across all browser tabs.

### 3. Agentic Execution Loops & Model Context Protocols (MCP)
*   **Structured Tool-Calling Prompts:** Constructing deterministically parsed JSON tool schemas (`name`, `description`, `parameters`) embedded directly into model-specific chat templates to evoke tokenized triggers (e.g., `<|tool_call|>`).
*   **Extension API Normalization (WebMCP):** Engineering a middle abstraction layer to normalize native browser actions (tabs, history, storage) into standardized, model-consumable functional tools.
*   **Dual-Transcript Pipeline (`Agent.runAgent`):** Managing asynchronous generation streams using separated contexts:
    *   *Internal Transcript:* Raw system, tool, and assistant tokens managing the autonomous back-and-forth execution loop.
    *   *UI Transcript:* Cleaned, token-stripped text streams injected with tool metadata and execution metrics for user display.

### 4. Lifecycle-Partitioned Storage & Least-Privilege Security
*   **Multi-Tiered Data Tiering:** Segmenting application data by volume, velocity, and durability parameters:
    *   *Volatile RAM:* Operational chat transcripts maintained in the active service worker memory space.
    *   *Durable Storage:* High-level user preferences and configurations using `chrome.storage.local`.
    *   *Dense Vector Databases:* Semantic history embeddings managed locally via browser `IndexedDB`.
*   **Least-Privilege Security Design:** Defining precise manifest permissions (`sidePanel`, `storage`, `scripting`, `tabs`) along with restrictive `host_permissions` for zero-server, 100% private processing.

---

## 🛠️ Implementation & Deployment Blueprint

### 1. Multi-Entry Vite Bundling
*   Configuring explicit entry points within `vite.config.ts` (`background.ts`, `content.ts`, `sidebar/index.html`) to compile deterministic, self-contained assets.
*   Isolating output chunks for page-level content scripts to completely prevent cross-origin runtime chunk-loading exceptions inside hostile client webpage DOMs.

### 2. Non-Blocking I/O & Lifecycle Recovery
*   Developing progressive lifecycle indicators using explicit downloading hooks (`DOWNLOAD_PROGRESS`) to mitigate user-facing latency during initial model hydration.
*   Designing error-handling states that safely handle service worker suspension by storing and re-initializing transient pipeline frames without losing conversation context.

---

## 🚀 Execution Checklist for Agentic Coding Models

- [ ] `manifest.json` correctly defines isolated entries for `background.service_worker`, `side_panel`, and `content_scripts`.
- [ ] Messaging handlers feature comprehensive TypeScript enum definitions to prevent malformed runtime calls.
- [ ] Transformers.js pipelines enforce `device: "webgpu"` with fallback to `wasm` if WebGPU hardware is unavailable.
- [ ] Model files are managed via a central lifecycle state manager capable of tracking `CHECK_MODELS` and throwing clear loading states.
- [ ] The agent execution engine correctly strips `<|tool_call|>` blocks from the public UI stream while running background callback executions.
- [ ] Content scripts are bundle-isolated without code-splitting dependencies to avoid browser injection blockers.