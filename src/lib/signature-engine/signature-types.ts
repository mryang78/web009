// ---------------------------------------------------------------------------
// Signature / Permit Simulation Engine —— 类型定义
//
// 所有签名都是 MOCK_SIGNATURE：mockSignature 字段的值永远带有
// "MOCK_SIGNATURE:" 文本前缀，结构上就不可能被误用为、或被任何真实签名校验
// 逻辑接受为一个有效的加密签名（真实签名是纯十六进制，不会带文本前缀）。
// 不产生任何可广播的真实签名。
// ---------------------------------------------------------------------------

import type { RiskLevel, SignatureType } from "@/lib/shared/types";

export type SignatureEngineStatus = "NONE" | "REQUESTED" | "REVIEWING" | "HIGH_RISK" | "SIGNED_MOCK" | "REJECTED";

export interface SignatureHistoryEntry {
  status: SignatureEngineStatus;
  riskLevel: RiskLevel;
  note: string;
  timestamp: string;
}

export interface SignatureRecordState {
  id: string;
  walletId: string;
  dappId?: string;
  type: SignatureType;
  /** 人类可读的"这次签名内容是什么"的摘要，仅用于展示。 */
  payloadSummary: string;
  status: SignatureEngineStatus;
  riskLevel: RiskLevel;
  /** 只有在 simulateSignature() 之后才存在，永远带 "MOCK_SIGNATURE:" 前缀。 */
  mockSignature?: string;
  createdAt: string;
  updatedAt: string;
  history: SignatureHistoryEntry[];
  simulationId?: string;
}

export interface CreateSignatureRequestInput {
  id?: string;
  walletId: string;
  dappId?: string;
  type: SignatureType;
  payloadSummary: string;
  simulationId?: string;
}
