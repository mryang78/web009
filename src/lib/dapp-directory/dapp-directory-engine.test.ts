import { beforeEach, describe, expect, it } from "vitest";
import { mockDApps } from "@/lib/shared/entities";
import { __resetDAppDirectoryForTests, getDApp, listDApps, setDAppRiskLevel, setDAppStatus, subscribeDApps } from "./dapp-directory-engine";

beforeEach(() => {
  __resetDAppDirectoryForTests();
});

describe("dapp-directory-engine", () => {
  it("以 @/lib/shared/entities.mockDApps 为基线惰性初始化", () => {
    const list = listDApps();
    expect(list.length).toBe(mockDApps.length);
    expect(list.map((d) => d.id).sort()).toEqual(mockDApps.map((d) => d.id).sort());
  });

  it("setDAppStatus 真实修改状态，后续读取立即反映变化", () => {
    const target = mockDApps[0];
    expect(getDApp(target.id)?.status).toBe(target.status);

    setDAppStatus(target.id, "Disabled");
    expect(getDApp(target.id)?.status).toBe("Disabled");

    setDAppStatus(target.id, "Active");
    expect(getDApp(target.id)?.status).toBe("Active");
  });

  it("setDAppRiskLevel 真实修改风险等级", () => {
    const target = mockDApps[1];
    setDAppRiskLevel(target.id, "LOW");
    expect(getDApp(target.id)?.riskLevel).toBe("LOW");
  });

  it("subscribeDApps 在任何一次编辑后都会收到通知（供 SOC 等只读页面实时刷新）", () => {
    let notified = 0;
    const unsubscribe = subscribeDApps(() => {
      notified += 1;
    });

    setDAppStatus(mockDApps[0].id, "Disabled");
    setDAppRiskLevel(mockDApps[0].id, "SAFE");

    expect(notified).toBe(2);
    unsubscribe();

    setDAppStatus(mockDApps[0].id, "Active");
    expect(notified).toBe(2);
  });
});
