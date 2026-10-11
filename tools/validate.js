/**
 * 识渔计划 · 题库数据校验脚本
 *
 * 作用：在提交/发布前静态校验 webapp/data.js 的数据完整性，
 *       防止"靶点 id 与 redflags.target 不一致""CAMPAIGN 引用了不存在的样本"
 *       这类会让游戏静默出错的问题。
 *
 * 运行： node tools/validate.js
 * 退出码：0 = 全部通过；1 = 发现问题（详见输出）。
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataPath = path.join(__dirname, "..", "webapp", "data.js");
const code = fs.readFileSync(dataPath, "utf8");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  code +
    "\n;globalThis.__DATA__ = { SAMPLES, CAMPAIGN, GENES, GENE_GROUPS, DIMENSIONS, DIM_OF_CATEGORY, CATEGORY_NAME, RANKS };",
  sandbox,
  { filename: "data.js" }
);

const D = sandbox.__DATA__;
const errors = [];
const warn = [];

const VALID_CARRIER = new Set(["email", "sms", "linkpage"]);
const VALID_PART_TYPE = new Set(["p", "link", "attach", "qr", "btn", "field"]);
const KNOWN_CATEGORY = new Set(Object.keys(D.CATEGORY_NAME));

// 与 app.js 中 partOf() 一致的目标解析规则：
//   - 邮件：meta.addrId = `${id}-addr`（data.js 末尾自动派生）
//   - 链接页：meta.urlId = `${id}-url`
//   - 显式 parts[].id
//   - parts[].html 中 <span data-el="..."> 文本锚点（chip 标签会回退为类别键）
function resolveTargets(s) {
  const byPartId = new Set();
  const byDataEl = new Set();
  for (const p of s.parts || []) {
    if (p.id) byPartId.add(p.id);
    if (typeof p.html === "string") {
      for (const m of p.html.matchAll(/data-el="([^"]+)"/g)) byDataEl.add(m[1]);
    }
  }
  const metaDerived = new Set();
  if (s.meta && s.meta.addrId) metaDerived.add(s.meta.addrId);
  if (s.meta && s.meta.urlId) metaDerived.add(s.meta.urlId);
  return { byPartId, byDataEl, metaDerived };
}

const sampleById = new Map();
for (const s of D.SAMPLES) {
  if (sampleById.has(s.id)) errors.push(`样本 id 重复：${s.id}`);
  sampleById.set(s.id, s);
  if (!VALID_CARRIER.has(s.carrier)) errors.push(`样本 ${s.id} 的 carrier 非法：${s.carrier}`);
  if (![1, 2, 3].includes(s.difficulty)) errors.push(`样本 ${s.id} 的 difficulty 非法：${s.difficulty}`);

  const partIds = new Set();
  for (const p of s.parts || []) {
    if (!VALID_PART_TYPE.has(p.t)) errors.push(`样本 ${s.id} 的 part 类型非法：${p.t}`);
    if (p.id) {
      if (partIds.has(p.id)) errors.push(`样本 ${s.id} 的 part id 重复：${p.id}`);
      partIds.add(p.id);
    }
  }

  const { byPartId, byDataEl, metaDerived } = resolveTargets(s);
  const checkTarget = (target, where) => {
    const ok = byPartId.has(target) || metaDerived.has(target) || byDataEl.has(target);
    if (!ok) {
      errors.push(`样本 ${s.id} 的 ${where}.target 无法解析（既不是 part.id、${s.carrier === "email" ? "addrId、" : ""}${s.carrier === "linkpage" ? "urlId、" : ""}也不是 data-el 锚点）：${target}`);
    } else if (byDataEl.has(target) && !byPartId.has(target) && !metaDerived.has(target)) {
      warn.push(`样本 ${s.id} 的 ${where} 目标 ${target} 是正文内 data-el 文本锚点：拆解台证物标签会回退显示类别键（可给该片段加 id 以显示文案）。`);
    }
  };

  for (const rf of s.redflags || []) {
    if (!KNOWN_CATEGORY.has(rf.category)) errors.push(`样本 ${s.id} 的 redflag 类别未知：${rf.category}`);
    checkTarget(rf.target, "redflag");
    if (!rf.explain) warn.push(`样本 ${s.id} 的 redflag（${rf.target}）缺少 explain 讲解文案`);
    if (!D.DIM_OF_CATEGORY[rf.category]) errors.push(`破绽类别 ${rf.category} 未在 DIM_OF_CATEGORY 中映射到能力维度`);
  }
  for (const ln of s.legitNotes || []) {
    if (ln.target === null) continue; // 约定：target=null 表示整条样本的说明，不做靶点校验
    if (!ln.target) { warn.push(`样本 ${s.id} 的 legitNotes 既没有 target 也不是显式 null`); continue; }
    if (!byPartId.has(ln.target) && !metaDerived.has(ln.target) && !byDataEl.has(ln.target)) {
      warn.push(`样本 ${s.id} 的 legitNotes.target 无法解析：${ln.target}`);
    }
  }
}

for (const [bucket, ids] of Object.entries(D.CAMPAIGN)) {
  for (const id of ids) {
    if (!sampleById.has(id)) errors.push(`CAMPAIGN.${bucket} 引用了不存在的样本 id：${id}`);
  }
}

const usedInCampaign = new Set(Object.values(D.CAMPAIGN).flat());
for (const s of D.SAMPLES) {
  if (!usedInCampaign.has(s.id)) warn.push(`样本 ${s.id} 未被任何战役波次使用（不会出现在游戏中）`);
}

const geneIds = new Set();
for (const g of D.GENES) {
  if (geneIds.has(g.id)) errors.push(`基因卡 id 重复：${g.id}`);
  geneIds.add(g.id);
  if (!D.GENE_GROUPS.some((grp) => grp.key === g.group)) errors.push(`基因卡 ${g.id} 的 group 未在 GENE_GROUPS 中定义：${g.group}`);
  if (typeof g.det !== "number") errors.push(`基因卡 ${g.id} 缺少数值型 det（基础检出分）`);
}

// ---- 输出 ----
const count = {
  样本: D.SAMPLES.length,
  邮件: D.SAMPLES.filter((s) => s.carrier === "email").length,
  短信: D.SAMPLES.filter((s) => s.carrier === "sms").length,
  链接页: D.SAMPLES.filter((s) => s.carrier === "linkpage").length,
  基因卡: D.GENES.length,
  能力维度: D.DIMENSIONS.length,
  破绽类别: Object.keys(D.CATEGORY_NAME).length,
};
console.log("识渔计划 题库数据校验");
console.log("统计：" + Object.entries(count).map(([k, v]) => `${k}=${v}`).join("  "));

if (warn.length) {
  console.log(`\n提示（${warn.length}）：`);
  for (const w of warn) console.log("  · " + w);
}

if (errors.length) {
  console.log(`\n错误（${errors.length}）：`);
  for (const e of errors) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ 校验通过：样本 id、破绽靶点、能力维度映射、基因卡、战役队列均一致。");
