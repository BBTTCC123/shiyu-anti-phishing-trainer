/* ============ 识渔计划 v3：游戏化应用逻辑（拦截战 / 拆解台 / 组装实验室） ============ */
"use strict";
const $ = (s) => document.querySelector(s);
const LS_KEY = "shiyu_v3";

/* ---------- 状态 ---------- */
let S = { dims: null, missCat: {}, report: null, atk: null };
function freshDims() { const d = {}; DIMENSIONS.forEach((x) => (d[x.key] = { hit: 0, miss: 0, fa: 0 })); return d; }
function store() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      dims: S.dims, report: S.report, missCat: S.missCat, atkBest: S.atk ? S.atk.best : null, atkFreeHits: S.atk ? (S.atk.freeHits || null) : null,
    }));
  } catch (e) {}
}
function restore() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    S.dims = (d && d.dims) || freshDims();
    S.report = (d && d.report) || null;
    S.missCat = (d && d.missCat) || {};
    S.atk = { round: 1, mode: "genes", slots: {}, history: [], best: d ? d.atkBest : null, freeHits: (d && d.atkFreeHits) || {}, freeText: "" };
  } catch (e) { S.dims = freshDims(); S.atk = { round: 1, mode: "genes", slots: {}, history: [], best: null, freeHits: {}, freeText: "" }; }
}

/* ---------- 视图 ---------- */
function show(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $("#v-" + id).classList.add("active");
  window.scrollTo(0, 0);
}

/* ---------- 音效（WebAudio 合成，零素材） ---------- */
const SFX = {
  ctx: null, on: true,
  ac() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return this.ctx; },
  play(kind) {
    if (!this.on) return;
    const ac = this.ac(); if (!ac) return;
    if (ac.state === "suspended") ac.resume();
    const t = ac.currentTime;
    const tone = (f0, f1, dur, type, vol) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    };
    if (kind === "pick") tone(300, 520, 0.08, "sine", 0.06);
    else if (kind === "drop") tone(500, 240, 0.1, "sine", 0.07);
    else if (kind === "good") { tone(523, 784, 0.12, "sine", 0.09); setTimeout(() => tone(784, 1046, 0.14, "sine", 0.07), 90); }
    else if (kind === "bad") tone(220, 90, 0.3, "sawtooth", 0.08);
    else if (kind === "combo") tone(660, 1320, 0.16, "triangle", 0.08);
    else if (kind === "alarm") { tone(880, 880, 0.09, "square", 0.05); setTimeout(() => tone(660, 660, 0.09, "square", 0.05), 110); }
    else if (kind === "lock") tone(880, 660, 0.1, "sine", 0.07);
  },
};

/* ---------- 2D 宠物 + AI 蓝军安全官 ---------- */
function officerChar() { return `<span class="opet-fish">🐟</span>`; }
const Officer = {
  voiceOn: true, timer: null, mood: "normal",
  initVoice() { try { const v = localStorage.getItem("shiyu_voice"); if (v != null) { this.voiceOn = v === "1"; SFX.on = this.voiceOn; } } catch (e) {} },
  syncBtn() { const b = $("#a-voice"); if (b) { b.textContent = this.voiceOn ? "🔊 音效" : "🔇 静音"; b.classList.toggle("on", this.voiceOn); } },
  toggle() { this.voiceOn = !this.voiceOn; SFX.on = this.voiceOn; if (!this.voiceOn) this.stopTTS();
    try { localStorage.setItem("shiyu_voice", this.voiceOn ? "1" : "0"); } catch (e) {} this.syncBtn(); return this.voiceOn; },
  stopTTS() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} },
  cancel() { if (this.timer) clearInterval(this.timer); this.timer = null; this.stopTTS(); },
  tts(text) {
    if (!this.voiceOn) return;
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text.replace(/[+≥%]/g, " "));
      u.lang = "zh-CN"; u.rate = 1.05;
      const zh = speechSynthesis.getVoices().find((v) => /zh|Chinese/i.test(v.lang));
      if (zh) u.voice = zh;
      speechSynthesis.speak(u);
    } catch (e) {}
  },
  say(text, done) {
    const host = $("#officer"); if (!host) { if (done) done(); return; }
    const b = document.createElement("div");
    b.className = "obubble";
    b.innerHTML = '<div class="officer-ava talking ' + this.mood + '">' + officerChar() + '</div><div class="otext"></div>';
    host.appendChild(b);
    const t = b.querySelector(".otext"); let i = 0;
    this.tts(text);
    this.timer = setInterval(() => {
      i += 1; t.textContent = text.slice(0, i);
      b.scrollIntoView({ block: "nearest" });
      if (i >= text.length) {
        clearInterval(this.timer); this.timer = null;
        b.classList.add("done");
        b.querySelector(".officer-ava").classList.remove("talking");
        if (done) done();
      }
    }, 24);
  },
  play(lines, thenChips, mood) {
    this.mood = mood || "normal"; this.cancel();
    const host = $("#officer"); if (host) host.innerHTML = "";
    const next = (k) => { if (k >= lines.length) { if (thenChips) this.showChips(); return; } this.say(lines[k], () => next(k + 1)); };
    next(0);
  },
  showChips() {
    const box = $("#officer-chips"); if (!box) return;
    box.innerHTML = OFFICER_QA.map((q, i) => '<span class="chip" data-q="' + i + '">' + esc(q.q) + "</span>").join("");
    box.querySelectorAll(".chip").forEach((c) => {
      c.onclick = () => { box.innerHTML = ""; this.play(OFFICER_QA[+c.dataset.q].a(), true); };
    });
  },
};
const OFFICER_QA = [
  { q: "怎么把分数打高？", a: () => [
      "拦截战里连击是关键：连续正确分拣，分数倍率会一直涨，错一张清零。",
      "拆解台尽量一次放对槽位——首放正确才算命中，放错弹回就记漏判了。",
    ] },
  { q: "造浪者怎么玩出高分？", a: () => [
      "组装实验室里，预测仪只是参考——它有误差带，真检出率要投放后才知道。",
      "调低激进度的同时提高伪装度，能压低检出；但投放量大本身会增加暴露面。",
    ] },
  { q: "普通学生最该防哪类？", a: () => [
      "利诱钩子与紧迫话术是命中率最高的两类破绽，几乎每封钓鱼都有其一。",
      "实操三条：不点正文链接、不给验证码、限时话术先冷静一分钟再核实。",
    ] },
  { q: "你是真人吗？", a: () => [
      "我是作品内置的AI蓝军安全官，本地规则与知识库驱动，浏览器语音合成播报。",
      "后端接入大模型后我会有自由问答能力——演示环节，零依赖最稳。",
    ] },
];

/* ---------- 工具函数 ---------- */
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function plainText(q) { return q.parts.map((p) => (p.t === "p" ? p.html.replace(/<[^>]+>/g, "") : "")).join(""); }
/* 正文内 <span data-el="…"> 文本锚点：解析片段文本，让证物标签/清白之证显示真实文案（不再回退为类别键） */
const EL_TEXT_CACHE = new WeakMap();
function elTextMap(q) {
  let map = EL_TEXT_CACHE.get(q);
  if (map) return map;
  map = {};
  (q.parts || []).forEach((p) => {
    if (typeof p.html !== "string" || p.html.indexOf("data-el=") < 0) return;
    try {
      const doc = new DOMParser().parseFromString("<div>" + p.html + "</div>", "text/html");
      doc.querySelectorAll("[data-el]").forEach((el) => {
        const key = el.getAttribute("data-el");
        const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (key && txt) map[key] = txt;
      });
    } catch (e) {}
  });
  EL_TEXT_CACHE.set(q, map);
  return map;
}
function partOf(q, id) {
  if (id === q.meta.addrId) return { t: "addr", text: q.meta.addr };
  if (id === q.meta.urlId) return { t: "url", text: q.meta.url };
  const p = (q.parts || []).find((x) => x.id === id);
  if (p) return { t: p.t, text: p.text || plainText({ parts: [p] }) };
  const txt = elTextMap(q)[id];
  if (txt) return { t: "text", text: txt };
  return null;
}
function partLabel(p) {
  if (!p) return null;
  if (p.t === "addr") return "发件域名 " + String(p.text).split("@").pop();
  if (p.t === "url") return "地址栏 " + p.text;
  if (p.t === "link") return "链接 " + p.text;
  if (p.t === "attach") return "附件 " + p.text;
  if (p.t === "qr") return "二维码";
  if (p.t === "field") return "表单 " + p.text;
  if (p.t === "text") return "正文「" + String(p.text).slice(0, 14) + "」";
  return String(p.text).slice(0, 14);
}
function chipLabel(q, r) {
  const p = partOf(q, r.target);
  return p ? partLabel(p) : r.category;
}

/* 正常样本的教学说明（legitNotes）→ 可渲染的 {label, note} 列表 */
function legitNotesOf(q) {
  return (q.legitNotes || []).map((n) => {
    const p = n.target ? partOf(q, n.target) : null;
    return { label: p ? partLabel(p) : "整体判断", note: n.note };
  });
}

/* 误报（把正常样本判成钓鱼）→ 落到对应能力维度，驱动画像中的 fa 扣分 */
function dimOfTarget(q, target) {
  if (!target) return "psych";
  const p = partOf(q, target);
  if (!p) return null;
  return FA_DIM_BY_PARTTYPE[p.t] || "psych";
}
function recordFalseAlarm(q) {
  const notes = q.legitNotes && q.legitNotes.length ? q.legitNotes : [{ target: null }];
  const dims = new Set();
  notes.forEach((n) => { const d = dimOfTarget(q, n.target); if (d) dims.add(d); });
  if (!dims.size) dims.add("psych");
  dims.forEach((d) => { S.dims[d].fa++; });
}

/* ============ 拦截战（拖拽分拣） ============ */
const WAVES = [
  { name: "第一波 · 前测侦察", ids: CAMPAIGN.pretest, reveal: false },
  { name: "第二波 · 近海拦截", ids: CAMPAIGN.train.slice(0, 5), reveal: true },
  { name: "第三波 · 深水区", ids: CAMPAIGN.train.slice(5), reveal: true },
  { name: "第四波 · 终局后测", ids: CAMPAIGN.posttest, reveal: false },
];
let G = null; // 战局状态
function startGame() {
  G = { waveIdx: 0, cardIdx: 0, lives: 100, score: 0, combo: 0, bestCombo: 0,
        answers: [[], [], [], []], sortLog: [] };
  S.dims = freshDims(); S.missCat = {}; S.report = null; store();
  show("game"); nextCard();
}
function wave() { return WAVES[G.waveIdx]; }
function cardFace(q) {
  const bits = q.parts.filter((p) => ["link", "attach", "qr"].includes(p.t)).map((p) =>
    p.t === "link" ? '<div class="cf-link">🔗 ' + esc(p.text) + "</div>" :
    p.t === "attach" ? '<div class="cf-att">📎 ' + esc(p.text) + "</div>" :
    '<div class="cf-qr">▦ ' + esc(p.text) + "</div>").join("");
  const body = '<div class="cf-body">' + esc(plainText(q).slice(0, 110)) + "</div>";
  if (q.carrier === "email") return '<div class="cf-meta">📮 ' + esc(q.meta.from) + " &lt;" + esc(q.meta.addr) + "&gt;</div>" +
    '<div class="cf-subj">' + esc(q.meta.subj) + "</div>" + bits + body;
  if (q.carrier === "sms") return '<div class="cf-meta">💬 ' + esc(q.meta.phone) + "</div>" + bits + body;
  return '<div class="cf-meta">🌐 ' + esc(q.meta.url) + "</div>" + '<div class="cf-subj">' + esc(q.meta.title) + "</div>" + bits;
}
function nextCard() {
  const w = wave();
  if (G.cardIdx >= w.ids.length) { startDismantle(); return; }
  const q = SAMPLE_MAP[w.ids[G.cardIdx]];
  G.cur = q; G.locked = false;
  $("#g-phase").textContent = w.name;
  $("#g-wave").textContent = (G.cardIdx + 1) + "/" + w.ids.length;
  $("#g-timer-txt").textContent = "";
  $("#g-stage").innerHTML = `
    <div class="g-sorter">
      <div class="dropzone dz-phish" id="dzL"><span>钓 鱼</span></div>
      <div class="g-center">
        <div class="g-timerbar" id="g-timerbar"><i id="g-timer" style="width:100%"></i></div>
        <div class="g-card" id="g-card">${cardFace(q)}</div>
        <div class="g-queue" id="g-queue">${"●".repeat(w.ids.length - G.cardIdx - 1) || "○"}</div>
      </div>
      <div class="dropzone dz-safe" id="dzR"><span>正 常</span></div>
    </div>
    <div class="hint">把消息卡<b>拖进</b>左侧渔网（钓鱼）或右侧收件箱（正常）｜电脑可用 ←/→ 键</div>`;
  bindCardDrag(q);
  startCardTimer(q);
}
function startCardTimer(q) {
  const secs = [12, 9, 7][q.difficulty - 1];
  const t0 = Date.now();
  clearInterval(G.tick);
  const tick = () => {
    if (G.locked) { clearInterval(G.tick); return; }
    const left = secs - (Date.now() - t0) / 1000;
    const bar = $("#g-timer"), wrap = $("#g-timerbar");
    if (bar) { bar.style.width = Math.max(0, (left / secs) * 100) + "%"; }
    if (wrap) wrap.classList.toggle("urgent", left < secs * 0.3);
    if ($("#g-timer-txt")) $("#g-timer-txt").textContent = left > 0 ? "⏱ " + Math.ceil(left) + "s" : "";
    if (left <= 0) { clearInterval(G.tick); if (!G.locked) sortCard(null); }
  };
  tick(); G.tick = setInterval(tick, 200);
}
function bindCardDrag(q) {
  const card = $("#g-card");
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  card.onpointerdown = (e) => {
    if (G.locked) return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    ox = card.offsetLeft; oy = card.offsetTop;
    card.classList.add("dragging"); SFX.play("pick");
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
  };
  card.onpointermove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    card.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx * 0.04 + "deg)";
    const r = card.getBoundingClientRect();
    const L = $("#dzL"), R = $("#dzR");
    if (L && R) {
      const lrect = L.getBoundingClientRect(), rrect = R.getBoundingClientRect();
      L.classList.toggle("hot", r.left < lrect.right - 8);
      R.classList.toggle("hot", r.right > rrect.left + 8);
    }
  };
  const finish = (e) => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("dragging");
    const r = card.getBoundingClientRect();
    const L = $("#dzL"), R = $("#dzR");
    let side = null;
    if (L && R) {
      const lrect = L.getBoundingClientRect(), rrect = R.getBoundingClientRect();
      L.classList.remove("hot"); R.classList.remove("hot");
      if (r.left < lrect.right - 8) side = "phish";
      else if (r.right > rrect.left + 8) side = "safe";
    }
    if (side) sortCard(side);
    else { card.style.transform = ""; SFX.play("drop"); }
  };
  card.onpointerup = finish; card.onpointercancel = finish;
}
document.addEventListener("keydown", (e) => {
  if (!G || G.locked || !$("#v-game").classList.contains("active") || !$("#g-card")) return;
  if (e.key === "ArrowLeft") { $("#g-card").style.transform = "translateX(-140px)"; setTimeout(() => sortCard("phish"), 120); }
  if (e.key === "ArrowRight") { $("#g-card").style.transform = "translateX(140px)"; setTimeout(() => sortCard("safe"), 120); }
});
function sortCard(side) {
  if (G.locked) return;
  G.locked = true; clearInterval(G.tick);
  const q = G.cur, w = wave();
  const correct = side === (q.phishing ? "phish" : "safe");
  G.answers[G.waveIdx].push({ qid: q.id, correct, timeout: side === null });
  if (side === null) G.sortLog.push({ qid: q.id, kind: "timeout" });
  else G.sortLog.push({ qid: q.id, kind: correct ? "ok" : "wrong" });
  if (correct) {
    G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    G.score += 100 + (G.combo - 1) * 20;
    SFX.play("good");
    if (G.combo >= 3) { SFX.play("combo"); popCombo(G.combo); }
    badge("good", "✓ 拦截正确");
  } else {
    G.combo = 0; G.lives = Math.max(0, G.lives - 15);
    SFX.play("bad");
    $("#v-game").classList.add("shake"); setTimeout(() => $("#v-game").classList.remove("shake"), 400);
    const falseAlarm = !q.phishing && side !== null; // 误报：把正常样本判成钓鱼
    if (side === null) badge("bad", "⏱ 超时漏网");
    else if (falseAlarm) badge("bad", "⚠ 误报 · 正常样本");
    else badge("bad", "✗ 漏判 · 钓鱼样本");
    if (falseAlarm) recordFalseAlarm(q);
    logWrong(q.id, null);
  }
  refreshHud();
  const card = $("#g-card");
  if (card) card.style.transform = "";
  setTimeout(() => {
    if (w.reveal) {
      const b = $("#g-stage .g-badge");
      if (b) b.innerHTML += '<div style="font-size:12px;font-weight:600;margin-top:4px">真实身份：' + (q.phishing ? "钓鱼样本" : "正常样本 · 清白") + "</div>";
    }
    G.cardIdx++;
    setTimeout(nextCard, w.reveal ? 850 : 420);
  }, 460);
}
function badge(kind, text) {
  const host = $("#g-stage .g-center") || $("#g-stage");
  const b = document.createElement("div");
  b.className = "g-badge " + kind; b.textContent = text;
  host.appendChild(b);
  setTimeout(() => b.remove(), 1300);
}
function popCombo(n) {
  const host = $("#g-stage");
  const c = document.createElement("div");
  c.className = "combo-pop"; c.textContent = "连击 x" + n + "！";
  host.appendChild(c); setTimeout(() => c.remove(), 1000);
}
function refreshHud() {
  $("#g-score").textContent = G.score;
  $("#g-combo").textContent = G.combo >= 2 ? "连击x" + G.combo : "";
  const lv = $("#g-lives");
  if (lv) { lv.style.width = G.lives + "%"; $("#g-lives-wrap").classList.toggle("low", G.lives <= 40); }
}

/* ============ 拆解台（证物拖放分类） ============ */
let DM = null;
function startDismantle() {
  const w = wave();
  const phish = w.ids.map((id) => SAMPLE_MAP[id]).filter((q) => q.phishing);
  const legit = w.ids.map((id) => SAMPLE_MAP[id]).filter((q) => !q.phishing);
  if (!phish.length || !w.reveal) { endWave(); return; }
  DM = { list: phish, legit, chips: [], placed: 0 };
  phish.forEach((q) => q.redflags.forEach((r) => DM.chips.push({ q, r, tries: 0, done: false })));
  const slotCats = [...new Set(DM.chips.map((c) => c.r.category))];
  $("#g-phase").textContent = w.name + " · 拆解台";
  $("#g-wave").textContent = "证物 " + DM.chips.length;
  $("#g-stage").innerHTML = `
    <div class="hint">把证物<b>拖进</b>对应破绽类别槽（点一下证物可查看内容）</div>
    <div class="dm-board" id="dm-board">
      <div class="dm-src">${phish.map((q) => "📮/💬/🌐 " + esc((q.meta.subj || q.meta.url || q.scene).slice(0, 26))).join("<br>")}</div>
      <div class="dm-chips" id="dm-chips"></div>
      <div class="dm-slots" id="dm-slots">
        ${Object.keys(CATEGORY_NAME).map((k) => '<div class="dm-slot" data-cat="' + k + '"><b>' + CATEGORY_NAME[k] + "</b></div>").join("")}
      </div>
      <div class="dm-inspect" id="dm-inspect">— 点击证物查看内容，拖到类别槽完成归类 —</div>
    </div>
    <button class="btn primary" id="dm-done" style="text-align:center" disabled>完成拆解 →</button>`;
  const chipHost = $("#dm-chips");
  DM.chips.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "chip-ev"; el.dataset.i = i;
    el.textContent = chipLabel(c.q, c.r).slice(0, 22);
    el.style.left = (6 + (i % 3) * 31 + Math.random() * 6) + "%";
    el.style.top = (Math.floor(i / 3) * 52 + Math.random() * 8) + "px";
    chipHost.appendChild(el);
    c.el = el;
  });
  chipHost.querySelectorAll(".chip-ev").forEach((el) => bindChipDrag(el));
  $("#dm-done").onclick = finishDismantle;
}
function slotAtPoint(x, y, selector) {
  return [...document.querySelectorAll(selector)].find((s) => {
    const b = s.getBoundingClientRect();
    return x > b.left && x < b.right && y > b.top && y < b.bottom;
  });
}
function bindChipDrag(el) {
  let sx = 0, sy = 0, moved = false;
  el.onpointerdown = (e) => {
    const c = DM.chips[+el.dataset.i];
    if (c.done) return;
    sx = e.clientX; sy = e.clientY; moved = false;
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    SFX.play("pick");
  };
  el.onpointermove = (e) => {
    const c = DM.chips[+el.dataset.i];
    if (c.done) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (moved) {
      el.classList.add("dragging");
      el.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.05)";
      el.style.zIndex = 8;
      const hot = slotAtPoint(e.clientX, e.clientY, ".dm-slot");
      document.querySelectorAll(".dm-slot").forEach((s) => s.classList.toggle("hot", s === hot));
    }
  };
  const up = (e) => {
    const c = DM.chips[+el.dataset.i];
    if (c.done) return;
    el.classList.remove("dragging");
    el.style.transform = ""; el.style.zIndex = "";
    const hitSlot = moved ? slotAtPoint(e.clientX, e.clientY, ".dm-slot") : null;
    document.querySelectorAll(".dm-slot").forEach((s) => s.classList.remove("hot"));
    if (!moved) { // 点击=查看
      $("#dm-inspect").textContent = "证物内容：" + (partOf(c.q, c.r.target) ? esc(String(partOf(c.q, c.r.target).text).slice(0, 70)) : c.r.category);
      return;
    }
    if (!hitSlot) { SFX.play("drop"); return; }
    c.tries++;
    if (hitSlot.dataset.cat === c.r.category) {
      c.done = true; DM.placed++;
      el.classList.add("locked"); el.style.opacity = ".45";
      const tag = document.createElement("span");
      tag.className = "placed" + (c.tries > 1 ? " miss" : "");
      tag.textContent = el.textContent.slice(0, 10);
      hitSlot.appendChild(tag);
      el.remove();
      const dim = DIM_OF_CATEGORY[c.r.category];
      S.dims[dim][c.tries > 1 ? "miss" : "hit"]++;
      if (c.tries > 1) { S.missCat[c.r.category] = (S.missCat[c.r.category] || 0) + 1; logWrong(c.q.id, c.r.category); }
      SFX.play("lock");
      $("#g-wave").textContent = "证物 " + (DM.chips.length - DM.placed);
      if (DM.placed >= DM.chips.length) $("#dm-done").disabled = false;
    } else {
      el.classList.add("bounce"); setTimeout(() => el.classList.remove("bounce"), 380);
      SFX.play("bad");
      $("#dm-inspect").textContent = "放错了——「" + el.textContent.slice(0, 12) + "」不属于「" + CATEGORY_NAME[hitSlot.dataset.cat] + "」";
    }
  };
  el.onpointerup = up; el.onpointercancel = up;
}
function finishDismantle() {
  const missed = DM.chips.filter((c) => c.tries > 1);
  const html = DM.chips.map((c) =>
    '<div class="flaw ' + (c.tries > 1 ? "miss" : "hit") + '"><div class="f-t">' +
    (c.tries > 1 ? "⚠ 试错后归位" : "✓ 首放命中") + " · " + CATEGORY_NAME[c.r.category] +
    "</div><div class=\"f-d\">" + esc(chipLabel(c.q, c.r)) + "：" + esc(c.r.explain) + "</div></div>").join("");
  G.score += DM.chips.filter((c) => c.tries === 1).length * 50;
  refreshHud();
  const legitHtml = DM.legit && DM.legit.length
    ? '<div class="legit-card"><div class="legit-head">清 白 之 证 · 本波正常样本为什么清白</div>' +
      DM.legit.map((q) => '<div class="legit-item"><div class="lg-scene">' + esc(q.scene) + '</div><ul class="lg-notes">' +
        legitNotesOf(q).map((n) => "<li><b>" + esc(n.label) + "</b>：" + esc(n.note) + "</li>").join("") + "</ul></div>").join("") +
      "</div>"
    : "";
  $("#g-stage").innerHTML = `
    <div class="xp-head ${missed.length ? "bad" : "good"}">拆 解 判 定</div>
    <div class="officer-wrap" id="officer"></div>
    <div class="dm-verdict">${html}</div>
    ${legitHtml}
    <button class="btn primary" id="dm-next" style="text-align:center">下一波 →</button>`;
  const lines = [missed.length
    ? "这波拆解有 " + missed.length + " 个证物放错了槽。看判 定，每个证物我都写了它属于哪类、为什么。"
    : "全部首放命中，漂亮。这一波的破绽语法你已经掌握了。"];
  const topMiss = Object.entries(S.missCat).sort((a, b) => b[1] - a[1])[0];
  if (topMiss && missed.length) lines.push("目前你最常漏的是「" + CATEGORY_NAME[topMiss[0]] + "」：" + DIM_ADVICE[DIM_OF_CATEGORY[topMiss[0]]]);
  if (DM.legit && DM.legit.length) lines.push("别忘了另一面：本波还有 " + DM.legit.length + " 个正常样本，「清白之证」里写了它们为什么可信——不漏判、也不误伤，才算练到位。");
  Officer.play(lines);
  $("#dm-next").onclick = endWave;
}
function endWave() {
  Officer.cancel();
  G.waveIdx++;
  if (G.waveIdx >= WAVES.length) { finishGame(); return; }
  G.cardIdx = 0; nextCard();
}

/* ============ 报告 / 画像 / 雷达 ============ */
function normalizeDims() {
  const out = {};
  DIMENSIONS.forEach((d) => {
    const v = S.dims[d.key];
    out[d.key] = Math.min(98, Math.max(5, Math.round(50 + v.hit * 11 - v.miss * 7 - v.fa * 4)));
  });
  return out;
}
function rankOf(avg) { return RANKS.find((r) => avg >= r.min).name; }
function accOf(waveIdx) {
  const a = G ? G.answers[waveIdx] : [];
  if (!a.length) return null;
  return Math.round((100 * a.filter((x) => x.correct).length) / a.length);
}
/* 汇总本局遇到的全部正常样本：用于「清白之证」复盘与误报统计 */
function buildLegitReview() {
  const seen = new Set(), out = [];
  WAVES.forEach((w) => {
    w.ids.forEach((id) => {
      if (seen.has(id)) return;
      const q = SAMPLE_MAP[id];
      if (!q || q.phishing) return;
      seen.add(id);
      const log = (G.sortLog || []).find((l) => l.qid === id);
      out.push({
        id: q.id, scene: q.scene, notes: legitNotesOf(q),
        mistaken: !!(log && log.kind === "wrong"),
        timeout: !!(log && log.kind === "timeout"),
      });
    });
  });
  return out;
}
function faTotal() { return DIMENSIONS.reduce((s, d) => s + (S.dims[d.key].fa || 0), 0); }
function finishGame() {
  const pre = accOf(0), post = accOf(3);
  const dimsN = normalizeDims();
  const avg = Math.round(DIMENSIONS.reduce((s, d) => s + dimsN[d.key], 0) / DIMENSIONS.length);
  S.report = { pre, post, dims: dimsN, avg, rank: rankOf(avg), score: G.score, bestCombo: G.bestCombo,
               legit: buildLegitReview(), fa: faTotal(), at: Date.now() };
  store();
  renderReport(); show("report");
}
function renderReport() {
  const r = S.report; if (!r) return;
  $("#r-pre").textContent = (r.pre ?? "--") + "%";
  const p = $("#r-post"); p.textContent = (r.post ?? "--") + "%";
  if (r.post != null && r.pre != null) { const d = r.post - r.pre; p.textContent += (d >= 0 ? " ↑" : " ↓") + Math.abs(d); }
  $("#r-rank").textContent = r.rank;
  drawRadar($("#radar-report"), r.dims);
  const cats = Object.entries(S.missCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  $("#r-topmiss").innerHTML = cats.length
    ? cats.map(([c, n]) => "<li><b>" + CATEGORY_NAME[c] + "</b>：漏判 " + n + " 次</li>").join("")
    : "<li>全部破绽均被首放命中，表现出色！</li>";
  const weak = DIMENSIONS.slice().sort((a, b) => r.dims[a.key] - r.dims[b.key]).slice(0, 2);
  $("#r-advice").innerHTML = weak.map((d) => "<li><b>" + d.name + "（" + r.dims[d.key] + "）</b>：" + DIM_ADVICE[d.key] + "</li>").join("");
  const lg = r.legit || [];
  const mistaken = lg.filter((x) => x.mistaken).length;
  const lcard = $("#r-legit-card");
  if (lcard) lcard.style.display = lg.length ? "" : "none";
  if (lg.length) {
    $("#r-legit-sub").textContent = mistaken
      ? "本局你误把 " + mistaken + " 个正常样本判成了钓鱼。误报和漏判一样会拉低画像——下面每一条都告诉你它为什么清白："
      : "本局你没有误伤正常样本。下面复习它们为什么是清白的（不漏判、也不误伤，才算练到位）：";
    $("#r-legit").innerHTML = lg.map((x) => {
      const tag = x.mistaken ? '<span class="lg-tag bad">误报</span>'
        : x.timeout ? '<span class="lg-tag warn">超时未判</span>'
        : '<span class="lg-tag ok">判断正确</span>';
      return "<li><b>" + esc(x.scene) + "</b> " + tag + "<br>" +
        x.notes.map((n) => "· <b>" + esc(n.label) + "</b>：" + esc(n.note)).join("<br>") + "</li>";
    }).join("");
  }
  const extra = $("#r-extra");
  if (extra && r.score != null) extra.textContent = "战绩：" + r.score + " 分 · 最高连击 x" + (r.bestCombo || 0) +
    " · 数据完整度 " + (G ? G.lives : "--") + "%" + (lg.length ? " · 误报 " + mistaken + "/" + lg.length : "");
  /* AI 训练诊断：命中本轮缓存则直接展示，否则流式生成（云端→规则版兜底见 analyst.js） */
  if (typeof Analyst !== "undefined") {
    const rb = $("#ai-regen");
    if (rb) rb.onclick = () => Analyst.render("ai-body", "ai-regen", true);
    Analyst.render("ai-body", "ai-regen");
  }
}
function drawRadar(cv, dims) {
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) / 2 - 52;
  ctx.clearRect(0, 0, W, H);
  const n = DIMENSIONS.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = ang(i % n), rr = (R * ring) / 4;
      i ? ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    ctx.strokeStyle = "rgba(53,224,200,.18)"; ctx.stroke();
  }
  ctx.font = "11px sans-serif"; ctx.fillStyle = "#7e8fa8"; ctx.textAlign = "center";
  DIMENSIONS.forEach((d, i) => {
    const a = ang(i);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = "rgba(53,224,200,.18)"; ctx.stroke();
    ctx.fillText(d.name, cx + (R + 26) * Math.cos(a), cy + (R + 26) * Math.sin(a) + 4);
  });
  ctx.beginPath();
  DIMENSIONS.forEach((d, i) => {
    const a = ang(i), rr = (R * dims[d.key]) / 100;
    i ? ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(53,224,200,.25)"; ctx.fill();
  ctx.strokeStyle = "#35e0c8"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#d7e3f4"; ctx.font = "bold 10px sans-serif";
  DIMENSIONS.forEach((d, i) => {
    const a = ang(i), rr = Math.max(14, (R * dims[d.key]) / 100 - 16);
    ctx.fillText(dims[d.key], cx + rr * Math.cos(a), cy + rr * Math.sin(a) + 3);
  });
}

/* ============ 造浪者：组装实验室（拖卡+滑杆+预测仪+扫描束） ============ */
const LAB_SLIDERS = [
  { k: "stealth", name: "伪装度", hint: "措辞越自然，越难被话术模型识别" },
  { k: "aggro", name: "激进度", hint: "越咄咄逼人，紧迫特征越明显" },
  { k: "volume", name: "投放量", hint: "群发越多，被样本捕获的概率越大" },
];
function startAttack(fresh) {
  if (fresh || !S.atk) S.atk = { round: 1, mode: S.atk ? S.atk.mode : "genes", slots: {}, history: [], best: S.atk ? S.atk.best : null, freeHits: {}, freeText: S.atk ? S.atk.freeText : "" };
  S.atk.sl = S.atk.sl || { stealth: 50, aggro: 50, volume: 30 };
  renderAttack(); show("attack");
}
function labPredict(slots, sl) {
  const used = GENE_GROUPS.map((g) => GENES.find((x) => x.id === slots[g.key]));
  if (used.some((x) => !x)) return null;
  const tech = used.find((g) => g.group === "tech").det;
  const skin = used.find((g) => g.group === "skin").det * (1 - sl.stealth / 160);
  const psych = used.find((g) => g.group === "psych").det * (0.55 + sl.aggro / 90);
  const vol = sl.volume * 0.12;
  return Math.round(Math.min(97, 5 + tech + skin + psych + vol));
}
function renderAttack() {
  const a = S.atk;
  a.mode = a.mode || "genes";
  Officer.cancel();
  $("#a-round").textContent = "第 " + a.round + " / 3 回合";
  const st = $("#a-stage");
  if (a.result) { st.innerHTML = a.result; bindAttackResult(); return; }
  if (a.mode === "free") {
    st.innerHTML = `
      <p class="atk-preview">亲手写一封"钓鱼邮件"挑战防线——命中特征会被高亮并计入检出率。</p>
      <div class="mode-tabs">
        <span class="mtab" data-m="genes">🧬 组装实验室</span>
        <span class="mtab on" data-m="free">✍️ 自由撰写</span>
      </div>
      <textarea class="freebox" id="free-text" placeholder="写下你想骗倒别人的"钓鱼邮件"……（仅本平台沙箱内演示）">${esc(a.freeText || "")}</textarea>
      <div id="free-warn" style="font-size:11.5px;color:var(--amber);margin:6px 0"></div>
      <button class="btn danger" id="a-launch-free" style="text-align:center">投放 → 挑战 AI 防线</button>`;
    bindModeTabs();
    const ft = $("#free-text");
    ft.oninput = () => { S.atk.freeText = ft.value; };
    $("#a-launch-free").onclick = launchFreeAttack;
    return;
  }
  const sl = a.sl;
  const pred = labPredict(a.slots, sl);
  st.innerHTML = `
    <p class="atk-preview">把基因卡<b>拖进</b>三个装配槽，调滑杆造出你的"钓鱼邮件"——预测仪有误差，真检出率投放后揭晓。</p>
    <div class="mode-tabs">
      <span class="mtab on" data-m="genes">🧬 组装实验室</span>
      <span class="mtab" data-m="free">✍️ 自由撰写</span>
    </div>
    <div class="lab-slots">${GENE_GROUPS.map((g) => {
      const filled = a.slots[g.key] && GENES.find((x) => x.id === a.slots[g.key]);
      return '<div class="lab-slot' + (filled ? " filled" : "") + '" data-slot="' + g.key + '">' +
        (filled ? filled.name : "拖入「" + g.name + "」") + "</div>";
    }).join("")}</div>
    <div class="lab-deck" id="lab-deck">${GENES.map((x) =>
      '<div class="lab-card' + (a.slots[x.group] === x.id ? " used" : "") + '" data-gene="' + x.id + '">' +
      '<span class="gi">' + (x.group === "skin" ? "🎭" : x.group === "psych" ? "🧠" : "🧬") + "</span>" + x.name +
      "<small>" + x.det + " 检出</small></div>").join("")}</div>
    <div class="sliders">${LAB_SLIDERS.map((s) =>
      '<div class="srow"><label>' + s.name + "</label>" +
      '<input type="range" min="0" max="100" value="' + sl[s.k] + '" data-sl="' + s.k + '">' +
      '<span class="sval" id="sv-' + s.k + '">' + sl[s.k] + "</span></div>" +
      '<div style="font-size:10.5px;color:var(--txt-dim);margin:-4px 0 4px 98px">' + s.hint + "</div>").join("")}</div>
    <div class="gauge">
      <div class="gauge-bar"><i id="gauge-bar" style="width:' + (pred || 0) + '%"></i></div>
      <div class="gnum" id="gauge-num">${pred != null ? "~" + pred + "%" : "--"}</div>
      <div class="gband">预测检出率 · 误差 ±8 · ≥60% 将被防线识破</div>
    </div>
    <button class="btn danger" id="a-launch" style="text-align:center" ${pred != null ? "" : "disabled"}>投放 → 穿越扫描防线</button>`;
  bindModeTabs();
  st.querySelectorAll(".lab-card").forEach((el) => bindGeneDrag(el));
  st.querySelectorAll('input[type="range"]').forEach((r) => {
    r.oninput = () => {
      sl[r.dataset.sl] = +r.value;
      $("#sv-" + r.dataset.sl).textContent = r.value;
      updateGauge();
    };
  });
  const lb = $("#a-launch");
  if (lb) lb.onclick = launchAttack;
}
function bindModeTabs() {
  document.querySelectorAll(".mtab").forEach((t) => {
    t.onclick = () => { S.atk.mode = t.dataset.m; renderAttack(); };
  });
}
function updateGauge() {
  const pred = labPredict(S.atk.slots, S.atk.sl);
  const bar = $("#gauge-bar"), num = $("#gauge-num"), btn = $("#a-launch");
  if (bar) bar.style.width = (pred || 0) + "%";
  if (num) num.textContent = pred != null ? "~" + pred + "%" : "--";
  if (btn) btn.disabled = pred == null;
}
function bindGeneDrag(el) {
  let sx = 0, sy = 0, moved = false;
  el.onpointerdown = (e) => {
    sx = e.clientX; sy = e.clientY; moved = false;
    try { el.setPointerCapture(e.pointerId); } catch (err) {} SFX.play("pick");
  };
  el.onpointermove = (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (moved) {
      el.classList.add("dragging");
      el.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.06)";
      const hot = slotAtPoint(e.clientX, e.clientY, ".lab-slot");
      document.querySelectorAll(".lab-slot").forEach((s) => s.classList.toggle("hot", s === hot));
    }
  };
  const up = (e) => {
    el.classList.remove("dragging");
    el.style.transform = "";
    const slot = moved ? slotAtPoint(e.clientX, e.clientY, ".lab-slot") : null;
    document.querySelectorAll(".lab-slot").forEach((s) => s.classList.remove("hot"));
    const g = GENES.find((x) => x.id === el.dataset.gene);
    if (!slot || !g) return;
    SFX.play("lock");
    S.atk.slots[slot.dataset.slot] = g.id;
    renderAttack();
  };
  el.onpointerup = up; el.onpointercancel = up;
}
function launchAttack() {
  const a = S.atk, sl = a.sl;
  const used = GENE_GROUPS.map((g) => GENES.find((x) => x.id === a.slots[g.key]));
  if (used.some((x) => !x)) return;
  const tech = used.find((g) => g.group === "tech");
  const skin = used.find((g) => g.group === "skin");
  const psych = used.find((g) => g.group === "psych");
  const parts = {
    tech: tech.det,
    skin: Math.round(skin.det * (1 - sl.stealth / 160)),
    psych: Math.round(psych.det * (0.55 + sl.aggro / 90)),
    vol: Math.round(sl.volume * 0.12),
  };
  const detect = Math.min(97, 5 + parts.tech + parts.skin + parts.psych + parts.vol);
  const noise = Math.round((Math.random() - 0.5) * 14); // 预测仪 ±8 的真实噪声
  const finalDetect = Math.max(5, Math.min(97, detect + noise));
  const caught = finalDetect >= 60;
  a.history.push({ round: a.round, genes: used.map((g) => g.name), detect: finalDetect, caught });
  if (100 - finalDetect > (a.best ?? -1)) a.best = 100 - finalDetect;
  store();
  a.result = `
    <div class="runway" id="runway">
      <span class="runner">✉️</span>
      <div class="beam" style="left:28%" id="beam-tech"></div>
      <div class="beam" style="left:50%" id="beam-skin"></div>
      <div class="beam" style="left:72%" id="beam-psych"></div>
    </div>
    <div class="detect-bar"><i id="dbar"></i></div>
    <div class="detect-num"><span id="dnum">0</span>%</div>
    <div class="verdict ${caught ? "caught" : "escape"}" id="a-verdict" style="opacity:0;transition:opacity .4s"></div>
    <div class="officer-wrap" id="officer"></div>
    <div class="chips" id="officer-chips"></div>
    <button class="btn primary" style="text-align:center" id="a-next" style="display:none"></button>`;
  renderAttack();
  const verdict = $("#a-verdict");
  setTimeout(() => {
    if (parts.tech >= 20 && $("#beam-tech")) $("#beam-tech").classList.add("hit");
  }, 650);
  setTimeout(() => { if (parts.skin + parts.psych >= 18 && $("#beam-skin")) $("#beam-skin").classList.add("hit"); }, 1100);
  setTimeout(() => { if (parts.psych >= 15 && $("#beam-psych")) $("#beam-psych").classList.add("hit"); }, 1550);
  setTimeout(() => { if (verdict) { verdict.style.opacity = 1; verdict.textContent = caught ? "🛡 防线识破了你的造物" : "🩸 你的造物咬中了数据化身"; } }, 2100);
  setTimeout(() => { const b = $("#dbar"); if (b) b.style.width = finalDetect + "%"; }, 2200);
  let n = 0;
  const iv = setInterval(() => {
    n += Math.ceil(finalDetect / 24);
    if (n >= finalDetect) { n = finalDetect; clearInterval(iv); }
    const el = $("#dnum"); if (el) el.textContent = n;
  }, 40);
  const script = [caught
    ? `拦截成功，检出率 ${finalDetect}%（预测仪只估了 ${detect}%——防线总有一点你猜不到的余量）。`
    : `警报，检出率只有 ${finalDetect}%。它咬中化身了。`]
    .concat(tech.det > 0 ? ["技术手段「" + tech.name + "」贡献 " + parts.tech + " 点。伪装度 " + sl.stealth + " 削弱不了技术特征。"] : [])
    .concat(parts.skin > 0 ? ["皮肤「" + skin.name + "」经伪装度削弱后仍贡献 " + parts.skin + " 点。"] : ["皮肤被你的高伪装度完全洗白了。"])
    .concat(parts.psych > 0 ? ["心理「" + psych.name + "」在激进度 " + sl.aggro + " 下贡献 " + parts.psych + " 点。"] : [])
    .concat(sl.volume >= 60 ? ["投放量 " + sl.volume + " 太大，样本人群里一定有防线的眼线（+" + parts.vol + "）。"] : []);
  const know = used.slice().sort((x, y) => y.det - x.det)[0];
  if (know) script.push("记一条：" + know.knowledge);
  const nextBtn = $("#a-next");
  nextBtn.textContent = a.round < 3 ? "下一回合 →" : "查看复盘 →";
  nextBtn.style.display = "";
  setTimeout(() => Officer.play(script, true, caught ? "happy" : "alert"), 2400);
  nextBtn.onclick = () => {
    if (a.round < 3) { a.round++; a.result = null; }
    else { a.round = 1; a.result = reviewHTML(); }
    renderAttack();
  };
}
/* 自由撰写 */
const FREE_RULES = [
  { k: "urg", name: "紧迫限时", cls: "hl-urg", det: 14, re: /(立即|马上|尽快|\d+\s*分钟内|\d+\s*小时内|今日内|逾期|限时|过期|作废|停用)/g, know: "倒计时话术是为了压缩你的思考时间——先停一分钟，再走官方渠道核实。" },
  { k: "rew", name: "利诱返利", cls: "hl-rew", det: 16, re: /(返利|中奖|赔付|补偿|领取|补贴|佣金|免费领|双倍|日入)/g, know: "无来由的好处就是鱼钩——先问自己：为什么是我？" },
  { k: "aut", name: "冒充权威", cls: "hl-aut", det: 10, re: /(客服|官方|公安|检察院|法院|银行|教务处|财务处|资助中心|管理员|老师)/g, know: "身份可以随便编，核验渠道不能跟对方走。" },
  { k: "pi", name: "索要敏感信息", cls: "hl-pi", det: 15, re: /(验证码|密码|银行卡号|身份证号|手机号)/g, know: "任何环节索要验证码/密码，直接判定为诈骗。" },
  { k: "lnk", name: "可疑链接", cls: "hl-lnk", det: 18, re: /(t\.cn\/|dwz\.cn\/|url\.cn\/|bit\.ly\/|\d+\.\d+\.\d+\.\d+|http:\/\/)/g, know: "短链与裸 IP 无法预览真实指向，一律按不可信入口处理。" },
  { k: "att", name: "附件诱导", cls: "hl-att", det: 9, re: /(见附件|附件|点击下载|打开附件|启用宏)/g, know: "让你运行程序或启用宏的来信，基本可以直接删除。" },
];
function scanFreeText(text) {
  const hits = []; let det = 5;
  FREE_RULES.forEach((r) => {
    const ms = [...String(text).matchAll(r.re)].map((m) => m[0]);
    const uniq = [...new Set(ms)];
    if (uniq.length) { hits.push({ ...r, matches: uniq, n: ms.length }); det += r.det + Math.min(6, (ms.length - 1) * 2); }
  });
  return { hits, detect: Math.min(97, det) };
}
function highlightFree(text) {
  let out = esc(text);
  FREE_RULES.forEach((r) => {
    [...String(text).matchAll(r.re)].map((m) => m[0]).filter((v, i, a) => a.indexOf(v) === i).forEach((w) => {
      out = out.split(esc(w)).join('<span class="hl ' + r.cls + '">' + esc(w) + "</span>");
    });
  });
  return out;
}
function launchFreeAttack() {
  const a = S.atk;
  const text = (a.freeText || "").trim();
  if (text.length < 10) { const box = $("#free-warn"); if (box) box.textContent = "至少写 10 个字——你的'钓鱼邮件'太敷衍，防线懒得分析。"; return; }
  const { hits, detect } = scanFreeText(text);
  const caught = detect >= 60;
  a.history.push({ round: a.round, genes: ["自由撰写"], detect, caught, free: true });
  hits.forEach((h) => { a.freeHits = a.freeHits || {}; a.freeHits[h.k] = (a.freeHits[h.k] || 0) + h.n; });
  if (100 - detect > (a.best ?? -1)) a.best = 100 - detect;
  store();
  a.result = `
    <p class="atk-preview" style="color:var(--txt-dim)">你亲笔写的"钓鱼邮件"（命中特征已高亮）：<br>
      <span class="freebox" style="display:block">${highlightFree(text)}</span></p>
    <div class="detect-bar"><i id="dbar"></i></div>
    <div class="detect-num"><span id="dnum">0</span>%</div>
    <div class="verdict ${caught ? "caught" : "escape"}">${caught ? "🛡 AI 防线识破了你的手笔" : "🩸 你的手笔咬中了数据化身"}</div>
    <div class="officer-wrap" id="officer"></div>
    <div class="chips" id="officer-chips"></div>
    <button class="btn primary" style="text-align:center" id="a-next">${a.round < 3 ? "下一回合 →" : "查看复盘 →"}</button>`;
  renderAttack();
  setTimeout(() => { const b = $("#dbar"); if (b) b.style.width = detect + "%"; }, 60);
  let n = 0;
  const iv = setInterval(() => { n += Math.ceil(detect / 24); if (n >= detect) { n = detect; clearInterval(iv); } const el = $("#dnum"); if (el) el.textContent = n; }, 40);
  const script = [caught ? `手笔不小，但检出率 ${detect}%。你写的每个陷阱词，都在规则库里。` : `检出率只有 ${detect}%——你已经会写"看起来正常"的坏邮件了，这更说明训练的必要。`]
    .concat(hits.slice(0, 3).map((h) => `${h.name}命中「${h.matches.slice(0, 3).join("、")}」。${h.know}`));
  if (!hits.length) script.push("全文没有命中任何攻击特征——那它就只是一封普通邮件。加点'料'再来看防线反应。");
  setTimeout(() => Officer.play(script, true, caught ? "happy" : "alert"), 900);
}
function bindAttackResult() {
  const a = S.atk;
  const home = $("#a-home");
  if (home) home.onclick = () => { Officer.cancel(); renderHome(); show("home"); };
  const restart = $("#a-restart");
  if (restart) restart.onclick = () => {
    S.atk = { round: 1, mode: "genes", slots: {}, history: [], best: a.best, freeHits: a.freeHits, freeText: a.freeText, sl: a.sl };
    renderAttack();
  };
  if (document.querySelector("#officer") && a.result && a.result.includes("攻 防 复 盘") && !a._reviewSpoken) {
    a._reviewSpoken = true;
    Officer.play([
      "三回合结束。看看战报——你用过的每个基因，我都翻译成了一条防御知识。",
      `你的最佳逃脱检出率 ${a.best}%。提醒一句：逃脱不是荣誉，它度量的是现实中防线的缺口。`,
    ]);
  }
}
function reviewHTML() {
  const a = S.atk;
  const usedIds = [...new Set(a.history.flatMap((h) => h.genes))];
  return `
    <div class="xp-head good">攻 防 复 盘</div>
    <div class="card"><h3>三回合战报</h3><ul class="advice">${a.history.map((h) =>
      "<li>第" + h.round + "回合（" + h.genes.join(" + ") + "）：检出率 <b>" + h.detect + "%</b> " + (h.caught ? "· 被识破" : "· 逃脱") + "</li>").join("")}</ul></div>
    <div class="officer-wrap" id="officer"></div>
    <div class="chips" id="officer-chips"></div>
    <div class="card"><h3>你用过的每个基因，都是一条防御知识</h3><ul class="advice">${GENES.filter((g) => usedIds.includes(g.name)).map((g) =>
      "<li><b>" + g.name + "</b>：" + esc(g.knowledge) + "</li>").join("")}</ul></div>
    ${a.freeHits && Object.keys(a.freeHits).length ? '<div class="card"><h3>自由撰写·你触发过的检测规则</h3><ul class="advice">' +
      FREE_RULES.filter((r) => a.freeHits[r.k]).map((r) => "<li><b>" + r.name + "</b>（触发 " + a.freeHits[r.k] + " 次）：" + r.know + "</li>").join("") + "</ul></div>" : ""}
    <p style="text-align:center;color:var(--txt-dim);font-size:12px">最佳逃脱检出率：${a.best}%</p>
    <button class="btn primary" style="text-align:center" id="a-restart">再来三回合</button>
    <button class="btn" style="text-align:center" id="a-home">返回首页</button>`;
}


/* ---------- 错题本 ---------- */
function logWrong(qid, cat) {
  let wb = {};
  try { wb = JSON.parse(localStorage.getItem("shiyu_wrong") || "{}"); } catch (e) {}
  const e0 = wb[qid] || { cats: {}, n: 0 };
  e0.n++;
  if (cat) e0.cats[cat] = (e0.cats[cat] || 0) + 1;
  wb[qid] = e0;
  try { localStorage.setItem("shiyu_wrong", JSON.stringify(wb)); } catch (e) {}
}
function wrongBookHTML() {
  let wb = {};
  try { wb = JSON.parse(localStorage.getItem("shiyu_wrong") || "{}"); } catch (e) {}
  const ids = Object.keys(wb).sort((a, b) => wb[b].n - wb[a].n);
  if (!ids.length) return '<div class="card"><h3>错题本</h3><p style="font-size:12.5px;color:var(--txt-dim);line-height:1.9">暂无错题——分拣错误与拆解试错会自动归档到这里，并附对应破绽的知识点。</p></div>';
  const items = ids.map((id) => {
    const q = SAMPLE_MAP[id]; if (!q) return "";
    const e = wb[id];
    const cats = Object.keys(e.cats).length ? Object.keys(e.cats) : q.redflags.map((r) => r.category);
    const know = cats.slice(0, 2).map((cc) => {
      const rf = q.redflags.find((r) => r.category === cc);
      return rf ? "<b>" + CATEGORY_NAME[cc] + "</b>：" + esc(rf.explain) : "";
    }).filter(Boolean).join("<br>");
    const carrier = q.carrier === "email" ? "邮件" : q.carrier === "sms" ? "短信" : "网页";
    return '<div class="wb-item"><div class="wb-t">' + (q.phishing ? "🎣" : "✅") + " " + esc(q.scene) + " · " + carrier + " · 错 " + e.n + ' 次</div><div class="wb-d">' + (know || "识别要点见拆解讲解") + "</div></div>";
  }).join("");
  return '<div class="card"><h3>错题本（' + ids.length + "）<button id=\"wb-clear\" style=\"float:right;font-size:11px;color:var(--red);background:none;border:1px solid rgba(255,84,112,.4);border-radius:6px;padding:2px 8px\">清空</button></h3>" + items + "</div>";
}

/* ---------- 日期工具（战绩海报用） ---------- */
function dateStr(d) { const x = d || new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); }

/* ---------- 战绩海报 ---------- */
function buildPoster() {
  const r = S.report; if (!r) { alert("先完成一轮拦截战再生成海报"); return; }
  const cv = document.createElement("canvas");
  cv.width = 750; cv.height = 1200;
  const c = cv.getContext("2d");
  const bg = c.createLinearGradient(0, 0, 0, 1200);
  bg.addColorStop(0, "#0C1424"); bg.addColorStop(1, "#070B14");
  c.fillStyle = bg; c.fillRect(0, 0, 750, 1200);
  c.fillStyle = "rgba(53,224,200,.06)"; c.beginPath(); c.arc(375, 210, 260, 0, 7); c.fill();
  c.textAlign = "center";
  c.fillStyle = "#7E8FA8"; c.font = "600 30px sans-serif"; c.fillText("S H I Y U", 375, 90);
  c.font = "70px sans-serif"; c.fillText("🐟", 375, 210);
  c.fillStyle = "#FFFFFF"; c.font = "bold 54px sans-serif"; c.fillText("识渔计划 · 训练战报", 375, 300);
  c.fillStyle = "#FFB84D"; c.font = "bold 104px sans-serif"; c.fillText(r.rank, 375, 430);
  c.fillStyle = "#7E8FA8"; c.font = "26px sans-serif";
  c.fillText("战绩 " + (r.score ?? "--") + " 分 · 综合 " + r.avg + " · 前测 " + (r.pre ?? "--") + "% → 后测 " + (r.post ?? "--") + "%", 375, 480);
  const cx = 375, cy = 720, R = 190;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  for (let ring = 1; ring <= 4; ring++) {
    c.beginPath();
    for (let i = 0; i <= 5; i++) { const a = ang(i % 5), rr = (R * ring) / 4; i ? c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : c.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
    c.strokeStyle = "rgba(53,224,200,.2)"; c.stroke();
  }
  c.beginPath();
  DIMENSIONS.forEach((d, i) => { const a = ang(i), rr = (R * r.dims[d.key]) / 100; i ? c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : c.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); });
  c.closePath(); c.fillStyle = "rgba(53,224,200,.25)"; c.fill(); c.strokeStyle = "#35E0C8"; c.lineWidth = 3; c.stroke();
  c.font = "24px sans-serif"; c.fillStyle = "#D7E3F4";
  DIMENSIONS.forEach((d, i) => { const a = ang(i); c.fillText(d.name + " " + r.dims[d.key], cx + (R + 62) * Math.cos(a), cy + (R + 62) * Math.sin(a) + 8); });
  c.fillStyle = "#35E0C8"; c.font = "bold 34px sans-serif";
  c.fillText("不教结论，练肌肉记忆", 340, 1010);
  c.fillStyle = "#7E8FA8"; c.font = "22px sans-serif";
  c.fillText(dateStr() + " · 长春理工大学 · 计算机科学技术学院", 375, 1055);
  c.fillText("本平台所有样本均为虚构，仅用于识别训练", 375, 1090);
  c.strokeStyle = "rgba(53,224,200,.5)"; c.strokeRect(600, 990, 115, 115);
  c.fillStyle = "#7E8FA8"; c.font = "18px sans-serif"; c.fillText("扫码开玩", 657, 1158);
  const url = cv.toDataURL("image/png");
  $("#poster-img").src = url;
  $("#poster-dl").href = url;
  $("#poster-mask").classList.remove("hidden");
}

/* ---------- 画像 / 首页 / 初始化 ---------- */
function renderProfile() {
  const b = $("#p-body");
  if (!S.report) {
    b.innerHTML = '<div class="card"><p style="font-size:13px;line-height:2;color:var(--txt-dim)">还没有战绩记录。<br>打一轮「拦截战」即可生成五维风险画像与段位。</p></div>';
    return;
  }
  const r = S.report, dims = r.dims;
  b.innerHTML = `
    <div class="rankline">段位：<b>${r.rank}</b> · 综合 ${r.avg}${r.score != null ? " · 战绩 " + r.score + " 分" : ""}</div>
    <div class="card">
      <h3>AI 训练诊断 <span class="ai-src" id="p-ai-src">AI 生成中…</span><button class="ai-regen" id="p-ai-regen">↻ 重新诊断</button></h3>
      <div class="ai-body" id="p-ai-body"></div>
    </div>
    <div class="radar-wrap"><canvas id="radar-p" width="320" height="300"></canvas></div>
    <div class="card"><h3>维度得分</h3><ul class="advice">${DIMENSIONS.map((d) => "<li><b>" + d.name + "</b>：" + dims[d.key] + " / 100</li>").join("")}</ul></div>
    ${r.legit && r.legit.length ? '<p style="text-align:center;color:var(--txt-dim);font-size:12px">正常样本误报：' + r.legit.filter((x) => x.mistaken).length + " / " + r.legit.length + "</p>" : ""}
    ${S.atk && S.atk.best != null ? '<p style="text-align:center;color:var(--txt-dim);font-size:12px">造浪者最佳逃脱检出率：' + S.atk.best + "%</p>" : ""}
    ${wrongBookHTML()}`;
  drawRadar($("#radar-p"), dims);
  if (typeof Analyst !== "undefined") {
    const prb = $("#p-ai-regen");
    if (prb) prb.onclick = () => Analyst.render("p-ai-body", "p-ai-regen", true);
    Analyst.render("p-ai-body", "p-ai-regen");
  }
  const wclear = $("#wb-clear");
  if (wclear) wclear.onclick = () => { localStorage.removeItem("shiyu_wrong"); renderProfile(); };
}
function renderHome() {
  const el = $("#home-rank");
  el.innerHTML = S.report
    ? '段位 <b>' + S.report.rank + "</b> · 战绩 " + (S.report.score ?? "--") + ' · <span style="color:var(--txt-dim)">再战一轮刷新画像</span>'
    : '<span style="color:var(--txt-dim)">尚无画像 · 完成一场拦截战后生成</span>';
}
function init() {
  restore();
  Officer.initVoice();
  const pet = $("#hero-pet");
  if (pet) pet.innerHTML = officerChar();
  renderHome();
  $("#b-start").onclick = () => startGame();
  $("#b-attack").onclick = () => startAttack(true);
  $("#b-profile").onclick = () => { renderProfile(); show("profile"); };
  $("#b-about").onclick = () => show("about");
  ["b-home1", "b-home3", "r-home", "p-home"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.onclick = () => { Officer.cancel(); renderHome(); show("home"); };
  });
  $("#b-report-attack").onclick = () => startAttack(true);
  const vb = $("#a-voice");
  if (vb) vb.onclick = () => Officer.toggle();
  Officer.syncBtn();
  $("#g-home").onclick = () => {
    if (G && !G.locked && $("#g-card") && !confirm("结束本轮并返回主页？（进度不计入报告）")) return;
    Officer.cancel(); clearInterval(G && G.tick);
    renderHome(); show("home");
  };
  $("#a-home-btn").onclick = () => { Officer.cancel(); renderHome(); show("home"); };
  $("#b-poster").onclick = () => buildPoster();
  $("#poster-close").onclick = () => $("#poster-mask").classList.add("hidden");
  agentInit();
  $("#b-reset").onclick = () => {
    if (!confirm("确认清空全部战绩与画像？")) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    if (typeof Analyst !== "undefined") { try { localStorage.removeItem(Analyst.LS_CACHE); } catch (e) {} }
    S = { dims: freshDims(), missCat: {}, report: null, atk: { round: 1, mode: "genes", slots: {}, history: [], best: null, freeHits: {}, freeText: "", sl: { stealth: 50, aggro: 50, volume: 30 } } };
    renderProfile(); renderHome();
  };
}
document.addEventListener("DOMContentLoaded", init);
