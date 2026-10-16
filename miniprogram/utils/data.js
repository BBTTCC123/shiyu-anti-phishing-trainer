/* 数据层：与 H5 webapp/data.js 同构（CommonJS 导出）。改题两侧同步。 */
const DIMENSIONS = [
  { key: "domain", name: "域名甄别" },
  { key: "psych", name: "话术免疫" },
  { key: "link", name: "链接警惕" },
  { key: "attach", name: "附件谨慎" },
  { key: "pressure", name: "紧迫感抗压" },
];
const DIM_OF_CATEGORY = {
  domain_spoof: "domain", authority: "psych", reward_bait: "psych", personal_info: "psych",
  urgency: "pressure", link_mismatch: "link", attachment: "attach",
};
const CATEGORY_NAME = {
  domain_spoof: "域名仿冒", urgency: "紧迫话术", authority: "冒充权威", link_mismatch: "链接不符",
  reward_bait: "利诱钩子", attachment: "附件风险", personal_info: "索要个人信息",
};
const DIM_ADVICE = {
  domain: "域名甄别偏弱：读完整域名（末段才是真域名），警惕连字符/一字之差/多余后缀。",
  psych: "话术免疫偏弱：冻结/扣费/逾期作废/返利/索要验证码，一律先怀疑。",
  link: "链接警惕偏弱：不点正文链接；短链、IP 直连、二维码按不可信入口处理。",
  attach: "附件谨慎偏弱：exe/docm 一律高危；官方通知不需回传附件。",
  pressure: "紧迫感抗压偏弱：限时话术为了让你来不及思考，先冷静再核实。",
};
const RANKS = [
  { min: 85, name: "王者防线" }, { min: 70, name: "铂金猎渔者" },
  { min: 55, name: "黄金破话术" }, { min: 40, name: "白银查链接" }, { min: 0, name: "青铜识路人" },
];
const GENE_GROUPS = [
  { key: "skin", name: "拟态皮肤" }, { key: "psych", name: "心理机制" }, { key: "tech", name: "技术手段" },
];
const GENES = [
  { id: "g1", group: "skin", name: "官方公文皮", frag: "以“学生资助管理中心”名义发文", det: 10, knowledge: "公文样式人人可仿，核验发件域名才是关键。" },
  { id: "g2", group: "skin", name: "电商客服皮", frag: "自称平台售后专员", det: 15, knowledge: "平台退款只会原路退回；主动找你的客服默认可疑。" },
  { id: "g3", group: "skin", name: "校园事务皮", frag: "伪装导师/教务老师", det: 12, knowledge: "涉及转账一律第二渠道核实身份。" },
  { id: "g4", group: "psych", name: "紧迫限时", frag: "30分钟内/逾期作废", det: 15, knowledge: "所有倒计时都是为了让你来不及思考。" },
  { id: "g5", group: "psych", name: "利诱返利", frag: "双倍赔付/中奖", det: 20, knowledge: "天上掉的馅饼半径一般等于坑的半径。" },
  { id: "g6", group: "psych", name: "恐吓冻结", frag: "账户异常将冻结", det: 18, knowledge: "真出问题官方会给核验渠道，不会逼你立刻操作。" },
  { id: "g7", group: "tech", name: "仿冒域名", frag: "与官方一字之差的域名", det: 30, knowledge: "完整读一遍域名再点，一字之差即深渊。" },
  { id: "g8", group: "tech", name: "短链跳转", frag: "短链/二维码", det: 25, knowledge: "无法预览指向的入口默认不可信。" },
  { id: "g9", group: "tech", name: "附件载荷", frag: "exe/docm 附件", det: 35, knowledge: "让你运行程序的来信可以直接删。" },
];
/* 样本库：结构与 H5 完全一致（截选同 20 题，内容以 webapp/data.js 为准同步） */
const SAMPLES = [
  { id: "em1", carrier: "email", difficulty: 1, phishing: true, scene: "奖助学金",
    meta: { from: "教务处学生资助中心", addr: "jwc-zizhu@qq.com", subj: "【重要】2026年秋季助学金申领通知" },
    parts: [
      { t: "p", html: "请点击链接，<span data-el=\"em1-pi\">填写银行卡号、取款密码及验证码</span>完成核验：" },
      { t: "link", id: "em1-link", text: "http://zhuxue-buzhu.top/verify" },
      { t: "p", html: "<span data-el=\"em1-urg\">逾期未核验视为自动放弃</span>。" },
    ],
    redflags: [
      { category: "domain_spoof", target: "em1-addr", explain: "学校部门不会用 qq.com 个人邮箱发资助通知。" },
      { category: "link_mismatch", target: "em1-link", explain: "链接指向无关的 .top 域名。" },
      { category: "personal_info", target: "em1-pi", explain: "任何环节都不应索要取款密码/验证码。" },
      { category: "urgency", target: "em1-urg", explain: "“逾期视为放弃”是典型催促话术。" },
    ] },
  { id: "em2", carrier: "email", difficulty: 1, phishing: true, scene: "快递理赔",
    meta: { from: "中通速递客服中心", addr: "kefu-zto@qq-kefu163.com", subj: "包裹破损双倍理赔" },
    parts: [
      { t: "p", html: "包裹<span data-el=\"em2-urg\">外包装严重破损</span>，已启动双倍赔付：" },
      { t: "attach", id: "em2-att", text: "赔付申请表.exe" },
      { t: "p", html: "请下载附件，<span data-el=\"em2-pi\">回传姓名与银行卡号</span>。" },
    ],
    redflags: [
      { category: "authority", target: "em2-addr", explain: "冒充客服，发件域为拼接伪官方地址。" },
      { category: "attachment", target: "em2-att", explain: ".exe 是可执行程序，理赔不会让你运行程序。" },
      { category: "urgency", target: "em2-urg", explain: "紧迫感压缩思考时间。" },
      { category: "personal_info", target: "em2-pi", explain: "理赔不需预先回传银行卡号。" },
    ] },
  { id: "em3", carrier: "email", difficulty: 2, phishing: false, scene: "图书馆提醒",
    meta: { from: "图书馆", addr: "lib@cust-demo.edu.cn", subj: "图书到期提醒" },
    parts: [
      { t: "p", html: "《计算机网络（第8版）》3天后到期，可在线续借一次：" },
      { t: "link", id: "em3-link", text: "https://lib.cust-demo.edu.cn/renew" },
    ], redflags: [],
    legitNotes: [{ target: "em3-addr", note: "域名与官方一致（演示域）。" }] },
  { id: "em4", carrier: "email", difficulty: 2, phishing: true, scene: "冒充导师",
    meta: { from: "王海林", addr: "wanghailin@cust-edu.cn", subj: "课题组经费报销" },
    parts: [
      { t: "p", html: "有一批<span data-el=\"em4-urg\">今晚必须提交</span>的发票，先把<span data-el=\"em4-pi\">银行卡号发到这个邮箱</span>，勿声张。" },
    ],
    redflags: [
      { category: "domain_spoof", target: "em4-addr", explain: "cust-edu.cn 与官方一字之差。" },
      { category: "urgency", target: "em4-urg", explain: "“今晚必须+勿声张”是冒充熟人经典组合。" },
      { category: "personal_info", target: "em4-pi", explain: "报销走财务系统，不发个人邮箱。" },
    ] },
  { id: "em5", carrier: "email", difficulty: 2, phishing: true, scene: "高仿链接",
    meta: { from: "教务处", addr: "jwc@cust-demo.edu.cn", subj: "学业状态确认（系统升级补发）" },
    parts: [
      { t: "p", html: "请通过“统一入口”核验：" },
      { t: "link", id: "em5-link", text: "http://jwc.cust-demo.edu.cn.ssl-verify.top/login" },
      { t: "p", html: "未确认科目<span data-el=\"em5-urg\">按零分记载</span>。" },
    ],
    redflags: [
      { category: "link_mismatch", target: "em5-link", explain: "真实域在末尾：ssl-verify.top。" },
      { category: "urgency", target: "em5-urg", explain: "恐吓施压。" },
    ] },
  { id: "em6", carrier: "email", difficulty: 3, phishing: false, scene: "财务通知（真）",
    meta: { from: "财务处", addr: "cwc@cust-demo.edu.cn", subj: "10月学生补贴发放安排" },
    parts: [
      { t: "p", html: "补贴15日发放至学校代办卡，无需任何操作。" },
      { t: "attach", id: "em6-att", text: "发放说明.pdf" },
    ], redflags: [],
    legitNotes: [{ target: "em6-att", note: "官方域名的说明性 pdf，且未要求回复。" }] },
  { id: "em7", carrier: "email", difficulty: 3, phishing: true, scene: "定向钓鱼",
    meta: { from: "校科技创新联盟", addr: "union@stu.cust-demo.edu.cn", subj: "报名表需要补全" },
    parts: [
      { t: "p", html: "<span data-el=\"em7-pi\">联系方式栏不完整</span>，请补全手机号与身份证号回传：" },
      { t: "attach", id: "em7-att", text: "报名表回传模板.docm" },
      { t: "link", id: "em7-link", text: "http://union-form.top/apply" },
    ],
    redflags: [
      { category: "personal_info", target: "em7-pi", explain: "报名不需要身份证号。" },
      { category: "attachment", target: "em7-att", explain: ".docm 带宏，可携带恶意代码。" },
      { category: "link_mismatch", target: "em7-link", explain: "回传域名与学校无关。" },
    ] },
  { id: "em8", carrier: "email", difficulty: 3, phishing: true, scene: "二维码核验",
    meta: { from: "网络信息中心", addr: "nic@cust-demo-edu.cn", subj: "校园网账号异常登录" },
    parts: [
      { t: "p", html: "请于<span data-el=\"em8-urg\">30分钟内</span>完成实名核验：" },
      { t: "qr", id: "em8-qr", text: "扫码核验" },
    ],
    redflags: [
      { category: "domain_spoof", target: "em8-addr", explain: "连字符替换点号的伪域名。" },
      { category: "urgency", target: "em8-urg", explain: "倒计时制造恐慌。" },
      { category: "link_mismatch", target: "em8-qr", explain: "二维码=无法预览的链接。" },
    ] },
  { id: "em9", carrier: "email", difficulty: 3, phishing: false, scene: "讲座通知（真）",
    meta: { from: "计算机学院教务办", addr: "jsj-jw@cust-demo.edu.cn", subj: "学术讲座预告" },
    parts: [{ t: "p", html: "周四14:00实验楼B201，无需报名。" }], redflags: [],
    legitNotes: [{ target: "em9-addr", note: "官方域，无链接无附件无索取。" }] },
  { id: "sms1", carrier: "sms", difficulty: 1, phishing: true, scene: "刷单返利",
    meta: { phone: "+86 170****8876" },
    parts: [
      { t: "p", html: "动动手指<span data-el=\"sms1-rb\">日入300+</span>，<span data-el=\"sms1-pi\">需先垫付本金</span>：" },
      { t: "link", id: "sms1-link", text: "https://t.cn/xxxxx9" },
    ],
    redflags: [
      { category: "reward_bait", target: "sms1-rb", explain: "轻松高收益是刷单诈骗开场。" },
      { category: "personal_info", target: "sms1-pi", explain: "垫付本金=资金陷阱。" },
      { category: "link_mismatch", target: "sms1-link", explain: "短链无法预览指向。" },
    ] },
  { id: "sms2", carrier: "sms", difficulty: 2, phishing: true, scene: "退款客服",
    meta: { phone: "95xxx20" },
    parts: [
      { t: "p", html: "<span data-el=\"sms2-au\">【天猫售后】</span>商品质量问题双倍退款，<span data-el=\"sms2-urg\">今日不办理每月扣费500元</span>。" },
    ],
    redflags: [
      { category: "authority", target: "sms2-au", explain: "冒充平台售后；真实退款原路退回。" },
      { category: "urgency", target: "sms2-urg", explain: "“不办理就扣费”是恐吓话术。" },
    ] },
  { id: "sms3", carrier: "sms", difficulty: 2, phishing: false, scene: "验证码（真）",
    meta: { phone: "95588" },
    parts: [{ t: "p", html: "验证码 482913，请勿告知任何人。" }],
    redflags: [], legitNotes: [{ target: null, note: "正常验证码短信：无链接无要求。" }] },
  { id: "sms4", carrier: "sms", difficulty: 2, phishing: true, scene: "校园卡停用",
    meta: { phone: "1069xxxx" },
    parts: [
      { t: "p", html: "校园卡已<span data-el=\"sms4-urg\">暂停使用</span>，请复核：" },
      { t: "link", id: "sms4-link", text: "http://jiaowu-cust.vip-recharge.top" },
    ],
    redflags: [
      { category: "urgency", target: "sms4-urg", explain: "制造损失焦虑。" },
      { category: "link_mismatch", target: "sms4-link", explain: "域名与学校无关。" },
    ] },
  { id: "sms5", carrier: "sms", difficulty: 2, phishing: true, scene: "航班退改",
    meta: { phone: "0085xxxx" },
    parts: [
      { t: "p", html: "<span data-el=\"sms5-au\">【航空出行】</span>航班取消可获补偿，<span data-el=\"sms5-pi\">请报银行卡号接收退款</span>：" },
      { t: "link", id: "sms5-link", text: "https://dwz.cn/3aXXXX" },
    ],
    redflags: [
      { category: "authority", target: "sms5-au", explain: "冒充航司，境外号码伪装。" },
      { category: "personal_info", target: "sms5-pi", explain: "退款只原路退回购票账户。" },
      { category: "link_mismatch", target: "sms5-link", explain: "短链跳转。" },
    ] },
  { id: "sms6", carrier: "sms", difficulty: 3, phishing: true, scene: "高仿通知",
    meta: { phone: "1069xxxx" },
    parts: [
      { t: "p", html: "【教务提示】重修申请待确认：" },
      { t: "link", id: "sms6-link", text: "http://111.230.5.14:8080/confirm" },
    ],
    redflags: [
      { category: "link_mismatch", target: "sms6-link", explain: "话术正常，唯一破绽是裸 IP 直连。" },
    ] },
  { id: "lp1", carrier: "linkpage", difficulty: 1, phishing: true, scene: "仿登录页",
    meta: { url: "http://ejuan-cust.vip-verify.top/login", title: "统一身份认证" },
    parts: [
      { t: "field", id: "lp1-fu", text: "学号" },
      { t: "field", id: "lp1-fp", text: "密码" },
      { t: "btn", id: "lp1-btn", text: "登 录" },
    ],
    redflags: [
      { category: "domain_spoof", target: "lp1-url", explain: "vip-verify.top 是典型仿冒后缀。" },
      { category: "personal_info", target: "lp1-fp", explain: "在可疑域名输密码=交出账号。" },
    ] },
  { id: "lp2", carrier: "linkpage", difficulty: 1, phishing: true, scene: "中奖页",
    meta: { url: "http://prize.jd-activity.top/winner", title: "恭喜中奖" },
    parts: [
      { t: "p", html: "<span data-el=\"lp2-rb\">价值4999元</span>礼包免费领：" },
      { t: "field", id: "lp2-fa", text: "地址 / 身份证号" },
      { t: "btn", id: "lp2-btn", text: "立即领取" },
    ],
    redflags: [
      { category: "reward_bait", target: "lp2-rb", explain: "无来由中奖即诈骗第一信号。" },
      { category: "personal_info", target: "lp2-fa", explain: "领奖不需要身份证号。" },
    ] },
  { id: "lp3", carrier: "linkpage", difficulty: 2, phishing: false, scene: "校园门户（真）",
    meta: { url: "https://portal.cust-demo.edu.cn", title: "数字校园门户" },
    parts: [
      { t: "field", id: "lp3-fu", text: "统一身份认证账号" },
      { t: "field", id: "lp3-fp", text: "密码" },
    ], redflags: [],
    legitNotes: [{ target: "lp3-url", note: "https + 官方演示域。" }] },
  { id: "lp4", carrier: "linkpage", difficulty: 2, phishing: true, scene: "高仿教务",
    meta: { url: "https://jwc.csut-demo.edu.cn", title: "教务管理系统" },
    parts: [
      { t: "field", id: "lp4-f1", text: "学号" },
      { t: "field", id: "lp4-f2", text: "密码" },
    ],
    redflags: [
      { category: "domain_spoof", target: "lp4-url", explain: "csut 与 cust 一字之差。" },
      { category: "personal_info", target: "lp4-f2", explain: "高仿域名下输密码即泄露。" },
    ] },
  { id: "lp5", carrier: "linkpage", difficulty: 3, phishing: true, scene: "跳转异常",
    meta: { url: "https://lib.cust-demo.edu.cn/seat", title: "图书馆座位预约" },
    parts: [
      { t: "p", html: "点击按钮进入预约系统：" },
      { t: "btn", id: "lp5-btn", text: "进入预约系统" },
    ],
    redflags: [
      { category: "link_mismatch", target: "lp5-btn", explain: "页面正常，按钮实跳外部域——入口正常、出口异常。" },
    ] },
];
SAMPLES.forEach((s) => {
  if (s.carrier === "email" && s.meta.addr) s.meta.addrId = s.id + "-addr";
  if (s.carrier === "linkpage" && s.meta.url) s.meta.urlId = s.id + "-url";
});
const CAMPAIGN = {
  pretest: ["em1", "sms1", "lp1", "em4", "sms4"],
  train: ["em2", "em3", "sms2", "sms3", "em5", "lp2", "em7", "lp3", "em8", "lp4"],
  posttest: ["sms5", "em6", "lp5", "sms6", "em9"],
};
const WAVES = [
  { name: "第一波 · 前测侦察", ids: ["em1", "em3", "sms1", "lp3", "em4"], reveal: false },
  { name: "第二波 · 近海拦截", ids: ["em2", "sms3", "sms2", "em5", "lp1"], reveal: true },
  { name: "第三波 · 深水区", ids: ["sms4", "lp2", "em6", "lp4", "em7"], reveal: true },
  { name: "第四波 · 终局后测", ids: ["sms5", "em9", "lp5", "sms6", "em8"], reveal: false },
];
const FREE_RULES = [
  { k: "urg", name: "紧迫限时", det: 14, re: /(立即|马上|尽快|\d+分钟内|小时内|今日内|逾期|限时|过期|作废|停用)/g, know: "倒计时话术为了压缩思考时间。" },
  { k: "rew", name: "利诱返利", det: 16, re: /(返利|中奖|赔付|补偿|领取|补贴|佣金|免费领|双倍|日入)/g, know: "无来由的好处就是鱼钩。" },
  { k: "aut", name: "冒充权威", det: 10, re: /(客服|官方|公安|检察院|法院|银行|教务处|财务处|资助中心|管理员|老师)/g, know: "身份可以随便编，核验渠道不能跟对方走。" },
  { k: "pi", name: "索要敏感信息", det: 15, re: /(验证码|密码|银行卡号|身份证号|手机号)/g, know: "索要验证码/密码直接判定诈骗。" },
  { k: "lnk", name: "可疑链接", det: 18, re: /(t\.cn\/|dwz\.cn\/|url\.cn\/|bit\.ly\/|\d+\.\d+\.\d+\.\d+|http:\/\/)/g, know: "短链与裸 IP 按不可信入口处理。" },
  { k: "att", name: "附件诱导", det: 9, re: /(见附件|附件|点击下载|打开附件|启用宏)/g, know: "让你运行程序的来信直接删除。" },
];
module.exports = {
  DIMENSIONS, DIM_OF_CATEGORY, CATEGORY_NAME, DIM_ADVICE, RANKS,
  GENE_GROUPS, GENES, SAMPLES, CAMPAIGN, WAVES, FREE_RULES,
};
