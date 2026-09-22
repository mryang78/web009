// Shared mock data for the /admin operations backend. All figures are
// static experience data — no real users, funds, or infrastructure are involved.
//
// 钱包地址不再在本文件里手写：此前这里的 8 个用户地址与
// lib/admin/wallet-security-data.ts 的 8 个"Wallet-00X"地址本应是同一批钱包，
// 却因为各自手写出现了大小写/字符差异（例如 0x71D3 vs 0x71D4），导致同一个
// 钱包在"用户管理"和"钱包与资产安全"两个页面显示不一致的地址。现在统一从
// @/lib/shared 按 linkedUserId 取数，保证两边永远一致。

import { mockWallets } from "@/lib/shared/entities";

export const pendingItems = [
  { label: "待处理授权", value: 8, href: "/admin/approvals", tone: "amber" as const },
  { label: "待复核资产流转", value: 3, href: "/admin/asset-flows", tone: "red" as const },
  { label: "攻击链分析待查看", value: 2, href: "/admin/security/simulations", tone: "blue" as const },
];

export type UserStatus = "正常" | "VIP" | "活跃" | "风险" | "封禁";

export interface UserRow {
  userId: string;
  wallet: string;
  vip: string;
  points: string;
  lastActive: string;
  status: UserStatus;
  joinedAt: string;
  email: string;
  /** 关联到 @/lib/shared 统一钱包池中的钱包 id（如存在）。 */
  walletId?: string;
}

interface UserSeed {
  userId: string;
  vip: string;
  points: string;
  lastActive: string;
  status: UserStatus;
  joinedAt: string;
  email: string;
}

const USER_SEEDS: UserSeed[] = [
  { userId: "U-482910", vip: "VIP 5", points: "42,880", lastActive: "2 分钟前", status: "VIP", joinedAt: "2025-03-12", email: "u482910@mail.example" },
  { userId: "U-482884", vip: "-", points: "1,204", lastActive: "18 分钟前", status: "正常", joinedAt: "2025-11-02", email: "u482884@mail.example" },
  { userId: "U-481022", vip: "VIP 2", points: "8,940", lastActive: "1 小时前", status: "活跃", joinedAt: "2024-08-27", email: "u481022@mail.example" },
  { userId: "U-479881", vip: "-", points: "320", lastActive: "3 分钟前", status: "风险", joinedAt: "2026-06-01", email: "u479881@mail.example" },
  { userId: "U-475120", vip: "VIP 8", points: "128,402", lastActive: "6 分钟前", status: "VIP", joinedAt: "2023-12-19", email: "u475120@mail.example" },
  { userId: "U-468042", vip: "-", points: "0", lastActive: "40 天前", status: "封禁", joinedAt: "2024-02-08", email: "u468042@mail.example" },
  { userId: "U-461209", vip: "VIP 1", points: "3,082", lastActive: "22 分钟前", status: "活跃", joinedAt: "2025-01-30", email: "u461209@mail.example" },
  { userId: "U-458811", vip: "-", points: "980", lastActive: "5 小时前", status: "正常", joinedAt: "2025-07-14", email: "u458811@mail.example" },
];

// 防御性兜底地址：正常情况下下面 8 个用户都能在统一钱包池中按 linkedUserId
// 找到对应钱包（一一对应"钱包与资产安全"模块的 8 个隔离钱包），此地址仅在
// 未来钱包池数据被修改导致匹配失败时兜底，避免渲染出 undefined。
const FALLBACK_WALLET_ADDRESS = "0x4b7a...2e91";

export const userRows: UserRow[] = USER_SEEDS.map((seed) => {
  const wallet = mockWallets.find((w) => w.linkedUserId === seed.userId);
  return {
    ...seed,
    wallet: wallet?.address ?? FALLBACK_WALLET_ADDRESS,
    walletId: wallet?.id,
  };
});

export const currentAdmin = { name: "王雨薇", role: "超级管理员", initials: "王" };

// —— 全局搜索（分析数据，仅用于分析搜索交互与分类结果展示） ——
export const globalSearchRecent = ["0xA1b2...9f3C", "钱包安全分析", "用户资产"];
export const globalSearchHot = ["授权记录", "资产流转", "攻击链分析"];

export interface GlobalSearchResult {
  category: "用户" | "资产" | "授权" | "安全";
  label: string;
  sub: string;
  href: string;
}

export const globalSearchResults: GlobalSearchResult[] = [
  { category: "用户", label: "陈晓萌", sub: "VIP 会员 · 6 分钟前活跃", href: "/admin/users" },
  { category: "资产", label: "0x71D3...A82F", sub: "分析资产 · $12,480", href: "/admin/user-assets" },
  { category: "授权", label: "0xA1b2...9f3C", sub: "高额授权 · 待复核", href: "/admin/approvals" },
  { category: "资产", label: "资金流向分析", sub: "用户地址 → 目标地址", href: "/admin/asset-flows" },
  { category: "安全", label: "钱包安全分析", sub: "验证授权与提取流程", href: "/admin/wallet-simulator" },
  { category: "安全", label: "攻击路径分析", sub: "威胁场景化验证", href: "/admin/security/simulations" },
];

// —— 通知中心（分析数据） ——
export interface AdminNotification {
  title: string;
  time: string;
  href: string;
}

export const adminNotifications: AdminNotification[] = [
  { title: "新的高额授权待复核", time: "6 分钟前", href: "/admin/approvals" },
  { title: "检测到异常资产流转路径", time: "22 分钟前", href: "/admin/asset-flows" },
  { title: "钱包安全分析：新报告已生成", time: "1 小时前", href: "/admin/wallet-simulator" },
  { title: "新用户注册", time: "3 小时前", href: "/admin/users" },
];
