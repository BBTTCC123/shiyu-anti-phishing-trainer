App({
  globalData: {
    queue: [],                 // 本局波次 [{name, ids, reveal}]
    waveIdx: 0, cardIdx: 0,
    lives: 100, score: 0, combo: 0, bestCombo: 0,
    answers: [],               // 每波 [{qid, correct}]
    report: null,              // {pre,post,dims,avg,rank,score}
    dims: null, missCat: {},
    pendingDismantle: [],      // 待拆解的钓鱼样本 id
  },
  onLaunch() {
    this.restore();
  },
  restore() {
    try {
      const d = wx.getStorageSync("shiyu_mp") || {};
      this.globalData.report = d.report || null;
      this.globalData.dims = d.dims || this.freshDims();
      this.globalData.missCat = d.missCat || {};
    } catch (e) {
      this.globalData.dims = this.freshDims();
    }
  },
  freshDims() {
    const d = {};
    const D = require("./utils/data").DIMENSIONS;
    D.forEach((x) => (d[x.key] = { hit: 0, miss: 0, fa: 0 }));
    return d;
  },
  save() {
    const g = this.globalData;
    try {
      wx.setStorageSync("shiyu_mp", { report: g.report, dims: g.dims, missCat: g.missCat });
    } catch (e) {}
  },
  logWrong(qid, cat) {
    let wb = {};
    try { wb = wx.getStorageSync("shiyu_wrong") || {}; } catch (e) {}
    const e0 = wb[qid] || { cats: {}, n: 0 };
    e0.n++;
    if (cat) e0.cats[cat] = (e0.cats[cat] || 0) + 1;
    wb[qid] = e0;
    try { wx.setStorageSync("shiyu_wrong", wb); } catch (e) {}
  },
});
