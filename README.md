# DeepSeek Harness Complete Guide

An interactive, bilingual learning book that takes you from *"what is an agent harness?"* to expert-level mastery of the [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) repository (dsh) — **25 chapters, 17 runnable in-browser demos, and a self-test at the end of every chapter**.

**Read now:** [all editions](https://jjack27.github.io/deepseek-harness-complete-guide/) · [English](https://jjack27.github.io/deepseek-harness-complete-guide/en/) · [中文](https://jjack27.github.io/deepseek-harness-complete-guide/zh/) · [offline instructions](#read-offline)

## What this is

[deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) is an open-source, plugin-based LLM agent harness built on the [Cordis](https://github.com/cordiverse/cordis) plugin framework: everything — tools, shell execution, filesystem access, subagents, persistence — is a plugin. This book teaches that architecture end to end using the repository's real source: real file paths (`packages/core/session`, `packages/shell/…`), real event names (`session/event`, `tool/call`), and real config surfaces (`cordis.yml`, profiles, patch layers).

The book was generated from the 2026-08 source snapshot by the personal-book-forger workflow, then hand-finished; it was refreshed against `dsh` 0.1.0-rc.7 (2026-08-17) — chapter 10 gained the `ReplayEnvelope` replay-state section, chapter 23 the twenty-first convention (both SDKs project the loop), chapter 17 the plugin-owned settings surface and the PTC Mode rename, and chapter 24 the settings-card cookbook. It is community learning material, **not** official DeepSeek documentation; details may drift as the repository evolves.

## Who it's for

- Engineers who want to understand how a production agent harness works — event-sourced session logs, tool execution pipelines, context compaction, subagent delegation — by reading a real codebase rather than a toy example.
- New contributors to `deepseek-harness` who need the map: which package owns what, which extension point to hook, which test channel to run.
- Learners in either language: the English and 中文 editions are parallel, chapter-for-chapter, and cross-linked from every page.

## The 25 chapters

Every title below links straight to that chapter in the online English edition.

**Part I — Foundations**

1. [What dsh Is: Product & Repository Panorama](https://jjack27.github.io/deepseek-harness-complete-guide/en/01-dsh-overview.html) — agent harness layering, dsh's product forms, the 49-group / 200+ package directory map
2. [The Cordis Mental Model](https://jjack27.github.io/deepseek-harness-complete-guide/en/02-cordis-mind-model.html) — Context, plugins, services, events, waterfall listeners; the one model the whole book runs on
3. [Assembling a Runtime](https://jjack27.github.io/deepseek-harness-complete-guide/en/03-runtime-assembly.html) — boot → bundle → profile → patch layers: how the plugin tree grows at startup

**Part II — The Core Spine**

4. [Session Log: The Event-Sourced Source of Truth](https://jjack27.github.io/deepseek-harness-complete-guide/en/04-session-log.html) — the append-only `SessionEvent` stream and the model-visible ⟺ logged invariant
5. [Persistence and Versioning](https://jjack27.github.io/deepseek-harness-complete-guide/en/05-persistence.html) — JSONL/SQLite backends, reject-on-mismatch versioning, crash recovery, projections
6. [The Agent Abstraction and Scope](https://jjack27.github.io/deepseek-harness-complete-guide/en/06-agent-and-scope.html) — the Agent interface, `ctx.agents`, per-agent scope, shadowing, the setup window
7. [Agent Loop: The Turn/Step Lifecycle](https://jjack27.github.io/deepseek-harness-complete-guide/en/07-agent-loop.html) — inbox admission, turn/step hierarchy, every interception point, the event flow
8. [The Tool System and Execution Pipeline](https://jjack27.github.io/deepseek-harness-complete-guide/en/08-tools-pipeline.html) — the `ctx.tools` registry, its five-stage guard pipeline, parallel execution, render intent
9. [System Prompt Assembly](https://jjack27.github.io/deepseek-harness-complete-guide/en/09-system-prompt.html) — sectioned assembly, tool-schema merge-in, scoped overrides for per-session personas
10. [The LLM Capability Layer](https://jjack27.github.io/deepseek-harness-complete-guide/en/10-llm-layer.html) — `ctx.llm` messages and streaming vocabulary, the DeepSeek adapter, retry, token metering

**Part III — Capability Seams**

11. [The Capability Seam Pattern](https://jjack27.github.io/deepseek-harness-complete-guide/en/11-capability-seams.html) — Service Definition / Provider / Consumer and the ripple effects of swapping a provider
12. [The Execution World](https://jjack27.github.io/deepseek-harness-complete-guide/en/12-execution-world.html) — shell, subprocess, terminal, sandbox (Landlock/Seatbelt), E2B: one provider swap moves the whole execution world
13. [The Filesystem Capability](https://jjack27.github.io/deepseek-harness-complete-guide/en/13-fs-capability.html) — `ctx.fs` providers, observation policy, `str-replace-editor`, the sandboxed FS
14. [Delegation and Subagents](https://jjack27.github.io/deepseek-harness-complete-guide/en/14-subagents.html) — five subagent providers, the Ralph loop, lineage, `delegationDepth`
15. [Context Pressure Management](https://jjack27.github.io/deepseek-harness-complete-guide/en/15-context-pressure.html) — compaction, spill offloading, the context-injection plugin family

**Part IV — Product Surfaces**

16. [The Human Plane](https://jjack27.github.io/deepseek-harness-complete-guide/en/16-human-plane.html) — slash commands, the one-shot permission waterfall, approvals, ask-user
17. [A Tour of the Capabilities](https://jjack27.github.io/deepseek-harness-complete-guide/en/17-capability-tour.html) — a one-page map of skill/web/lsp/mcp/workflow/jobs/goal/todo/plan
18. [The dsh CLI and boot, In Depth](https://jjack27.github.io/deepseek-harness-complete-guide/en/18-cli-and-boot.html) — `apps/cli` argument syntax, app-boot guards and the config tree, the cmdline handoff
19. [Web UI Architecture](https://jjack27.github.io/deepseek-harness-complete-guide/en/19-web-ui.html) — the host half and browser half, the `__DSH_BOOT__` module graph, ui-slots composition
20. [Typert and the RPC Gateway](https://jjack27.github.io/deepseek-harness-complete-guide/en/20-typert-rpc.html) — type-graph generation → loading → registry, gateway and apiproxy, dual WebSocket downstream
21. [ACP, SDK, and Python](https://jjack27.github.io/deepseek-harness-complete-guide/en/21-acp-sdk-python.html) — three ways to drive dsh out of process: ACP, the JSON-RPC SDK, Python

**Part V — The Craft**

22. [The Testing System](https://jjack27.github.io/deepseek-harness-complete-guide/en/22-testing.html) — five vitest channels, keyless `llm-replay` playback, golden snapshot fixtures
23. [Quality Gates and Repository Conventions](https://jjack27.github.io/deepseek-harness-complete-guide/en/23-gates-and-conventions.html) — the coverage gate, doc-sync/hygiene, the `AGENTS.md` hard rules
24. [Extension Practice](https://jjack27.github.io/deepseek-harness-complete-guide/en/24-extension-practice.html) — follow the official cookbook: add a package, a tool, an LLM adapter
25. [The Contribution Map and Expert Navigation](https://jjack27.github.io/deepseek-harness-complete-guide/en/25-contributing-map.html) — Agent Notes, the bilingual doc flow, PR conventions, and the expert navigation map

## How the book works

- **Chapter tests.** Every chapter ends with 9–14 questions (single-choice, multi-choice, fill-in, short answer). Scoring **≥ 80%** marks the chapter "learned enough to move forward" — a soft gate that never locks content. Wrong answers link back to the exact section to re-read.
- **Progress tracking.** Scores live in your browser's `localStorage`, tracked separately per language, with an overall-progress dashboard on the table of contents.
- **Interactive demos.** 17 demos run entirely in your browser: watch a waterfall listener short-circuit the chain, derive model history from an event log step by step, stack profile patch layers onto a bundle, swap a capability provider and move the whole execution world.
- **Fully static.** No server, no build step, no external requests, no API key. Every diagram is inline SVG and every chapter file is self-contained.

## Read offline

```sh
git clone https://github.com/JJack27/deepseek-harness-complete-guide.git
open index.html      # landing page listing every edition — or jump straight
                     # to en/index.html / zh/index.html; double-clicking works too
```

## Repository layout

```
index.html              Landing page linking every edition — start here
en/                     English edition
zh/                     中文版 (primary edition)
  index.html            Dashboard — start here
  01-…html … 25-…html   Chapters
  assets/               Shared stylesheet and script (book.js holds the demo
                        registry; byte-identical across languages)
```

## FAQ

**Is this official DeepSeek documentation?**
No. It is community learning material generated from the public repository's 2026-08 snapshot. The repository evolves; the book is a snapshot.

**Do I need a DeepSeek API key or any signup?**
No. The book is plain static HTML; nothing phones home.

**I passed the tests in one language. Does the other language count?**
No — progress is deliberately tracked per language. Passing a chapter test in English doesn't certify you in Chinese, and vice versa.

**Can I fix or improve a chapter?**
Yes — each chapter is a single self-contained HTML file with no build step; open a pull request.
