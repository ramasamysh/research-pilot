# Agent Harness Engineering

## 1. What an agent "harness" is

An **agent harness** is the software system that surrounds a language model and turns it from a text-predictor into something that can actually *do* things in the world. Anthropic's engineering team describes it as the runtime that gives an LLM "tools to gather context, plan, and execute" and manages everything the model itself cannot do on its own — memory across sessions, tool execution, context management, and progress tracking ([Anthropic, "Effective harnesses for long-running agents," Nov 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)).

A simple, widely-repeated formula from multiple vendors (Databricks, Snowflake, Salesforce) captures it:

> **Agent = Model + Harness**

The model is the "brain" — it reasons and decides what to do next. The harness is the surrounding control loop: it feeds the model context, executes the tool calls the model requests, injects results back in, enforces permissions, and decides when a task is finished ([Databricks, "What is an AI Agent Harness?"](https://www.databricks.com/blog/ai-harness); [Snowflake, "Agent Harness"](https://www.snowflake.com/en/artificial-intelligence/agents/harness)).

The term borrows from the older engineering sense of a "test harness" — scaffolding built around a component so it can be run, observed, and evaluated reliably.

## 2. How it differs from the model

| | Model | Harness |
|---|---|---|
| Role | Reasoning, judgment, generating next action | Executing that action, managing state, enforcing limits |
| Owned by | The AI lab (weights, training) | The developer/product team building the agent |
| Changes | Improves with new model releases | Changes constantly as you tune behavior |
| Failure mode if missing | N/A | Model "can answer questions, but can't reliably run code, call APIs, access files, remember prior work" (Databricks) |

Anthropic frames the relationship precisely: **"every component in a harness encodes an assumption about what the model can't do on its own — and those assumptions are worth stress testing, because they may be incorrect, and because they can quickly go stale as models improve"** ([Anthropic, "Harness design for long-running application development," Mar 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps)). This is a key conceptual point: a harness is not a fixed architecture but a set of compensations for a *particular* model's current weaknesses. As models get better, parts of the harness become unnecessary "dead weight" — Anthropic gives the concrete example of removing "context resets" (built for Sonnet 4.5's "context anxiety") once Opus 4.5 no longer exhibited that behavior ([Anthropic, "Scaling Managed Agents," Apr 2026](https://www.anthropic.com/engineering/managed-agents)).

A related but distinct concept is the **agent framework** (LangChain, etc.) — that's a toolkit of components for *building* a harness. The harness is the actual assembled, running system.

## 3. Important components

Drawing from Anthropic's engineering blog series and cross-referenced with Databricks/Snowflake, the recurring components are:

- **Context management** — deciding what the model sees each turn: system prompt, tool definitions, conversation history, retrieved data. Anthropic calls this "context engineering," the evolution of prompt engineering — "curating and maintaining the optimal set of tokens during inference" given a finite "attention budget" ([Anthropic, "Effective context engineering for AI agents," Sep 2025](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). Includes techniques like compaction (auto-summarizing old turns) and "just-in-time" context loading (keeping file paths/references instead of full contents).
- **Tool design** — the interfaces the model calls to act (run code, edit files, browse the web, query a DB). Anthropic treats tool design as "agent UX": clear naming, tight schemas, high-signal (not verbose) return values, sensible pagination/truncation defaults ([Anthropic, "Writing effective tools for agents," Sep 2025](https://www.anthropic.com/engineering/writing-tools-for-agents)).
- **The control loop** — the classic "reason → act → observe" (ReAct) cycle: call the model, parse its requested action, execute it, feed results back, repeat, and decide when to stop.
- **State / memory across sessions** — since context windows are finite, long tasks need external state: git commits, progress logs, structured feature/task lists (e.g., a `claude-progress.txt` file and JSON feature list in Anthropic's autonomous coding harness).
- **Permissions and guardrails** — sandboxing, approval gates, and structured (not just natural-language) authorization systems, rather than relying on the model to "ask nicely." Anthropic explicitly moved away from freeform permission prompts toward structured permission systems ("Beyond permission prompts," Oct 2025).
- **Evaluation / feedback loops** — a separate mechanism (often a second "evaluator" agent) that checks the primary agent's output, because models are poor at self-critique and tend to rate their own work generously ("Harness design for long-running application development," Mar 2026; "Demystifying evals for AI agents," Jan 2026).
- **Observability / tracing** — logging each step so behavior can be inspected, debugged, and regression-tested (Snowflake's framing emphasizes this heavily for enterprise deployments).
- **Orchestration across multiple agents** — initializer vs. coding agents, or generator vs. evaluator agents, with defined handoff artifacts (git history, progress files, feature lists) bridging separate context windows or separate roles.

## 4. Why harness engineering is becoming important

Several authoritative sources converge on the same argument:

- **Model quality is converging and commoditizing.** As Snowflake puts it: "Two teams using the same LLM might see very different task-completion rates because their harnesses make different decisions about context, tool scope, error handling, approvals and observability." When the underlying model is roughly a fixed input, the harness becomes the primary lever for real-world performance and product differentiation.
- **Complex, long-running tasks expose the limits of "just prompting."** Anthropic's core finding is that even frontier models (Opus 4.5) fail at multi-hour/multi-day tasks like "build a clone of claude.ai" without harness support — they either try to one-shot everything and run out of context mid-feature, or prematurely declare victory. Structural scaffolding (feature lists, incremental progress, testing loops) fixes this, not better prompting alone.
- **Prompt engineering → context engineering → harness engineering is described as a natural progression** as the unit of design moves from "words in a prompt" to "the full system around the model" (Databricks FAQ; Anthropic's context-engineering post).
- **Self-evaluation is unreliable**, so production-grade agent systems need architectural solutions (separate evaluator agents, adversarial GAN-style setups) rather than asking one model to grade itself.
- **Harnesses are volatile and need to be actively maintained/pruned**, not just built once. Anthropic's own guidance shifted from "build a robust harness" to "ask what you can delete," since capability gains render old workarounds unnecessary or even harmful (over-engineering that constrains a now-more-capable model). This "harness engineering as its own discipline requiring continuous iteration" is exactly why it has become a named practice, distinct from model training or one-off prompt tuning.
- **Enterprise deployment needs (safety, compliance, cost, latency)** push companies (Databricks, Snowflake, Salesforce) to formalize harness design as infrastructure, separate from model selection, so they can swap models without rebuilding governance/observability each time.

## 5. Practical examples

- **Claude Agent SDK** — Anthropic's general-purpose harness for coding and tool-using agents, with built-in context compaction ([Claude Agent SDK docs](https://platform.claude.com/docs/en/agent-sdk/overview)).
- **Initializer + coding agent pattern** — one agent sets up a JSON feature-list, `init.sh` script, and git repo; a second agent works one feature at a time each session, leaving git commits and a progress file as handoff artifacts for the next session (Anthropic, Nov 2025 post).
- **Generator–Evaluator (GAN-style) harness** — a "generator" agent produces a frontend design or code, and a separate "evaluator" agent (using tools like Playwright MCP to interact with the live output) scores it against explicit weighted criteria and gives critique, driving 5–15 iterative refinement loops (Anthropic, Mar 2026 post).
- **Three-agent planner/generator/evaluator architecture** for full-stack app builds, using context resets and structured handoffs across multi-hour sessions (Anthropic, Mar 2026; covered by [InfoQ](https://www.infoq.com/news/2026/04/anthropic-three-agent-harness-ai)).
- **"Agent teams" harness for autonomous C compiler build** — 16 parallel Claude instances working continuously in a loop (Ralph-loop style), tested via a purpose-built test suite instead of human oversight, producing a 100,000-line compiler over ~2,000 sessions (Anthropic, "Building a C compiler with a team of parallel Claudes," Feb 2026).
- **Managed Agents** — Anthropic's hosted service that abstracts the harness behind stable interfaces, explicitly because "harnesses encode assumptions that go stale as models improve" (Anthropic, Apr 2026).
- **MCP (Model Context Protocol)** — a standardized way to wire tools/data sources into a harness, and "code execution with MCP" for more token-efficient tool use (Anthropic, Nov 2025).
- **Structured permission systems in Claude Code** replacing natural-language permission prompts, to make autonomous execution safer (Anthropic, "Beyond permission prompts," Oct 2025).

**Bottom line:** Agent harness engineering is the emerging discipline — distinct from model training and separate from simple prompt engineering — of designing the surrounding runtime (context management, tools, memory, permissions, evaluation, orchestration) that lets an LLM operate reliably as an autonomous agent. Anthropic's own engineering blog is probably the most authoritative, continuously updated primary source on the topic, explicitly tracking how harness design assumptions must evolve alongside model capability.