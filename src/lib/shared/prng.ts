// ---------------------------------------------------------------------------
// 确定性伪随机工具 —— 全站唯一实现
//
// 用于生成"看起来像真实数据、但其实是根据固定 seed / 输入文本哈希确定性生成"
// 的 Mock 地址、交易哈希等分析内容。相同输入永远得到相同输出，且不查询、不
// 连接任何真实链上数据源或第三方 API。此前 src/lib/soc/mock.ts 内部私有维护
// 了一份几乎相同的实现，现已统一收敛到本文件，避免多处实现漂移。
// ---------------------------------------------------------------------------

/** 轻量确定性伪随机数生成器（mulberry32）。 */
export function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** 简单字符串哈希（djb2 变体），把任意输入文本映射为确定性 seed。 */
export function hashStringToSeed(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash) || 1;
}

const HEX_CHARS = "0123456789ABCDEF";

/** 生成形如 0xABCD...WXYZ 的截断 Mock 地址（永远不是真实地址）。 */
export function mockAddress(rnd: () => number): string {
  const head = Array.from({ length: 4 }, () => HEX_CHARS[Math.floor(rnd() * 16)]).join("");
  const tail = Array.from({ length: 4 }, () => HEX_CHARS[Math.floor(rnd() * 16)]).join("");
  return `0x${head}...${tail}`;
}

/** 生成形如 0xEVENT-XXXXXXXXXXXXXXXXXXXX 的 Mock 交易哈希，明确标注为分析数据。 */
export function mockTxHash(rnd: () => number): string {
  const body = Array.from({ length: 16 }, () => HEX_CHARS[Math.floor(rnd() * 16)]).join("");
  return `0xEVENT-${body}`;
}
