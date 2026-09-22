// ---------------------------------------------------------------------------
// Wallet Engine —— 类型定义
//
// 纯分析安全研究平台：本引擎管理的一切钱包，无论是来自 @/lib/shared 的静态
// 隔离钱包池，还是通过 createMockWallet() 动态创建的钱包，都只是这个进程
// 内存里的 JS 对象。不连接真实钱包、不调用真实 RPC，没有任何私钥/助记词
// 概念——这里的"钱包"只是一条带地址、风险等级的 Mock 记录。
// ---------------------------------------------------------------------------

import type { RiskLevel, WalletNetwork, WalletStatus, WalletType } from "@/lib/shared/types";

/** static = 来自 @/lib/shared 的 44 个 canonical 隔离钱包；created = 本引擎动态创建的 Mock 钱包。 */
export type WalletOrigin = "static" | "created";

export interface WalletEngineState {
  id: string;
  address: string;
  label: string;
  network: WalletNetwork;
  walletType: WalletType;
  totalValueUsd: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: WalletStatus;
  origin: WalletOrigin;
  createdAt: string;
  lastSelectedAt?: string;
  lastResetAt?: string;
}

export interface CreateMockWalletInput {
  id?: string;
  label?: string;
  network?: WalletNetwork;
  walletType?: WalletType;
  /** 不传则由引擎生成一个默认落在低风险区间的分数（0-39）。 */
  riskScore?: number;
  totalValueUsd?: number;
}

export type WalletLifecycleListener = (walletId: string) => void;
export type Unsubscribe = () => void;
