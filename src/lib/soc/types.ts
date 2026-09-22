// ---------------------------------------------------------------------------
// 全链路分析平台（Security Operations Center）类型定义 —— 精简版
//
// 重要：本模块下所有数据均为 实时分析数据，用于 UI 与安全教育分析。
// 、不调用真实钱包、不产生真实签名或真实资产转移。
// 钱包相关能力复用现有 /admin 钱包安全分析与用户资产模块，本文件不重复定义。
//
// RiskLevel / SimulationStatus / DAppCategory / ApprovalType / AttackChainStep /
// AttackScenario 现在统一定义在 @/lib/shared/types（全站唯一数据源），本文件
// 仅 re-export，避免与其他模块各自维护一套同名但字段不完全一致的类型。
// ---------------------------------------------------------------------------

export type {
  RiskLevel,
  SimulationStatus,
  DAppCategory,
  ApprovalType,
  AttackChainStep,
  AttackScenario,
} from "@/lib/shared/types";

import type { ApprovalType, DAppCategory, RiskLevel, SimulationStatus } from "@/lib/shared/types";

export interface SocDApp {
  id: string;
  name: string;
  domain: string;
  category: DAppCategory;
  riskLevel: RiskLevel;
  contract: string;
  status: "Active" | "Disabled";
}

export interface SocToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  mockPrice: number;
  totalSupply: string;
  riskLevel: RiskLevel;
}

export interface ApprovalSimulation {
  id: string;
  token: string;
  owner: string;
  spender: string;
  currentAllowance: string;
  requestedAmount: string;
  type: ApprovalType;
  riskLevel: RiskLevel;
  dapp: string;
  chain: string;
}

export interface SecurityAlert {
  id: string;
  level: "Critical" | "High" | "Medium" | "Low";
  title: string;
  detail: string;
  wallet: string;
  dapp: string;
  token: string;
  time: string;
  read: boolean;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface ThreatActivityRow {
  time: string;
  threatLevel: RiskLevel;
  attackType: string;
  wallet: string;
  dapp: string;
  token: string;
  status: SimulationStatus;
}

export interface AttackDistributionSlice {
  category: string;
  count: number;
}
