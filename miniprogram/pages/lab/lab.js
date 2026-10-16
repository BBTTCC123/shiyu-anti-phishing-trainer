// 页面：造浪者实验室（基因卡点选装配 + 滑杆 + 投放 + 自由撰写）
const D = require("../../utils/data");

Page({
  data: {
    mode: "genes", slots: { skin: null, psych: null, tech: null },
    genes: D.GENES, groups: D.GENE_GROUPS,
    sl: { stealth: 50, aggro: 50, volume: 30 },
    pred: null, result: null, freeText: "", round: 1, history: [],
  },

  onLoad() { this.sl = { stealth: 50, aggro: 50, volume: 30 }; this.slots = { skin: null, psych: null, tech: null }; this.round = 1; this.history = []; },
  switchMode(e) { this.setData({ mode: e.currentTarget.dataset.m, result: null }); },
  tapGene(e) {
    const g = D.GENES.find((x) => x.id === e.currentTarget.dataset.g);
    this.slots[g.group] = this.slots[g.group] === g.id ? null : g.id;
    this.setData({ slots: this.slots });
    this.updatePred();
  },
  onSlide(e) {
    const k = e.currentTarget.dataset.k;
    this.sl[k] = +e.detail.value;
    this.setData({ sl: this.sl });
    this.updatePred();
  },
  updatePred() {
    const used = D.GENE_GROUPS.map((g) => D.GENES.find((x) => x.id === this.slots[g.key]));
    if (used.some((x) => !x)) { this.setData({ pred: null }); return; }
    const tech = used.find((g) => g.group === "tech").det;
    const skin = used.find((g) => g.group === "skin").det * (1 - this.sl.stealth / 160);
    const psych = used.find((g) => g.group === "psych").det * (0.55 + this.sl.aggro / 90);
    const vol = this.sl.volume * 0.12;
    this.setData({ pred: Math.round(Math.min(97, 5 + tech + skin + psych + vol)) });
  },
  launch() {
    const used = D.GENE_GROUPS.map((g) => D.GENES.find((x) => x.id === this.slots[g.key]));
    if (used.some((x) => !x)) return;
    const parts = {
      tech: used.find((g) => g.group === "tech").det,
      skin: Math.round(used.find((g) => g.group === "skin").det * (1 - this.sl.stealth / 160)),
      psych: Math.round(used.find((g) => g.group === "psych").det * (0.55 + this.sl.aggro / 90)),
      vol: Math.round(this.sl.volume * 0.12),
    };
    const noise = Math.round((Math.random() - 0.5) * 14);
    const detect = Math.max(5, Math.min(97, 5 + parts.tech + parts.skin + parts.psych + parts.vol + noise));
    this.pushHistory(used.map((g) => g.name), detect);
    const comments = [
      detect >= 60 ? "拦截成功，检出率 " + detect + "%。你调的每一根滑杆，防线都看得见。" : "警报——检出率只有 " + detect + "%，它咬中化身了。",
      "技术「" + used.find((g) => g.group === "tech").name + "」贡献 " + parts.tech + "：技术特征不受伪装度影响。",
      parts.skin > 0 ? "皮肤贡献 " + parts.skin + "（伪装度已削弱）。" : "皮肤被你的高伪装度完全洗白。",
      "心理在激进度 " + this.sl.aggro + " 下贡献 " + parts.psych + "。",
    ];
    this.setData({ result: { detect, caught: detect >= 60, comments, kind: "genes" } });
  },
  onFreeInput(e) { this.setData({ freeText: e.detail.value }); },
  launchFree() {
    const text = (this.data.freeText || "").trim();
    if (text.length < 10) { wx.showToast({ title: "至少写10个字", icon: "none" }); return; }
    const hits = [];
    let det = 5;
    D.FREE_RULES.forEach((r) => {
      const ms = [...text.matchAll(r.re)].map((m) => m[0]);
      const uniq = [...new Set(ms)];
      if (uniq.length) { hits.push({ name: r.name, words: uniq.slice(0, 3).join("、"), know: r.know }); det += r.det + Math.min(6, (ms.length - 1) * 2); }
    });
    const detect = Math.min(97, det);
    this.pushHistory(["自由撰写"], detect);
    const comments = [detect >= 60 ? "检出率 " + detect + "%——你写的每个陷阱词都在规则库里。" : "检出率仅 " + detect + "%，你已经会写看起来正常的坏邮件了。"]
      .concat(hits.slice(0, 3).map((h) => h.name + "命中「" + h.words + "」。" + h.know));
    if (!hits.length) comments.push("全文未命中任何攻击特征——加点料再看防线反应。");
    this.setData({ result: { detect, caught: detect >= 60, comments, kind: "free" } });
  },
  pushHistory(genes, detect) {
    this.history.push({ round: this.round, genes, detect, caught: detect >= 60 });
    this.setData({ history: this.history });
  },
  nextRound() {
    if (this.round < 3) { this.round++; this.setData({ result: null, round: this.round }); }
    else { this.round = 1; this.setData({ result: null, review: true }); }
  },
  again() { this.onLoad(); this.setData({ review: false, result: null, history: [] }); },
  reviewList() {
    return this.history.map((h) => "第" + h.round + "回合（" + h.genes.join("+") + "）检出率 " + h.detect + "% " + (h.caught ? "被识破" : "逃脱"));
  },
});
