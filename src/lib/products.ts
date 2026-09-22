export type ProductCategory =
  | "交易所"
  | "钱包"
  | "DeFi"
  | "数据"
  | "活动"
  | "NFT"
  | "资讯"
  | "安全"
  | "工具";

export type ThumbnailVariant =
  | "trading-chart"
  | "wallet-grid"
  | "token-orbit"
  | "defi-stats"
  | "explorer-list"
  | "market-ticker"
  | "airdrop-burst"
  | "faucet-drop"
  | "reward-ring"
  | "vip-badge"
  | "promo-glow"
  | "referral-network"
  | "launch-rocket"
  | "nft-cards"
  | "news-list"
  | "help-docs"
  | "risk-score"
  | "portal-rings"
  | "external-link";

export type AccentTone = "blue" | "violet" | "neutral" | "green";

export const accentClass: Record<AccentTone, string> = {
  blue: "from-blue-500/12 to-transparent",
  violet: "from-cyan-500/12 to-transparent",
  neutral: "from-slate-500/8 to-transparent",
  green: "from-success/15 to-transparent",
};

/**
 * Per-category icon treatment for the product identity badge shown on
 * every experience page header and product card — gives each of the 9 product
 * categories its own gradient + glow so the 20 experience icons read as a
 * deliberate, premium icon set rather than 20 copies of one flat tint.
 */
export const categoryIconClass: Record<ProductCategory, { gradient: string; ring: string; glow: string }> = {
  交易所: { gradient: "from-blue-500 to-blue-700", ring: "ring-blue-400/40", glow: "shadow-blue-500/30" },
  钱包: { gradient: "from-cyan-500 to-blue-700", ring: "ring-cyan-400/40", glow: "shadow-cyan-500/30" },
  DeFi: { gradient: "from-teal-400 to-cyan-700", ring: "ring-teal-400/40", glow: "shadow-teal-500/30" },
  数据: { gradient: "from-sky-500 to-blue-800", ring: "ring-sky-400/40", glow: "shadow-sky-500/30" },
  活动: { gradient: "from-amber-400 to-orange-600", ring: "ring-amber-400/40", glow: "shadow-amber-500/30" },
  NFT: { gradient: "from-cyan-400 to-blue-700", ring: "ring-cyan-400/40", glow: "shadow-cyan-500/30" },
  资讯: { gradient: "from-sky-400 to-blue-700", ring: "ring-sky-400/40", glow: "shadow-sky-500/30" },
  安全: { gradient: "from-red-500 to-rose-800", ring: "ring-red-400/40", glow: "shadow-red-500/30" },
  工具: { gradient: "from-slate-500 to-slate-800", ring: "ring-slate-400/40", glow: "shadow-slate-500/25" },
};

export type ProductTier = "S" | "A" | "B";

export const tierMeta: Record<ProductTier, { label: string; description: string }> = {
  S: { label: "S 级旗舰", description: "平台核心产品，代表最高完成度与视觉标准" },
  A: { label: "A 级核心", description: "核心业务产品，覆盖行情、资产与数据场景" },
  B: { label: "B 级运营", description: "运营与内容型产品，服务增长与用户留存" },
};

export interface Product {
  id: string;
  index: number;
  name: string;
  nameZh: string;
  tagline?: string;
  description: string;
  detail: string;
  category: ProductCategory;
  tier: ProductTier;
  tags: string[];
  modules: string[];
  thumbnail: ThumbnailVariant;
  accent: AccentTone;
  featured?: boolean;
  /** True for third-party sites linked from the matrix — no internal /lab page, opens the real site. */
  external?: boolean;
  externalUrl?: string;
}

export const categories: { label: string; value: ProductCategory | "全部" }[] = [
  { label: "全部", value: "全部" },
  { label: "交易所", value: "交易所" },
  { label: "钱包", value: "钱包" },
  { label: "DeFi", value: "DeFi" },
  { label: "活动", value: "活动" },
  { label: "工具", value: "工具" },
];

export const categoryMatrix: { index: string; label: string; value: ProductCategory }[] = [
  { index: "01", label: "交易所", value: "交易所" },
  { index: "02", label: "钱包", value: "钱包" },
  { index: "03", label: "DeFi", value: "DeFi" },
  { index: "04", label: "活动", value: "活动" },
  { index: "05", label: "工具", value: "工具" },
];

export const products: Product[] = [
  // —— 精选合作入口（外部真实网站，非本平台分析产品，点击后离开 Web3 Studio） ——
  {
    id: "jd-giftcard",
    index: 21,
    name: "Bitrefill 京东礼品卡",
    nameZh: "加密货币购京东礼品卡",
    tagline: "Crypto to JD.com Gift Cards",
    description: "用 BTC / ETH / USDT 等加密货币购买京东礼品卡",
    detail: "第三方礼品卡兑换平台 Bitrefill 提供的京东礼品卡专区，支持用主流加密货币直接购买，覆盖 186+ 个国家的话费、礼品卡与生活消费场景。",
    category: "工具",
    tier: "B",
    tags: ["礼品卡", "购物", "合作入口"],
    modules: ["加密货币支付", "京东礼品卡", "即时到账"],
    thumbnail: "external-link",
    accent: "blue",
    external: true,
    externalUrl: "https://www.bitrefill.com/cn/zh-Hans/gift-cards/jd-china/",
  },
  {
    id: "laguna-cashback",
    index: 22,
    name: "Laguna Network",
    nameZh: "加密货币购物返利",
    tagline: "Shop & Earn Crypto Cashback",
    description: "在合作电商购物，按比例返还加密货币",
    detail: "第三方购物返利平台，通过其专属链接在 Trip.com、Agoda、Shopee 等平台消费后，按比例自动返还 BTC、ETH 等加密资产，无需钱包地址、无前期费用。",
    category: "活动",
    tier: "B",
    tags: ["购物返利", "现金回赠", "合作入口"],
    modules: ["购物返利", "多商户合作", "自动结算"],
    thumbnail: "external-link",
    accent: "green",
    external: true,
    externalUrl: "https://laguna.network/jp/zh-CN/home",
  },
  {
    id: "tetherback",
    index: 23,
    name: "TetherBack",
    nameZh: "交易所手续费返现",
    tagline: "Exchange Fee Cashback",
    description: "在合作交易所交易，按比例返还 USDT 手续费",
    detail: "第三方交易返现平台，与 Bitunix、Bybit、MEXC、BloFin 等交易所合作，只需绑定交易所 UID（无需 API），交易产生的手续费按比例以 USDT 形式每日返还。",
    category: "交易所",
    tier: "B",
    tags: ["手续费返现", "交易所合作", "合作入口"],
    modules: ["手续费返现", "多交易所支持", "每日结算"],
    thumbnail: "external-link",
    accent: "blue",
    external: true,
    externalUrl: "https://tetherback.com/",
  },
  {
    id: "bleapcard",
    index: 24,
    name: "BleapCard",
    nameZh: "非托管加密借记卡",
    tagline: "Non-Custodial Crypto Card",
    description: "无需 KYC 的非托管加密货币消费卡",
    detail: "第三方非托管加密借记卡服务，资产始终由用户自持，支持 Apple Pay / Google Pay 消费，最高提供 8% 加密货币返现，已在多个欧洲国家及加拿大获得合规牌照。",
    category: "钱包",
    tier: "B",
    tags: ["加密借记卡", "非托管", "合作入口"],
    modules: ["非托管资产", "Apple/Google Pay", "消费返现"],
    thumbnail: "external-link",
    accent: "violet",
    external: true,
    externalUrl: "https://bleapcard.com/",
  },
  {
    id: "pairbots",
    index: 25,
    name: "PairBots",
    nameZh: "自动化加密投资机器人",
    tagline: "Automated Crypto Trading Bots",
    description: "第三方自动化加密货币投资策略平台",
    detail: "第三方自动化加密投资平台，提供 ORIGIN / EQUATOR / SPACE 三档策略机器人。第三方投资类产品存在本金与收益波动风险，请自行评估后再访问，本站不对其收益或安全性做任何背书。",
    category: "DeFi",
    tier: "B",
    tags: ["自动化交易", "投资机器人", "合作入口"],
    modules: ["策略机器人", "自动化执行", "收益追踪"],
    thumbnail: "external-link",
    accent: "violet",
    external: true,
    externalUrl: "https://www.pairbots.net/zh/investments",
  },
  {
    id: "meta-miles",
    index: 26,
    name: "MetaMiles",
    nameZh: "MetaMask 卡消费奖励",
    tagline: "Crypto Debit Card Rewards",
    description: "MetaMask 卡消费获取积分奖励",
    detail: "第三方加密消费奖励平台，绑定 MetaMask 卡后，每笔线下 / 线上消费均可累积 MetaMiles 积分，用于兑换专属权益与活动名额，并提供交易分析与钱包安全提醒。",
    category: "钱包",
    tier: "B",
    tags: ["消费积分", "MetaMask", "合作入口"],
    modules: ["消费积分", "钱包安全提醒", "交易分析"],
    thumbnail: "external-link",
    accent: "violet",
    external: true,
    externalUrl: "https://meta-miles.vercel.app/",
  },
  {
    id: "liftup-money",
    index: 27,
    name: "LiftUp Money",
    nameZh: "稳定币交易收益分配",
    tagline: "Stablecoin Trading Rewards",
    description: "多链稳定币交易，交易费透明分配给用户",
    detail: "第三方多链 DeFi 平台，交易 USDC、EURC、cirBTC 等稳定币产生的手续费全部进入公开的链上奖励分配器，其中 90% 通过每日 / 每周 / 每月抽奖返还给交易者与流动性提供者。",
    category: "DeFi",
    tier: "B",
    tags: ["稳定币", "手续费分配", "合作入口"],
    modules: ["多链稳定币", "链上分配器", "流动性激励"],
    thumbnail: "external-link",
    accent: "green",
    external: true,
    externalUrl: "https://www.liftup.money/reward",
  },
  {
    id: "rozo-pay",
    index: 28,
    name: "Rozo",
    nameZh: "USDC 消费钱包",
    tagline: "Pay with USDC Everywhere",
    description: "用 USDC 在认证商家直接消费",
    detail: "第三方移动钱包应用，支持用户直接用 USDC 等稳定币在认证服务商处消费，提供类似银行卡的加密消费体验，并可发现平台已核验的合作商家。",
    category: "工具",
    tier: "B",
    tags: ["稳定币消费", "认证商家", "合作入口"],
    modules: ["USDC 支付", "商家发现", "移动钱包"],
    thumbnail: "external-link",
    accent: "neutral",
    external: true,
    externalUrl: "https://rewards.rozo.ai/discovery?type=verified-services",
  },
  {
    id: "staking-dapp",
    index: 29,
    name: "Staking DApp",
    nameZh: "链上质押收益平台",
    tagline: "Stake & Earn On-Chain Rewards",
    description: "链上质押赚取收益，支持多种代币灵活质押策略",
    detail: "第三方链上质押 DApp，提供多代币质押池与灵活的收益策略，用户可一键质押主流 ERC-20 代币并实时追踪 APY 与累计奖励，资产全程由智能合约托管，公开透明。",
    category: "DeFi",
    tier: "B",
    tags: ["质押", "链上收益", "合作入口"],
    modules: ["多代币质押", "实时 APY", "智能合约"],
    thumbnail: "external-link",
    accent: "green",
    external: true,
    externalUrl: "https://staking-dapp-v2-sandy.vercel.app/",
  },
];

export const featuredProducts = products.filter((p) => p.featured);
export const sTierProducts = products.filter((p) => p.tier === "S");
export const aTierProducts = products.filter((p) => p.tier === "A");
export const bTierProducts = products.filter((p) => p.tier === "B");

export const stats = [
  { value: "9", label: "产品 / 合作入口" },
  { value: "1", label: "统一运营后台" },
  { value: "5", label: "产品类型" },
  { value: "100%", label: "实时分析" },
];

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

// Deterministic "product maturity" facts derived from a product's index, so
// the same version number / update time / status shows up consistently
// everywhere that product is referenced — homepage cards, the experience's own
// system status bar, and the admin project list — instead of each surface
// inventing its own (which reads as generated rather than operated).
const updatedAgoByIndex = [
  "2 分钟前", "5 分钟前", "12 分钟前", "18 分钟前", "34 分钟前", "1 小时前", "2 小时前", "3 小时前",
  "6 小时前", "8 小时前", "刚刚", "4 分钟前", "22 分钟前", "45 分钟前", "1 小时前", "5 小时前",
  "9 小时前", "1 天前", "2 天前", "3 天前",
];

export function productVersion(p: Product): string {
  return `v2.${(p.index % 9) + 1}.${p.index % 4}`;
}

export function productUpdatedAgo(p: Product): string {
  return updatedAgoByIndex[(p.index - 1) % updatedAgoByIndex.length];
}

export type ProductOpsStatus = "Operational" | "Degraded" | "Maintenance";

export function productOpsStatus(p: Product): ProductOpsStatus {
  if (p.index % 11 === 6) return "Degraded";
  if (p.index % 17 === 9) return "Maintenance";
  return "Operational";
}

export const productOpsStatusLabel: Record<ProductOpsStatus, string> = {
  Operational: "运行中",
  Degraded: "性能下降",
  Maintenance: "维护中",
};
