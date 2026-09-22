// ---------------------------------------------------------------------------
// Asset Engine —— 对外暴露的统一入口
//
// 依赖 @/lib/wallet-engine 校验 walletId 存在并读取钱包的 totalValueUsd 基线
// （单向依赖：wallet-engine 完全不知道 asset-engine 的存在，见
// wallet-engine.ts 顶部注释）。持仓通过确定性伪随机算法从钱包的
// totalValueUsd 按权重拆分到 @/lib/shared 的 Token 目录上，同一个钱包每次
// 生成的持仓分布完全一致。
//
// 安全约束（见 asset-types.ts 顶部注释）：actualBalance 永远等于
// originalBalance，actualLoss 永远为 0——createMockAssetMovement() 只更新
// projectedMovement，calculateProjectedLoss() 只是一次纯计算、不写回任何
// 状态。assertActualLossInvariant() 在每次写入后做运行时断言，一旦这个不
// 变量被打破就立刻抛错，而不是允许一个"看起来正常"但违反安全约束的状态
// 悄悄存在。
// ---------------------------------------------------------------------------

import { mockTokens } from "@/lib/shared/entities";
import { hashStringToSeed, mockAddress, mockTxHash, seededRandom } from "@/lib/shared/prng";
import type { RiskLevel } from "@/lib/shared/types";
import { getWalletState, subscribeAssetsReset } from "@/lib/wallet-engine";
import * as store from "./asset-store";
import type {
  AssetHoldingState,
  CalculateProjectedLossInput,
  CreateMockAssetMovementInput,
  MockAssetMovementRecord,
} from "./asset-types";

/** RiskLevel → 如果这是一次真实攻击，预计会造成的损失比例。仅用于展示/教育，绝不应用到 actualBalance。 */
const PROJECTED_LOSS_RATIO: Record<RiskLevel, number> = {
  SAFE: 0,
  LOW: 0.05,
  MEDIUM: 0.2,
  HIGH: 0.55,
  CRITICAL: 0.95,
};

const MIN_HOLDING_TOKENS = 2;
const MAX_HOLDING_TOKENS = 4;

function tokenPrice(tokenId: string): number {
  return mockTokens.find((t) => t.id === tokenId)?.mockPriceUsd ?? 0;
}

/** 根据钱包 id 确定性地生成一份持仓分布：同一个钱包永远得到同一份结果。 */
function buildHoldingsForWallet(walletId: string): AssetHoldingState[] {
  const wallet = getWalletState(walletId); // walletId 不存在时会在这里抛出明确错误
  const rnd = seededRandom(hashStringToSeed(`holdings:${walletId}`));

  const tokenCount = MIN_HOLDING_TOKENS + Math.floor(rnd() * (MAX_HOLDING_TOKENS - MIN_HOLDING_TOKENS + 1));
  const shuffled = [...mockTokens].sort(() => rnd() - 0.5);
  const tokens = shuffled.slice(0, tokenCount);
  const weights = tokens.map(() => rnd() + 0.1); // +0.1 避免权重为 0 导致某个 token 持仓恒为 0
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return tokens.map((token, i) => {
    const shareUsd = wallet.totalValueUsd * (weights[i] / totalWeight);
    const price = token.mockPriceUsd;
    const amount = price > 0 ? Math.round((shareUsd / price) * 1e6) / 1e6 : 0;
    return {
      walletId,
      tokenId: token.id,
      symbol: token.symbol,
      originalBalance: amount,
      projectedMovement: 0,
      actualBalance: amount,
      actualLoss: 0,
    };
  });
}

function resolveHoldings(walletId: string): AssetHoldingState[] {
  const existing = store.readHoldings(walletId);
  if (existing) return existing;
  return store.putHoldings(walletId, buildHoldingsForWallet(walletId));
}

/** 防御性运行时断言：actualBalance 必须恒等于 originalBalance，actualLoss 必须恒为 0。 */
function assertActualLossInvariant(holdings: AssetHoldingState[], walletId: string): void {
  for (const h of holdings) {
    if (h.actualBalance !== h.originalBalance || h.actualLoss !== 0) {
      throw new Error(
        `[asset-engine] 安全不变量被打破：钱包 "${walletId}" 的 token "${h.tokenId}" 的 actualBalance/actualLoss ` +
          `偏离了初始值。这不应该发生——任何分析攻击都不允许修改 actualBalance，请检查是否有代码路径误将 ` +
          `projectedMovement 写入了 actualBalance。`
      );
    }
  }
}

export function getAssets(walletId: string): AssetHoldingState[] {
  return resolveHoldings(walletId);
}

/**
 * 不传 tokenId：返回该钱包全部持仓的合计美元估值（按 actualBalance 计算）。
 * 传 tokenId：返回该 token 的 actualBalance（数量，不是美元）。
 */
export function getBalance(walletId: string, tokenId?: string): number {
  const holdings = resolveHoldings(walletId);
  if (tokenId) {
    const holding = holdings.find((h) => h.tokenId === tokenId);
    if (!holding) throw new Error(`[asset-engine] 钱包 "${walletId}" 未持有 token "${tokenId}"`);
    return holding.actualBalance;
  }
  return holdings.reduce((sum, h) => sum + h.actualBalance * tokenPrice(h.tokenId), 0);
}

/**
 * 计算"如果这是一次真实攻击，预计会损失多少"（美元）——纯推演计算，不读写任何
 * 持久状态，调用多少次都不会对 actualBalance / actualLoss 产生任何影响。
 */
export function calculateProjectedLoss(input: CalculateProjectedLossInput): number {
  const holdings = resolveHoldings(input.walletId);
  const ratio = PROJECTED_LOSS_RATIO[input.riskLevel];
  const targets = input.tokenId ? holdings.filter((h) => h.tokenId === input.tokenId) : holdings;
  return targets.reduce((sum, h) => sum + h.originalBalance * tokenPrice(h.tokenId) * ratio, 0);
}

let movementCounter = 0;

/**
 * 记录一次"假设的资产异动"：只更新目标持仓的 projectedMovement 和
 * lastMovementAt，绝不触碰 actualBalance / actualLoss。返回一条带 Mock 交易
 * 哈希的异动记录，供 UI 展示"资产提取验证"效果，但这条记录本身也不代表任何
 * 真实发生的转账。
 */
export function createMockAssetMovement(input: CreateMockAssetMovementInput): MockAssetMovementRecord {
  const holdings = resolveHoldings(input.walletId);
  const holding = holdings.find((h) => h.tokenId === input.tokenId);
  if (!holding) throw new Error(`[asset-engine] 钱包 "${input.walletId}" 未持有 token "${input.tokenId}"`);

  movementCounter += 1;
  const rnd = seededRandom(hashStringToSeed(`movement:${input.walletId}:${input.tokenId}:${movementCounter}`));
  const timestamp = new Date().toISOString();

  const record: MockAssetMovementRecord = {
    id: `mov-${input.walletId}-${movementCounter}`,
    walletId: input.walletId,
    tokenId: input.tokenId,
    symbol: holding.symbol,
    amount: input.amount,
    destinationAddress: input.destinationAddress ?? mockAddress(rnd),
    mockTxHash: mockTxHash(rnd),
    riskLevel: input.riskLevel ?? "HIGH",
    createdAt: timestamp,
    simulationId: input.simulationId,
  };
  store.pushMovement(input.walletId, record);

  const nextHoldings = holdings.map((h) =>
    h.tokenId === input.tokenId
      ? { ...h, projectedMovement: h.projectedMovement + input.amount, lastMovementAt: timestamp }
      : h
  );
  store.putHoldings(input.walletId, nextHoldings);
  assertActualLossInvariant(nextHoldings, input.walletId);

  return record;
}

export function getMovements(walletId: string): MockAssetMovementRecord[] {
  return store.readMovements(walletId);
}

/** 清空该钱包的持仓与异动记录，下次 getAssets() 会按当前钱包基线重新生成一份干净持仓。 */
export function resetAssets(walletId: string): AssetHoldingState[] {
  store.clearWallet(walletId);
  return resolveHoldings(walletId);
}

// 订阅 Wallet Engine 的重置信号：walletEngine.resetAssets() / resetWallet()
// 都会级联触发这里的真实重置，模块一旦被 import 即自动生效。
subscribeAssetsReset((walletId) => {
  resetAssets(walletId);
});
