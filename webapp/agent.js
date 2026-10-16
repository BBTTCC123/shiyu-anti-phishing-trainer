/* ============ 识渔计划 · AI 智能体「渔安」v4 ============ */
/* 大模型主引擎（配置见 config.js，后台文件，用户界面无任何配置项）；
   本地规则引擎仅作断网/故障兜底。 */
"use strict";

/* ---------- 离线兜底引擎 ---------- */
const DIAG_CATS = [
  { k: "pay", name: "资金动作", w: 30, re: /(转账|汇款|打款|保证金|解冻费|会费|押金|手续费|安全账户|屏幕共享|共享屏幕|刷流水|验证资金)/g, why: "让先行转账/缴纳费用/共享屏幕是诈骗的核心闭环——正规机构没有任何环节需要这些。" },
  { k: "pi", name: "索要敏感信息", w: 25, re: /(验证码|密码|银行卡号|身份证号|短信验证|人脸|刷脸)/g, why: "验证码/密码/人脸是最后防线，任何索要行为可直接判定诈骗。" },
  { k: "rew", name: "利诱收益", w: 20, re: /(返利|佣金|垫付|刷单|兼职日结|高息|稳赚|内幕|中奖|赔付|退款|补贴|免费领|涨粉)/g, why: "无来由的收益承诺是鱼钩；前期小额返利是为了诱导大额投入。" },
  { k: "urg", name: "紧迫施压", w: 15, re: /(立即|马上|尽快|\d+\s*分钟|\d+\s*小时|今日内|逾期|冻结|注销|影响征信|涉嫌|涉案|通缉|逮捕|立案|名下.*冒用|清查资金)/g, why: "倒计时与恐吓（冻结/涉案/影响征信）都是为了让你来不及核实。" },
  { k: "aut", name: "冒充身份", w: 15, re: /(公安|警察|民警|派出所|检察院|法院|办案|客服|官方|银行工作人员|老师|导师|教务|资助中心|快递员|运营商|社保|医保|海关|税务|领导|反诈中心)/g, why: "身份可以随便编；真机构不会通过私人社交工具办理涉案/资金业务。" },
  { k: "lnk", name: "可疑入口", w: 15, re: /(链接|网址|二维码|扫码|下载.*APP|下载APP|下载软件|加群|加好友)/g, why: "脱离平台的链接/二维码/陌生APP是钓鱼与盗刷的标准入口。" },
  { k: "inv", name: "投资理财话术", w: 22, re: /(虚拟币|数字货币|交易所|带单|老师带赚|内部通道|原始股|博彩|下注|提现要|无法提现)/g, why: "带你投资+平台无法提现=杀猪盘两段式：先养猪（小赢）再杀（大亏后无法提现）。" },
];
const SCAM_PATTERNS = [
  { key: "shuadan", name: "刷单返利", hit: /(刷单|垫付返利|做任务|派单)/, script: "先小额返利建立信任 → 大额连单“卡单” → 以“操作失误需再充值解冻”连环收割。", predict: "接下来对方会以“任务未完成/卡单”要求继续追加资金——此时停止，一分不要再转。" },
  { key: "kefu", name: "冒充电商/快递客服退款", hit: /(客服|退款|理赔|快件丢失|包裹|订单异常|双倍赔付)/, script: "准确报出订单信息取得信任 → 引导“退款理赔” → 诱导开通借贷或屏幕共享。", predict: "对方会让你点链接填银行卡、下载会议软件共享屏幕——都是套信息。" },
  { key: "gongan", name: "冒充公检法", hit: /(公安|检察院|法院|涉嫌|洗钱|通缉|安全账户|资金核查|民警|派出所)/, script: "谎称涉案恐吓 → 出示伪造通缉令 → 要求“资金清查”转入所谓安全账户。", predict: "真警察不会电话办案、不发通缉令、没有安全账户。挂断后拨 110 核实。" },
  { key: "shazhu", name: "投资/杀猪盘", hit: /(带单|老师带赚|交易所|虚拟币|博彩|内部通道|稳赚)/, script: "婚恋/交友建立情感 → 展示虚假盈利 → 大额入金后无法提现。", predict: "“提现需缴税/保证金”就是收尾信号——继续转只会亏更多。" },
  { key: "xiaoyuandai", name: "校园贷/注销校园贷", hit: /(校园贷|注销.*账户|学生额度)/, script: "谎称“需注销校园贷额度否则影响征信” → 诱导在各平台借款转出。", predict: "征信不会因“不注销学生额度”受影响；让你去借钱转出的都是诈骗。" },
  { key: "luoliao", name: "裸聊/私密照敲诈", hit: /(裸聊|私密照|不雅|删视频)/, script: "诱导视频并录屏 → 以群发通讯录威胁 → 逼转账且永不满足。", predict: "转一次就有第二次。立即停止联系、保留证据、直接报警。" },
  { key: "dailian", name: "虚假购物/代练/票务", hit: /(代练|代抢|低价.*出售|内部票|折扣充值|先付款)/, script: "远低于市价吸引 → 付款后拉黑或以“冻结费”连环收费。", predict: "脱离平台担保的私下转账交易都按诈骗对待。" },
  { key: "jiuzhu", name: "冒充熟人/老师借钱", hit: /(我是你.*老师|领导让你转账|帮我垫付|换了新号)/, script: "盗号或新号冒充熟人 → 紧急事由借钱/代付 → 利用碍于情面不核实。", predict: "用原有渠道（电话/当面）核实身份再谈钱，一招破解。" },
];
function diagAnalyze(text) {
  const t = String(text); const hits = []; let score = 0;
  DIAG_CATS.forEach((c) => {
    const ms = [...t.matchAll(c.re)].map((m) => m[0]);
    const uniq = [...new Set(ms)];
    if (uniq.length) { hits.push({ ...c, words: uniq.slice(0, 4) }); score += c.w + Math.min(10, (ms.length - 1) * 4); }
  });
  const pats = SCAM_PATTERNS.filter((p) => p.hit.test(t));
  pats.forEach(() => { score += 18; });
  score = Math.min(99, score);
  return { score, level: score >= 60 ? "高危" : score >= 30 ? "中危" : "低危", hits, pats };
}
function diagLocalText(text) {
  const r = diagAnalyze(text); const L = [];
  if (r.level === "高危") L.push("【判定：高危（风险分 " + r.score + "/99）】几乎可以断定是诈骗，立即停止一切操作。");
  else if (r.level === "中危") L.push("【判定：中危（风险分 " + r.score + "/99）】存在明显可疑要素，先停止操作、官方渠道核实。");
  else L.push("【判定：低危（风险分 " + r.score + "/99）】未命中明显诈骗要素——仍建议走官方渠道办理。");
  if (r.hits.length) { L.push("■ 命中要素："); r.hits.forEach((h) => L.push("· " + h.name + "：「" + h.words.join("、") + "」——" + h.why)); }
  r.pats.forEach((p) => L.push("■ 高度吻合剧本【" + p.name + "】：\n典型套路：" + p.script + "\n下一步预测：" + p.predict));
  if (r.level !== "低危") L.push("■ 立即行动：①停止回复与转账；②不点对方链接/二维码；③官方渠道核实身份；④保留聊天与转账凭证；⑤拿不准拨 96110，被骗立即拨 110。");
  if (!r.hits.length && !r.pats.length) L.push("补充细节（对方身份、要你做什么、金额）可更准；或直接拨 96110 由反诈专员判断。");
  return L.join("\n");
}
const DIAG_SYS = "你是一名资深反诈骗研判警官（AI）。用户会用日常语言描述自己的遭遇或收到的信息，无论内容多模糊，你都要基于常识与反诈经验给出判断。严格按以下四段输出（中文，总300字内，第一行必须是判定行）：\n" +
  "【判定：高危|中危|低危（风险分 X/99）】一句话结论。\n" +
  "■ 可疑要素：逐条引用用户原话中的词语并说明为何危险（没有就写“未发现明显要素”，并可追问1个关键缺失信息）。\n" +
  "■ 剧本研判：若吻合已知骗局（刷单返利/冒充客服退款/冒充公检法/杀猪盘投资/校园贷/裸聊敲诈/虚假购物/冒充熟人等）点名剧本、描述典型套路并预测对方下一步；不吻合则说明更可能的真相。\n" +
  "■ 立即行动：给出2-4条具体动作，涉及资金务必提醒96110/110。语气果断、像真人警官，不寒暄。";

/* ---------- 智能体核心（配置来源：config.js，用户界面零配置） ---------- */
const Agent = {
  cfg: { base: "", key: "", model: "", provider: "" },
  history: [],

  loadCfg() {
    const c = (typeof APP_CONFIG !== "undefined" && APP_CONFIG.agent) || {};
    let key = "";
    if (c.enc && c.salt) {
      try {
        const raw = atob(c.enc);
        let s = "";
        for (let i = 0; i < raw.length; i++) s += String.fromCharCode(raw.charCodeAt(i) ^ c.salt.charCodeAt(i % c.salt.length));
        key = s;
      } catch (e) { key = ""; }
    }
    this.cfg = { base: c.base || "", key, model: c.model || "", provider: c.provider || "" };
  },
  cloudReady() {
    return !!(this.cfg.base && this.cfg.model && this.cfg.key && this.cfg.key.length > 10 && this.cfg.key.indexOf("在此填入") < 0);
  },

  ctxSnapshot() {
    let s = "（用户暂无训练数据）";
    try {
      const r = S.report;
      if (r) s = "段位" + r.rank + "，五维：" + DIMENSIONS.map((d) => d.name + r.dims[d.key]).join("/") + "，错题" + Object.keys(JSON.parse(localStorage.getItem("shiyu_wrong") || "{}")).length + "条";
    } catch (e) {}
    return s;
  },
  chatSys() {
    return "你是反钓鱼训练游戏《识渔计划》（长春理工大学参赛作品）里的AI安全官「渔安」。用中文简短口语化回答（150字内），话题限定：反诈识别、网络安全、本作品玩法与用户训练数据。用户当前训练状态：" + this.ctxSnapshot() + "。拿不准就建议拨96110。";
  },

  /* noHist=true 时单发调用，不携带对话历史（供分析类一次性调用使用，避免污染/串味） */
  async cloudChat(sys, q, onDelta, noHist) {
    const res = await fetch(this.cfg.base.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + this.cfg.key },
      body: JSON.stringify({ model: this.cfg.model, stream: true, max_tokens: 2000, temperature: 0.3,
        messages: [{ role: "system", content: sys }].concat(noHist ? [] : this.history.slice(-6)).concat([{ role: "user", content: q }]) }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (!res.body || !res.body.getReader) {
      const j = await res.json();
      const full = j.choices[0].message.content.trim();
      if (onDelta) onDelta(full);
      return full;
    }
    const reader = res.body.getReader(); const dec = new TextDecoder();
    let buf = "", full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const ln of lines) {
        const s = ln.trim();
        if (!s.startsWith("data:")) continue;
        const d = s.slice(5).trim();
        if (d === "[DONE]") continue;
        try {
          const j = JSON.parse(d);
          const delta = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
          if (delta) { full += delta; if (onDelta) onDelta(full); }
        } catch (e) {}
      }
    }
    if (!full.trim()) throw new Error("空回复");
    return full.trim();
  },

  async run(sys, q, fallback, onDelta, onSrc) {
    this.history.push({ role: "user", content: q });
    let out = "";
    if (this.cloudReady()) {
      try { out = await this.cloudChat(sys, q, onDelta); if (onSrc) onSrc("cloud"); }
      catch (e) {
        out = "（网络波动，已用离线引擎应答）\n\n" + fallback();
        if (onDelta) onDelta(out); if (onSrc) onSrc("local");
      }
    } else {
      await new Promise((r) => setTimeout(r, 300));
      out = fallback(); if (onDelta) onDelta(out); if (onSrc) onSrc("local");
    }
    this.history.push({ role: "assistant", content: out });
    if (this.history.length > 24) this.history = this.history.slice(-20);
    return out;
  },
  diagnose(text, onDelta, onSrc) { return this.run(DIAG_SYS, "【遭遇研判】" + text, () => diagLocalText(text), onDelta, onSrc); },
  ask(q, onDelta, onSrc) {
    const local = () => {
      const t = q.toLowerCase();
      const has = (...ws) => ws.some((w) => t.includes(w));
      if (has("画像", "段位", "成绩", "水平")) { const r = S.report; if (r) { const weak = DIMENSIONS.slice().sort((a, b) => r.dims[a.key] - r.dims[b.key])[0]; return "段位【" + r.rank + "】战绩 " + r.score + " 分，最薄弱「" + weak.name + "」：" + DIM_ADVICE[weak.key]; } return "还没有画像，先打一轮拦截战。"; }
      if (has("怎么玩", "玩法", "规则")) return "拦截战拖卡分拣→拆解台归类→造浪者对抗→查看训练报告与画像；遭遇可切「遭遇研判」直接问。";
      if (has("域名")) return "读域名从末尾往前读；官方域只是长域名一段=伪装。";
      if (has("链接", "二维码")) return "不点正文链接；短链/裸IP/二维码按不可信入口处理。";
      if (has("附件", "exe")) return "exe/docm 一律高危，正规通知不需回传附件。";
      if (has("紧迫", "限时", "倒计时")) return "限时话术为了压缩思考；停一分钟再官方核实。";
      if (has("返利", "中奖", "客服", "验证码", "密码")) return "利诱+冒充权威命中率最高；索要验证码/密码直接判诈骗。";
      if (has("破绽", "特征")) return "七类破绽：域名仿冒/链接不符/紧迫话术/利诱钩子/索要信息/附件风险/冒充权威。";
      return "这个问题建议连线人工：拨 96110 反诈专线，或到属地派出所咨询。";
    };
    return this.run(this.chatSys(), q, local, onDelta, onSrc);
  },
};

/* ---------- UI（普通聊天界面，无任何配置入口） ---------- */
function agentInit() {
  Agent.loadCfg();
  const fab = document.createElement("div");
  fab.id = "agent-fab";
  let seen = false;
  try { seen = localStorage.getItem("shiyu_fab_seen") === "1"; } catch (e) {}
  fab.innerHTML = '<span class="opet-fish">🐟</span>' +
    '<span class="fab-txt">遇到疑似诈骗？问渔安<small>遭遇研判 · 智能问答</small></span>' +
    (seen ? "" : '<span class="fab-dot"></span>');
  fab.title = "渔安 · 遭遇研判 / 知识问答";
  document.body.appendChild(fab);
  const panel = document.createElement("div");
  panel.id = "agent-panel";
  panel.innerHTML = `
    <div class="ag-head">
      <span><b>渔安</b> · AI 安全官${Agent.cloudReady() && Agent.cfg.provider ? " <em>" + esc(Agent.cfg.provider) + "</em>" : ""}</span>
      <button class="voice-btn" id="ag-close">×</button>
    </div>
    <div class="ag-tabs">
      <span class="ag-tab on" data-t="diag">🔍 遭遇研判</span>
      <span class="ag-tab" data-t="chat">💬 自由问答</span>
    </div>
    <div class="ag-view" id="ag-view-diag">
      <div class="ag-diag-intro">用你自己的话描述遭遇——渔安会给出<b>判定 / 可疑要素 / 剧本预测 / 行动建议</b>。</div>
      <textarea id="ag-diag-text" placeholder="例：微信有个自称我导师的人，让我先把课题经费垫付转到指定卡号…（任何遭遇都可以问）"></textarea>
      <button id="ag-diag-go">立即研判</button>
      <div class="ag-quick" id="ag-diag-quick"></div>
    </div>
    <div class="ag-view hidden" id="ag-view-chat">
      <div class="ag-msgs" id="ag-msgs"></div>
      <div class="ag-input"><input id="ag-input" placeholder="问渔安任何反诈问题…"><button id="ag-send">发送</button></div>
    </div>`;
  document.body.appendChild(panel);

  const switchTab = (t) => {
    panel.querySelectorAll(".ag-tab").forEach((x) => x.classList.toggle("on", x.dataset.t === t));
    $("#ag-view-diag").classList.toggle("hidden", t !== "diag");
    $("#ag-view-chat").classList.toggle("hidden", t !== "chat");
  };
  panel.querySelectorAll(".ag-tab").forEach((t) => { t.onclick = () => switchTab(t.dataset.t); });

  const bubble = (role) => {
    const box = $("#ag-msgs");
    const d = document.createElement("div");
    d.className = "ag-m " + (role === "user" ? "u" : "a");
    d.innerHTML = role === "user" ? '<div class="ag-bubble"></div>'
      : '<div class="officer-ava talking normal">' + officerChar() + '</div><div class="ag-bubble"></div>';
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    return d;
  };
  const setBubble = (d, text) => {
    d.__txt = text;
    d.querySelector(".ag-bubble").innerHTML = esc(text).replace(/\n/g, "<br>") + '<span class="cur">▌</span>';
    $("#ag-msgs").scrollTop = 1e9;
  };
  const doneBubble = (d, src) => {
    const b = d.querySelector(".ag-bubble");
    const ava = d.querySelector(".officer-ava"); if (ava) ava.classList.remove("talking");
    const txt = d.__txt != null ? d.__txt : b.textContent;
    const lines = String(txt).split("\n");
    let first = lines.shift() || "";
    const m = first.match(/(高危|中危|低危)/);
    if (m) {
      const cls = m[1] === "高危" ? "lv-high" : m[1] === "中危" ? "lv-mid" : "lv-low";
      first = '<span class="lv ' + cls + '">' + esc(first) + "</span>";
    } else { first = esc(first); }
    b.innerHTML = first + (lines.length ? "<br>" + esc(lines.join("\n")).replace(/\n/g, "<br>") : "");
    $("#ag-msgs").scrollTop = 1e9;
  };

  const runDiag = async (text) => {
    switchTab("chat");
    const du = bubble("user"); setBubble(du, text); doneBubble(du);
    const d = bubble("assistant"); setBubble(d, "正在研判…");
    const final = await Agent.diagnose(text, (full) => setBubble(d, full));
    setBubble(d, final); doneBubble(d);
    if (Officer.voiceOn) Officer.tts(final.split("\n")[0].slice(0, 80));
  };
  $("#ag-diag-go").onclick = () => {
    const t = $("#ag-diag-text").value.trim();
    if (t.length < 8) { $("#ag-diag-text").placeholder = "再多写几个字（至少8字），越具体研判越准"; return; }
    $("#ag-diag-text").value = "";
    runDiag(t);
  };
  const samples = ["导师微信让我垫付课题经费到指定卡号", "网友带我在平台买币，小赚后大额无法提现", "快递客服说要双倍理赔，让我下载APP共享屏幕"];
  $("#ag-diag-quick").innerHTML = samples.map((s) => '<span class="chip">' + s + "</span>").join("");
  $("#ag-diag-quick").querySelectorAll(".chip").forEach((c) => { c.onclick = () => runDiag(c.textContent); });

  const ask = async (q) => {
    switchTab("chat");
    const du = bubble("user"); setBubble(du, q); doneBubble(du);
    const d = bubble("assistant"); setBubble(d, "…");
    const final = await Agent.ask(q, (full) => setBubble(d, full));
    setBubble(d, final); doneBubble(d);
    if (Officer.voiceOn && final.length < 160) Officer.tts(final);
  };
  $("#ag-send").onclick = () => { const v = $("#ag-input").value.trim(); if (v) { $("#ag-input").value = ""; ask(v); } };
  $("#ag-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#ag-send").click(); });

  let greeted = false;
  fab.onclick = () => {
    panel.classList.toggle("open");
    const dot = fab.querySelector(".fab-dot");
    if (dot) { dot.remove(); try { localStorage.setItem("shiyu_fab_seen", "1"); } catch (e) {} }
    if (panel.classList.contains("open") && !greeted) { greeted = true; switchTab("diag"); }
  };
  $("#ag-close").onclick = () => panel.classList.remove("open");
}
