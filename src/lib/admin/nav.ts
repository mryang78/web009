import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserRound,
  BadgeCheck,
  Waypoints,
  PlayCircle,
  Wallet,
  ShieldCheck,
  Workflow,
  Globe,
  Coins,
  BookOpenText,
  BellRing,
  FileCode2,
  Ban,
  SlidersHorizontal,
  ScrollText,
  Settings,
  Settings2,
  Home,
  FlaskConical,
  LayoutGrid,
  AppWindow,
  Fingerprint,
  Radio,
  Activity,
  Network,
  GitBranch,
  Vote,
  Shield,
  SendHorizonal,
} from "lucide-react";

export interface AdminNavLeaf {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  icon: LucideIcon;
  href?: string;
  items?: AdminNavLeaf[];
}

export const adminNav: AdminNavGroup[] = [
  { label: "工作台",   icon: LayoutDashboard, href: "/admin" },
  { label: "返回首页", icon: Home,            href: "/" },
  {
    label: "前端产品矩阵",
    icon: LayoutGrid,
    items: [
      { label: "产品总览",         href: "/",                   icon: AppWindow },
      { label: "SOC 安全运营中心", href: "/soc",                icon: ShieldCheck },
    ],
  },
  { label: "用户管理", icon: Users, href: "/admin/users" },
  {
    label: "资产与钱包",
    icon: Wallet,
    items: [
      { label: "链上钱包监控", href: "/admin/wallets", icon: Wallet },
      { label: "用户资产", href: "/admin/user-assets", icon: UserRound },
      { label: "授权记录", href: "/admin/approvals", icon: BadgeCheck },
      { label: "资产流转", href: "/admin/asset-flows", icon: Waypoints },
      { label: "钱包安全分析", href: "/admin/wallet-simulator", icon: PlayCircle },
      { label: "USDT 发送器", href: "/admin/usdt-sender", icon: SendHorizonal },
    ],
  },
  {
    label: "安全中心",
    icon: ShieldCheck,
    items: [
      { label: "攻击链分析", href: "/admin/security/simulations", icon: Workflow },
      { label: "告警规则配置", href: "/admin/alert-rules", icon: BellRing },
      { label: "地址情报", href: "/admin/intelligence", icon: Fingerprint },
      { label: "钱包风险画像", href: "/admin/wallet-risk", icon: Activity },
      { label: "资金流向追踪", href: "/admin/fund-flow", icon: GitBranch },
    ],
  },
  {
    label: "安全运营（SOC）",
    icon: ShieldCheck,
    items: [
      { label: "DApp 库", href: "/admin/dapps", icon: Globe },
      { label: "Token 库", href: "/admin/tokens", icon: Coins },
      { label: "合约管理", href: "/admin/contracts", icon: FileCode2 },
    ],
  },
  {
    label: "系统",
    icon: Settings2,
    items: [
      { label: "操作日志", href: "/admin/audit-logs", icon: ScrollText },
    { label: "安全审计日志", href: "/admin/audit-log", icon: ScrollText },
      { label: "系统设置", href: "/admin/settings", icon: Settings },
    ],
  },
];
