import { beforeEach, describe, expect, it } from "vitest";
import { createMockWallet, resetApprovals as walletResetApprovals } from "@/lib/wallet-engine";
import { __resetWalletStoreForTests } from "@/lib/wallet-engine/wallet-store";
import {
  analyzeApproval,
  blockApproval,
  getApprovalsByWallet,
  getApprovalState,
  getApprovalStatusFor,
  requestApproval,
  simulateApproval,
  simulateRevoke,
} from "./approval-engine";
import { __resetApprovalStoreForTests } from "./approval-store";

beforeEach(() => {
  __resetWalletStoreForTests();
  __resetApprovalStoreForTests();
  createMockWallet({ id: "w-1" });
});

describe("getApprovalStatusFor", () => {
  it("没有任何记录时返回 NONE", () => {
    expect(getApprovalStatusFor("w-1", "tok-usdt")).toBe("NONE");
  });
});

describe("requestApproval", () => {
  it("创建后状态为 REQUESTED，并带有一条历史记录", () => {
    const approval = requestApproval({
      walletId: "w-1",
      tokenId: "tok-usdt",
      spenderAddress: "0xSPENDER-TEST",
      requestedAmount: "500",
    });
    expect(approval.status).toBe("REQUESTED");
    expect(approval.history).toHaveLength(1);
  });

  it("钱包不存在时应抛出错误", () => {
    expect(() =>
      requestApproval({ walletId: "no-such-wallet", tokenId: "tok-usdt", spenderAddress: "0xX", requestedAmount: "1" })
    ).toThrowError(/未知的 walletId/);
  });
});

describe("analyzeApproval —— 风险判定", () => {
  it("Unlimited 额度请求应判定为 HIGH 或 CRITICAL，并把状态置为 HIGH_RISK", () => {
    const approval = requestApproval({
      walletId: "w-1",
      tokenId: "tok-usdt",
      dappId: "dapp-02", // LuckyAirdrop, CRITICAL risk dapp
      spenderAddress: "0xMOCK-DRAIN-9F3C",
      requestedAmount: "Unlimited (2^256-1)",
    });
    const analyzed = analyzeApproval(approval.id);
    expect(analyzed.status).toBe("HIGH_RISK");
    expect(["HIGH", "CRITICAL"]).toContain(analyzed.riskLevel);
  });

  it("小额、非仿冒 token 的请求应判定为低风险并保持 REVIEWING", () => {
    const approval = requestApproval({
      walletId: "w-1",
      tokenId: "tok-usdt",
      spenderAddress: "0xSPENDER-SAFE-1120",
      requestedAmount: "50",
    });
    const analyzed = analyzeApproval(approval.id);
    expect(analyzed.status).toBe("REVIEWING");
    expect(analyzed.riskLevel).toBe("LOW");
  });

  it("已经 SIMULATED_APPROVED 后再分析出高风险，应覆盖为 HIGH_RISK（保护引擎事后拦截的前置条件）", () => {
    const approval = requestApproval({
      walletId: "w-1",
      tokenId: "tok-usdt",
      dappId: "dapp-02",
      spenderAddress: "0xMOCK-DRAIN-9F3C",
      requestedAmount: "Unlimited (2^256-1)",
    });
    simulateApproval(approval.id);
    const analyzed = analyzeApproval(approval.id);
    expect(analyzed.status).toBe("HIGH_RISK");
  });
});

describe("状态机合法性", () => {
  it("已经 BLOCKED 的授权不能再被 simulateApproval", () => {
    const approval = requestApproval({ walletId: "w-1", tokenId: "tok-usdt", spenderAddress: "0xX", requestedAmount: "1" });
    blockApproval(approval.id);
    expect(() => simulateApproval(approval.id)).toThrowError(/无法在状态 "BLOCKED"/);
  });

  it("REQUESTED 状态不能直接 simulateRevoke（必须先 SIMULATED_APPROVED 或 HIGH_RISK）", () => {
    const approval = requestApproval({ walletId: "w-1", tokenId: "tok-usdt", spenderAddress: "0xX", requestedAmount: "1" });
    expect(() => simulateRevoke(approval.id)).toThrowError(/无法在状态 "REQUESTED"/);
  });
});

describe("blockApproval → simulateRevoke 完整链路", () => {
  it("REQUESTED → SIMULATED_APPROVED → BLOCKED，历史记录完整可追溯", () => {
    const approval = requestApproval({ walletId: "w-1", tokenId: "tok-usdt", spenderAddress: "0xX", requestedAmount: "999999" });
    simulateApproval(approval.id);
    const blocked = blockApproval(approval.id);
    expect(blocked.status).toBe("BLOCKED");
    expect(blocked.history.map((h) => h.status)).toEqual(["REQUESTED", "SIMULATED_APPROVED", "BLOCKED"]);
  });
});

describe("getApprovalsByWallet / getApprovalState", () => {
  it("可以按钱包列出全部授权记录", () => {
    requestApproval({ walletId: "w-1", tokenId: "tok-usdt", spenderAddress: "0xA", requestedAmount: "1" });
    requestApproval({ walletId: "w-1", tokenId: "tok-eth", spenderAddress: "0xB", requestedAmount: "2" });
    expect(getApprovalsByWallet("w-1")).toHaveLength(2);
  });

  it("getApprovalState 对不存在的 id 应抛出错误", () => {
    expect(() => getApprovalState("no-such-approval")).toThrowError(/未找到 approval/);
  });
});

describe("与 Wallet Engine 的联动重置", () => {
  it("walletEngine.resetApprovals(walletId) 会清空该钱包名下的全部授权记录", () => {
    requestApproval({ walletId: "w-1", tokenId: "tok-usdt", spenderAddress: "0xA", requestedAmount: "1" });
    expect(getApprovalsByWallet("w-1")).toHaveLength(1);

    walletResetApprovals("w-1");
    expect(getApprovalsByWallet("w-1")).toHaveLength(0);
    expect(getApprovalStatusFor("w-1", "tok-usdt")).toBe("NONE");
  });
});
