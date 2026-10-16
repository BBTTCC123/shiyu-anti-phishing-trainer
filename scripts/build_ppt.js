/* 识渔计划 · 答辩 PPT 生成脚本（pptxgenjs，16:9 深色科技风） */
const path = require("path");
const GROOT = require("child_process").execSync("npm root -g").toString().trim();
const pptxgen = require(path.join(GROOT, "pptxgenjs"));

const PREV = "D:/GYY/长春理工/学生竞赛/本科生竞赛/数媒竞赛_识渔计划/preview";
const OUT = "D:/GYY/长春理工/学生竞赛/本科生竞赛/数媒竞赛_识渔计划/识渔计划_答辩PPT.pptx";

/* 调色板（与作品一致） */
const BG = "0A0F1C", CARD = "111A2C", CARD2 = "0D1524", LINE = "1C2B45";
const CYAN = "35E0C8", RED = "FF5470", AMBER = "FFB84D";
const TXT = "D7E3F4", MUT = "7E8FA8", WHITE = "FFFFFF";
const F = "微软雅黑", MONO = "Consolas";
const W = 13.33, H = 7.5, M = 0.55;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "识渔计划团队";
pres.title = "识渔计划 · 反钓鱼攻防训练营";

const TOTAL = 20;
let pageNo = 0;
const bu = (color) => ({ code: "25B8", indent: 12, color: color || CYAN });

function baseSlide(kicker, title) {
  const s = pres.addSlide();
  s.background = { color: BG };
  pageNo++;
  if (kicker) {
    s.addText(kicker, { x: M, y: 0.34, w: 9, h: 0.3, fontSize: 12, bold: true, color: CYAN, fontFace: F, charSpacing: 3, margin: 0 });
    s.addText(title, { x: M, y: 0.62, w: 11.5, h: 0.62, fontSize: 27, bold: true, color: WHITE, fontFace: F, margin: 0 });
  }
  s.addText("识渔计划 SHIYU · 答辩演示", { x: M, y: H - 0.42, w: 4, h: 0.26, fontSize: 9, color: MUT, fontFace: F, margin: 0 });
  s.addText(String(pageNo).padStart(2, "0") + " / " + TOTAL, { x: W - M - 1.2, y: H - 0.42, w: 1.2, h: 0.26, fontSize: 9, color: MUT, fontFace: F, align: "right", margin: 0 });
  return s;
}
function card(s, x, y, w, h, opts) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({ x, y, w, h, fill: { color: CARD }, line: { color: LINE, width: 1 }, rectRadius: 0.09 }, opts || {}));
}
function phone(s, img, x, y, hgt, cap) {
  const wIn = hgt * (420 / 860);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.07, y: y - 0.07, w: wIn + 0.14, h: hgt + 0.14, fill: { color: CARD2 }, line: { color: CYAN, width: 1.25 }, rectRadius: 0.12 });
  s.addImage({ path: PREV + "/" + img, x, y, w: wIn, h: hgt });
  if (cap) s.addText(cap, { x: x - 0.3, y: y + hgt + 0.12, w: wIn + 0.6, h: 0.3, fontSize: 11, color: MUT, fontFace: F, align: "center", margin: 0 });
  return wIn;
}
function rows(s, items, x, y, w, rh, gap) {
  items.forEach((it, i) => {
    const yy = y + i * (rh + gap);
    s.addShape(pres.shapes.OVAL, { x, y: yy + 0.06, w: 0.34, h: 0.34, fill: { color: CARD }, line: { color: CYAN, width: 1 } });
    s.addText(String(i + 1), { x, y: yy + 0.06, w: 0.34, h: 0.34, fontSize: 12, bold: true, color: CYAN, fontFace: F, align: "center", valign: "middle", margin: 0 });
    s.addText([
      { text: it[0] + "　", options: { bold: true, color: WHITE, fontSize: 14.5 } },
      { text: it[1], options: { color: TXT, fontSize: 13 } },
    ], { x: x + 0.52, y: yy - 0.04, w: w - 0.52, h: rh + 0.1, fontFace: F, valign: "top", margin: 0 });
  });
}

/* ============ S1 封面 ============ */
(() => {
  const s = baseSlide(null, null);
  s.addText("SHIYU", { x: 0, y: 0.7, w: W, h: 1.0, fontSize: 20, color: MUT, fontFace: "Arial", align: "center", charSpacing: 14, margin: 0 });
  s.addText("识渔计划", { x: 0, y: 1.55, w: W, h: 1.5, fontSize: 66, bold: true, color: WHITE, fontFace: F, align: "center", charSpacing: 10, margin: 0 });
  s.addText("反钓鱼攻防训练营", { x: 0, y: 3.0, w: W, h: 0.55, fontSize: 24, color: CYAN, fontFace: F, align: "center", charSpacing: 6, margin: 0 });
  s.addText("不教结论，练肌肉记忆 —— 把反诈知识变成条件反射的游戏", { x: 0, y: 3.72, w: W, h: 0.42, fontSize: 15, color: TXT, fontFace: F, align: "center", margin: 0 });
  const chips = [["20", "高仿虚构样本"], ["4", "直接操纵玩法"], ["0", "外部依赖"]];
  chips.forEach((c, i) => {
    const cw = 2.15, x = W / 2 - (cw * 3 + 0.4) / 2 + i * (cw + 0.2);
    card(s, x, 4.55, cw, 1.28, { fill: { color: CARD2 } });
    s.addText(c[0], { x, y: 4.66, w: cw, h: 0.62, fontSize: 34, bold: true, color: i === 2 ? RED : CYAN, fontFace: "Arial", align: "center", margin: 0 });
    s.addText(c[1], { x, y: 5.3, w: cw, h: 0.32, fontSize: 12, color: MUT, fontFace: F, align: "center", margin: 0 });
  });
  s.addText("中国大学生数字媒体科技作品及创意竞赛 · 移动与网络应用开发　｜　长春理工大学 · 计算机科学技术学院",
    { x: 0, y: 6.35, w: W, h: 0.35, fontSize: 12, color: MUT, fontFace: F, align: "center", margin: 0 });
  s.addText("参赛团队：［队伍名称 / 成员 / 指导教师］", { x: 0, y: 6.72, w: W, h: 0.32, fontSize: 11, color: MUT, fontFace: F, align: "center", margin: 0 });
  s.addNotes("开场10秒：一句话定位——反钓鱼训练游戏。三个数字：20个仿真样本、4种直接操纵玩法、0外部依赖（现场可玩、断网可演示）。");
})();

/* ============ S2 目录 ============ */
(() => {
  const s = baseSlide("CONTENTS", "目录");
  const items = [
    ["01", "创意缘起", "为什么“知道有诈骗”救不了你"],
    ["02", "方案定位", "反诈教育的“消防演练场”"],
    ["03", "玩法体验", "四种玩法交互 + AI 智能体（研判/问答）"],
    ["04", "创新技术", "统一拖拽引擎 · 对抗判定引擎 · 零依赖 AI 角色"],
    ["05", "效果验证", "前后测对比与五维风险画像"],
    ["06", "应用与展望", "落地路径 · AI 协作工程 · 团队"],
  ];
  items.forEach((it, i) => {
    const y = 1.62 + i * 0.86;
    s.addText(it[0], { x: M, y, w: 1.0, h: 0.6, fontSize: 30, bold: true, color: i === 3 ? RED : CYAN, fontFace: "Arial", margin: 0 });
    s.addText(it[1], { x: 1.75, y: y + 0.02, w: 3.2, h: 0.5, fontSize: 19, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addText(it[2], { x: 5.1, y: y + 0.08, w: 7.4, h: 0.45, fontSize: 13.5, color: MUT, fontFace: F, margin: 0 });
    if (i < 5) s.addShape(pres.shapes.LINE, { x: M, y: y + 0.72, w: W - 2 * M, h: 0, line: { color: LINE, width: 0.75 } });
  });
  s.addNotes("六段结构，重点在03玩法与04技术，约占一半时长。");
})();

/* ============ S3 痛点（现场互动） ============ */
(() => {
  const s = baseSlide("01 · 创意缘起", "先来一道现场测试：哪一封是钓鱼邮件？");
  const mail = (x, from, addr, subj, body, w) => {
    card(s, x, 1.6, w, 3.1, { fill: { color: "F4F6FA" }, line: { color: "C6CFDD", width: 1 } });
    s.addText([{ text: "发件人　", options: { color: "6B7686", fontSize: 11 } }, { text: from + "  ", options: { color: "1C2530", bold: true, fontSize: 12 } }, { text: addr, options: { color: "2563EB", fontSize: 11 } }],
      { x: x + 0.25, y: 1.78, w: w - 0.5, h: 0.35, fontFace: F, margin: 0 });
    s.addText(subj, { x: x + 0.25, y: 2.16, w: w - 0.5, h: 0.4, fontSize: 13.5, bold: true, color: "1C2530", fontFace: F, margin: 0 });
    s.addText(body, { x: x + 0.25, y: 2.62, w: w - 0.5, h: 1.9, fontSize: 12, color: "3A4656", fontFace: F, lineSpacingMultiple: 1.35, margin: 0 });
  };
  mail(M, "教务处", "<jwc@cust-demo.edu.cn>", "学业预警通知（补）", "因系统升级，部分同学需重新确认学业状态，请通过“统一入口”核验：\nhttp://jwc.cust-demo.edu.cn.ssl-verify.top/login\n未确认的科目成绩将按零分记载。", 5.9);
  mail(W - M - 5.9, "学生资助中心", "<jwc-zizhu@qq.com>", "2026 年秋季助学金申领通知", "请点击下方链接，填写银行卡号、取款密码及短信验证码完成身份核验：\nhttp://zhuxue-buzhu.top/verify\n逾期未核验视为自动放弃资助资格。", 5.9);
  s.addText("两封都是钓鱼——但讲座听过的你，3 秒内敢下判断吗？", { x: 0, y: 4.95, w: W, h: 0.5, fontSize: 19, bold: true, color: RED, fontFace: F, align: "center", margin: 0 });
  s.addText("反诈教育的真问题：讲座、海报只能传递“知识”，无法训练“判断”。识别钓鱼是一项行为能力——它需要可重复、可反馈、可量化的训练场。",
    { x: 1.4, y: 5.55, w: W - 2.8, h: 0.8, fontSize: 13.5, color: TXT, fontFace: F, align: "center", lineSpacingMultiple: 1.3, margin: 0 });
  s.addNotes("互动开场：请评委猜哪封是钓鱼（停顿5秒）——答案是两封都是。A是长域名伪装（真实域ssl-verify.top），B是个人邮箱+索要密码。引出核心论点：知道≠判断。");
})();

/* ============ S4 方案定位 ============ */
(() => {
  const s = baseSlide("02 · 方案定位", "反诈教育的“消防演练场”");
  s.addText("像消防演练之于火灾：在仿真环境里反复练习判断，错了有 AI 讲解，练完出成绩单。",
    { x: M, y: 1.7, w: 6.3, h: 1.0, fontSize: 17, color: TXT, fontFace: F, lineSpacingMultiple: 1.35, margin: 0 });
  const feats = [["训练", "四波拦截战 · 前测-训练-后测闭环"], ["反馈", "AI 蓝军安全官逐条讲评"], ["量化", "五维风险画像与段位"]];
  feats.forEach((f, i) => {
    const y = 3.0 + i * 1.05;
    card(s, M, y, 6.3, 0.88);
    s.addText(f[0], { x: M + 0.25, y: y + 0.14, w: 1.1, h: 0.6, fontSize: 17, bold: true, color: CYAN, fontFace: F, margin: 0 });
    s.addText(f[1], { x: M + 1.45, y: y + 0.18, w: 4.7, h: 0.55, fontSize: 13.5, color: TXT, fontFace: F, margin: 0 });
  });
  const users = [["个人自练", "宿舍/班级对抗赛\n扫码即玩 · 免安装"], ["班级演练", "保卫处/辅导员组织\n匿名汇总=演练报告"], ["课堂教学", "网安/AI素养课教具\n拆解台即知识结构化"]];
  users.forEach((u, i) => {
    const y = 1.7 + i * 1.62;
    card(s, 7.35, y, W - M - 7.35, 1.42, { fill: { color: CARD2 } });
    s.addText(u[0], { x: 7.62, y: y + 0.16, w: 2.2, h: 0.42, fontSize: 16, bold: true, color: AMBER, fontFace: F, margin: 0 });
    s.addText(u[1], { x: 7.62, y: y + 0.6, w: 4.6, h: 0.75, fontSize: 12, color: TXT, fontFace: F, lineSpacingMultiple: 1.25, margin: 0 });
  });
  s.addNotes("定位一句话：不是又一个答题H5，而是可反复、可反馈、可量化的行为训练场。右列三类用户给落地口径。");
})();

/* ============ S5 创意设计理念 ============ */
(() => {
  const s = baseSlide("03 · 玩法体验", "创意设计理念：从“阅卷人”到“局中人”");
  const ideas = [
    ["直接操纵", "判断不再是点选项", "拖拽分拣、证物归类、拖卡装配、滑杆调参、自由撰写——全部核心操作都是直接操纵（Direct Manipulation），配合吸附高亮、跟手倾斜、连击弹字与合成音效。"],
    ["攻防双视角", "先防守，再进攻", "拦截战/拆解台训练防守直觉；造浪者实验室让玩家亲手构造钓鱼邮件挑战 AI 防线——在纯沙箱内从攻击者视角反推“为什么这封能骗到人”。"],
    ["风险可视化", "让“被骗概率”看得见", "数据完整度血条、连击倍率、检出率仪表、五维雷达——把抽象的安全能力翻译成游戏语言，训练效果可被看见、被比较、被追踪。"],
  ];
  ideas.forEach((d, i) => {
    const x = M + i * 4.18;
    card(s, x, 1.65, 3.95, 4.75);
    s.addText("0" + (i + 1), { x: x + 0.3, y: 1.95, w: 1.5, h: 0.7, fontSize: 40, bold: true, color: i === 1 ? RED : CYAN, fontFace: "Arial", margin: 0 });
    s.addText(d[0], { x: x + 0.3, y: 2.75, w: 3.3, h: 0.45, fontSize: 19, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addText(d[1], { x: x + 0.3, y: 3.22, w: 3.3, h: 0.4, fontSize: 13, bold: true, color: CYAN, fontFace: F, margin: 0 });
    s.addText(d[2], { x: x + 0.3, y: 3.75, w: 3.35, h: 2.4, fontSize: 12, color: TXT, fontFace: F, lineSpacingMultiple: 1.4, margin: 0 });
  });
  s.addNotes("这是全片的创意总纲：交互范式（直接操纵）×叙事范式（攻防双视角）×反馈范式（风险可视化）。后面每个玩法都是这三条的具体化。");
})();

/* ============ S6 拦截战 ============ */
(() => {
  const s = baseSlide("03 · 玩法体验", "玩法一 · 拦截战：拖拽分拣，限时拦截");
  const imgW = phone(s, "game-sorter.png", 9.6, 1.62, 4.95, "真机界面 · 420×860 视口");
  rows(s, [
    ["拖拽分拣", "消息卡拖入左侧渔网（钓鱼）或右侧收件箱（正常），投放区高亮吸附、卡片跟手倾斜"],
    ["限时压力", "三档难度对应 12/9/7 秒倒计时——用时间压力复现真实受骗情境，超时即“漏网”"],
    ["连击与血条", "连续正确触发连击倍率与弹字，分拣错误扣减“数据完整度”并震屏警示"],
    ["混合出题", "每波混入正常样本——“无脑全拖左”必然失败，判断才有意义；触屏/鼠标/键盘三输入等价"],
  ], M, 1.75, 8.55 - M - 0.3, 0.78, 0.62);
  s.addNotes("演示时先故意漏一张（超时）展示血条惩罚，再连对三张展示连击倍率。设计动机：限时=复现真实受骗时的时间压力。");
})();

/* ============ S7 拆解台 ============ */
(() => {
  const s = baseSlide("03 · 玩法体验", "玩法二 · 拆解台：把破绽拖回它的类别");
  phone(s, "game-dismantle.png", 9.6, 1.62, 4.95, "证物拖入七类破绽槽位");
  rows(s, [
    ["证物碎片化", "拦下的钓鱼样本被拆解为证物：仿冒域名、短链、二维码、紧迫话术、可疑附件"],
    ["拖拽归类", "把证物拖入七类破绽槽位（域名仿冒/链接不符/紧迫话术/利诱钩子/索要信息/附件风险/冒充权威）"],
    ["试错即学习", "首放命中锁绿计入能力值；放错弹回并提示“不属于该类”——点击证物可查看完整内容取证"],
    ["判定与讲解", "全部归位后逐条展开每件证物的归属理由，AI 安全官点评最薄弱类别"],
  ], M, 1.75, 8.55 - M - 0.3, 0.78, 0.62);
  s.addNotes("讲透教学设计：归类动作本身就是知识结构化——学生不是被告知答案，而是亲手把证据放进它该在的位置。");
})();

/* ============ S8 造浪者实验室 ============ */
(() => {
  const s = baseSlide("03 · 玩法体验", "玩法三 · 造浪者组装实验室：亲手造一封“钓鱼邮件”");
  phone(s, "lab.png", 9.6, 1.62, 4.95, "拖卡装配 + 滑杆调参 + 预测仪");
  rows(s, [
    ["拖卡装配", "基因卡拖入三个装配槽：拟态皮肤 × 心理机制 × 技术手段（9 张卡组合）"],
    ["连续调参", "伪装度 / 激进度 / 投放量三根滑杆连续改变检出公式——非线性耦合，无脑拉满必然翻车"],
    ["带误差的预测仪", "实时预测显示 ±8 误差带，抑制穷举最优解，保留博弈感"],
    ["扫描束结算", "投放后“邮件”飞越三条扫描光束，命中的光束炸红，加噪声的真实检出率揭晓"],
  ], M, 1.75, 8.55 - M - 0.3, 0.78, 0.62);
  s.addNotes("最大创新点：攻防双视角。滑杆示例：伪装度拉高洗白皮肤特征，但技术特征（仿冒域名）不受影响——玩家在调参中体感理解检测原理。");
})();

/* ============ S9 自由撰写 + 安全官 ============ */
(() => {
  const s = baseSlide("03 · 玩法体验", "玩法四 · 自由撰写 × AI 蓝军安全官");
  phone(s, "attack-free.png", 3.4, 1.62, 4.6, "自由撰写：命中词实时高亮");
  phone(s, "attack-result.png", 7.6, 1.62, 4.6, "安全官逐条讲评 + 快捷追问");
  rows(s, [
    ["自由撰写", "玩家亲写一封钓鱼邮件，六类规则引擎逐词扫描、原文高亮、判检出率"],
    ["AI 蓝军安全官", "打字机点评 + 语音讲评 + 快捷追问，全程陪伴式反馈"],
  ], M, 1.8, 2.7, 0.72, 1.9);
  s.addText("零外部依赖：断网可运行、可演示，无 API Key、无网络延迟",
    { x: M, y: 5.9, w: 2.75, h: 1.0, fontSize: 13, bold: true, color: AMBER, fontFace: F, lineSpacingMultiple: 1.35, margin: 0 });
  s.addNotes("自由撰写是主观创作入口；安全官是反馈系统。强调零依赖：答辩现场再差的网络也能演示。");
})();

/* ============ S10 科技感来源 ============ */
(() => {
  const s = baseSlide("04 · 创新技术", "科技感从哪里来：一套完整的设计系统");
  const items = [
    ["深色霓虹设计系统", "背景-主色-强调三级色彩模型贯穿 H5 与本 PPT；深海军蓝 × 信号青 × 警戒红，与“信息安全”语义同构"],
    ["动效反馈语言", "槽位吸附高亮、卡片跟手倾斜、连击弹字、错分震屏、扫描光束炸红——每个操作都有可感知的物理反馈"],
    ["程序合成音效", "WebAudio 实时合成拾取/命中/警报/连击音色，零音频素材文件，体积极小且永不缺资源"],
    ["数据可视化", "Canvas 手绘五维雷达、检出率仪表、血条与连击——训练效果全程可视化"],
  ];
  items.forEach((it, i) => {
    const x = M + (i % 2) * 6.25, y = 1.75 + Math.floor(i / 2) * 2.3;
    card(s, x, y, 5.95, 2.05);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.28, y: y + 0.3, w: 0.5, h: 0.5, rectRadius: 0.08, fill: { color: CARD2 }, line: { color: CYAN, width: 1 } });
    s.addText(String(i + 1), { x: x + 0.28, y: y + 0.3, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: CYAN, fontFace: "Arial", align: "center", valign: "middle", margin: 0 });
    s.addText(it[0], { x: x + 0.98, y: y + 0.3, w: 4.7, h: 0.45, fontSize: 16.5, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addText(it[1], { x: x + 0.98, y: y + 0.82, w: 4.75, h: 1.1, fontSize: 12, color: TXT, fontFace: F, lineSpacingMultiple: 1.35, margin: 0 });
  });
  s.addNotes("回答“科技感怎么来”：不是贴图，而是设计系统+反馈密度——每个操作100ms内必有可感知反馈。");
})();

/* ============ S11 技术架构 ============ */
(() => {
  const s = baseSlide("04 · 创新技术", "技术架构：数据与逻辑彻底分离的纯前端工程");
  const layer = (y, title, desc, color) => {
    card(s, M, y, 8.0, 1.02);
    s.addText(title, { x: M + 0.28, y: y + 0.13, w: 2.35, h: 0.75, fontSize: 15, bold: true, color: color || CYAN, fontFace: F, valign: "middle", margin: 0 });
    s.addText(desc, { x: M + 2.75, y: y + 0.13, w: 5.05, h: 0.78, fontSize: 11.5, color: TXT, fontFace: F, lineSpacingMultiple: 1.25, valign: "middle", margin: 0 });
  };
  layer(1.7, "交互层", "Pointer Events 统一拖拽引擎（拦截卡/证物/基因卡三套复用）· 键盘等价输入 · 槽位坐标命中");
  layer(2.86, "逻辑层", "拦截战状态机 · 拆解计分 · 对抗判定公式 · 自由撰写规则引擎 · 五维能力模型");
  layer(4.02, "数据层 data.js", "20 个样本（含七类破绽标注）· 基因卡 · 波次编排 · 讲解文案——加题不改代码", AMBER);
  layer(5.18, "本地能力层", "Web Speech 语音 · WebAudio 合成音效 · localStorage 存档 · Canvas 雷达");
  card(s, 8.85, 1.7, W - M - 8.85, 4.5, { fill: { color: CARD2 }, line: { color: RED, width: 1 } });
  s.addText("后端化预留位", { x: 9.1, y: 1.92, w: 3.4, h: 0.4, fontSize: 15, bold: true, color: RED, fontFace: F, margin: 0 });
  const ups = [["话术出口", "Officer 单一出口\n→ 换大模型流式"], ["判分引擎", "对抗公式\n→ 服务端分类器"], ["固定题库", "波次队列\n→ 每日挑战生成"]];
  ups.forEach((u, i) => {
    const y = 2.45 + i * 1.2;
    s.addText(u[0], { x: 9.1, y, w: 3.5, h: 0.35, fontSize: 13, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addText(u[1], { x: 9.1, y: y + 0.36, w: 3.5, h: 0.62, fontSize: 11, color: TXT, fontFace: F, lineSpacingMultiple: 1.2, margin: 0 });
  });
  s.addText("纯静态部署：任意托管零门槛 · 无构建链 · 无第三方运行时依赖", { x: M, y: 6.35, w: 8.0, h: 0.35, fontSize: 12, color: MUT, fontFace: F, margin: 0 });
  s.addNotes("架构三句话：数据逻辑分离（改题不改码）；交互引擎复用；三个后端化预留位意味着这不是玩具，是可生长的工程。");
})();

/* ============ S12 创新技术① 拖拽引擎 ============ */
(() => {
  const s = baseSlide("04 · 创新技术", "创新技术 ①  统一拖拽交互引擎");
  rows(s, [
    ["一套模型三处复用", "拦截卡 / 拆解证物 / 基因卡共享同一 Pointer Events 拖拽模型，触屏与鼠标行为完全一致"],
    ["指针坐标命中", "槽位判定以指针落点为准（而非元素矩形），宽元素、快速拖放均不误判"],
    ["过渡态治理", "拖拽中禁用 transform 过渡（.dragging），根除“快速拖放丢判定”的经典缺陷"],
    ["异常兜底", "合成指针事件的 setPointerCapture 异常已捕获——自动化测试与真机两不误"],
  ], M, 1.7, 7.0, 0.75, 0.72);
  card(s, 8.0, 1.7, W - M - 8.0, 4.6, { fill: { color: CARD2 } });
  s.addText("slotAtPoint(x, y, selector)", { x: 8.3, y: 1.95, w: 4.4, h: 0.35, fontSize: 13, bold: true, color: CYAN, fontFace: MONO, margin: 0 });
  s.addText(
    "[...document.querySelectorAll(sel)]\n  .find(s => {\n    const b = s.getBoundingClientRect();\n    return x > b.left && x < b.right\n        && y > b.top  && y < b.bottom;\n  });",
    { x: 8.3, y: 2.45, w: 4.5, h: 2.6, fontSize: 12.5, color: TXT, fontFace: MONO, lineSpacingMultiple: 1.3, margin: 0 });
  s.addText("命中即真理：手指在哪，就放在哪", { x: 8.3, y: 5.5, w: 4.4, h: 0.6, fontSize: 13, bold: true, color: AMBER, fontFace: F, margin: 0 });
  s.addNotes("技术深挖第一页：拖拽是本作全部交互的地基。两个真实修复过的缺陷写进去——展示的是工程判断力。");
})();

/* ============ S13 创新技术② 对抗判定引擎 ============ */
(() => {
  const s = baseSlide("04 · 创新技术", "创新技术 ②  带噪声的非线性对抗判定引擎");
  card(s, M, 1.65, W - 2 * M, 1.15, { fill: { color: CARD2 }, line: { color: CYAN, width: 1 } });
  s.addText("检出率 = min(97, 5+技术 + 皮肤×(1−伪装度/160) + 心理×(0.55+激进度/90) + 投放量×0.12) + 噪声±7",
    { x: M + 0.3, y: 1.8, w: W - 2 * M - 0.6, h: 0.85, fontSize: 14, bold: true, color: CYAN, fontFace: F, align: "center", valign: "middle", margin: 0 });
  const slider = (y, label, val, note) => {
    s.addText(label, { x: M, y: y + 0.02, w: 1.35, h: 0.35, fontSize: 13.5, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 1.5, y: y + 0.13, w: 4.6, h: 0.12, rectRadius: 0.06, fill: { color: CARD2 }, line: { color: LINE, width: 0.75 } });
    s.addShape(pres.shapes.OVAL, { x: M + 1.5 + 4.6 * val, y: y + 0.01, w: 0.36, h: 0.36, fill: { color: CYAN }, line: { color: WHITE, width: 1 } });
    s.addText(note, { x: M + 6.4, y, w: 5.6, h: 0.4, fontSize: 12, color: TXT, fontFace: F, margin: 0 });
  };
  slider(3.15, "伪装度", 0.8, "洗白“皮肤”类特征——措辞越自然越难被话术模型识别");
  slider(3.85, "激进度", 0.5, "放大“心理”类特征——咄咄逼人等于自曝");
  slider(4.55, "投放量", 0.3, "增加暴露面——样本群里总有防线的眼线");
  card(s, M, 5.35, W - 2 * M, 1.35);
  s.addText("~63%", { x: M + 0.35, y: 5.5, w: 2.1, h: 1.0, fontSize: 40, bold: true, color: CYAN, fontFace: "Arial", valign: "middle", margin: 0 });
  s.addText("预测仪 ±8 误差带：玩家只能估计检出率，无法穷举最优解；投放瞬间的噪声结算，让每一局都保留博弈张力。",
    { x: M + 2.6, y: 5.55, w: 9.3, h: 0.95, fontSize: 13.5, color: TXT, fontFace: F, lineSpacingMultiple: 1.3, valign: "middle", margin: 0 });
  s.addNotes("技术深挖第二页：公式可讲解可复现（非黑盒）。设计要点是故意引入不确定性——对抗游戏一旦可穷举就死了。");
})();

/* ============ S14 创新技术③ 云端大模型智能体 ============ */
(() => {
  const s = baseSlide("04 · 创新技术", "创新技术 ③  云端大模型智能体（DeepSeek）");
  card(s, M, 1.65, 5.95, 4.7);
  s.addText("能力：任意遭遇 · 任意问法", { x: M + 0.28, y: 1.88, w: 5, h: 0.4, fontSize: 16, bold: true, color: CYAN, fontFace: F, margin: 0 });
  s.addText([
    { text: "遭遇研判：四段式结论——判定/风险分 → 引用原话的可疑要素 → 剧本与下一步预测 → 96110 行动清单", options: { bullet: bu(), breakLine: true } },
    { text: "自由问答：回答自动携带用户段位/五维/错题，个性化作答", options: { bullet: bu(), breakLine: true } },
    { text: "SSE 流式打字机 + 语音播报，警官式人设 System Prompt", options: { bullet: bu(), breakLine: true } },
    { text: "界面零配置：配置全部在后台 config.js", options: { bullet: bu() } },
  ], { x: M + 0.28, y: 2.38, w: 5.4, h: 2.5, fontSize: 12.5, color: TXT, fontFace: F, paraSpaceAfter: 9, margin: 0 });
  s.addText("已用团队 Key 真机接入并验证", { x: M + 0.28, y: 5.55, w: 5.4, h: 0.5, fontSize: 13.5, bold: true, color: AMBER, fontFace: F, margin: 0 });
  card(s, 6.85, 1.65, W - M - 6.85, 4.7, { line: { color: RED, width: 1 } });
  s.addText("工程保障", { x: 7.12, y: 1.88, w: 5, h: 0.4, fontSize: 16, bold: true, color: RED, fontFace: F, margin: 0 });
  s.addText([
    { text: "deepseek-flash 低价档思考型模型，已适配思考 token（额度 2000 防截断）", options: { bullet: bu(RED), breakLine: true } },
    { text: "Key 混淆存储（XOR+Base64）：源码/截图零明文；对外分发包不含 Key", options: { bullet: bu(RED), breakLine: true } },
    { text: "三层兜底：云端 → 离线规则引擎（七类要素×八剧本）→ 断网可用", options: { bullet: bu(RED), breakLine: true } },
    { text: "换 Key：tools/obscure_key.js 一条命令重新编码", options: { bullet: bu(RED) } },
  ], { x: 7.12, y: 2.38, w: 5.5, h: 2.5, fontSize: 12.5, color: TXT, fontFace: F, paraSpaceAfter: 9, margin: 0 });
  s.addText("演示永不掉链子：云端挂了自动回落，界面无感", { x: 7.12, y: 5.55, w: 5.5, h: 0.5, fontSize: 13.5, bold: true, color: AMBER, fontFace: F, margin: 0 });
  s.addNotes("技术深挖第三页升级：真大模型智能体。强调三件事——任意案例（非固定题库）、flash低价+思考型适配的工程细节、Key安全（混淆+分发不含Key+三层兜底）。");
})();

/* ============ S15 智能体实测 ============ */
(() => {
  const s = baseSlide("04 · 创新技术", "智能体实测：真模型 · 任意遭遇 · 当场判定");
  phone(s, "agent-diag.png", 9.75, 1.62, 4.9, "真实 DeepSeek 研判界面");
  const case1 = [
    ["测试案例", "“同学说内部渠道六折充话费，让我先转 200，付款后被拉黑”"],
    ["模型判定", "【高危 88/99】“内部六折话费”是典型诱饵，转账后被拉黑，基本认定诈骗"],
    ["输出要点", "引用原话逐条解释 → 虚假购物剧本 → 追回与报警行动清单"],
  ];
  const case2 = [
    ["测试案例", "“我爸接到电话说社保卡被冒用，要把钱转到安全账户配合调查”"],
    ["模型判定", "【高危 99/99】冒充公检法三件套：涉案恐吓+安全账户+限时配合"],
    ["输出要点", "直接给出劝阻父亲的具体话术与 96110 提醒"],
  ];
  [case1, case2].forEach((cs, i) => {
    const y = 1.62 + i * 2.42;
    card(s, M, y, 8.9 - M, 2.2);
    cs.forEach((row, j) => {
      s.addText(row[0], { x: M + 0.24, y: y + 0.13 + j * 0.66, w: 1.35, h: 0.6, fontSize: 11.5, bold: true, color: j === 1 ? RED : MUT, fontFace: F, margin: 0 });
      s.addText(row[1], { x: M + 1.66, y: y + 0.13 + j * 0.66, w: 7.0, h: 0.66, fontSize: j === 1 ? 13 : 12, color: j === 1 ? TXT : TXT, fontFace: F, lineSpacingMultiple: 1.2, margin: 0 });
    });
  });
  s.addNotes("真模型真Key实测两例：一个交易类、一个冒充公检法类——都不是预设案例，模型自由理解。评委现场可扫码随便编一个遭遇验证。");
})();

/* ============ S15 效果验证 ============ */
(() => {
  const s = baseSlide("05 · 效果验证", "效果验证：前后测 + 五维风险画像");
  phone(s, "profile.png", 9.7, 1.62, 4.9, "五维画像（内部试玩数据）");
  const stat = (x, big, label, color) => {
    card(s, x, 1.75, 2.75, 1.5, { fill: { color: CARD2 } });
    s.addText(big, { x, y: 1.9, w: 2.75, h: 0.75, fontSize: 34, bold: true, color: color, fontFace: "Arial", align: "center", margin: 0 });
    s.addText(label, { x, y: 2.68, w: 2.75, h: 0.4, fontSize: 12, color: MUT, fontFace: F, align: "center", margin: 0 });
  };
  stat(M, "__ %", "训练前 · 识别率（前测）", TXT);
  stat(M + 2.95, "__ %", "训练后 · 识别率（后测）", CYAN);
  stat(M + 5.9, "5 维", "能力画像 + 个性化建议", AMBER);
  rows(s, [
    ["评测方案", "招募 20–30 名同学：前测 10 题 → 完成四波训练 → 后测 10 题（同难度不同题）"],
    ["报告产出", "识别率变化 · 五维雷达 · 常错破绽 TOP3 · 个性化建议——个人版与班级匿名汇总版"],
    ["当前状态", "全流程自动化回归已通过；正式前后测数据将于提交前填入（数据位已预留）"],
  ], M, 3.65, 8.9, 0.72, 0.62);
  s.addNotes("诚实口径：截图为内部试玩数据（N=1），正式前后测进行中、提交前填入。评委追问样本时如实说明方案与进度。");
})();

/* ============ S16 创新点小结 ============ */
(() => {
  const s = baseSlide("05 · 效果验证", "创新点小结");
  const pts = [
    ["攻防双视角训练法", "防守（拦截/拆解）与进攻（造浪者/自由撰写）闭环——在沙箱里从攻击者视角学会防守"],
    ["证物化拆解交互", "把“圈出可疑”升级为“证物拖入类别槽”——归类动作本身就是知识结构化"],
    ["带误差的连续对抗空间", "滑杆连续调参 × 非线性公式 × 噪声结算——不可穷举，每一局都有博弈张力"],
    ["云端大模型智能体", "任意遭遇研判+个性化问答 · DeepSeek flash · Key 混淆与三层兜底"],
  ];
  pts.forEach((p, i) => {
    const y = 1.7 + i * 1.22;
    card(s, M, y, W - 2 * M, 1.05);
    s.addText(String(i + 1), { x: M + 0.3, y: y + 0.2, w: 0.75, h: 0.65, fontSize: 30, bold: true, color: i % 2 ? RED : CYAN, fontFace: "Arial", margin: 0 });
    s.addText(p[0], { x: M + 1.2, y: y + 0.14, w: 3.6, h: 0.75, fontSize: 16.5, bold: true, color: WHITE, fontFace: F, valign: "middle", margin: 0 });
    s.addText(p[1], { x: M + 4.9, y: y + 0.14, w: 7.2, h: 0.78, fontSize: 12.5, color: TXT, fontFace: F, valign: "middle", lineSpacingMultiple: 1.25, margin: 0 });
  });
  s.addNotes("四条与申报书措辞完全一致——评委交叉核对材料时的一致性本身就是加分项。");
})();

/* ============ S17 应用与推广 ============ */
(() => {
  const s = baseSlide("06 · 应用与展望", "应用与推广路径");
  const steps = [["校内落地", "新生安全教育月\n班级扫码演练", "保卫处/辅导员\n匿名汇总即报告"],
                 ["课堂教学", "网安 / AI 素养课\n互动教学具", "拆解台=教具\n画像=学情反馈"],
                 ["开放分发", "静态托管零门槛\n校园内网可离线部署", "开源分发\n社区共建题库"]];
  steps.forEach((st, i) => {
    const x = M + i * 4.18;
    card(s, x, 1.75, 3.95, 3.3);
    s.addText("PHASE " + (i + 1), { x: x + 0.3, y: 2.0, w: 3, h: 0.3, fontSize: 12, bold: true, color: CYAN, fontFace: "Arial", charSpacing: 2, margin: 0 });
    s.addText(st[0], { x: x + 0.3, y: 2.35, w: 3.3, h: 0.5, fontSize: 19, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addText(st[1], { x: x + 0.3, y: 2.95, w: 3.35, h: 0.95, fontSize: 13, color: TXT, fontFace: F, lineSpacingMultiple: 1.3, margin: 0 });
    s.addText(st[2], { x: x + 0.3, y: 4.05, w: 3.35, h: 0.85, fontSize: 11.5, color: MUT, fontFace: F, lineSpacingMultiple: 1.25, margin: 0 });
    if (i < 2) s.addText("→", { x: x + 3.95, y: 3.1, w: 0.25, h: 0.5, fontSize: 20, bold: true, color: CYAN, fontFace: "Arial", align: "center", margin: 0 });
  });
  card(s, M, 5.35, W - 2 * M, 1.15, { fill: { color: CARD2 } });
  s.addText([
    { text: "后端化路线：", options: { bold: true, color: AMBER, fontSize: 13.5 } },
    { text: "大模型话术（安全官自由问答）· 分类器判分（可解释评测）· 每日挑战动态题库 · 班级看板——交互层零改动", options: { color: TXT, fontSize: 13.5 } },
  ], { x: M + 0.3, y: 5.5, w: W - 2 * M - 0.6, h: 0.85, fontFace: F, valign: "middle", margin: 0 });
  s.addNotes("路径可信最重要：从校内真实场景起步，再到课堂，再开源。不要画大饼。");
})();

/* ============ S18 AI 协作工程实践 ============ */
(() => {
  const s = baseSlide("06 · 应用与展望", "AI 协作的工程实践（对应申报书第七章）");
  const flow = ["人定架构与验收标准", "大模型生成候选实现", "人工评审后合入", "浏览器自动化回归"];
  flow.forEach((f, i) => {
    const x = M + i * 3.13;
    card(s, x, 1.7, 2.85, 1.0, { fill: { color: CARD2 } });
    s.addText(f, { x: x + 0.15, y: 1.78, w: 2.55, h: 0.85, fontSize: 13, bold: true, color: WHITE, fontFace: F, align: "center", valign: "middle", lineSpacingMultiple: 1.2, margin: 0 });
    if (i < 3) s.addText("→", { x: x + 2.85, y: 1.95, w: 0.28, h: 0.5, fontSize: 18, bold: true, color: CYAN, fontFace: "Arial", align: "center", margin: 0 });
  });
  card(s, M, 3.1, 5.95, 3.3);
  s.addText("回归战绩（真实记录）", { x: M + 0.28, y: 3.32, w: 5, h: 0.4, fontSize: 15, bold: true, color: CYAN, fontFace: F, margin: 0 });
  s.addText([
    { text: "全流程自动化回归：四波分拣 / 拆解 10-10 归位 / 实验室投放 / 自由撰写 / 报告生成", options: { bullet: bu(), breakLine: true } },
    { text: "人工修复 AI 初版 2 处交互缺陷：拖拽过渡丢判定 · 合成事件指针捕获异常", options: { bullet: bu(), breakLine: true } },
    { text: "数据校验脚本：靶点存在性 / 队列有效性 / 维度覆盖", options: { bullet: bu() } },
  ], { x: M + 0.28, y: 3.85, w: 5.4, h: 2.3, fontSize: 12.5, color: TXT, fontFace: F, paraSpaceAfter: 10, margin: 0 });
  card(s, 6.85, 3.1, W - M - 6.85, 3.3, { line: { color: AMBER, width: 1 } });
  s.addText("边界声明（如实）", { x: 7.12, y: 3.32, w: 5, h: 0.4, fontSize: 15, bold: true, color: AMBER, fontFace: F, margin: 0 });
  s.addText([
    { text: "AI 辅助范围：脚手架代码 / 样式片段 / 正则草案 / 文档初稿", options: { bullet: bu(AMBER), breakLine: true } },
    { text: "100% 人工完成：玩法设计 · 样本与破绽标注 · 判定规则 · 全部文案", options: { bullet: bu(AMBER), breakLine: true } },
    { text: "无 AI 生成图像/音频素材（音效为程序合成）", options: { bullet: bu(AMBER) } },
  ], { x: 7.12, y: 3.85, w: 5.5, h: 2.3, fontSize: 12.5, color: TXT, fontFace: F, paraSpaceAfter: 10, margin: 0 });
  s.addNotes("答辩最容易被追问的一页：如实、具体、有战绩。把修复AI缺陷讲成工程管理能力，而不是遮掩。");
})();

/* ============ S19 团队 + 扫码 ============ */
(() => {
  const s = baseSlide("06 · 应用与展望", "团队与致谢");
  const team = [["A", "交互与玩法设计 · 前端逻辑"], ["B", "数据与规则工程（样本/破绽/判定）"], ["C", "视觉动效 · 合成音效"], ["D", "文案评测 · 前后测组织"], ["E", "测试 · 演示视频 · 材料"]];
  team.forEach((t, i) => {
    const y = 1.75 + i * 0.92;
    s.addShape(pres.shapes.OVAL, { x: M, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: CARD }, line: { color: CYAN, width: 1 } });
    s.addText(t[0], { x: M, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: CYAN, fontFace: "Arial", align: "center", valign: "middle", margin: 0 });
    s.addText(t[1], { x: M + 0.7, y: y + 0.1, w: 6.2, h: 0.45, fontSize: 14, color: TXT, fontFace: F, margin: 0 });
  });
  card(s, 8.15, 1.75, W - M - 8.15, 4.55, { fill: { color: CARD2 }, line: { color: CYAN, width: 1.25 } });
  s.addText("现场扫码 · 亲手上阵", { x: 8.15, y: 2.05, w: W - M - 8.15, h: 0.45, fontSize: 17, bold: true, color: WHITE, fontFace: F, align: "center", margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.85, y: 2.7, w: 2.3, h: 2.3, rectRadius: 0.08, fill: { color: BG }, line: { color: LINE, width: 1 } });
  s.addText("作品在线链接\n二维码\n（部署后替换）", { x: 8.85, y: 2.7, w: 2.3, h: 2.3, fontSize: 12, color: MUT, fontFace: F, align: "center", valign: "middle", lineSpacingMultiple: 1.4, margin: 0 });
  s.addText("本地演示亦可离线运行（零依赖）", { x: 8.3, y: 5.25, w: W - M - 8.3 - 0.15, h: 0.35, fontSize: 11.5, color: MUT, fontFace: F, align: "center", margin: 0 });
  s.addText("不教结论，练肌肉记忆。", { x: M, y: 6.45, w: 7.5, h: 0.45, fontSize: 16, bold: true, color: CYAN, fontFace: F, margin: 0 });
  s.addNotes("收尾话术：欢迎评委扫码现场试玩——作品当场可玩，是完成度的终极证明。团队信息定稿后替换。");
})();

pres.writeFile({ fileName: OUT }).then(() => console.log("written:", OUT, "slides:", TOTAL));
