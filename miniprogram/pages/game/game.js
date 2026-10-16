// 页面：拦截战（拖拽分拣）
const D = require("../../utils/data");
const app = getApp();

Page({
  data: {
    phase: "", idx: "1/5", timer: 100, urgent: false,
    card: null, dx: 0, dy: 0, dragging: false,
    badge: null, lives: 100, score: 0, comboTxt: "",
    queueDots: "",
  },
  onLoad() {
    this.startRun();
  },
  startRun() {
    const g = app.globalData;
    g.queue = D.WAVES;
    g.waveIdx = 0; g.cardIdx = 0; g.lives = 100; g.score = 0; g.combo = 0; g.bestCombo = 0;
    g.answers = g.queue.map(() => []);
    this.setData({ lives: 100, score: 0, comboTxt: "" });
    this.nextCard();
  },
  nextCard() {
    const g = app.globalData;
    const w = g.queue[g.waveIdx];
    if (g.cardIdx >= w.ids.length) { this.endWave(); return; }
    const q = D.SAMPLES.find((s) => s.id === w.ids[g.cardIdx]);
    this.q = q; this.locked = false;
    const secs = [12, 9, 7][q.difficulty - 1];
    this.t0 = Date.now(); this.secs = secs;
    clearInterval(this.tickIv);
    this.tickIv = setInterval(() => this.tick(), 200);
    this.tick();
    this.setData({
      phase: w.name, idx: (g.cardIdx + 1) + "/" + w.ids.length,
      card: this.cardFace(q), dx: 0, dy: 0, badge: null,
      queueDots: "●".repeat(w.ids.length - g.cardIdx - 1) || "○",
    });
  },
  tick() {
    if (this.locked) { clearInterval(this.tickIv); return; }
    const left = this.secs - (Date.now() - this.t0) / 1000;
    const pct = Math.max(0, (left / this.secs) * 100);
    if (Math.round(pct) !== this.data.timer || (left < this.secs * 0.3) !== this.data.urgent) {
      this.setData({ timer: Math.round(pct), urgent: left < this.secs * 0.3 });
    }
    if (left <= 0) { clearInterval(this.tickIv); if (!this.locked) this.sortCard(null); }
  },
  cardFace(q) {
    const bits = q.parts.filter((p) => ["link", "attach", "qr"].includes(p.t)).map((p) =>
      p.t === "link" ? { k: "link", v: p.text } : p.t === "attach" ? { k: "att", v: p.text } : { k: "qr", v: p.text });
    const body = q.parts.filter((p) => p.t === "p").map((p) => p.html.replace(/<[^>]+>/g, "")).join("").slice(0, 90);
    const head = q.carrier === "email" ? { k: "email", from: q.meta.from, addr: q.meta.addr, subj: q.meta.subj }
      : q.carrier === "sms" ? { k: "sms", phone: q.meta.phone }
      : { k: "web", url: q.meta.url, subj: q.meta.title };
    return { head, bits, body, phish: q.phishing };
  },
  onCardStart(e) {
    if (this.locked) return;
    this.sx = e.touches[0].clientX; this.sy = e.touches[0].clientY;
    this.setData({ dragging: true });
  },
  onCardMove(e) {
    if (this.locked || this.sx == null) return;
    const dx = e.touches[0].clientX - this.sx, dy = e.touches[0].clientY - this.sy;
    const rd = Math.round(dx), rdY = Math.round(dy);
    if (rd !== this.data.dx || rdY !== this.data.dy) this.setData({ dx: rd, dy: rdY });
  },
  onCardEnd(e) {
    if (this.locked) return;
    this.setData({ dragging: false });
    const dx = this.data.dx;
    if (dx < -70) this.sortCard("phish");
    else if (dx > 70) this.sortCard("safe");
    else this.setData({ dx: 0, dy: 0 });
    this.sx = null;
  },
  sortCard(side) {
    if (this.locked) return;
    this.locked = true; clearInterval(this.tickIv);
    const g = app.globalData;
    const q = this.q, w = g.queue[g.waveIdx];
    const correct = side === (q.phishing ? "phish" : "safe");
    g.answers[g.waveIdx].push({ qid: q.id, correct });
    if (correct) {
      g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
      g.score += 100 + (g.combo - 1) * 20;
      this.setData({ badge: { ok: true, txt: "✓ 拦截正确" + (g.combo >= 3 ? " · 连击x" + g.combo : "") }, score: g.score, comboTxt: g.combo >= 2 ? "连击x" + g.combo : "" });
    } else {
      g.combo = 0; g.lives = Math.max(0, g.lives - 15);
      app.logWrong(q.id, null);
      this.setData({ badge: { ok: false, txt: side === null ? "⏱ 超时漏网" : "✗ 分拣错误" }, lives: g.lives, comboTxt: "" });
      wx.vibrateShort({ type: "medium" });
    }
    const reveal = w.reveal ? " · 真实身份：" + (q.phishing ? "钓鱼" : "正常") : "";
    setTimeout(() => {
      this.setData({ badge: null, dx: 0, dy: 0 });
      g.cardIdx++;
      setTimeout(() => this.nextCard(), 250);
    }, w.reveal ? 900 : 500);
    if (reveal) this.setData({ "badge.txt": this.data.badge.txt + reveal });
  },
  endWave() {
    const g = app.globalData;
    g.waveIdx++;
    if (g.waveIdx >= g.queue.length) { this.finishRun(); return; }
    g.cardIdx = 0; this.nextCard();
  },
  finishRun() {
    const g = app.globalData;
    clearInterval(this.tickIv);
    // 中波需拆解
    const phish = [];
    g.queue.forEach((w, wi) => {
      if (!w.reveal) return;
      w.ids.forEach((id) => { const q = D.SAMPLES.find((s) => s.id === id); if (q && q.phishing) phish.push(id); });
    });
    if (phish.length) {
      g.pendingDismantle = phish;
      wx.redirectTo({ url: "/pages/dismantle/dismantle" });
    } else {
      this.finalReport();
    }
  },
  finalReport() {
    const g = app.globalData;
    const acc = (wi) => { const a = g.answers[wi] || []; return a.length ? Math.round(100 * a.filter((x) => x.correct).length / a.length) : null; };
    const dims = {};
    D.DIMENSIONS.forEach((d) => {
      const v = g.dims[d.key];
      dims[d.key] = Math.min(98, Math.max(5, Math.round(50 + v.hit * 11 - v.miss * 7 - v.fa * 4)));
    });
    const avg = Math.round(D.DIMENSIONS.reduce((s, d) => s + dims[d.key], 0) / 5);
    g.report = { pre: acc(0), post: acc(g.queue.length - 1), dims, avg, rank: D.RANKS.find((r) => avg >= r.min).name, score: g.score, bestCombo: g.bestCombo };
    app.save();
    wx.redirectTo({ url: "/pages/profile/profile?fresh=1" });
  },
  onUnload() { clearInterval(this.tickIv); },
});
