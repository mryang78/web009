import { beforeEach, describe, expect, it } from "vitest";
import { createMockWallet } from "@/lib/wallet-engine";
import { __resetWalletStoreForTests } from "@/lib/wallet-engine/wallet-store";
import { requestApproval, analyzeApproval } from "@/lib/approval-engine";
import { __resetApprovalStoreForTests } from "@/lib/approval-engine/approval-store";
import { __resetSignatureStoreForTests } from "@/lib/signature-engine/signature-store";
import { __resetAssetStoreForTests } from "@/lib/asset-engine/asset-store";
import {
  assessApprovalRisk,
  assessSignatureRisk,
  assessWalletRisk,
  computeApprovalRiskFactors,
  normalizeRiskScore,
  riskLevelForScore,
} from "./index";

beforeEach(() => {
  __resetWalletStoreForTests();
  __resetApprovalStoreForTests();
  __resetSignatureStoreForTests();
  __resetAssetStoreForTests();
  createMockWallet({ id: "w-1" });
});

describe("normalizeRiskScore / riskLevelForScore", () => {
  it("按 factor 权重求和并截断到 0～100", () => {
    const { score } = normalizeRiskScore([
      { key: "unlimitedAllowance", weight: 60, triggered: true, reason: "x" },
      { key: "largeValue", weight: 60, triggered: true, reason: "x" },
    ]);
    expect(score).toBe(100);
  });

  it("五档等级判定与全站统一实现一致（不新造第四套分档标准）", () => {
    expect(riskLevelForScore(0)).toBe("SAFE");
    expect(riskLevelForScore(20)).toBe("LOW");
    expect(riskLevelForScore(50)).toBe("MEDIUM");
    expect(riskLevelForScore(70)).toBe("HIGH");
    expect(riskLevelForScore(90)).toBe("CRITICAL");
  });
});

describe("computeApprovalRiskFactors —— 动态规则计算，不是固定数字", () => {
  it("同一份输入永远得到同一份输出（确定性）", () => {
    const input = { requestedAmount: "500", tokenId: "tok-usdt", spenderAddress: "0xABC" };
    const a = computeApprovalRiskFactors(input);
    const b = computeApprovalRiskFactors(input);
    expect(a).toEqual(b);
  });

  it("不同风险特征的输入应该产生不同的分数（不是写死的单一常量）", () => {
    const low = assessApprovalRisk({ requestedAmount: "50", tokenId: "tok-usdt", spenderAddress: "0xSAFE-0001" });
    const high = assessApprovalRisk({
      requestedAmount: "Unlimited (2^256-1)",
      tokenId: "tok-usdt",
      dappId: "dapp-02",
      spenderAddress: "0xMOCK-DRAIN-9F3C",
    });
    expect(high.score).toBeGreaterThan(low.score);
    expect(["HIGH", "CRITICAL"]).toContain(high.level);
    expect(low.level === "SAFE" || low.level === "LOW").toBe(true);
  });

  it("每个 factor 都可追溯——包含全部 9 个 key，命中的因素带有具体理由", () => {
    const { factors } = assessApprovalRisk({
      requestedAmount: "Unlimited",
      tokenId: "tok-usdt",
      dappId: "dapp-02",
      spenderAddress: "0xMOCK-DRAIN-9F3C",
    });
    expect(factors).toHaveLength(9);
    const unlimited = factors.find((f) => f.key === "unlimitedAllowance");
    expect(unlimited?.triggered).toBe(true);
    expect(unlimited?.reason.length).toBeGreaterThan(0);
  });
});

describe("computeSignatureRiskFactors —— Permit + 高风险 DApp 应显著推高分数", () => {
  it("Permit 签名 + CRITICAL DApp 的分数应高于普通 Personal Sign", () => {
    const risky = assessSignatureRisk({ type: "Permit (EIP-2612)", payloadSummary: "Permit 授权 USDT", dappId: "dapp-01" });
    const safe = assessSignatureRisk({ type: "Personal Sign", payloadSummary: "登录签名" });
    expect(risky.score).toBeGreaterThan(safe.score);
    expect(["HIGH", "CRITICAL"]).toContain(risky.level);
  });

  it("签名内容摘要命中危险关键词应触发 signatureRisk 因素", () => {
    const { factors } = assessSignatureRisk({ type: "Personal Sign", payloadSummary: "请求 setApprovalForAll 清空全部资产" });
    const signatureRiskFactor = factors.find((f) => f.key === "signatureRisk");
    expect(signatureRiskFactor?.triggered).toBe(true);
  });
});

describe("assessWalletRisk —— 聚合数据必须来自 Wallet/Approval/Signature Engine 的真实状态", () => {
  it("钱包名下产生高风险 Approval 后，钱包风险评估应该真实上升", () => {
    const before = assessWalletRisk("w-1");

    const approval = requestApproval({
      walletId: "w-1",
      tokenId: "tok-usdt",
      dappId: "dapp-02",
      spenderAddress: "0xMOCK-DRAIN-9F3C",
      requestedAmount: "Unlimited (2^256-1)",
    });
    analyzeApproval(approval.id);

    const after = assessWalletRisk("w-1");
    expect(after.score).toBeGreaterThan(before.score);
    const approvalFactor = after.factors.find((f) => f.key === "unlimitedAllowance");
    expect(approvalFactor?.triggered).toBe(true);
  });
});
