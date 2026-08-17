# DeepSeek Harness Complete Guide

An interactive book — *The DeepSeek Harness Expert Path*（《DeepSeek Harness 专家之路》）— 25 chapters that take you from "what is an agent harness" all the way to picking up any requirement in the [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) repository and knowing which package to read, which extension point to hook, and which test channel to run.

## Read online

- English edition: **https://jjack27.github.io/deepseek-harness-complete-guide/en/**
- 中文版：**https://jjack27.github.io/deepseek-harness-complete-guide/zh/**

## Read offline

No server, no internet connection, no external requests:

```sh
git clone https://github.com/JJack27/deepseek-harness-complete-guide.git
open en/index.html   # or zh/index.html — double-clicking the file works too
```

Both languages cross-link via the language toggle in the top bar of every page; reading progress is tracked separately per language.

## What's inside

- **25 chapters**: the Cordis plugin model → the session log (event sourcing) → the turn/step loop → the tool execution pipeline → capability seams → subagents → Web UI / RPC gateway / ACP / Python SDK → testing and the contribution process.
- **A chapter test** at the end of every chapter (single-choice / multi-choice / fill-in / short answer); scoring **≥ 80%** means "learned enough to move forward" (a soft gate — nothing is locked). Progress is saved in the browser's `localStorage`, with an overall-progress dashboard on the table of contents.
- **17 inline interactive demos** (waterfall short-circuiting, deriving model history from the event log, stacking patch layers, swapping a seam provider, …), all running locally in your browser.
- All diagrams are inline SVG; every chapter file is fully self-contained.

## Repository layout

```
en/                     English edition
zh/                     中文版（primary edition）
  index.html            Dashboard — start here
  01-…html … 25-…html   Chapters
  assets/               Shared stylesheet and script (book.js holds the demo
                        registry; byte-identical across languages)
```

## Provenance

The content was forged by the [personal-book-forger](https://github.com/) skill from the real source of the [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) repository (2026-08 snapshot). This is community learning material, not official DeepSeek documentation; details may drift as the repository evolves.
