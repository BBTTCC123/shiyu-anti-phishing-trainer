// 页面：首页
const D = require("../../utils/data");
Page({
  data: { rank: "", scoreTxt: "" },
  onShow() {
    const g = getApp().globalData;
    this.setData({
      rank: g.report ? "段位 " + g.report.rank + " · 战绩 " + (g.report.score ?? "--") : "尚无画像 · 完成一场拦截战后生成",
    });
  },
  goCampaign() { wx.navigateTo({ url: "/pages/game/game" }); },
  goLab() { wx.navigateTo({ url: "/pages/lab/lab" }); },
  goProfile() { wx.navigateTo({ url: "/pages/profile/profile" }); },
  goAgent() { wx.navigateTo({ url: "/pages/agent/agent" }); },
});
