// 用法：node tools/obscure_key.js sk-xxxx  → 输出 ENC 串，替换 webapp/config.js 的 enc 字段
const salt = "shiyu-2026-cust";
const key = process.argv[2];
if (!key || !key.startsWith("sk-")) { console.error("用法: node obscure_key.js sk-xxxx"); process.exit(1); }
let x = "";
for (let i = 0; i < key.length; i++) x += String.fromCharCode(key.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
console.log(Buffer.from(x, "binary").toString("base64"));
