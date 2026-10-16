/* ============ 识渔计划 · AI 训练诊断（答题结果分析 / 画像评语）v1 ============ */
/* 数据流：本地存档（段位/五维/漏判分布/错题本）→ 结构化快照 → 云端大模型流式诊断；
   云端不可用（无 Key / 断网 / 请求失败）回落到规则版诊断（由 DIM_ADVICE 合成），
   与既有「云端 → 本地规则 → 断网可用」三层兜底同一思路。
   缓存按 report.at 世代标记：每打完一轮拦截战自动失效并重新诊断。 */
"use strict";

const AI_DIAG_SYS = "你是一名资深反诈训练教练（AI），服务于反钓鱼训练游戏《识渔计划》。用户刚完成一轮训练，你会收到一份结构化训练数据（JSON：段位、五维得分、原始命中/漏判/误报计数、漏判类别分布、错题本）。请基于数据出具个性化训练诊断，严格按以下四段输出（中文，总300字以内，不寒暄、不套话、不说教）：\n" +
  "①【总评】一句话：结合段位与前后测识别率变化给出定位（必须引用数据中的具体数字）。\n" +
  "②【薄弱分析】最多3条：从得分最低的维度写起，每条必须引用数据中的具体数字或错题场景，说明它反映的识别习惯问题。\n" +
  "③【训练处方】3条可执行建议：具体到练哪个模式、盯哪类破绽、做哪个自查动作。\n" +
  "④【一句提醒】与错题最相关的一条反诈要点。\n" +
  "硬性约束：只使用给定数据，绝不编造用户没做过的题、没发生的错误或不存在的数字；数据中未出现的维度不要分析。涉及资金一律提醒96110/110。";

const Analyst = {
  LS_CACHE: "shiyu_ai_diag",
  busy: false,

  /* ---------- 训练数据快照（只取本地已有存档，不新增采集） ---------- */
  snapshot() {
    const r = S.report; if (!r) return null;
    const dims = DIMENSIONS.map((d) => {
      const v = S.dims[d.key] || { hit: 0, miss: 0, fa: 0 };
      return { 维度: d.name, 得分: r.dims[d.key], 首放命中: v.hit, 漏判或试错: v.miss, 误报: v.fa };
    });
    const missCat = Object.entries(S.missCat || {}).sort((a, b) => b[1] - a[1])
      .map(([c, n]) => ({ 破绽类别: CATEGORY_NAME[c] || c, 次数: n }));
    let wb = {};
    try { wb = JSON.parse(localStorage.getItem("shiyu_wrong") || "{}"); } catch (e) {}
    const carrierName = (c) => (c === "email" ? "邮件" : c === "sms" ? "短信" : "网页");
    const wrongBook = Object.entries(wb).sort((a, b) => b[1].n - a[1].n).slice(0, 6).map(([id, e]) => {
      const q = SAMPLE_MAP[id]; if (!q) return null;
      return { 场景: q.scene, 载体: carrierName(q.carrier), 错次: e.n, 类别: Object.keys(e.cats || {}).map((c) => CATEGORY_NAME[c] || c) };
    }).filter(Boolean);
    return {
      段位: r.rank, 五维均分: r.avg, 前测识别率: r.pre, 后测识别率: r.post,
      五维: dims,
      漏判类别分布: missCat,
      错题本: wrongBook,
      造浪者最佳逃脱检出率: S.atk && S.atk.best != null ? S.atk.best : "未玩过",
      说明: "五维得分0-100；命中/漏判/误报与错题本为历次训练累计数据",
    };
  },

  /* ---------- 规则版诊断（离线兜底，与报告页既有建议同源） ---------- */
  localText() {
    const r = S.report; if (!r) return "先完成一轮拦截战，渔安才有数据可以诊断。";
    const weak = DIMENSIONS.slice().sort((a, b) => r.dims[a.key] - r.dims[b.key]).slice(0, 2);
    const top = Object.entries(S.missCat || {}).sort((a, b) => b[1] - a[1])[0];
    const L = ["【总评】离线诊断：段位 " + r.rank + " · 五维均分 " + r.avg +
      (r.pre != null && r.post != null ? " · 识别率 " + r.pre + "% → " + r.post + "%" : "") + "。"];
    L.push("【薄弱分析】");
    weak.forEach((d) => L.push("· " + d.name + "（" + r.dims[d.key] + "）：" + DIM_ADVICE[d.key]));
    if (top && DIM_OF_CATEGORY[top[0]]) L.push("· 最常漏判「" + (CATEGORY_NAME[top[0]] || top[0]) + "」共 " + top[1] + " 次：" + DIM_ADVICE[DIM_OF_CATEGORY[top[0]]]);
    L.push("【提醒】AI 教练暂时联系不上，以上为规则版建议；恢复网络后点「重新诊断」可获取 AI 逐条分析。");
    return L.join("\n");
  },

  /* ---------- 缓存（按 report.at 世代号失效） ---------- */
  cached() {
    try {
      const c = JSON.parse(localStorage.getItem(this.LS_CACHE) || "null");
      if (c && S.report && c.at === S.report.at) return c;
    } catch (e) {}
    return null;
  },
  save(text, src) {
    try { localStorage.setItem(this.LS_CACHE, JSON.stringify({ at: S.report.at, text, src })); } catch (e) {}
  },

  /* ---------- 渲染 ---------- */
  setBadge(badge, src) {
    if (!badge) return;
    badge.textContent = src === "cloud" ? "AI 生成" : "离线规则版";
    badge.className = "ai-src " + (src === "cloud" ? "cloud" : "local");
  },
  paint(body, badge, text, src) {
    const lines = String(text).split("\n").filter((x) => x.trim() !== "");
    const head = lines.shift() || "";
    body.innerHTML = '<span class="lead">' + esc(head) + "</span>" + (lines.length ? "<br>" + esc(lines.join("\n")).replace(/\n/g, "<br>") : "");
    this.setBadge(badge, src);
  },
  stream(body, text) {
    body.innerHTML = esc(text).replace(/\n/g, "<br>") + '<span class="cur">▌</span>';
  },

  /* ---------- 入口：bodyId 为诊断文本容器；btnId 为「重新诊断」按钮（可选） ---------- */
  async render(bodyId, btnId, force) {
    const body = document.getElementById(bodyId); if (!body) return;
    const badge = body.closest(".card") ? body.closest(".card").querySelector(".ai-src") : null;
    const btn = btnId ? document.getElementById(btnId) : null;
    if (!S.report) { body.innerHTML = "先完成一轮拦截战，渔安才有数据可以诊断。"; if (btn) btn.disabled = true; return; }
    const c = this.cached();
    if (c && !force) { this.paint(body, badge, c.text, c.src); if (btn) btn.disabled = false; return; }
    if (this.busy) { body.innerHTML = "渔安正在分析中——稍后点「重新诊断」即可查看结果。"; if (btn) btn.disabled = false; return; }
    if (!Agent.cloudReady()) { this.paint(body, badge, this.localText(), "local"); if (btn) btn.disabled = false; return; }
    this.busy = true;
    if (btn) btn.disabled = true;
    if (badge) { badge.textContent = "AI 生成中…"; badge.className = "ai-src"; }
    body.innerHTML = '<span class="cur">▌</span> <span style="color:var(--txt-dim)">渔安正在读你的训练数据…</span>';
    try {
      const full = await Agent.cloudChat(AI_DIAG_SYS, "【训练数据】" + JSON.stringify(this.snapshot()), (t) => this.stream(body, t), true);
      this.paint(body, badge, full, "cloud");
      this.save(full, "cloud");
    } catch (e) {
      this.paint(body, badge, this.localText(), "local");
    } finally {
      this.busy = false;
      if (btn) btn.disabled = false;
    }
  },
};
