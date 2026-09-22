import {
  // 产品图标（20 个产品，一一对应，线性几何风格）
  CandlestickChart,
  Coins,
  WalletCards,
  WalletMinimal,
  ChartNoAxesCombined,
  CircleDollarSign,
  Blocks,
  TrendingUp,
  Gift,
  Droplets,
  BadgePlus,
  Crown,
  BadgePercent,
  UsersRound,
  Rocket,
  Image as ImageIcon,
  Newspaper,
  CircleHelp,
  ShieldCheck,
  Grid2X2,
  // 精选合作入口图标（外部真实网站）
  ShoppingBag,
  PiggyBank,
  RefreshCcw,
  CreditCard,
  Bot,
  Award,
  Layers3,
  QrCode,
  // 安全中心图标
  Radar,
  ShieldAlert,
  OctagonAlert,
  TriangleAlert,
  CircleAlert,
  Info,
  FileCode2,
  ArrowLeftRight,
  GitBranch,
  Waypoints,
  ShieldX,
  ScanSearch,
  FileSearch,
  FileWarning,
  Workflow,
  Network,
  MapPinCheck,
  // 钱包与资产安全分析中心图标
  Wallet,
  UserRound,
  BadgeCheck,
  ArrowUpRight,
  PlayCircle,
  History,
  Snowflake,
  Eye,
  type LucideIcon,
} from "lucide-react";

/**
 * 全站统一图标注册表（配合 /components/icon.tsx 使用）。
 * 所有菜单、产品、安全、操作、状态相关的图标都应从这里取用，
 * 避免同一语义在不同页面使用不一致的图标。
 */

// —— 20 个前端产品图标（按 products.ts 的 id 对应，风格统一、线性几何） ——
export const productIcons: Record<string, LucideIcon> = {
  cryptox: CandlestickChart,
  coinhub: Coins,
  "web3-wallet": WalletCards,
  "wallet-pro": WalletMinimal,
  "defi-dashboard": ChartNoAxesCombined,
  "token-explorer": CircleDollarSign,
  "blockchain-explorer": Blocks,
  "crypto-market": TrendingUp,
  "airdrop-center": Gift,
  "faucet-lab": Droplets,
  rewards: BadgePlus,
  "vip-center": Crown,
  "deposit-promo": BadgePercent,
  "referral-center": UsersRound,
  launchpad: Rocket,
  "nft-market": ImageIcon,
  "crypto-news": Newspaper,
  "help-center": CircleHelp,
  "web3-security": ShieldCheck,
  "web3-portal": Grid2X2,
  // —— 精选合作入口（外部真实网站） ——
  "jd-giftcard": ShoppingBag,
  "laguna-cashback": PiggyBank,
  tetherback: RefreshCcw,
  bleapcard: CreditCard,
  pairbots: Bot,
  "meta-miles": Award,
  "liftup-money": Layers3,
  "rozo-pay": QrCode,
};

// —— 安全中心专用图标（威胁等级 / 对象类型 / 操作状态） ——
export const securityIcons = {
  threatIntelligence: Radar,
  risk: ShieldAlert,
  critical: OctagonAlert,
  high: TriangleAlert,
  medium: CircleAlert,
  low: Info,
  address: WalletCards,
  contract: FileCode2,
  transaction: ArrowLeftRight,
  attackPath: GitBranch,
  assetFlow: Waypoints,
  blocked: ShieldX,
  protected: ShieldCheck,
  investigation: ScanSearch,
  report: FileSearch,
  suspiciousContract: FileWarning,
  simulation: Workflow,
  fundFlowNetwork: Network,
  riskAddress: MapPinCheck,
} satisfies Record<string, LucideIcon>;

export type SecurityIconKey = keyof typeof securityIcons;

export function getProductIcon(productId: string): LucideIcon {
  return productIcons[productId] ?? Grid2X2;
}

export function getSecurityIcon(key: SecurityIconKey): LucideIcon {
  return securityIcons[key];
}

// —— 钱包与资产安全分析中心图标 ——
export const walletIcons = {
  wallet: Wallet,
  user: UserRound,
  asset: Coins,
  approval: BadgeCheck,
  risk: ShieldAlert,
  extraction: ArrowUpRight,
  assetFlow: Waypoints,
  simulate: PlayCircle,
  log: History,
  security: ShieldCheck,
  frozen: Snowflake,
  monitor: Eye,
} satisfies Record<string, LucideIcon>;

export type WalletIconKey = keyof typeof walletIcons;

export function getWalletIcon(key: WalletIconKey): LucideIcon {
  return walletIcons[key];
}
