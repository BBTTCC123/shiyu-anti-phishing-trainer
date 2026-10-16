/* 小程序后台配置（对应 H5 的 webapp/config.js） */
module.exports = {
  agent: {
    provider: "DeepSeek",
    base: "https://api.deepseek.com/v1",
    model: "deepseek-flash",
    enc: "AANEQBROBQUHAklRRBVFRwoPTxRMBwgFUEkHRkFDEAwLQEY=",
    salt: "shiyu-2026-cust",
    /* 注意：上线前需在小程序后台把 base 域名加入 request 合法域名（须 HTTPS 且 ICP 备案；
       若该域名未备案导致无法添加，需自建代理域名替换 base */
  },
};
