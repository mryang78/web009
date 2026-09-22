// ---------------------------------------------------------------------------
// Approval Engine —— 类型定义
//
// 一次 Token 授权请求的完整生命周期，全部只发生在这个进程的内存里——不产生
// 任何真实的 approve() 链上交易，"授权额度"永远是一个展示用的字符串
// （如 "500" 或 "Unlimited (2^256-1)"），从不调用任何钱包 / RPC 接口。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";

export type ApprovalEngineStatus =
  | "NONE"
  | "REQUESTED"
  | "REVIEWING"
  | "SIMULATED_APPROVED"
  | "HIGH_RISK"
  | "BLOCKED"
  | "REVOKED_SIMULATION";

export interface ApprovalHistoryEntry {
  status: ApprovalEngineStatus;
  riskLevel: RiskLevel;
  note: string;
  timestamp: string;
}

export interface ApprovalRecordState {
  id: string;
  walletId: string;
  tokenId: string;
  dappId?: string;
  spenderAddress: string;
  requestedAmount: string;
  status: ApprovalEngineStatus;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  history: ApprovalHistoryEntry[];
  simulationId?: string;
}

export interface RequestApprovalInput {
  id?: string;
  walletId: string;
  tokenId: string;
  dappId?: string;
  spenderAddress: string;
  /** 展示用字符串，例如 "500" 或 "Unlimited (2^256-1)"，不是真实的链上调用参数。 */
  requestedAmount: string;
  simulationId?: string;
}
