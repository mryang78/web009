import { beforeEach, describe, expect, it } from "vitest";
import { completeSimulation, createSimulation, resetSimulation, startSimulation } from "@/lib/simulation";
import { __resetStoreForTests } from "@/lib/simulation/simulation-store";
import { attachToSimulation, scanSimulation } from "@/lib/threat-engine";
import { __resetThreatStoreForTests } from "@/lib/threat-engine/threat-store";
import { generateAlertFromThreat, getAlertsForSimulation, resetAlerts, severityForRiskLevel } from "./alert-engine";
import { __resetAlertStoreForTests } from "./alert-store";
import type { ThreatDetection } from "@/lib/threat-engine";

const FAKE_AIRDROP = "atk-fake-airdrop";

beforeEach(() => {
  __resetStoreForTests();
  __resetThreatStoreForTests();
  __resetAlertStoreForTests();
});

describe("severityForRiskLevel", () => {
  it("RiskLevel 五档换算到 Alert 四档，SAFE 归入 LOW", () => {
    expect(severityForRiskLevel("SAFE")).toBe("LOW");
    expect(severityForRiskLevel("LOW")).toBe("LOW");
    expect(severityForRiskLevel("MEDIUM")).toBe("MEDIUM");
    expect(severityForRiskLevel("HIGH")).toBe("HIGH");
    expect(severityForRiskLevel("CRITICAL")).toBe("CRITICAL");
  });
});

describe("generateAlertFromThreat", () => {
  it("Alert 的 severity / message 可追溯回触发它的威胁", () => {
    const threat: ThreatDetection = {
      id: "threat-x-1",
      simulationId: "sim-x",
      walletId: "wallet-01",
      type: "UNLIMITED_APPROVAL",
      severity: "CRITICAL",
      title: "检测到 Unlimited Approval 请求",
      message: "发起 Unlimited Approval 请求（组件：Approval Engine）",
      sourceEventId: "e1",
      sourceEventType: "APPROVAL_ANALYZED",
      sourceStepIndex: 2,
      detectedAt: new Date().toISOString(),
    };
    const alert = generateAlertFromThreat(threat);
    expect(alert.severity).toBe("CRITICAL");
    expect(alert.sourceThreatId).toBe("threat-x-1");
    expect(alert.threatType).toBe("UNLIMITED_APPROVAL");
    expect(alert.acknowledged).toBe(false);
  });
});

describe("Threat → Alert 自动联动（同一份 Simulation State）", () => {
  it("Threat Engine 检测出威胁后，Alert Engine 应该自动生成对应告警，无需页面手动触发", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP, walletId: "wallet-01" });
    attachToSimulation(id);
    startSimulation(id);
    completeSimulation(id);

    const alerts = getAlertsForSimulation(id);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((a) => a.threatType === "UNLIMITED_APPROVAL" && a.severity === "CRITICAL")).toBe(true);
  });

  it("resetAlerts 可以单独清空某次 simulation 的告警", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP });
    attachToSimulation(id);
    startSimulation(id);
    completeSimulation(id);
    expect(getAlertsForSimulation(id).length).toBeGreaterThan(0);

    resetAlerts(id);
    expect(getAlertsForSimulation(id)).toHaveLength(0);
  });

  it("同一次 simulation 的 scanSimulation 幂等，不会重复生成告警", () => {
    const { id } = createSimulation({ scenarioId: FAKE_AIRDROP });
    startSimulation(id);
    completeSimulation(id);

    scanSimulation(id);
    const first = getAlertsForSimulation(id).length;
    scanSimulation(id);
    const second = getAlertsForSimulation(id).length;
    expect(second).toBe(first);
  });
});
