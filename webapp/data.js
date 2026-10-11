/* ============ 识渔计划 数据层（全部样本为虚构，仅用于教学模拟） ============ */

const DIMENSIONS = [
  { key: "domain",   name: "域名甄别" },
  { key: "psych",    name: "话术免疫" },
  { key: "link",     name: "链接警惕" },
  { key: "attach",   name: "附件谨慎" },
  { key: "pressure", name: "紧迫感抗压" },
];

const DIM_OF_CATEGORY = {
  domain_spoof: "domain",
  authority:    "psych",
  reward_bait:  "psych",
  personal_info:"psych",
  urgency:      "pressure",
  link_mismatch:"link",
  attachment:   "attach",
};

const CATEGORY_NAME = {
  domain_spoof: "域名仿冒",
  urgency: "紧迫话术",
  authority: "冒充权威",
  link_mismatch: "链接不符",
  reward_bait: "利诱钩子",
  attachment: "附件风险",
  personal_info: "索要个人信息",
};

const DIM_ADVICE = {
  domain:   "域名甄别偏弱：养成看完整域名的习惯（@后整个字符串、末尾一段才是真域名），注意连字符/一字之差/多余后缀。",
  psych:    "话术免疫偏弱：凡出现“冻结、扣费、逾期作废、双倍赔付、垫付返利、索要验证码/身份证号”，一律先怀疑。",
  link:     "链接警惕偏弱：不点短信/邮件正文链接；悬停或长按查看真实指向；短链、IP 直连、二维码一律视为不可信入口。",
  attach:   "附件谨慎偏弱：不打开陌生来信的附件；exe/dotm/docm 等可执行或宏格式一律高危；官方通知通常不需要你回传附件。",
  pressure: "紧迫感抗压偏弱：倒计时/限时话术正是为了让你来不及思考。遇到“立即、马上、X分钟内”，先停下来，换官方渠道核实。",
};

const FA_DIM_BY_PARTTYPE = {
  addr: "domain", url: "domain", phone: "domain",
  link: "link", qr: "link", btn: "link",
  attach: "attach",
  subj: "psych", p: "psych", field: "psych",
};

/* ---------- 样本库：carrier(email/sms/linkpage) × difficulty(1-3) ---------- */
/* parts: {t, id?, text/html, sub?}；redflags 引用 parts.id */
const SAMPLES = [
  /* ============ 邮件 ============ */
  { id: "em1", carrier: "email", difficulty: 1, phishing: true, scene: "奖助学金",
    meta: { from: "教务处学生资助中心", addr: "jwc-zizhu@qq.com", subj: "【重要】2026年秋季助学金申领通知", time: "08:12" },
    parts: [
      { t: "p", html: "各位同学：根据学校资助管理中心安排，本学期助学金将于近期分批发放。" },
      { t: "p", html: "请点击下方链接，<span class=\"sel-target\" data-el=\"em1-pi\">填写银行卡号、取款密码及短信验证码</span>完成身份核验：" },
      { t: "link", id: "em1-link", text: "http://zhuxue-buzhu.top/verify" },
      { t: "p", html: "<span class=\"sel-target\" data-el=\"em1-urg\">逾期未核验视为自动放弃</span>本学期资助资格。" },
    ],
    redflags: [
      { category: "domain_spoof", target: "em1-addr", explain: "学校部门不会使用 qq.com 个人邮箱发送资助通知。" },
      { category: "link_mismatch", target: "em1-link", explain: "链接指向与学校毫无关系的 .top 域名。" },
      { category: "personal_info", target: "em1-pi", explain: "任何正规环节都不会索要银行卡取款密码和短信验证码。" },
      { category: "urgency", target: "em1-urg", explain: "“逾期视为放弃”制造截止压力，是典型催促话术。" },
    ] },

  { id: "em2", carrier: "email", difficulty: 1, phishing: true, scene: "快递理赔",
    meta: { from: "中通速递客服中心", addr: "kefu-zto@qq-kefu163.com", subj: "您的包裹在运输中破损，可获双倍理赔", time: "14:47" },
    parts: [
      { t: "p", html: "您好：您的包裹（单号末四位 8873）在分拣过程中<span class=\"sel-target\" data-el=\"em2-urg\">外包装严重破损</span>，现已为您启动双倍赔付流程。" },
      { t: "attach", id: "em2-att", text: "赔付申请表.exe", sub: "358 KB" },
      { t: "p", html: "请下载并填写附件，<span class=\"sel-target\" data-el=\"em2-pi\">回传您的姓名、银行卡号</span>，今日内到账，逾期不予受理。" },
    ],
    redflags: [
      { category: "authority", target: "em2-addr", explain: "冒充快递客服，但发件域为拼接的伪官方地址。" },
      { category: "attachment", target: "em2-att", explain: ".exe 是可执行程序，正规理赔绝不会让你运行程序。" },
      { category: "urgency", target: "em2-urg", explain: "强调“破损/今日内”，用紧迫感压缩你的思考时间。" },
      { category: "personal_info", target: "em2-pi", explain: "理赔不需预先回传银行卡号。" },
    ] },

  { id: "em3", carrier: "email", difficulty: 2, phishing: false, scene: "图书馆提醒",
    meta: { from: "图书馆", addr: "lib@cust-demo.edu.cn", subj: "图书到期提醒", time: "09:30" },
    parts: [
      { t: "p", html: "读者您好：您借阅的《计算机网络（第8版）》将于 3 天后到期，可在到期前在线续借一次。" },
      { t: "link", id: "em3-link", text: "https://lib.cust-demo.edu.cn/renew" },
      { t: "p", html: "如有疑问请携带校园卡到一层服务台咨询。" },
    ],
    redflags: [],
    legitNotes: [
      { target: "em3-addr", note: "发件域与图书馆官方域名一致（演示域），非个人邮箱。" },
      { target: "em3-link", note: "链接域名与官网一致且为 https，未索要任何敏感信息。" },
    ] },

  { id: "em4", carrier: "email", difficulty: 2, phishing: true, scene: "冒充导师",
    meta: { from: "王海林", addr: "wanghailin@cust-edu.cn", subj: "关于课题组经费报销的事", time: "21:03" },
    parts: [
      { t: "p", html: "同学你好，我这边有一批<span class=\"sel-target\" data-el=\"em4-urg\">今晚必须提交</span>的会议发票，" },
      { t: "p", html: "你先把<span class=\"sel-target\" data-el=\"em4-pi\">银行卡号发到这个邮箱</span>，报销款到账后我再把垫付部分转给你，勿声张。" },
    ],
    redflags: [
      { category: "domain_spoof", target: "em4-addr", explain: " cust-edu.cn 与官方 cust-demo.edu.cn 仅差一个字符——一字之差即伪域名。" },
      { category: "urgency", target: "em4-urg", explain: "“今晚必须”“勿声张”是冒充熟人诈骗的经典组合。" },
      { category: "personal_info", target: "em4-pi", explain: "正规报销走财务系统，不会让你把银行卡号发给个人邮箱。" },
    ] },

  { id: "em5", carrier: "email", difficulty: 2, phishing: true, scene: "高仿链接",
    meta: { from: "教务处", addr: "jwc@cust-demo.edu.cn", subj: "学业状态确认（系统升级补发）", time: "10:15" },
    parts: [
      { t: "p", html: "因系统升级，部分同学的学业状态需重新确认，请通过下方“统一入口”核验：" },
      { t: "link", id: "em5-link", text: "http://jwc.cust-demo.edu.cn.ssl-verify.top/login" },
      { t: "p", html: "未确认的科目成绩将<span class=\"sel-target\" data-el=\"em5-urg\">按零分记载</span>。" },
    ],
    redflags: [
      { category: "link_mismatch", target: "em5-link", explain: "长域名陷阱：真正的域名在末尾（ssl-verify.top），前面一大串都是伪装。" },
      { category: "urgency", target: "em5-urg", explain: "“按零分记载”恐吓施压。" },
    ] },

  { id: "em6", carrier: "email", difficulty: 3, phishing: false, scene: "财务通知（真）",
    meta: { from: "财务处", addr: "cwc@cust-demo.edu.cn", subj: "2026年10月学生补贴发放安排", time: "08:00" },
    parts: [
      { t: "p", html: "十月学生补贴将于 15 日统一发放至学校代办的银行卡，无需任何操作。" },
      { t: "attach", id: "em6-att", text: "发放说明.pdf", sub: "126 KB" },
      { t: "p", html: "如有疑问请到行政楼 204 室咨询，谨防以发放补贴为名的诈骗。" },
    ],
    redflags: [],
    legitNotes: [
      { target: "em6-addr", note: "官方域名 + 明确线下办理渠道。" },
      { target: "em6-att", note: "官方域名来信中的说明性 pdf，且全文未要求你回复任何信息——结合域名与要求综合判断。" },
    ] },

  { id: "em7", carrier: "email", difficulty: 3, phishing: true, scene: "定向钓鱼",
    meta: { from: "校科技创新联盟", addr: "union@stu.cust-demo.edu.cn", subj: "你的《识渔计划》报名表需要补全", time: "17:26" },
    parts: [
      { t: "p", html: "收到你通过社团渠道提交的竞赛报名表，其中<span class=\"sel-target\" data-el=\"em7-pi\">联系方式栏不完整</span>，请补全手机号与身份证号后回传：" },
      { t: "attach", id: "em7-att", text: "报名表回传模板.docm", sub: "88 KB" },
      { t: "link", id: "em7-link", text: "http://union-form.top/apply" },
    ],
    redflags: [
      { category: "personal_info", target: "em7-pi", explain: "报名表不需要身份证号；索要证件号即为红旗。" },
      { category: "attachment", target: "em7-att", explain: ".docm 是带宏的文档，可携带恶意代码。" },
      { category: "link_mismatch", target: "em7-link", explain: "回传入口域名与学校无关。" },
    ] },

  { id: "em8", carrier: "email", difficulty: 3, phishing: true, scene: "二维码核验",
    meta: { from: "网络信息中心", addr: "nic@cust-demo-edu.cn", subj: "校园网账号异常登录提醒", time: "12:44" },
    parts: [
      { t: "p", html: "系统检测到您的账号在异地登录，请于<span class=\"sel-target\" data-el=\"em8-urg\">30 分钟内</span>完成实名核验，否则账号将被停用：" },
      { t: "qr", id: "em8-qr", text: "扫码核验" },
    ],
    redflags: [
      { category: "domain_spoof", target: "em8-addr", explain: " cust-demo-edu.cn 用连字符替换了点号，一字之差的伪域名。" },
      { category: "urgency", target: "em8-urg", explain: "倒计时 30 分钟，制造恐慌。" },
      { category: "link_mismatch", target: "em8-qr", explain: "二维码=无法预览指向的链接，等价于不明短链。" },
    ] },

  { id: "em9", carrier: "email", difficulty: 3, phishing: false, scene: "讲座通知（真）",
    meta: { from: "计算机学院教务办", addr: "jsj-jw@cust-demo.edu.cn", subj: "学术讲座预告：大模型安全攻防", time: "16:20" },
    parts: [
      { t: "p", html: "本周四 14:00 在实验楼 B201 举办学术讲座，可认定素质拓展学分，无需报名，座位先到先得。" },
    ],
    redflags: [],
    legitNotes: [
      { target: "em9-addr", note: "官方域名、无链接无附件、无任何信息索取。" },
    ] },

  /* ============ 短信 ============ */
  { id: "sms1", carrier: "sms", difficulty: 1, phishing: true, scene: "刷单返利",
    meta: { phone: "+86 170****8876", time: "19:52" },
    parts: [
      { t: "p", html: "【兼职】动动手指<span class=\"sel-target\" data-el=\"sms1-rb\">日入 300+</span>！给短视频点赞关注即可结算，<span class=\"sel-target\" data-el=\"sms1-pi\">需先垫付本金</span>提升等级，加群了解：" },
      { t: "link", id: "sms1-link", text: "https://t.cn/xxxxx9" },
    ],
    redflags: [
      { category: "reward_bait", target: "sms1-rb", explain: "“日入 300+ 轻松结算”是刷单诈骗的标准开场。" },
      { category: "personal_info", target: "sms1-pi", explain: "垫付本金=资金陷阱，先给小利再收割大额。" },
      { category: "link_mismatch", target: "sms1-link", explain: "短链无法预览真实指向。" },
    ] },

  { id: "sms2", carrier: "sms", difficulty: 2, phishing: true, scene: "退款客服",
    meta: { phone: "95xxx20", time: "11:08" },
    parts: [
      { t: "p", html: "<span class=\"sel-target\" data-el=\"sms2-au\">【天猫售后】</span>您购买的商品检测出质量问题，双倍退款已受理。<span class=\"sel-target\" data-el=\"sms2-urg\">今日不办理将每月自动扣费 500 元</span>，回T退订。" },
    ],
    redflags: [
      { category: "authority", target: "sms2-au", explain: "冒充平台官方售后；真实退款只会原路退回，无需你“办理”。" },
      { category: "urgency", target: "sms2-urg", explain: "“不办理就扣费”是恐吓型紧迫话术。" },
    ] },

  { id: "sms3", carrier: "sms", difficulty: 2, phishing: false, scene: "验证码（真）",
    meta: { phone: "95588", time: "13:31" },
    parts: [
      { t: "p", html: "【演示银行】验证码 482913，您正在进行登录操作。验证码请勿告知任何人，工作人员不会向您索要。" },
    ],
    redflags: [],
    legitNotes: [
      { target: null, note: "正常的验证码短信：官方号段、只告知验证码并提醒保密，没有任何链接与要求。" },
    ] },

  { id: "sms4", carrier: "sms", difficulty: 2, phishing: true, scene: "校园卡停用",
    meta: { phone: "1069xxxx", time: "07:59" },
    parts: [
      { t: "p", html: "【校园卡中心】您的校园卡已<span class=\"sel-target\" data-el=\"sms4-urg\">被暂停使用</span>，请前往完成身份复核后重启：" },
      { t: "link", id: "sms4-link", text: "http://jiaowu-cust.vip-recharge.top" },
    ],
    redflags: [
      { category: "urgency", target: "sms4-urg", explain: "“已被暂停”制造损失焦虑。" },
      { category: "link_mismatch", target: "sms4-link", explain: "充值复核域名与学校无关；校园卡业务请走校内官方入口。" },
    ] },

  { id: "sms5", carrier: "sms", difficulty: 2, phishing: true, scene: "航班退改",
    meta: { phone: "0085xxxx", time: "05:23" },
    parts: [
      { t: "p", html: "<span class=\"sel-target\" data-el=\"sms5-au\">【航空出行】</span>您预订的 CZ36XX 航班因机械故障取消，改签可获 300 元补偿。<span class=\"sel-target\" data-el=\"sms5-pi\">请回短信提供银行卡号接收退款</span>：" },
      { t: "link", id: "sms5-link", text: "https://dwz.cn/3aXXXX" },
    ],
    redflags: [
      { category: "authority", target: "sms5-au", explain: "冒充航司；0085 开头为境外号码伪装。" },
      { category: "personal_info", target: "sms5-pi", explain: "退款只会原路退回购票账户，不需要新银行卡号。" },
      { category: "link_mismatch", target: "sms5-link", explain: "短链跳转，真实目的地不明。" },
    ] },

  { id: "sms6", carrier: "sms", difficulty: 3, phishing: true, scene: "高仿通知",
    meta: { phone: "1069xxxx", time: "15:42" },
    parts: [
      { t: "p", html: "【教务提示】你有一门课程的重修申请待确认，确认地址：" },
      { t: "link", id: "sms6-link", text: "http://111.230.5.14:8080/confirm" },
    ],
    redflags: [
      { category: "link_mismatch", target: "sms6-link", explain: "L3 级伪装：话术完全正常，唯一破绽是裸 IP 直连地址——正规系统不会用 IP+端口做入口。" },
    ] },

  /* ============ 链接页 ============ */
  { id: "lp1", carrier: "linkpage", difficulty: 1, phishing: true, scene: "仿登录页",
    meta: { url: "http://ejuan-cust.vip-verify.top/login", title: "统一身份认证" },
    parts: [
      { t: "field", id: "lp1-fu", text: "学号" },
      { t: "field", id: "lp1-fp", text: "密码" },
      { t: "btn", id: "lp1-btn", text: "登 录" },
    ],
    redflags: [
      { category: "domain_spoof", target: "lp1-url", explain: "地址栏域名与学校无关，vip-verify.top 是典型仿冒后缀。" },
      { category: "personal_info", target: "lp1-fp", explain: "在可疑域名页面输入密码=直接交出账号。" },
    ] },

  { id: "lp2", carrier: "linkpage", difficulty: 1, phishing: true, scene: "中奖页",
    meta: { url: "http://prize.jd-activity.top/winner", title: "恭喜中奖" },
    parts: [
      { t: "p", html: "您已获得限量礼包一份，<span class=\"sel-target\" data-el=\"lp2-rb\">价值 4999 元</span>，填写信息免费领取：" },
      { t: "field", id: "lp2-fn", text: "姓名 / 手机号" },
      { t: "field", id: "lp2-fa", text: "地址 / 身份证号" },
      { t: "btn", id: "lp2-btn", text: "立即领取" },
    ],
    redflags: [
      { category: "reward_bait", target: "lp2-rb", explain: "无来由的中奖本身就是诈骗第一信号。" },
      { category: "personal_info", target: "lp2-fa", explain: "领取奖品不需要身份证号。" },
    ] },

  { id: "lp3", carrier: "linkpage", difficulty: 2, phishing: false, scene: "校园门户（真）",
    meta: { url: "https://portal.cust-demo.edu.cn", title: "数字校园门户" },
    parts: [
      { t: "field", id: "lp3-fu", text: "统一身份认证账号" },
      { t: "field", id: "lp3-fp", text: "密码" },
      { t: "btn", id: "lp3-btn", text: "登 录" },
    ],
    redflags: [],
    legitNotes: [
      { target: "lp3-url", note: "https + 官方演示域，登录页出现在正确域名下才可信。" },
    ] },

  { id: "lp4", carrier: "linkpage", difficulty: 2, phishing: true, scene: "高仿教务",
    meta: { url: "https://jwc.csut-demo.edu.cn", title: "教务管理系统" },
    parts: [
      { t: "field", id: "lp4-f1", text: "学号" },
      { t: "field", id: "lp4-f2", text: "密码" },
      { t: "btn", id: "lp4-btn", text: "登 录" },
    ],
    redflags: [
      { category: "domain_spoof", target: "lp4-url", explain: "csut 与 cust 一字之差；页面可以做得一模一样，域名不会。" },
      { category: "personal_info", target: "lp4-f2", explain: "在高仿域名下输入密码即泄露凭据。" },
    ] },

  { id: "lp5", carrier: "linkpage", difficulty: 3, phishing: true, scene: "跳转异常",
    meta: { url: "https://lib.cust-demo.edu.cn/seat", title: "图书馆座位预约" },
    parts: [
      { t: "p", html: "当前页面为座位预约快捷入口，点击下方按钮进入预约系统：" },
      { t: "btn", id: "lp5-btn", text: "进入预约系统" },
    ],
    redflags: [
      { category: "link_mismatch", target: "lp5-btn", explain: "L3 级伪装：域名和页面都正常，唯一破绽是按钮实际跳向外部域（浏览器下方预览可见 pay-lib.vip）——对“入口正常、出口异常”保持警觉。" },
    ] },
];

/* 邮件发件人行/链接页地址栏是固定靶点：补齐 id */
SAMPLES.forEach(s => {
  if (s.carrier === "email" && s.meta.addr) s.meta.addrId = s.id + "-addr";
  if (s.carrier === "linkpage" && s.meta.url) s.meta.urlId = s.id + "-url";
});

const SAMPLE_MAP = Object.fromEntries(SAMPLES.map(s => [s.id, s]));

/* ---------- 训练战役 ---------- */
const CAMPAIGN = {
  pretest:  ["em1", "sms1", "lp1", "em4", "sms4"],
  train:    ["em2", "em3", "sms2", "sms3", "em5", "lp2", "em7", "lp3", "em8", "lp4"],
  posttest: ["sms5", "em6", "lp5", "sms6", "em9"],
};

const RANKS = [
  { min: 85, name: "王者防线" }, { min: 70, name: "铂金猎渔者" },
  { min: 55, name: "黄金破话术" }, { min: 40, name: "白银查链接" },
  { min: 0,  name: "青铜识路人" },
];

/* ---------- 造浪者：攻击基因卡 ---------- */
const GENE_GROUPS = [
  { key: "skin", name: "拟态皮肤" }, { key: "psych", name: "心理机制" }, { key: "tech", name: "技术手段" },
];

const GENES = [
  { id: "g1", group: "skin", name: "官方公文皮", frag: "以“学生资助管理中心”名义发文，套用公文格式与落款",
    det: 10, reason: "公文样式是被仿冒最多的外壳，AI 防线对官方措辞的组合特征额外敏感",
    knowledge: "看到公文样式不要自动加信任——格式人人可仿，核验发件域名才是关键。" },
  { id: "g2", group: "skin", name: "电商客服皮", frag: "自称平台售后专员，引用你的“订单异常”",
    det: 15, reason: "电商客服话术模板与真实工单语言分布差异明显",
    knowledge: "平台退款只会原路退回；主动找你的“客服”默认可疑。" },
  { id: "g3", group: "skin", name: "校园事务皮", frag: "伪装成导师/教务老师，用课题、报销等校内事务开场",
    det: 12, reason: "校园事务皮命中“熟人+事务”特征组合",
    knowledge: "涉及转账汇款，务必通过第二渠道（当面/官方电话）核实身份。" },
  { id: "g4", group: "psych", name: "紧迫限时", frag: "加入“30 分钟内”“逾期作废”倒计时",
    det: 15, reason: "限时施压是最高频心理开关，防线设为强特征",
    knowledge: "所有倒计时都是为了让你来不及思考——先停一分钟，再核实。" },
  { id: "g5", group: "psych", name: "利诱返利", frag: "承诺双倍赔付、返利、中奖",
    det: 20, reason: "利诱类在训练数据中与诈骗高度相关",
    knowledge: "天上掉的馅饼半径一般等于坑的半径。" },
  { id: "g6", group: "psych", name: "恐吓冻结", frag: "声称账户异常、将扣费/冻结",
    det: 18, reason: "恐吓型损失厌恶话术特征显著",
    knowledge: "真出问题，官方会给你核验渠道，而不是逼你立刻操作。" },
  { id: "g7", group: "tech", name: "仿冒域名", frag: "使用与官方一字之差的域名",
    det: 30, reason: "域名相似度检测直接命中（编辑距离=1）",
    knowledge: "把完整域名读一遍再点，一字之差即深渊。" },
  { id: "g8", group: "tech", name: "短链跳转", frag: "正文放置短链/二维码",
    det: 25, reason: "短链与二维码指向不可预览，防线一律预警",
    knowledge: "无法预览指向的入口（短链/二维码）默认按不可信处理。" },
  { id: "g9", group: "tech", name: "附件载荷", frag: "附带 .exe/.docm 附件",
    det: 35, reason: "可执行/宏附件属高危载荷，防线直接标记",
    knowledge: "让你“运行程序/启用宏”的来信，基本可以直接删了。" },
];
