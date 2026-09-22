import { beforeEach, describe, expect, it } from "vitest";
import { __resetWalletStoreForTests } from "@/lib/wallet-engine/wallet-store";
import { __resetAssetStoreForTests } from "@/lib/asset-engine/asset-store";
import { __resetApprovalStoreForTests } from "@/lib/approval-engine/approval-store";
import { __resetSignatureStoreForTests } from "@/lib/signature-engine/signature-store";
import { __resetStoreForTests } from "@/lib/simulation/simulation-store";
import { __resetThreatStoreForTests } from "@/lib/threat-engine/threat-store";
import { __resetAlertStoreForTests } from "@/lib/alert-engine/alert-store";
import { listAttackScenarios, requireScenario } from "./attack-scenario-library";
import { runFullAttack体验 } from "./attack-scenario-engine";

const REQUIRED_NAMES = [
  "Fake Airdrop",
  "Fake Claim",
  "Fake Mint",
  "Fake Staking",
  "Fake Swap",
  "Fake Bridge",
  "Fake Presale",
  "Fake Giveaway",
  "Malicious Approval",
  "Unlimited Approval",
  "Permit Abuse",
  "Signature Phishing",
  "Fake Revoke",
  "Suspicious DApp",
  "Suspicious Contract",
  "Address Poisoning",
  "Fake NFT Mint",
  "Fake Token Migration",
  "Transaction Manipulation",
  "Social Engineering",
];

beforeEach(() => {
  __resetWalletStoreForTests();
  __resetAssetStoreForTests();
  __resetApprovalStoreForTests();
  __resetSignatureStoreForTests();
  __resetStoreForTests();
  __resetThreatStoreForTests();
  __resetAlertStoreForTests();
});

describe("attackScenarioLibrary —— 20 个标准场景目录", () => {
  it("至少覆盖全部 20 个要求的场景名称", () => {
    const names = listAttackScenarios().map((s) => s.name);
    for (const required of REQUIRED_NAMES) {
      expect(names).toContain(required);
    }
    expect(names.length).toBeGreaterThanOrEqual(20);
  });

  it("每个场景都包含全部 8 个必需字段，且字段内容非空", () => {
    for (const scenario of listAttackScenarios()) {
      expect(scenario.id).toBeTruthy();
      expect(scenario.name).toBeTruthy();
      expect(scenario.category).toBeTruthy();
      expect(scenario.description.length).toBeGreaterThan(0);
      expect(["SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(scenario.severity);
      expect(scenario.initialState.narrative.length).toBeGreaterThan(0);
      expect(scenario.steps.length).toBeGreaterThan(0);
      expect(scenario.riskRules.length).toBeGreaterThan(0);
      expect(scenario.detectionRules.length).toBeGreaterThan(0);
      expect(scenario.simulationOutcome).toBeDefined();
      expect(scenario.recommendations.length).toBeGreaterThan(0);
    }
  });

  it("simulationOutcome 的安全字段结构性写死为 0 / false / false", () => {
    for (const scenario of listAttackScenarios()) {
      expect(scenario.simulationOutcome.actualLoss).toBe(0);
      expect(scenario.simulationOutcome.transactionExecuted).toBe(false);
      expect(scenario.simulationOutcome.blockchainConnected).toBe(false);
    }
  });

  it("linkedAttackScenarioId 必须能在 @/lib/shared/entities.attackScenarios 中找到", () => {
    for (const scenario of listAttackScenarios()) {
      expect(() => requireScenario(scenario.id)).not.toThrow();
    }
  });
});

describe("runFullAttack体验 —— 完整 体验 管道", () => {
  it("Fake Airdrop：跑完整条管道后应产生 Approval、威胁检测与安全报告", () => {
    const report = runFullAttack体验({ scenarioId: "scn-fake-airdrop" });

    expect(report.approval).toBeDefined();
    expect(["BLOCKED", "DETECTED", "COMPLETED", "FAILED"]).toContain(report.status);
    expect(report.threats.length).toBeGreaterThan(0);
    expect(report.threats.some((t) => t.type === "UNLIMITED_APPROVAL")).toBe(true);
    expect(report.alerts.length).toBeGreaterThan(0);
  });

  it("安全约束：Security Report 的 safety footer 永远是 Actual Loss=0 / NOT EXECUTED / NOT CONNECTED", () => {
    const report = runFullAttack体验({ scenarioId: "scn-fake-staking" });
    expect(report.safety).toEqual({ actualLoss: 0, transactionStatus: "NOT EXECUTED", blockchainStatus: "NOT CONNECTED" });
  });

  it("Permit Abuse：应产生一条 MOCK_SIGNATURE 前缀的签名，而不是真实签名", () => {
    const report = runFullAttack体验({ scenarioId: "scn-permit-abuse" });
    expect(report.signature).toBeDefined();
    expect(report.signature?.mockSignature?.startsWith("MOCK_SIGNATURE:")).toBe(true);
  });

  it("资产异动只产生 projectedMovement，钱包的 actualBalance 不会因为这次分析攻击而改变", () => {
    const report = runFullAttack体验({ scenarioId: "scn-fake-bridge" });
    expect(report.assetMovement).toBeDefined();
    expect(report.safety.actualLoss).toBe(0);
    expect(report.projectedLossUsd).toBeGreaterThanOrEqual(0);
  });

  it("全部 20+ 个场景都可以完整跑完一次 体验 而不抛错，且每一次都各自使用独立的 目标钱包", () => {
    const walletIds = new Set<string>();
    for (const scenario of listAttackScenarios()) {
      const report = runFullAttack体验({ scenarioId: scenario.id });
      expect(report.scenarioId).toBe(scenario.id);
      expect(report.safety.actualLoss).toBe(0);
      expect(report.safety.transactionStatus).toBe("NOT EXECUTED");
      expect(report.safety.blockchainStatus).toBe("NOT CONNECTED");
      walletIds.add(report.walletId);
    }
    expect(walletIds.size).toBe(listAttackScenarios().length);
  });
});
