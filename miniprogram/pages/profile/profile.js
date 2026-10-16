// 页面：画像（雷达 + 报告 + 错题本）
const D = require("../../utils/data");
const app = getApp();

Page({
  data: { report: null, dimsTxt: [], wrongs: [], preTxt: "--", postTxt: "--" },

  onLoad(opts) {
    this.fresh = opts.fresh === "1";
  },
  onShow() {
    const g = app.globalData;
    const r = g.report;
    this.setData({
      report: r,
      preTxt: r && r.pre != null ? r.pre + "%" : "--",
      postTxt: r && r.post != null ? (r.post + "%") : "--",
      dimsTxt: r ? D.DIMENSIONS.map((d) => ({ name: d.name, v: r.dims[d.key] })) : [],
      wrongs: this.wrongList(),
    });
    if (r) this.drawRadar(r.dims);
  },
  wrongList() {
    let wb = {}; try { wb = wx.getStorageSync("shiyu_wrong") || {}; } catch (e) {}
    return Object.keys(wb).sort((a, b) => wb[b].n - wb[a].n).map((id) => {
      const q = D.SAMPLES.find((s) => s.id === id);
      if (!q) return null;
      const e0 = wb[id];
      const cats = Object.keys(e0.cats).length ? Object.keys(e0.cats) : q.redflags.map((x) => x.category);
      const know = cats.slice(0, 2).map((c) => {
        const rf = q.redflags.find((x) => x.category === c);
        return rf ? D.CATEGORY_NAME[c] + "：" + rf.explain : "";
      }).filter(Boolean).join("；");
      return { scene: q.scene, n: e0.n, know: know || "见拆解讲解" };
    }).filter(Boolean);
  },
  drawRadar(dims) {
    const q = wx.createSelectorQuery();
    q.select("#radar").fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return;
      const cv = res[0].node;
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2;
      const w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const c = cv.getContext("2d");
      c.scale(dpr, dpr);
      const cx = w / 2, cy = h / 2 + 4, R = Math.min(w, h) / 2 - 42;
      const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      for (let ring = 1; ring <= 4; ring++) {
        c.beginPath();
        for (let i = 0; i <= 5; i++) { const a = ang(i % 5), rr = (R * ring) / 4; i ? c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : c.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
        c.strokeStyle = "rgba(53,224,200,.2)"; c.stroke();
      }
      c.font = "10px sans-serif"; c.fillStyle = "#7e8fa8"; c.textAlign = "center";
      D.DIMENSIONS.forEach((d, i) => { const a = ang(i); c.fillText(d.name, cx + (R + 24) * Math.cos(a), cy + (R + 24) * Math.sin(a) + 3); });
      c.beginPath();
      D.DIMENSIONS.forEach((d, i) => { const a = ang(i), rr = (R * dims[d.key]) / 100; i ? c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : c.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); });
      c.closePath(); c.fillStyle = "rgba(53,224,200,.25)"; c.fill(); c.strokeStyle = "#35e0c8"; c.lineWidth = 2; c.stroke();
    });
  },
  clearWrongs() {
    wx.showModal({ title: "清空错题本", content: "确认清空全部错题记录？", success: (r) => { if (r.confirm) { try { wx.removeStorageSync("shiyu_wrong"); } catch (e) {} this.onShow(); } } });
  },
  goHome() { wx.reLaunch({ url: "/pages/index/index" }); },
});
