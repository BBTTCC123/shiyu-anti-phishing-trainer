/* 智能体核心：云端 DeepSeek（非流式，打字机由前端模拟）+ 离线规则兜底（与 H5 同源） */
const CFG = require("./config");
const D = require("./data");

function decodeKey() {
  try {
    const buf = wx.base64ToArrayBuffer(CFG.agent.enc);
    const salt = CFG.agent.salt;
    let s = "";
    for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i] ^ salt.charCodeAt(i % salt.length));
    return s;
  } catch (e) { return ""; }
}
function cloudReady() {
  return !!(CFG.agent.base && CFG.agent.model && CFG.agent.enc);
}

const DIAG_SYS = "你是一名资深反诈骗研判警官（AI）。用户会用日常语言描述自己的遭遇或收到的信息，无论内容多模糊，你都要基于常识与反诈经验给出判断。严格按以下四段输出（中文，总300字内，第一行必须是判定行）：\n" +
  "【判定：高危|中危|低危（风险分 X/99）】一句话结论。\n" +
  "■ 可疑要素：逐条引用用户原话中的词语并说明为何危险（没有就写“未发现明显要素”，并可追问1个关键缺失信息）。\n" +
  "■ 剧本研判：若吻合已知骗局点名剧本、描述典型套路并预测对方下一步；不吻合则说明更可能的真相。\n" +
  "■ 立即行动：给出2-4条具体动作，涉及资金务必提醒96110/110。语气果断、不寒暄。";

function chatSys() {
  const g = getApp().globalData;
  let ctx = "无训练数据";
  if (g.report) ctx = "段位" + g.report.rank + "，战绩" + g.report.score + "分";
  return "你是反钓鱼训练游戏《识渔计划》里的AI安全官「渔安」。用中文简短口语化回答（150字内），话题限定：反诈识别、网络安全、本作品玩法。用户训练状态：" + ctx + "。拿不准建议拨96110。";
}

function cloudChat(sys, user) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: CFG.agent.base.replace(/\/+$/, "") + "/chat/completions",
      method: "POST",
      header: { "Content-Type": "application/json", Authorization: "Bearer " + decodeKey() },
      data: { model: CFG.agent.model, stream: false, max_tokens: 2000, temperature: 0.3,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }] },
      success(res) {
        if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
        const t = res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message && res.data.choices[0].message.content;
        if (!t) return reject(new Error("空回复"));
        resolve(String(t).trim());
      },
      fail(e) { reject(new Error(e.errMsg || "网络失败")); },
    });
  });
}

/* ---------- 离线兜底引擎 ---------- */
const DIAG_CATS = [
  { name: "资金动作", w: 30, re: /(转账|汇款|保证金|解冻费|押金|手续费|安全账户|屏幕共享)/g, why: "让先行转账/缴费/共享屏幕是诈骗核心闭环。" },
  { name: "索要敏感信息", w: 25, re: /(验证码|密码|银行卡号|身份证号|人脸)/g, why: "验证码/密码/人脸是最后防线，索要即诈骗。" },
  { name: "利诱收益", w: 20, re: /(返利|佣金|垫付|刷单|高息|稳赚|中奖|赔付|退款|补贴)/g, why: "无来由收益是鱼钩；小额返利诱导大额投入。" },
  { name: "紧迫施压", w: 15, re: /(立即|马上|\d+分钟|小时内|逾期|冻结|注销|影响征信|涉嫌|涉案|通缉)/g, why: "倒计时与恐吓为了让你来不及核实。" },
  { name: "冒充身份", w: 15, re: /(公安|民警|派出所|检察院|法院|客服|官方|老师|导师|快递|社保|医保)/g, why: "身份可以随便编；真机构不私下办涉案资金业务。" },
  { name: "可疑入口", w: 15, re: /(链接|二维码|扫码|下载APP|加群|加好友)/g, why: "脱离平台的链接/二维码/陌生APP是标准入口。" },
  { name: "投资话术", w: 22, re: /(虚拟币|交易所|带单|老师带赚|内部通道|博彩|无法提现)/g, why: "带你投资+无法提现=杀猪盘。" },
];
const SCAM_PATTERNS = [
  { name: "刷单返利", hit: /(刷单|垫付返利|做任务)/, script: "小额返利→大额连单“卡单”→连环收割。", predict: "下一步会以“任务未完成”要求继续追加，一分不要再转。" },
  { name: "冒充客服退款", hit: /(客服|退款|理赔|订单异常)/, script: "报准订单取信→退款理赔→借贷或屏幕共享。", predict: "会让你点链接填银行卡或共享屏幕。" },
  { name: "冒充公检法", hit: /(公安|检察院|法院|涉案|安全账户)/, script: "涉案恐吓→伪造通缉令→转入“安全账户”。", predict: "真警察不电话办案；挂断拨110核实。" },
  { name: "投资杀猪盘", hit: /(带单|交易所|虚拟币|博彩)/, script: "交友养猪→虚假盈利→大额无法提现。", predict: "“提现缴税/保证金”是收尾信号。" },
  { name: "虚假购物", hit: /(代练|低价|内部票|折扣充值)/, script: "低价吸引→付款拉黑或连环收费。", predict: "私下转账交易按诈骗对待。" },
  { name: "冒充熟人", hit: /(我是你老师|领导让你转账|换了新号|帮我垫付)/, script: "冒充熟人紧急借钱。", predict: "原有渠道核实身份再谈钱。" },
];
function diagLocalText(text) {
  const t = String(text);
  const hits = []; let score = 0;
  DIAG_CATS.forEach((c) => {
    const ms = [...t.matchAll(c.re)].map((m) => m[0]);
    if (ms.length) { hits.push({ name: c.name, words: [...new Set(ms)].slice(0, 4), why: c.why }); score += c.w; }
  });
  const pats = SCAM_PATTERNS.filter((p) => p.hit.test(t));
  pats.forEach(() => { score += 18; });
  score = Math.min(99, score);
  const level = score >= 60 ? "高危" : score >= 30 ? "中危" : "低危";
  const L = ["【判定：" + level + "（风险分 " + score + "/99）】" + (level === "高危" ? "几乎可断定是诈骗，立即停止操作。" : level === "中危" ? "存在明显可疑要素，先停止操作、官方核实。" : "未命中明显要素，仍建议走官方渠道。")];
  if (hits.length) { L.push("■ 可疑要素："); hits.forEach((h) => L.push("· " + h.name + "：「" + h.words.join("、") + "」——" + h.why)); }
  pats.forEach((p) => L.push("■ 剧本【" + p.name + "】：" + p.script + "\n下一步：" + p.predict));
  if (level !== "低危") L.push("■ 立即行动：停止转账；不点链接；官方渠道核实；保留证据；拨 96110，被骗拨 110。");
  return L.join("\n");
}
function localAnswer(q) {
  const t = q.toLowerCase();
  const has = (...ws) => ws.some((w) => t.includes(w));
  if (has("怎么玩", "玩法", "规则")) return "拦截战拖卡分拣→拆解台归类→造浪者对抗→查看画像；遭遇可切「遭遇研判」直接问。";
  if (has("域名")) return "域名从末尾往前读；官方域只是长域名一段=伪装。";
  if (has("链接", "二维码")) return "短链/裸IP/二维码按不可信入口处理。";
  if (has("附件", "exe")) return "exe/docm 一律高危。";
  if (has("返利", "中奖", "客服", "验证码")) return "利诱+冒充权威命中率最高；索要验证码直接判诈骗。";
  if (has("破绽", "特征")) return "七类破绽：" + Object.values(D.CATEGORY_NAME).join("、");
  const g = getApp().globalData;
  if (has("画像", "段位", "成绩")) return g.report ? "段位【" + g.report.rank + "】战绩 " + g.report.score + " 分。" : "还没有画像，先打一轮拦截战。";
  return "本地模式能力有限；接入云端后任何问题都能回答，或拨 96110 咨询。";
}

module.exports = { cloudReady, cloudChat, DIAG_SYS, chatSys, diagLocalText, localAnswer, provider: CFG.agent.provider };
