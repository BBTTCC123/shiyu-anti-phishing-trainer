/* ============ 识渔计划 · 后台配置文件（部署者修改，用户不可见） ============
 * 智能体大模型配置。Key 以混淆串存储（运行时解码），源码与截图中不出现明文。
 * 更换 Key：node tools/obscure_key.js <你的新Key> 生成新串替换 enc 字段。
 */
const APP_CONFIG = {
  agent: {
    provider: "DeepSeek",
    base: "https://api.deepseek.com/v1",
    model: "deepseek-flash",
    enc: "AANEQBROBQUHAklRRBVFRwoPTxRMBwgFUEkHRkFDEAwLQEY=",
    salt: "shiyu-2026-cust",
    /* 本地规则引擎兜底始终可用，无需配置 */
  },
};
