// ---------------------------------------------------------------------------
// Attack Scenario Engine —— "完整 体验" 编排器
//
//   目标钱包 → Mock DApp → Fake Airdrop/Claim → Mock Approval Request →
//   Risk Analysis → Mock Signature/Permit → Threat Detection →
//   Simulated Asset Movement → Protection Triggered → Simulation Completed →
//   Security Report
//
// runFullAttack体验() 是这条管道的真正实现：依次调用本次会话已经建好的
// Wallet / Asset / Approval / Signature Engine（内部已经接入 Risk Engine 做
// 风险评分）、Simulation Engine（底层状态机 + 事件流）、Threat Engine（订阅
// 事件自动检测）、Alert Engine（订阅威胁自动生成告警），最终拼出一份
// SecurityReport。全程只调用这些 Engine 已经暴露的 Mock 动作函数，不直接
// 操作任何"钱包/RPC/链上"概念——结构上就不存在能触发真实交易的代码路径。
//
// 资产异动只能是 SIMULATED_ASSET_MOVEMENT：本文件只调用 Asset Engine 的
// createMockAssetMovement()，该函数在实现里被强制只更新 projectedMovement，
// 绝不写入 actualBalance/actualLoss（见 asset-engine.ts 的运行时断言）。
// SecurityReport.safety 三个字段永远是字面量 0 / "NOT EXECUTED" /
// "NOT CONNECTED"，不是"通常如此"，是这个平台的结构性约束。
// ---------------------------------------------------------------------------

import { getDAppById } from "@/lib/shared/entities";
import type { SignatureType } from "@/lib/shared/types";
import { createMockWallet, getWalletState, selectMockWallet } from "@/lib/wallet-engine";
import { calculateProjectedLoss, createMockAssetMovement, getAssets, getBalance } from "@/lib/asset-engine";
import { analyzeApproval, blockApproval, requestApproval, simulateApproval } from "@/lib/approval-engine";
import type { ApprovalRecordState } from "@/lib/approval-engine";
import { analyzeSignature, createSignatureRequest, simulateSignature } from "@/lib/signature-engine";
import type { SignatureRecordState } from "@/lib/signature-engine";
import { completeSimulation, createSimulation, startSimulation } from "@/lib/simulation";
import { attachToSimulation, getThreatsForSimulation } from "@/lib/threat-engine";
import { getAlertsForSimulation } from "@/lib/alert-engine";
import { requireScenario } from "./attack-scenario-library";
import type { RunFullAttack体验Input, SecurityReport } from "./attack-scenario-types";

function resolveSpenderAddress(dappId: string | undefined, walletId: string): string {
  const dapp = dappId ? getDAppById(dappId) : undefined;
  return dapp?.contractAddress ?? `0xSPEND-PROTOCOL${walletId.toUpperCase()}`;
}

/** 跑完一个场景的"完整 体验"，返回一份可展示的安全报告。全程只产生 Mock 状态变化。 */
export function runFullAttack体验(input: RunFullAttack体验Input): SecurityReport {
  const scenario = requireScenario(input.scenarioId);

  // 1. 目标钱包 —— 复用已选定的钱包，或按场景的初始状态叙事创建一个新的。
  const wallet = input.walletId
    ? getWalletState(input.walletId)
    : createMockWallet({ label: scenario.initialState.walletLabel, network: scenario.initialState.network });
  selectMockWallet(wallet.id);

  // 2. Mock DApp —— 场景引用的 DApp（如果有）仅用于取 spender/合约地址等展示信息。
  const holdings = getAssets(wallet.id);
  const primaryTokenId = holdings.find((h) => scenario.initialState.tokenIds.includes(h.tokenId))?.tokenId ?? holdings[0]?.tokenId;

  // 3. 创建并驱动底层 Simulation Engine：真实状态机 + 事件流，Threat Engine 订阅它自动检测。
  const simulation = createSimulation({
    scenarioId: scenario.linkedAttackScenarioId,
    walletId: wallet.id,
    dappId: scenario.initialState.dappId,
    tokenId: primaryTokenId,
  });
  attachToSimulation(simulation.id);
  startSimulation(simulation.id);

  // 部分攻击链把"发起请求"与"被检测"压缩成同一步（例如 Fake Airdrop 的
  // Approval Engine 步骤状态直接就是 Detected），所以按 component 判断这个
  // 场景"是否涉及授权/签名"，而不是只看有没有单独的 REQUEST_* 步骤。
  const hasApprovalStep = scenario.steps.some((s) => s.component === "Approval Engine");
  const hasSignatureStep = scenario.steps.some((s) => s.component === "Permit Engine" || s.component === "Signature Engine");
  const wantsUnlimited = scenario.category === "Malicious Approval" || scenario.detectionRules.some((r) => r.threatType === "UNLIMITED_APPROVAL");
  const wantsPermit = scenario.name === "Permit Abuse" || scenario.detectionRules.some((r) => r.threatType === "PERMIT_RISK");

  // 4. Mock Approval Request → 5. Risk Analysis（Approval Engine 内部已经调用 Risk Engine 动态评分）
  let approval: ApprovalRecordState | undefined;
  if (hasApprovalStep && primaryTokenId) {
    approval = requestApproval({
      walletId: wallet.id,
      tokenId: primaryTokenId,
      dappId: scenario.initialState.dappId,
      spenderAddress: resolveSpenderAddress(scenario.initialState.dappId, wallet.id),
      requestedAmount: wantsUnlimited ? "Unlimited (2^256-1)" : "50000",
      simulationId: simulation.id,
    });
    // 先分析"用户在 Mock 钱包里点击同意"（真实时序：用户可能先于风险分析完成前就已同意）
    approval = simulateApproval(approval.id);
    // 安全引擎事后分析——如判定为高风险会覆盖为 HIGH_RISK，即使已经"分析同意"过
    approval = analyzeApproval(approval.id);
    if (approval.riskLevel === "HIGH" || approval.riskLevel === "CRITICAL") {
      // 9. Protection Triggered —— 保护引擎在授权生效前拦截
      approval = blockApproval(approval.id);
    }
  }

  // 6. Mock Signature / Permit（同样已经内部接入 Risk Engine 动态评分）
  let signature: SignatureRecordState | undefined;
  if (hasSignatureStep) {
    const type: SignatureType = wantsPermit ? "Permit (EIP-2612)" : "Typed Data (EIP-712)";
    signature = createSignatureRequest({
      walletId: wallet.id,
      dappId: scenario.initialState.dappId,
      type,
      payloadSummary: `${scenario.name} 场景测试签名请求（Mock，不产生真实签名，也不会被广播）`,
      simulationId: simulation.id,
    });
    signature = analyzeSignature(signature.id);
    // 教育场景：即使已经被判定为 HIGH_RISK，用户依然可能无视警告完成签名
    signature = simulateSignature(signature.id);
  }

  // 7. 推进底层攻击链状态机走到终态（Threat Detection 通过 attachToSimulation() 的订阅在每一步后自动进行）
  const finalSimState = completeSimulation(simulation.id);

  // 8. Simulated Asset Movement —— 只允许 SIMULATED_ASSET_MOVEMENT，绝不写入真实余额。
  const assetMovement = primaryTokenId
    ? createMockAssetMovement({
        walletId: wallet.id,
        tokenId: primaryTokenId,
        amount: getBalance(wallet.id, primaryTokenId),
        destinationAddress: resolveSpenderAddress(scenario.initialState.dappId, wallet.id),
        riskLevel: finalSimState.riskLevel,
        simulationId: simulation.id,
      })
    : undefined;

  // 10. Simulation Completed → Security Report
  const projectedLossUsd = primaryTokenId
    ? calculateProjectedLoss({ walletId: wallet.id, tokenId: primaryTokenId, riskLevel: finalSimState.riskLevel })
    : calculateProjectedLoss({ walletId: wallet.id, riskLevel: finalSimState.riskLevel });

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    simulationId: simulation.id,
    walletId: wallet.id,
    walletAddress: wallet.address,
    status: finalSimState.status,
    riskLevel: finalSimState.riskLevel,
    riskScore: finalSimState.riskScore,
    threats: getThreatsForSimulation(simulation.id),
    alerts: getAlertsForSimulation(simulation.id),
    approval,
    signature,
    assetMovement,
    projectedLossUsd,
    safety: { actualLoss: 0, transactionStatus: "NOT EXECUTED", blockchainStatus: "NOT CONNECTED" },
    generatedAt: new Date().toISOString(),
  };
}
