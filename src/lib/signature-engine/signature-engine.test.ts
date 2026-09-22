import { beforeEach, describe, expect, it } from "vitest";
import { createMockWallet, resetWallet } from "@/lib/wallet-engine";
import { __resetWalletStoreForTests } from "@/lib/wallet-engine/wallet-store";
import {
  analyzeSignature,
  createSignatureRequest,
  getSignaturesByWallet,
  isMockSignature,
  rejectSignature,
  simulateSignature,
} from "./signature-engine";
import { __resetSignatureStoreForTests } from "./signature-store";

beforeEach(() => {
  __resetWalletStoreForTests();
  __resetSignatureStoreForTests();
  createMockWallet({ id: "w-1" });
});

describe("createSignatureRequest", () => {
  it("创建后状态为 REQUESTED，尚未生成 mockSignature", () => {
    const req = createSignatureRequest({ walletId: "w-1", type: "Personal Sign", payloadSummary: "登录签名" });
    expect(req.status).toBe("REQUESTED");
    expect(req.mockSignature).toBeUndefined();
  });
});

describe("analyzeSignature", () => {
  it("Permit + 高风险 DApp 应判定为 HIGH_RISK", () => {
    const req = createSignatureRequest({
      walletId: "w-1",
      dappId: "dapp-01", // MockSwap, CRITICAL
      type: "Permit (EIP-2612)",
      payloadSummary: "Permit 授权 USDT",
    });
    const analyzed = analyzeSignature(req.id);
    expect(analyzed.status).toBe("HIGH_RISK");
  });

  it("普通 Personal Sign 且无关联 DApp 应判定为低风险", () => {
    const req = createSignatureRequest({ walletId: "w-1", type: "Personal Sign", payloadSummary: "登录签名" });
    const analyzed = analyzeSignature(req.id);
    expect(analyzed.status).toBe("REVIEWING");
    expect(analyzed.riskLevel).toBe("LOW");
  });
});

describe("simulateSignature —— MOCK_SIGNATURE 安全约束", () => {
  it("生成的签名值必须以 MOCK_SIGNATURE: 开头，isMockSignature() 能识别", () => {
    const req = createSignatureRequest({ walletId: "w-1", type: "Personal Sign", payloadSummary: "登录签名" });
    const signed = simulateSignature(req.id);
    expect(signed.status).toBe("SIGNED_MOCK");
    expect(signed.mockSignature).toBeDefined();
    expect(signed.mockSignature!.startsWith("MOCK_SIGNATURE:")).toBe(true);
    expect(isMockSignature(signed.mockSignature!)).toBe(true);
  });

  it("即使在 HIGH_RISK 状态下，用户依然可以「无视警告」完成测试签名（教育场景）", () => {
    const req = createSignatureRequest({
      walletId: "w-1",
      dappId: "dapp-01",
      type: "Permit (EIP-2612)",
      payloadSummary: "Permit 授权 USDT",
    });
    analyzeSignature(req.id);
    const signed = simulateSignature(req.id);
    expect(signed.status).toBe("SIGNED_MOCK");
    expect(isMockSignature(signed.mockSignature!)).toBe(true);
  });

  it("已经 REJECTED 的签名请求不能再被 simulateSignature", () => {
    const req = createSignatureRequest({ walletId: "w-1", type: "Personal Sign", payloadSummary: "登录签名" });
    rejectSignature(req.id);
    expect(() => simulateSignature(req.id)).toThrowError(/无法在状态 "REJECTED"/);
  });
});

describe("rejectSignature", () => {
  it("REQUESTED → REJECTED，且历史记录完整", () => {
    const req = createSignatureRequest({ walletId: "w-1", type: "Personal Sign", payloadSummary: "登录签名" });
    const rejected = rejectSignature(req.id);
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.history.map((h) => h.status)).toEqual(["REQUESTED", "REJECTED"]);
  });
});

describe("与 Wallet Engine 的联动重置", () => {
  it("walletEngine.resetWallet(walletId) 会级联清空该钱包名下的签名记录", () => {
    createSignatureRequest({ walletId: "w-1", type: "Personal Sign", payloadSummary: "登录签名" });
    expect(getSignaturesByWallet("w-1")).toHaveLength(1);

    resetWallet("w-1");
    expect(getSignaturesByWallet("w-1")).toHaveLength(0);
  });
});
