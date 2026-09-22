import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockWallet,
  getSelectedWalletId,
  getWalletState,
  resetWallet,
  selectMockWallet,
  subscribeAssetsReset,
  subscribeApprovalsReset,
} from "./wallet-engine";
import { __resetWalletStoreForTests } from "./wallet-store";

beforeEach(() => {
  __resetWalletStoreForTests();
});

describe("createMockWallet", () => {
  it("创建的钱包 origin 为 created，地址/风险等级由确定性生成算法给出", () => {
    const wallet = createMockWallet({ label: "测试钱包 A" });
    expect(wallet.origin).toBe("created");
    expect(wallet.label).toBe("测试钱包 A");
    expect(wallet.address).toMatch(/^0x[0-9A-F]{4}\.\.\.[0-9A-F]{4}$/);
  });

  it("重复的 id 应该抛出错误", () => {
    createMockWallet({ id: "dup-wallet" });
    expect(() => createMockWallet({ id: "dup-wallet" })).toThrowError(/已存在/);
  });
});

describe("getWalletState / 静态钱包惰性接入", () => {
  it("可以直接读取 @/lib/shared 静态钱包池中的钱包（首次访问时惰性注册）", () => {
    const wallet = getWalletState("wallet-01");
    expect(wallet.origin).toBe("static");
    expect(wallet.address).toBe("0x71D4...A82F");
  });

  it("未知 walletId 应该抛出明确错误", () => {
    expect(() => getWalletState("wallet-does-not-exist")).toThrowError(/未知的 walletId/);
  });
});

describe("selectMockWallet", () => {
  it("选中钱包后 getSelectedWalletId 应返回该 id", () => {
    createMockWallet({ id: "wallet-x" });
    selectMockWallet("wallet-x");
    expect(getSelectedWalletId()).toBe("wallet-x");
  });
});

describe("resetWallet", () => {
  it("静态钱包重置后应恢复到 @/lib/shared 中的原始风险评分", () => {
    const original = getWalletState("wallet-02"); // riskScore 97 in shared entities
    expect(original.riskScore).toBe(97);

    const reset = resetWallet("wallet-02");
    expect(reset.riskScore).toBe(97);
    expect(reset.lastResetAt).toBeTruthy();
  });

  it("会级联触发 Asset / Approval 的重置信号", () => {
    createMockWallet({ id: "wallet-cascade" });
    let assetsResetCount = 0;
    let approvalsResetCount = 0;
    subscribeAssetsReset((id) => {
      if (id === "wallet-cascade") assetsResetCount += 1;
    });
    subscribeApprovalsReset((id) => {
      if (id === "wallet-cascade") approvalsResetCount += 1;
    });

    resetWallet("wallet-cascade");
    expect(assetsResetCount).toBe(1);
    expect(approvalsResetCount).toBe(1);
  });
});
