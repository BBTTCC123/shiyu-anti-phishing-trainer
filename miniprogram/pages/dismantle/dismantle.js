// 页面：拆解台（证物拖放归类）
const D = require("../../utils/data");
const app = getApp();

Page({
  data: { chips: [], slots: [], done: 0, verdicts: null, curIdx: 0 },

  onLoad() {
    const ids = app.globalData.pendingDismantle || [];
    this.list = ids.map((id) => D.SAMPLES.find((s) => s.id === id)).filter(Boolean);
    if (!this.list.length) { this.finishAll(); return; }
    this.chipData = [];
    this.list.forEach((q) => q.redflags.forEach((r, ri) =>
      this.chipData.push({ q, r, tries: 0, done: false })));
    this.setData({
      curIdx: 0,
      chips: this.chipData.map((c, i) => ({
        i, label: this.label(c), left: 30 + (i % 3) * 200, top: Math.floor(i / 3) * 90, done: false,
      })),
      slots: Object.keys(D.CATEGORY_NAME).map((k) => ({ k, name: D.CATEGORY_NAME[k], placed: [] })),
      done: 0,
    });
    this.cacheRects();
  },
  label(c) {
    const q = c.q, r = c.r;
    let p = (q.parts || []).find((x) => x.id === r.target);
    if (r.target === (q.meta && q.meta.addrId)) return "发件域名 " + q.meta.addr.split("@").pop();
    if (r.target === (q.meta && q.meta.urlId)) return "地址栏 " + q.meta.url;
    if (!p) return r.category;
    if (p.t === "link") return "链接 " + p.text;
    if (p.t === "attach") return "附件 " + p.text;
    if (p.t === "qr") return "二维码";
    if (p.t === "field") return "表单 " + p.text;
    return (p.html || "").replace(/<[^>]+>/g, "").slice(0, 12);
  },
  cacheRects() {
    const q = wx.createSelectorQuery();
    q.selectAll(".slot").boundingClientRect();
    q.select("#board").boundingClientRect();
    q.exec((res) => {
      this.slotRects = res[0] || [];
      this.boardRect = res[1] || { left: 0, top: 0 };
    });
  },
  onChipStart(e) {
    const i = e.currentTarget.dataset.i;
    if (this.chipData[i].done) return;
    this.dragIdx = i;
    this.sx = e.touches[0].clientX; this.sy = e.touches[0].clientY;
    this.base = { left: this.data.chips[i].left, top: this.data.chips[i].top };
  },
  onChipMove(e) {
    if (this.dragIdx == null) return;
    const dx = e.touches[0].clientX - this.sx, dy = e.touches[0].clientY - this.sy;
    const key = "chips[" + this.dragIdx + "]";
    this.setData({ [key + ".left"]: this.base.left + dx, [key + ".top"]: this.base.top + dy });
    this.pointer = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  },
  onChipEnd() {
    if (this.dragIdx == null) return;
    const i = this.dragIdx; this.dragIdx = null;
    const c = this.chipData[i];
    const px = (this.pointer || {}).x || 0, py = (this.pointer || {}).y || 0;
    const hit = (this.slotRects || []).find((b) => px > b.left && px < b.right && py > b.top && py < b.bottom);
    if (!hit) { this.setData({ ["chips[" + i + ".left"]: this.base.left, ["chips[" + i + ".top"]: this.base.top }); return; }
    const cat = hit.dataset.cat;
    c.tries++;
    if (cat === c.r.category) {
      c.done = true;
      const g = app.globalData;
      const dim = D.DIM_OF_CATEGORY[cat];
      g.dims[dim][c.tries > 1 ? "miss" : "hit"]++;
      if (c.tries > 1) { g.missCat[cat] = (g.missCat[cat] || 0) + 1; app.logWrong(c.q.id, cat); }
      app.save();
      const slotIdx = this.data.slots.findIndex((s) => s.k === cat);
      this.setData({
        ["chips[" + i + "].done"]: true,
        ["slots[" + slotIdx + "].placed"]: this.data.slots[slotIdx].placed.concat(
          { label: this.data.chips[i].label.slice(0, 10), ok: c.tries === 1 }),
        done: this.data.done + 1,
      });
      wx.vibrateShort({ type: "light" });
      if (this.data.done + 1 >= this.chipData.length) setTimeout(() => this.showVerdict(), 350);
    } else {
      const key = "chips[" + i + "]";
      this.setData({ [key + ".left"]: this.base.left, [key + ".top"]: this.base.top });
      wx.showToast({ title: "放错了：" + this.data.chips[i].label.slice(0, 8) + " 不属于「" + D.CATEGORY_NAME[cat] + "」", icon: "none" });
    }
  },
  chipTap(e) {
    const i = e.currentTarget.dataset.i;
    wx.showToast({ title: "证物：" + this.data.chips[i].label.slice(0, 14), icon: "none" });
  },
  showVerdict() {
    const verdicts = this.chipData.map((c) => ({
      ok: c.tries === 1, cat: D.CATEGORY_NAME[c.r.category], label: this.label(c), explain: c.r.explain }));
    const missed = verdicts.filter((v) => !v.ok).length;
    app.globalData.score += verdicts.filter((v) => v.ok).length * 50;
    this.setData({ verdicts, missedTxt: missed ? "有 " + missed + " 个证物试错后归位" : "全部首放命中" });
  },
  next() {
    app.globalData.pendingDismantle = [];
    this.finishAll();
  },
  finishAll() {
    const g = app.globalData;
    const acc = (wi) => { const a = g.answers[wi] || []; return a.length ? Math.round(100 * a.filter((x) => x.correct).length / a.length) : null; };
    const dims = {};
    D.DIMENSIONS.forEach((d) => {
      const v = g.dims[d.key];
      dims[d.key] = Math.min(98, Math.max(5, Math.round(50 + v.hit * 11 - v.miss * 7 - v.fa * 4)));
    });
    const avg = Math.round(D.DIMENSIONS.reduce((s, d) => s + dims[d.key], 0) / 5);
    g.report = { pre: acc(0), post: acc(3), dims, avg, rank: D.RANKS.find((r) => avg >= r.min).name, score: g.score, bestCombo: g.bestCombo };
    app.save();
    wx.redirectTo({ url: "/pages/profile/profile?fresh=1" });
  },
});
