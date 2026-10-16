// 页面：AI 智能体「渔安」（云端研判 + 离线兜底，与 H5 同体验）
const core = require("../../utils/agentCore");

Page({
  data: {
    mode: "diag", badge: "",
    msgs: [], input: "", diagText: "",
    quick: ["导师微信让我垫付课题经费到卡号", "网友带买币大额无法提现", "客服说理赔让我下APP共享屏幕"],
  },

  onLoad() {
    this.setData({ badge: core.cloudReady() ? core.provider + " 已接入" : "离线引擎" });
    this.push("a", "渔安在线。把你的遭遇原样发给我——任何内容都能研判：判定 / 可疑要素 / 剧本预测 / 行动建议。");
  },
  switchTab(e) { this.setData({ mode: e.currentTarget.dataset.t }); },
  onDiagInput(e) { this.setData({ diagText: e.detail.value }); },
  push(role, text) {
    const msgs = this.data.msgs.concat([{ role, text }]);
    this.setData({ msgs });
    this.scrollBottom();
  },
  scrollBottom() { setTimeout(() => wx.pageScrollTo || wx.createSelectorQuery().select("#agentEnd").scrollIntoView(), 50); },
  typeIn(text) {
    return new Promise((resolve) => {
      const idx = this.data.msgs.length - 1;
      let i = 0;
      const iv = setInterval(() => {
        i += 2;
        const key = "msgs[" + idx + "].text";
        this.setData({ [key]: text.slice(0, i) });
        if (i >= text.length) {
          clearInterval(iv);
          const lines = text.split("\n");
          const first = lines.shift() || "";
          const m = first.match(/(高危|中危|低危)/);
          const patch = { ["msgs[" + idx + "].text"]: "", ["msgs[" + idx + "].done"]: 1,
            ["msgs[" + idx + "].head"]: first, ["msgs[" + idx + "].body"]: lines.join("\n") };
          if (m) patch["msgs[" + idx + "].lvcls"] = m[1] === "高危" ? "lv-high" : m[1] === "中危" ? "lv-mid" : "lv-low";
          this.setData(patch);
          resolve();
        }
      }, 18);
    });
  },
  runCloud(sys, user, fallback) {
    return new Promise((resolve) => {
      if (!core.cloudReady()) return resolve({ text: fallback(), src: "local" });
      core.cloudChat(sys, user)
        .then((t) => resolve({ text: t, src: "cloud" }))
        .catch((e) => resolve({ text: "（网络波动，已用离线引擎应答）\n\n" + fallback(), src: "local" }));
    });
  },
  async diagnose() {
    const text = (this.data.diagText || "").trim();
    if (text.length < 8) { wx.showToast({ title: "再多写几个字（至少8字）", icon: "none" }); return; }
    this.setData({ diagText: "", mode: "chat" });
    this.push("u", text);
    this.push("a", "正在研判…");
    const r = await this.runCloud(core.DIAG_SYS, "【遭遇研判】" + text, () => core.diagLocalText(text));
    await this.typeIn(r.text);
  },
  quickTap(e) {
    this.setData({ diagText: e.currentTarget.dataset.q });
    this.diagnose();
  },
  onInput(e) { this.setData({ input: e.detail.value }); },
  async send() {
    const q = (this.data.input || "").trim();
    if (!q) return;
    this.setData({ input: "" });
    this.push("u", q);
    this.push("a", "…");
    const r = await this.runCloud(core.chatSys(), q, () => core.localAnswer(q));
    await this.typeIn(r.text);
  },
});
