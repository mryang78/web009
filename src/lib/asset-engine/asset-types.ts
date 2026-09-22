// ---------------------------------------------------------------------------
// Asset Engine —— 类型定义
//
// 核心安全约束：Actual Loss 永远不能因为分析攻击而产生真实资金损失。
// 本模块用四个独立字段把"账面初始值"“推演出的假设影响”“账本实际记的值”
// “账本实际产生的损失”严格区分开：
//
//   originalBalance   —— 该持仓的初始基线余额，只有 resetAssets() 能改变它
//                         指向的基准（重新生成一份干净持仓）。
//   projectedMovement —— createMockAssetMovement() / calculateProjectedLoss()
//                         产生的"假设会发生什么"的纯推演数字，教育/展示用。
//   actualBalance     —— 这个 Mock 账本"实际记录"的余额。engine 内部保证它
//                         永远等于 originalBalance——任何分析攻击都不会、
//                         也不能修改它。
//   actualLoss        —— max(0, originalBalance - actualBalance)。因为
//                         actualBalance 恒等于 originalBalance，actualLoss
//                         在代码层面被强制恒为 0（asset-engine.ts 里有运行时
//                         断言兜底），这是"绝不产生真实资金损失"这句话在
//                         代码里的具体落地方式。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";

export interface AssetHoldingState {
  walletId: string;
  tokenId: string;
  symbol: string;
  originalBalance: number;
  projectedMovement: number;
  actualBalance: number;
  actualLoss: number;
  lastMovementAt?: string;
}

export interface MockAssetMovementRecord {
  id: string;
  walletId: string;
  tokenId: string;
  symbol: string;
  /** 本次"假设转移"的数量，只计入 projectedMovement，绝不写入 actualBalance。 */
  amount: number;
  destinationAddress: string;
  mockTxHash: string;
  riskLevel: RiskLevel;
  createdAt: string;
  simulationId?: string;
}

export interface CreateMockAssetMovementInput {
  walletId: string;
  tokenId: string;
  amount: number;
  destinationAddress?: string;
  riskLevel?: RiskLevel;
  simulationId?: string;
}

export interface CalculateProjectedLossInput {
  walletId: string;
  /** 不传则计算该钱包全部持仓的合计（美元估值）。 */
  tokenId?: string;
  riskLevel: RiskLevel;
}
