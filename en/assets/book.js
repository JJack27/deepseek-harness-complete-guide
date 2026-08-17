/* Personal Book Forger — shared book JS.
   Handles: localStorage scoring, TOC/dashboard, per-chapter tests,
   the light/dark theme toggle, and a small registry of interactive
   demos used across chapters.
   Loaded from each chapter via <script src="assets/book.js" defer>.

   CONFIG: every page sets window.BOOK_CONFIG inline (in a <script> block
   on the page itself, before this file loads) to override the defaults
   below — at minimum: slug (kebab-case book id), lang ("en"/"zh"/...),
   and chapters (ordered list of {n, slug}). The slug + lang form the
   localStorage key prefix so scores namespace per language. */

(function () {
  "use strict";

  // ---- Config (overridable per book via window.BOOK_CONFIG) ----
  // Replace these defaults with your book's values, OR (preferred) set
  // window.BOOK_CONFIG inline on every page just before <script src="assets/book.js">.
  var CFG = Object.assign({
    slug: "my-book",
    lang: "en",
    passThreshold: 80,
    chapters: [
      { n: 1, slug: "01-example-chapter" }
    ]
  }, window.BOOK_CONFIG || {});

  // ---- Utilities ----
  function normalize(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, " ");
  }
  function storageKey(chapter) { return "book:" + CFG.slug + ":" + CFG.lang + ":ch:" + chapter; }
  function loadScore(chapter) {
    try { var v = localStorage.getItem(storageKey(chapter)); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }
  function saveScore(chapter, score, total, percent) {
    try {
      localStorage.setItem(storageKey(chapter), JSON.stringify({
        score: score, total: total, percent: percent,
        pass: percent >= CFG.passThreshold, ts: Date.now()
      }));
    } catch (e) { /* localStorage unavailable (private mode) */ }
  }

  // ============================================================
  // CHAPTER PAGE: tests
  // ============================================================
  function scoreQuestion(q) {
    var type = q.getAttribute("data-type");
    if (type === "mcq") {
      var correct = JSON.parse(q.getAttribute("data-correct") || "[]");
      var multiselect = q.getAttribute("data-multiselect") === "true";
      if (multiselect) {
        var inputs = q.querySelectorAll('input[type="checkbox"]');
        var selected = Array.prototype.filter.call(inputs, function (i) { return i.checked; })
                                       .map(function (i) { return i.value; });
        var allRight = correct.every(function (c) { return selected.indexOf(c) >= 0; });
        var noWrong = selected.every(function (s) { return correct.indexOf(s) >= 0; });
        return (allRight && noWrong) ? 1 : 0;
      }
      var input = q.querySelector('input[type="radio"]:checked');
      return (input && correct.indexOf(input.value) >= 0) ? 1 : 0;
    }
    if (type === "fill") {
      var accepted = JSON.parse(q.getAttribute("data-accepted") || "[]").map(normalize);
      var fills = q.querySelectorAll("input.fill");
      if (fills.length === 1) {
        return (accepted.indexOf(normalize(fills[0].value)) >= 0) ? 1 : 0;
      }
      // multi-blank: each value in accepted, no duplicates
      var vals = Array.prototype.map.call(fills, function (f) { return normalize(f.value); });
      var allFilled = vals.every(function (v) { return v.length > 0; });
      var noDup = vals.length === new Set(vals).size;
      var matched = accepted.filter(function (a) { return vals.indexOf(a) >= 0; });
      return (allFilled && noDup && matched.length === vals.length) ? 1 : 0;
    }
    if (type === "short") {
      var kpBox = q.querySelector(".key-points");
      var checks = kpBox ? kpBox.querySelectorAll('input[type="checkbox"]') : [];
      if (!checks.length) return 0;
      var checked = Array.prototype.filter.call(checks, function (c) { return c.checked; }).length;
      return checks.length ? checked / checks.length : 0;
    }
    return 0;
  }

  function showFeedback(q, earned) {
    var fb = q.querySelector(".feedback");
    if (!fb) return;
    var correct = (earned >= 1), partial = (earned > 0 && earned < 1);
    fb.className = "feedback shown " + (correct ? "correct" : (partial ? "partial" : "wrong"));
    var verdict = correct ? "✓ Correct" : (partial ? "△ Partial credit" : "✗ Revisit this");
    var answer = q.getAttribute("data-answer") || "";
    var rationale = q.getAttribute("data-rationale") || "";
    var review = q.getAttribute("data-review");
    var html = "<strong>" + verdict + "</strong>";
    if (answer) html += "<div>" + answer + "</div>";
    if (rationale) html += "<div class='rationale'>" + rationale + "</div>";
    if (review) html += "<div class='review-link'>→ <a href='#" + review + "'>review this section</a></div>";
    fb.innerHTML = html;
  }

  function ensureKeyPoints(q) {
    if (q.getAttribute("data-type") !== "short") return;
    var kpBox = q.querySelector(".key-points");
    if (!kpBox || kpBox.querySelector('input[type="checkbox"]')) return;
    var points = JSON.parse(q.getAttribute("data-key-points") || "[]");
    points.forEach(function (p, i) {
      var lbl = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox"; cb.setAttribute("data-kp", i);
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(" " + p));
      kpBox.appendChild(lbl);
    });
  }

  function lockQuestion(q) {
    Array.prototype.forEach.call(q.querySelectorAll("input, textarea"), function (el) { el.disabled = true; });
  }

  function scoreTest(form) {
    var chNum = form.getAttribute("data-chapter");
    var questions = form.querySelectorAll(".q");
    var total = questions.length, earned = 0;
    Array.prototype.forEach.call(questions, function (q) {
      ensureKeyPoints(q);
      var e = scoreQuestion(q);
      earned += e;
      showFeedback(q, e);
      lockQuestion(q);
    });
    var percent = total ? Math.round(100 * earned / total) : 0;
    saveScore(chNum, earned, total, percent);

    var pass = percent >= CFG.passThreshold;
    var resultEl = form.querySelector(".test-result");
    if (resultEl) {
      resultEl.className = "test-result shown " + (pass ? "pass" : "fail");
      var verdict = pass
        ? "Learned enough to move forward. ✓"
        : "Below " + CFG.passThreshold + "%. Re-read the highlighted sections, then retake. (Nothing is locked — you can still read the next chapter.)";
      resultEl.innerHTML =
        "<div class='score'>" + percent + "%</div>" +
        "<div class='verdict'>" + verdict + "</div>";
    }
    var submitBtn = form.querySelector(".submit-test");
    if (submitBtn) submitBtn.disabled = true;
    var retakeBtn = form.querySelector(".retake-btn");
    if (retakeBtn) retakeBtn.hidden = false;
  }

  function resetTest(form) {
    Array.prototype.forEach.call(form.querySelectorAll(".q"), function (q) {
      Array.prototype.forEach.call(q.querySelectorAll("input, textarea"), function (el) {
        el.disabled = false;
        if (el.type === "checkbox" || el.type === "radio") el.checked = false;
        else el.value = "";
      });
      var fb = q.querySelector(".feedback");
      if (fb) { fb.className = "feedback"; fb.innerHTML = ""; }
    });
    var resultEl = form.querySelector(".test-result");
    if (resultEl) { resultEl.className = "test-result"; resultEl.innerHTML = ""; }
    var submitBtn = form.querySelector(".submit-test");
    if (submitBtn) submitBtn.disabled = false;
    var retakeBtn = form.querySelector(".retake-btn");
    if (retakeBtn) retakeBtn.hidden = true;
  }

  document.addEventListener("submit", function (e) {
    if (e.target.classList && e.target.classList.contains("test")) {
      e.preventDefault();
      scoreTest(e.target);
    }
  });
  document.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("retake-btn")) {
      var form = e.target.closest("form.test");
      if (form) resetTest(form);
    }
  });
  document.addEventListener("focusin", function (e) {
    if (e.target.classList && e.target.classList.contains("short")) {
      var q = e.target.closest(".q");
      if (q) ensureKeyPoints(q);
    }
  });

  // ============================================================
  // CHAPTER PAGE: top nav (prev/next) + lang toggle
  // ============================================================
  function buildChapterNav(currentN) {
    var nav = document.querySelector(".topbar nav.chapter-nav");
    if (!nav) return;
    var ordered = CFG.chapters.slice().sort(function (a, b) { return a.n - b.n; });
    var prev = null, next = null;
    for (var i = 0; i < ordered.length; i++) {
      if (ordered[i].n === currentN) {
        prev = ordered[i - 1] || null;
        next = ordered[i + 1] || null;
      }
    }
    var html = "";
    if (prev) html += '<a href="' + prev.slug + '.html">← ' + prev.n + '</a>';
    else html += '<a class="disabled">←</a>';
    html += '<a href="index.html"> Contents</a>';
    if (next) html += '<a href="' + next.slug + '.html">' + next.n + ' →</a>';
    else html += '<a class="disabled">→</a>';
    nav.innerHTML = html;
  }

  // ============================================================
  // THEME (light/dark) — toggle button auto-injected into the topbar
  // ============================================================
  // The initial theme is applied BEFORE first paint by the tiny inline
  // snippet in each page's <head> (stored choice, else prefers-color-scheme,
  // else dark) so there is no flash of the wrong theme. Here we only inject
  // the toggle button and flip the attribute on click. The choice persists
  // in localStorage under a single book-agnostic key ("pbf:theme"), shared
  // across chapters AND languages (a reader's theme preference is not
  // per-language).
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function initThemeToggle() {
    var topbar = document.querySelector(".topbar");
    if (!topbar || topbar.querySelector(".theme-toggle")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle light/dark theme");
    function render() {
      var light = currentTheme() === "light";
      btn.textContent = light ? "☾" : "☀";
      btn.title = light ? "Switch to dark theme" : "Switch to light theme";
    }
    btn.addEventListener("click", function () {
      var next = currentTheme() === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("pbf:theme", next); } catch (e) { /* private mode */ }
      render();
    });
    render();
    // Sit before the lang-toggle when there is one, else at the bar's end.
    var lang = topbar.querySelector(".lang-toggle");
    topbar.insertBefore(btn, lang || null);
  }

  // ============================================================
  // TOC PAGE: build cards + dashboard
  // ============================================================
  function buildTocPage() {
    var grid = document.querySelector(".chapter-grid");
    if (!grid) return;
    var descs = window.CHAPTER_DESCS || {};
    var passed = 0;
    grid.innerHTML = "";
    CFG.chapters.forEach(function (ch) {
      var rec = loadScore(ch.n);
      if (rec && rec.pass) passed++;
      var statusClass = rec ? (rec.pass ? "pass" : "fail") : "";
      var statusText = rec
        ? (rec.pass ? "✓ passed (" + rec.percent + "%)" : "● taken (" + rec.percent + "%)")
        : "○ not started";
      var card = document.createElement("a");
      card.className = "chapter-card";
      card.href = ch.slug + ".html";
      card.innerHTML =
        '<div class="ch-num">CHAPTER ' + ch.n + '</div>' +
        '<div class="ch-title">' + (descs[ch.n] ? descs[ch.n].title : ("Chapter " + ch.n)) + '</div>' +
        '<div class="ch-desc">' + (descs[ch.n] ? descs[ch.n].desc : "") + '</div>' +
        '<div class="ch-status"><span class="dot ' + statusClass + '"></span>' + statusText + '</div>';
      grid.appendChild(card);
    });
    var pct = Math.round(100 * passed / CFG.chapters.length);
    var pb = document.getElementById("overall-progress");
    if (pb) pb.style.width = pct + "%";
    var pctLabel = document.getElementById("progress-pct");
    if (pctLabel) pctLabel.textContent = pct + "%";
    var passedLabel = document.getElementById("progress-passed");
    if (passedLabel) passedLabel.textContent = passed + " / " + CFG.chapters.length;
  }

  // ============================================================
  // DEMOS — registry of interactive widgets.
  // Each chapter can include <div class="demo" data-demo="NAME">…</div>
  // blocks. NAME looks up a handler here, which receives the demo's
  // root element. The handler is bound to any <button data-run> inside
  // the demo (click), plus range/text inputs (input event) and radios
  // (change event) for live demos.
  //
  // This template ships an EMPTY registry — each book authors its own
  // demos below. Pattern:
  //
  //   var demos = {
  //     myDemo: function (root) {
  //       var out = root.querySelector(".demo-output");
  //       out.classList.remove("empty");
  //       out.textContent = "…result…";
  //     }
  //   };
  //
  // Then in a chapter: <div class="demo" data-demo="myDemo">
  //   <button data-run>Run</button>
  //   <div class="demo-output empty">Click to run.</div>
  // </div>
  // ============================================================
  var demos = {
    // ---- 第 1 章：职责归哪一层 ----
    layerMapper: function (root) {
      var out = root.querySelector(".demo-output");
      var sel = root.querySelector('input[type="radio"]:checked');
      out.classList.remove("empty");
      if (!sel) { out.textContent = "先选一个职责。"; return; }
      var map = {
        a: "→ LLM API 层（模型供应商，如 DeepSeek）：只负责按输入生成 token。harness 把请求组织好交给它，它不知道工具、会话或权限的存在。",
        b: "→ agent harness 层（也就是 dsh）：工具执行管道在这里。模型只是「请求」执行一条命令，允不允许、怎么守卫、结果怎么记进日志，全是本地 harness 的职责。",
        c: "→ 前端 UI 层（浏览器 Web UI / 终端）：只负责把会话事件渲染成界面。它消费 harness 投影出的状态，不做任何决策。",
        d: "→ agent harness 层（dsh 的持久化能力）：session-persistence 插件把会话事件写进 JSONL/SQLite。UI 和模型都不直接碰磁盘。"
      };
      out.textContent = map[sel.value] || "先选一个职责。";
    },

    // ---- 第 2 章：waterfall 忘了 next() ----
    waterfallChain: function (root) {
      var out = root.querySelector(".demo-output");
      var skip = root.querySelector('input[type="checkbox"]');
      out.classList.remove("empty");
      if (skip && skip.checked) {
        out.textContent = "A 收到请求 → A 调 next() → B 收到请求 → B 直接返回，没调 next() ✗ 链在 B 处短路：监听器 C 和真正的 LLM 调用都不会发生，B 的返回值成为最终结果。这就是「waterfall 监听器必须调 next()」要防的事故。";
      } else {
        out.textContent = "A 收到请求 → A 调 next() → B 收到请求 → B 调 next() → C 收到请求 → C 调 next() → 真正的 LLM 请求发生 → 结果沿链逐层返回给 A。每个监听器都能包裹（改写、计时、拒绝）它下层的调用。";
      }
    },

    // ---- 第 3 章：补丁层叠加 ----
    patchLayers: function (root) {
      var out = root.querySelector(".demo-output");
      var btn = root.querySelector("button[data-run]");
      out.classList.remove("empty");
      if (root.getAttribute("data-state") === "after") {
        root.setAttribute("data-state", "before");
        if (btn) btn.textContent = "应用补丁层";
        out.textContent = "启动前的空 entry list，先叠 dsh-base bundle：\n[1] llm-deepseek（config: model=deepseek-chat）\n[2] tool-bash\n[3] session-persistence-sqlite\n\n—— 点击按钮，把 profile 的 cordis.patch.yml 叠上去。";
      } else {
        root.setAttribute("data-state", "after");
        if (btn) btn.textContent = "回到叠加前";
        out.textContent = "profile 补丁做了两件事：按 id 替换 [1] 的整行 config（model=deepseek-reasoner），并插入新行 [4] my-weather（out-of-tree 插件）。最终插件树：\n[1] llm-deepseek（config: model=deepseek-reasoner）← 被替换\n[2] tool-bash\n[3] session-persistence-sqlite\n[4] my-weather ← 新插入\n\n补丁永远整行替换、按 id 定位；层序 = bundle 顺序 → profile → home → --patch，越往后优先级越高。";
      }
    },

    // ---- 第 4 章：事件日志推导 ----
    eventLogDerive: function (root) {
      var out = root.querySelector(".demo-output");
      var btn = root.querySelector("button[data-run]");
      var step = parseInt(root.getAttribute("data-step") || "0", 10);
      var steps = [
        "追加 user/message：\"帮我把这个仓库的测试跑一遍\"",
        "追加 assistant/message：\"好，我先看看有哪些测试脚本。\"",
        "追加 tool/call（bash: pnpm run test）",
        "追加 tool/result（stdout 摘要 + 退出码 0）",
        "追加 assistant/message：\"全部通过。接下来我看看覆盖率……\"",
        "→ deriveMessages() 从日志推导模型历史：user → assistant → tool 调用与结果 → assistant。下一轮模型请求看到的就是这份推导结果 —— 日志是唯一来源。",
        "⚠ 试图绕过日志、直接往请求里塞一条模型可见的 system 提示？运行时不变量当场拒绝：model-visible ⟺ logged。想加模型可见输入，必须先新增一个会话事件。",
        "已重置。再点一次从头来。"
      ];
      out.classList.remove("empty");
      out.textContent = "步骤 " + ((step % 8) + 1) + "/8 · " + steps[step % 8];
      root.setAttribute("data-step", String((step + 1) % 8));
      if (btn) btn.textContent = (step % 8) === 6 ? "重新开始" : "下一步";
    },

    // ---- 第 5 章：版本拒绝 ----
    versionReject: function (root) {
      var out = root.querySelector(".demo-output");
      var logs = root.querySelectorAll('input[name="d5log"]');
      var reads = root.querySelectorAll('input[name="d5read"]');
      var lv = null, rv = null;
      Array.prototype.forEach.call(logs, function (r) { if (r.checked) lv = r.value; });
      Array.prototype.forEach.call(reads, function (r) { if (r.checked) rv = r.value; });
      out.classList.remove("empty");
      if (!lv || !rv) { out.textContent = "给日志和读取器各选一个版本。"; return; }
      out.textContent = (lv === rv)
        ? "✓ 版本一致（v" + lv + " = v" + rv + "）：后端正常加载事件流。"
        : "✗ 版本不匹配（日志 v" + lv + " vs 读取器 v" + rv + "）：后端直接拒绝加载，没有任何迁移尝试 —— 找到生成该日志的 dsh 版本，或开新会话。dsh 的策略是拒绝式版本化，不是向后兼容。";
    },

    // ---- 第 6 章：scope shadowing ----
    scopeShadow: function (root) {
      var out = root.querySelector(".demo-output");
      var sel = root.querySelector('input[type="radio"]:checked');
      out.classList.remove("empty");
      if (!sel) { out.textContent = "先选一个 agent。"; return; }
      out.textContent = (sel.value === "persona")
        ? "人格 agent 胜出的是 agent-scoped 注册（宽松版 write 工具）：scope 越具体优先级越高，全局注册被遮蔽但并没有卸载 —— 其他 agent 仍然用严格版。这就是 per-session 人格的底层机制。"
        : "默认 agent 没有自己的同名注册，用全局注册（严格版 write：每次写入前要求逐段确认）。全局注册属于所有 agent 的公共世界。";
    },

    // ---- 第 7 章：turn/step 事件流 ----
    turnStepFlow: function (root) {
      var out = root.querySelector(".demo-output");
      var lines = [
        "turn/start",
        "  claim：从 inbox 认领 1 条 user/message",
        "  agent/pre-step → enter（没人拒绝）",
        "  step/start（第 1 步）",
        "  从日志 derive 模型历史 → 组装 prompt + 工具 schema",
        "  agent/request → llm/stream → assistant/chunk×n → assistant/message",
        "  tool/call（bash）→ tools/* 管道 → tool/result",
        "  step/end（第 1 步）",
        "  工具结果欠一次回应 → 再认领 → step/start（第 2 步）",
        "  agent/request → … → assistant/message（无工具调用）",
        "  step/end（第 2 步）→ 没有欠账，也没有新输入",
        "  agent/turn-stopping（串行，无 next()）",
        "turn/end —— 这个 turn 共 2 个 step，全程事件都进了会话日志"
      ];
      var step = parseInt(root.getAttribute("data-step") || "0", 10);
      out.classList.remove("empty");
      if (step === 0) out.textContent = "";
      out.textContent += (step === 0 ? "" : "\n") + lines[step];
      var next = step + 1;
      root.setAttribute("data-step", String(next));
      var btn = root.querySelector("button[data-run]");
      if (btn) btn.textContent = next >= lines.length ? "重放这个 turn" : "下一步";
      if (next >= lines.length) root.setAttribute("data-step", "0");
    },

    // ---- 第 8 章：工具执行管道 ----
    toolPipeline: function (root) {
      var out = root.querySelector(".demo-output");
      var sel = root.querySelector('input[type="radio"]:checked');
      out.classList.remove("empty");
      if (!sel) { out.textContent = "先选一种情形。"; return; }
      if (sel.value === "ok") {
        out.textContent = "tools/pre-execute ✓（前置策略：改写参数，比如补默认超时）→ 守卫层 ✓（ctx.tools.guard() 注册的单调守卫）→ around（真正执行，可并行；timeout-policy 就是在这里以 around 包住执行）→ tools/post-execute ✓（后处理：截断超大输出；repeat-tool-reminder 的循环卫生提醒也挂在这一段，advisory 性质）→ observation（观测记录）→ tool/result 作为会话事件落进日志。模型下一轮从日志里看到结果。";
      } else if (sel.value === "reject") {
        out.textContent = "tools/pre-execute ✗ 拒绝（策略判定：目标路径在工作区之外）→ 管道短路，around 与后续阶段全部不执行 → 但拒绝本身仍以 tool/result 事件落进日志（模型可见 ⟺ 已记录），模型能看到被拒原因并改道。";
      } else {
        out.textContent = "timeout-policy 守卫（以 around 包住 tools/execute）✗ 超时 → 终止整个进程树（不只是直接子进程）→ tool/result 记录超时原因。守卫失败同样短路管道，且结果照常入日志。";
      }
    },

    // ---- 第 9 章：prompt 装配 ----
    promptAssembly: function (root) {
      var out = root.querySelector(".demo-output");
      var boxes = root.querySelectorAll('input[type="checkbox"]');
      var names = ["[身份与规则]", "[环境信息：cwd / 平台]", "[时间上下文]", "[工具 schema：bash / fs / web]"];
      var picked = [];
      Array.prototype.forEach.call(boxes, function (b, i) { if (b.checked) picked.push(names[i] || "[section]"); });
      out.classList.remove("empty");
      out.textContent = picked.length
        ? "本轮装配出的 system 区块（按注册的 section 顺序）：\n\n" + picked.join("\n") + "\n\n每个 section 是一个插件用 ctx.systemPrompt 注册的；工具 schema 也在这里汇入 —— 模型每轮看到的工具列表，就是这一步拼出来的。"
        : "一个 section 都没勾：system 区块为空，模型只看到裸的用户消息。真实 dsh 里 dsh-base 总会注册身份与环境 section，所以不会出现这种情况。";
    },

    // ---- 第 10 章：流式 chunk ----
    streamChunks: function (root) {
      var out = root.querySelector(".demo-output");
      var chunks = ["我", "先", "看", "一下", "目录", "结构", "。"];
      var step = parseInt(root.getAttribute("data-step") || "0", 10);
      out.classList.remove("empty");
      if (step < chunks.length) {
        var acc = chunks.slice(0, step + 1).join("");
        out.textContent = "assistant/chunk ×" + (step + 1) + "（原始流事件，逐个入日志）\n累计缓冲区：\"" + acc + "\"\n\nchunk 事件保留流式与 UI 回放的保真度；等流结束，一条 assistant/message 事件才用于推导模型历史。";
        root.setAttribute("data-step", String(step + 1));
        var btn1 = root.querySelector("button[data-run]");
        if (btn1) btn1.textContent = step < chunks.length - 1 ? "再来一个 chunk" : "结束流";
      } else {
        out.textContent = "流结束 → 追加 assistant/message：\"我先看一下目录结构。\"\n\n模型历史（deriveMessages）只取 message 事件；chunk 只服务于 UI 逐字渲染与回放。两类事件都在日志里。";
        root.setAttribute("data-step", "0");
        var btn2 = root.querySelector("button[data-run]");
        if (btn2) btn2.textContent = "重新开始流";
      }
    },

    // ---- 第 11 章：seam 换 provider ----
    seamSwap: function (root) {
      var out = root.querySelector(".demo-output");
      var sel = root.querySelector('input[type="radio"]:checked');
      out.classList.remove("empty");
      if (!sel) { out.textContent = "先选一个 provider。"; return; }
      out.textContent = (sel.value === "local")
        ? "ctx.fs = fs-local（本机磁盘）\nctx.subprocess = subprocess-local（本机进程树）\n→ Bash、终端（PTY）、LSP、str-replace-editor 全部在本机执行。这些工具插件一行代码都不用改 —— 它们只依赖 Service Definition 的接口。"
        : "ctx.fs = fs-sandbox（沙箱文件系统）\nctx.subprocess 指向沙箱里的进程世界\n→ Bash、终端、LSP、编辑器工具随「执行世界」整体搬进沙箱。换一个 provider，等于换一个产品形态 —— 这就是 seam 的意义：Consumer 从不 import 具体 provider。";
    },

    // ---- 第 12 章：执行世界对照 ----
    execWorld: function (root) {
      var out = root.querySelector(".demo-output");
      var sel = root.querySelector('input[type="radio"]:checked');
      out.classList.remove("empty");
      if (!sel) { out.textContent = "先选一个执行环境。"; return; }
      var map = {
        local: "本机直跑：bash/pwsh 直接 spawn；文件读写无约束（靠 fs 策略与审批拦）；无沙箱边界。适合可信任务与开发。",
        sandbox: "本机沙箱（Linux: Landlock/bwrap；macOS: Seatbelt；Windows: ACL）：进程被限定在临时根目录，文件系统与网络按策略裁剪；bash/terminal/lsp 仍然通过同一个 seam 获得执行，只是 provider 换了。",
        e2b: "E2B 云沙箱：fs-e2b 与 subprocess-e2b 把执行世界整个搬到远端 firecracker 微虚拟机；模型侧完全无感 —— 工具、路径、结果格式都不变，变的是 provider 背后的实现。"
      };
      out.textContent = map[sel.value] || "";
    },

    // ---- 第 13 章：fs 策略闸门 ----
    fsPolicyGate: function (root) {
      var out = root.querySelector(".demo-output");
      var inp = root.querySelector('input[type="text"]');
      var path = (inp && inp.value ? inp.value : "").trim();
      out.classList.remove("empty");
      if (!path) { out.textContent = "输入一个路径试试，比如 /repo/src/a.ts 或 /repo/.env"; return; }
      if (/\.env$|\/\.ssh\/|id_rsa|credentials/i.test(path)) {
        out.textContent = "✗ 拒绝：路径命中密钥/凭据规则。fs 能力的事件策略在执行前拦截，读取根本不会发生。";
      } else if (/^\/repo\//.test(path) || /^repo\//.test(path)) {
        out.textContent = "✓ 允许：路径在工作区内，fs provider 正常读取；观测策略记录这次访问（谁、何时、读了什么）。";
      } else {
        out.textContent = "？ 工作区之外：需要审批（user-approval 插件介入）或被 fs 策略拒绝，取决于会话的 permission preset。";
      }
    },

    // ---- 第 14 章：lineage 深度 ----
    lineageDepth: function (root) {
      var out = root.querySelector(".demo-output");
      var step = parseInt(root.getAttribute("data-step") || "0", 10);
      out.classList.remove("empty");
      if (step < 3) {
        out.textContent = "派生子代理：第 " + (step + 1) + " 层。\nlineage 记录在 SessionHeader（parentSession + delegationDepth=" + (step + 1) + "）——血统是「数据」，不是可见性：父会话并不自动看到子会话内容。\n再点一次继续派生。";
        root.setAttribute("data-step", String(step + 1));
      } else {
        out.textContent = "✗ delegationDepth 达到上限（3）：subagent provider 拒绝继续派生，防止失控的代理递归。已重置。";
        root.setAttribute("data-step", "0");
      }
    },

    // ---- 第 15 章：spill 外置 ----
    spillOffload: function (root) {
      var out = root.querySelector(".demo-output");
      var inp = root.querySelector('input[type="range"]');
      var kb = inp ? parseInt(inp.value, 10) : 10;
      out.classList.remove("empty");
      out.textContent = (kb > 64)
        ? kb + " KB > 阈值 64 KB → spill：完整结果外置到 storage，模型上下文里只留一个定位符（locator）+ 摘要。需要时模型用定位符取回。上下文压力解除。"
        : kb + " KB ≤ 阈值 64 KB → 直接内联进 tool/result，模型完整可见。阈值是策略（spill-policy），不是写死的常数。";
    },

    // ---- 第 16 章：一次性 permission ----
    permissionOnce: function (root) {
      var out = root.querySelector(".demo-output");
      var step = parseInt(root.getAttribute("data-step") || "0", 10);
      out.classList.remove("empty");
      if (step === 0) {
        out.textContent = "第 1 次：write 工具请求写 /repo/src/a.ts → permission waterfall 触发 → 用户批准 ✓。授权被记录在案。";
      } else if (step === 1) {
        out.textContent = "第 2 次：同一会话再次请求同类写入 → waterfall 是 one-shot：不再打扰用户，直接沿用已建立的决定执行。用户不会被问两遍同样的问题。";
      } else {
        out.textContent = "换了一个从未批准过的目标 → 重新触发 waterfall 问用户。已重置。";
        root.setAttribute("data-step", "-1");
      }
      root.setAttribute("data-step", String(parseInt(root.getAttribute("data-step") || "0", 10) + 1));
    },

    // ---- 第 22 章：快照 record/replay ----
    snapshotModes: function (root) {
      var out = root.querySelector(".demo-output");
      var sel = root.querySelector('input[type="radio"]:checked');
      out.classList.remove("empty");
      if (!sel) { out.textContent = "先选一种模式。"; return; }
      out.textContent = (sel.value === "record")
        ? "DSH_SNAPSHOT=record（需要 DEEPSEEK_API_KEY）：真实调用 API，跑完整的 ACP/headless 转录，把模型响应与最终输出录进金标准 fixture 并提交到仓库。"
        : "DSH_SNAPSHOT=replay（无密钥）：llm-replay 用录好的响应逐条回放，重新跑出完整转录并与期望输出比对。CI 与本地默认走这条路 —— 快照测试因此零密钥可跑。";
    }
  };

  function initDemos() {
    var roots = document.querySelectorAll(".demo[data-demo]");
    Array.prototype.forEach.call(roots, function (root) {
      var name = root.getAttribute("data-demo");
      var handler = demos[name];
      if (!handler) return;
      var runBtns = root.querySelectorAll("button[data-run]");
      Array.prototype.forEach.call(runBtns, function (btn) {
        btn.addEventListener("click", function () { handler(root); });
      });
      // also auto-run on input change for range/text inputs
      var inputs = root.querySelectorAll('input[type="range"], input[type="text"]');
      Array.prototype.forEach.call(inputs, function (inp) {
        inp.addEventListener("input", function () { handler(root); });
      });
      // radio changes
      var radios = root.querySelectorAll('input[type="radio"]');
      Array.prototype.forEach.call(radios, function (r) {
        r.addEventListener("change", function () { handler(root); });
      });
    });
  }

  // ============================================================
  // BOOT
  // ============================================================
  function boot() {
    initDemos();
    initThemeToggle();
    buildTocPage(); // no-op if not on TOC page
    var chapterEl = document.querySelector("main.chapter");
    if (chapterEl) {
      var n = parseInt(chapterEl.getAttribute("data-chapter-n"), 10);
      if (n) buildChapterNav(n);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
