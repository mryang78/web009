import { beforeEach, describe, expect, it } from "vitest";
import { createMockWallet } from "@/lib/wallet-engine";
import { __resetWalletStoreForTests } from "@/lib/wallet-engine/wallet-store";
import {
  calculateProjectedLoss,
  createMockAssetMovement,
  getAssets,
  getBalance,
  resetAssets,
} from "./asset-engine";
import { __resetAssetStoreForTests } from "./asset-store";

beforeEach(() => {
  __resetWalletStoreForTests();
  __resetAssetStoreForTests();
});

describe("getAssets", () => {
  it("同一个钱包多次调用得到完全一致的持仓分布（确定性生成）", () => {
    createMockWallet({ id: "w-1", totalValueUsd: 100000 });
    const first = getAssets("w-1");
    const second = getAssets("w-1");
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThanOrEqual(2);
  });

  it("初始状态下 originalBalance === actualBalance 且 actualLoss 为 0", () => {
    createMockWallet({ id: "w-2", totalValueUsd: 50000 });
    for (const holding of getAssets("w-2")) {
      expect(holding.actualBalance).toBe(holding.originalBalance);
      expect(holding.actualLoss).toBe(0);
      expect(holding.projectedMovement).toBe(0);
    }
  });
});

describe("getBalance", () => {
  it("不传 tokenId 返回全部持仓的美元合计，应约等于钱包的 totalValueUsd", () => {
    createMockWallet({ id: "w-3", totalValueUsd: 80000 });
    const total = getBalance("w-3");
    expect(total).toBeGreaterThan(80000 * 0.9);
    expect(total).toBeLessThan(80000 * 1.1);
  });

  it("传入未持有的 tokenId 应抛出错误", () => {
    createMockWallet({ id: "w-4" });
    expect(() => getBalance("w-4", "token-not-held")).toThrowError(/未持有/);
  });
});

describe("calculateProjectedLoss —— 纯推演计算，不改变任何状态", () => {
  it("风险等级越高，预计损失越大", () => {
    createMockWallet({ id: "w-5", totalValueUsd: 100000 });
    const low = calculateProjectedLoss({ walletId: "w-5", riskLevel: "LOW" });
    const high = calculateProjectedLoss({ walletId: "w-5", riskLevel: "HIGH" });
    const critical = calculateProjectedLoss({ walletId: "w-5", riskLevel: "CRITICAL" });
    expect(low).toBeLessThan(high);
    expect(high).toBeLessThan(critical);
  });

  it("多次调用不会改变实际持仓（actualBalance/actualLoss 岿然不动）", () => {
    createMockWallet({ id: "w-6", totalValueUsd: 60000 });
    const before = getAssets("w-6");
    calculateProjectedLoss({ walletId: "w-6", riskLevel: "CRITICAL" });
    calculateProjectedLoss({ walletId: "w-6", riskLevel: "CRITICAL" });
    const after = getAssets("w-6");
    expect(after).toEqual(before);
  });
});

describe("createMockAssetMovement —— 核心安全不变量", () => {
  it("记录资产异动后，projectedMovement 增加，但 actualBalance 与 actualLoss 绝对不变", () => {
    createMockWallet({ id: "w-7", totalValueUsd: 90000 });
    const [holding] = getAssets("w-7");
    const before = { ...holding };

    createMockAssetMovement({ walletId: "w-7", tokenId: holding.tokenId, amount: holding.originalBalance * 10 });

    const after = getAssets("w-7").find((h) => h.tokenId === holding.tokenId)!;
    expect(after.projectedMovement).toBeGreaterThan(0);
    expect(after.actualBalance).toBe(before.actualBalance);
    expect(after.actualBalance).toBe(after.originalBalance);
    expect(after.actualLoss).toBe(0);
  });

  it("即使连续多次记录巨额异动（远超实际余额），actualLoss 也永远为 0", () => {
    createMockWallet({ id: "w-8", totalValueUsd: 1000 });
    const [holding] = getAssets("w-8");

    for (let i = 0; i < 20; i++) {
      createMockAssetMovement({ walletId: "w-8", tokenId: holding.tokenId, amount: 999999 });
    }

    const finalHolding = getAssets("w-8").find((h) => h.tokenId === holding.tokenId)!;
    expect(finalHolding.actualLoss).toBe(0);
    expect(finalHolding.actualBalance).toBe(finalHolding.originalBalance);
    expect(finalHolding.projectedMovement).toBe(999999 * 20);
  });

  it("返回的异动记录携带 Mock 交易哈希与目标地址，可用于 UI 展示但不是真实交易", () => {
    createMockWallet({ id: "w-9" });
    const [holding] = getAssets("w-9");
    const record = createMockAssetMovement({ walletId: "w-9", tokenId: holding.tokenId, amount: 1 });
    expect(record.mockTxHash).toMatch(/^0xEVENT-ANALYSIS/);
    expect(record.destinationAddress).toMatch(/^0x/);
  });

  it("未持有的 tokenId 应抛出错误，而不是静默创建一条空持仓记录", () => {
    createMockWallet({ id: "w-10" });
    expect(() => createMockAssetMovement({ walletId: "w-10", tokenId: "not-held", amount: 1 })).toThrowError(/未持有/);
  });
});

describe("resetAssets", () => {
  it("重置后 projectedMovement 清零，持仓重新生成为初始干净状态", () => {
    createMockWallet({ id: "w-11", totalValueUsd: 40000 });
    const [holding] = getAssets("w-11");
    createMockAssetMovement({ walletId: "w-11", tokenId: holding.tokenId, amount: 500 });

    const reset = resetAssets("w-11");
    for (const h of reset) {
      expect(h.projectedMovement).toBe(0);
      expect(h.actualLoss).toBe(0);
      expect(h.actualBalance).toBe(h.originalBalance);
    }
  });
});
