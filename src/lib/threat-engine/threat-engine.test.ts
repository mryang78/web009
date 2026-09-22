import { beforeEach, describe, expect, it } from "vitest";
import { completeSimulation, createSimulation, resetSimulation, startSimulation } from "@/lib/simulation";
import { __resetStoreForTests } from "@/lib/simulation/simulation-store";
import { attachToSimulation, classifyEvent, getThreatsForSimulation, scanSimulation, subscribeThreats } from "./threat-engine";
import { __resetThreatStoreForTests } from "./threat-store";

const FAKE_AIRDROP = "atk-fake-airdrop"; // 含 "发起 Unlimited Approval 请求" 步骤
const ADDRESS_POISONING = "atk-address-poisoning"; // 含 "相似地址" 步骤

beforeEach(() => {
  __resetStoreForTests();
  __resetThreatStoreForTests();
});

describe("classifyEvent", () => {
  it("SAFE 等级的事件永远不产生威胁分类（避免每一步都报警）", () => {
    expect(
      classifyEvent({
        id: "e1",
        simulationId: "sim-1",
        sequence: 0,
        type: "DAPP_OPENED",
        title: "无限额度授权",
        stepIndex: 0,
        component: "Fake DApp",
        riskLevel: "SAFE",
        timestamp: new Date().toISOString(),
      })
    ).toBeUndefined();
  });

  it("标题包含 Unlimited 的事件应归类为 UNLIMITED_APPROVAL", () => {
    expect(
      classifyEvent({
        id: "e1",
        simulationId: "sim-1",
        sequence: 0,
        type: "APPROVAL_ANALYZED",
        title: "发起 Unlimited Approval 请求",
        stepIndex: 2,
        component: "Approval Engine",
        riskLevel: "CRITICAL",
        timestamp: new Date().toISOString(),
      })
    ).toBe("UNLIMITED_APPROVAL");
  });
});

describe("scanSimulation —— 根据真实 Simulation Event 自动检测威胁", () => {
  it("推进一次 Fake Airdrop 场景后，应该真实检测出 UNLIMITED_APPROVAL 威胁，且 severity 与触发事件的 riskLevel 一致", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP, walletId: "wallet-01" });
    attachToSimulation(id);
    startSimulation(id);
    completeSimulation(id);

    const threats = getThreatsForSimulation(id);
    const unlimited = threats.find((t) => t.type === "UNLIMITED_APPROVAL");
    expect(unlimited).toBeDefined();
    expect(unlimited?.severity).toBe("CRITICAL");
    expect(unlimited?.simulationId).toBe(id);
    expect(unlimited?.walletId).toBe("wallet-01");
  });

  it("同一批事件重复扫描不会产生重复检测（按 sequence 去重，幂等）", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP });
    startSimulation(id);
    completeSimulation(id);

    scanSimulation(id);
    const first = getThreatsForSimulation(id).length;
    scanSimulation(id);
    const second = getThreatsForSimulation(id).length;
    expect(second).toBe(first);
    expect(first).toBeGreaterThan(0);
  });

  it("Address Poisoning 场景应检测出 SUSPICIOUS_SPENDER 威胁", () => {
    const { id } = createSimulation({ scenarioId: ADDRESS_POISONING });
    startSimulation(id);
    completeSimulation(id);
    scanSimulation(id);

    const threats = getThreatsForSimulation(id);
    expect(threats.some((t) => t.type === "SUSPICIOUS_SPENDER")).toBe(true);
  });

  it("resetSimulation 后重新扫描，应该清空这次 simulation 之前产生的威胁记录", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP });
    startSimulation(id);
    completeSimulation(id);
    scanSimulation(id);
    expect(getThreatsForSimulation(id).length).toBeGreaterThan(0);

    resetSimulation(id);
    scanSimulation(id);
    expect(getThreatsForSimulation(id)).toHaveLength(0);
  });
});

describe("attachToSimulation —— 状态变化时自动检测，不需要手动轮询", () => {
  it("订阅后，每次 advanceStep 都可能自动产生新的威胁检测，通过 subscribeThreats 实时收到推送", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP, walletId: "wallet-01" });
    const seen: string[] = [];
    subscribeThreats((detection) => {
      if (detection.simulationId === id) seen.push(detection.type);
    });

    attachToSimulation(id);
    startSimulation(id);
    completeSimulation(id);

    expect(seen).toContain("UNLIMITED_APPROVAL");
  });
});
