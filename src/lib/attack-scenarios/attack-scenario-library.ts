// ---------------------------------------------------------------------------
// Attack Scenario Engine —— 20 个标准场景目录
//
// 每个场景只手写"这个场景独有"的字段（名字、分类、简介、初始状态叙事、关联
// 的 Mock DApp/Token、关联的执行蓝图 id）；可以从执行蓝图（@/lib/shared/
// entities.attackScenarios）自动推导的字段（steps / severity / 最终状态）由
// buildScenario() 统一派生，避免同一份攻击链数据在两个地方手写两遍、逐渐漂移。
// ---------------------------------------------------------------------------

import { getAttackScenarioById, getDAppById } from "@/lib/shared/entities";
import type { AttackChainStep, RiskLevel, WalletNetwork } from "@/lib/shared/types";
import { buildStepBlueprints, resolveFinalStatus, type StepBlueprint } from "@/lib/simulation";
import { classifyEvent } from "@/lib/threat-engine";
import type { SimulationEngineEvent } from "@/lib/simulation";
import type {
  AttackScenario,
  AttackScenarioCategory,
  ScenarioDetectionRule,
  ScenarioRiskRule,
  ScenarioStep,
} from "./attack-scenario-types";

interface ScenarioSeed {
  id: string;
  name: string;
  category: AttackScenarioCategory;
  description: string;
  linkedAttackScenarioId: string;
  dappId?: string;
  tokenIds: string[];
  walletLabel: string;
  network: WalletNetwork;
  narrative: string;
}

/** 场景分类 → 这一类攻击"通常会命中"的 Risk Engine 具名因素（模板级别，见 attack-scenario-types.ts 的注释）。 */
const CATEGORY_RISK_RULES: Record<AttackScenarioCategory, ScenarioRiskRule[]> = {
  "Phishing DApp": [
    { factor: "unknownDapp", description: "发起方是一个此前未记录过交互历史的 DApp/域名" },
    { factor: "newContract", description: "关联合约地址呈现「近期新部署 / 未经审计」特征" },
    { factor: "addressRisk", description: "合约地址或落地域名命中已知钓鱼特征库" },
    { factor: "behaviorRisk", description: "整体交互节奏与已知钓鱼模板高度相似" },
  ],
  "Malicious Approval": [
    { factor: "unlimitedAllowance", description: "请求的授权额度为 Unlimited / 2^256-1" },
    { factor: "suspiciousSpender", description: "spender 地址关联到风险等级 HIGH/CRITICAL 的 DApp" },
    { factor: "largeValue", description: "请求金额远超本次交互实际需要的额度" },
    { factor: "behaviorRisk", description: "授权请求的时机/频率偏离正常使用模式" },
  ],
  "Signature Abuse": [
    { factor: "permitRisk", description: "签名类型为 Permit (EIP-2612)，可在链下直接换取代币授权" },
    { factor: "signatureRisk", description: "签名 payload 内容与页面展示不一致，或包含危险关键词" },
    { factor: "suspiciousSpender", description: "签名请求关联到风险等级 HIGH/CRITICAL 的 DApp" },
    { factor: "behaviorRisk", description: "签名请求脱离正常交易上下文单独出现" },
  ],
  "Suspicious Contract": [
    { factor: "newContract", description: "合约地址呈现「近期新部署 / 未经审计」特征" },
    { factor: "addressRisk", description: "合约字节码/地址与已知恶意合约模板高度相似" },
    { factor: "unknownDapp", description: "该 DApp/合约没有可追溯的历史交互记录" },
    { factor: "behaviorRisk", description: "合约调用模式偏离同类正常合约的行为基线" },
  ],
  "Address Poisoning": [
    { factor: "addressRisk", description: "目标地址与用户历史常用地址仅首尾字符相似" },
    { factor: "behaviorRisk", description: "相似地址在交易记录中出现的时机高度可疑（贴近用户真实转账前后）" },
  ],
  "Transaction Manipulation": [
    { factor: "addressRisk", description: "实际执行的目标地址与用户预期签署的地址不一致" },
    { factor: "largeValue", description: "被篡改的交易涉及金额较大" },
    { factor: "behaviorRisk", description: "交易在确认后、广播前的执行路径出现非预期变化" },
  ],
  "Social Engineering": [
    { factor: "unknownDapp", description: "话术来自无法验证身份的社交账号/私信渠道" },
    { factor: "suspiciousSpender", description: "话术最终引导至一个风险地址或风险 DApp" },
    { factor: "behaviorRisk", description: "话术制造紧迫感，诱导用户跳过正常的核实步骤" },
  ],
};

/** 攻击链 component → ScenarioStep 的 actor 归类。 */
function actorForComponent(component: string): ScenarioStep["actor"] {
  switch (component) {
    case "Fake DApp":
    case "Social Channel":
      return "DApp";
    case "Wallet Mock":
    case "Approval Engine":
    case "Permit Engine":
    case "Signature Engine":
      return "Wallet";
    case "Risk Engine":
      return "RiskEngine";
    case "Malicious Contract":
    case "Fund Flow Engine":
      return "Attacker";
    default:
      return "User";
  }
}

/** StepBlueprint（含 scenario-engine.ts 解析出的真实 eventType）→ 这一步对应"完整 体验"管道里的哪个 Mock 动作。 */
function mockActionForBlueprint(blueprint: StepBlueprint, chainStep: AttackChainStep): ScenarioStep["mockAction"] {
  if (chainStep.status === "Blocked") return "TRIGGER_PROTECTION";
  switch (blueprint.eventType) {
    case "DAPP_OPENED":
      return "OPEN_DAPP";
    case "APPROVAL_REQUESTED":
      return "REQUEST_APPROVAL";
    case "APPROVAL_ANALYZED":
      return "ANALYZE_RISK";
    case "SIGNATURE_REQUESTED":
      return "REQUEST_SIGNATURE";
    case "SIGNATURE_ANALYZED":
      return "ANALYZE_RISK";
    case "THREAT_DETECTED":
      return "DETECT_THREAT";
    case "ASSET_MOVEMENT_SIMULATED":
      return "SIMULATE_ASSET_MOVEMENT";
    case "PROTECTION_TRIGGERED":
      return "TRIGGER_PROTECTION";
    default:
      return "NONE";
  }
}

/** 把执行蓝图的每一步转换成一个用于展示"这一步在分析里实际做了什么"的合成事件，喂给 Threat Engine 的 classifyEvent 复用同一套检测规则。 */
function toSyntheticEvent(blueprint: StepBlueprint, simulationId: string): SimulationEngineEvent {
  return {
    id: `${simulationId}-synthetic-${blueprint.stepIndex}`,
    simulationId,
    sequence: blueprint.stepIndex,
    type: blueprint.eventType,
    title: blueprint.title,
    stepIndex: blueprint.stepIndex,
    component: blueprint.component,
    riskLevel: blueprint.riskLevel,
    timestamp: new Date(0).toISOString(),
  };
}

function buildDetectionRules(scenarioId: string): ScenarioDetectionRule[] {
  const scenario = getAttackScenarioById(scenarioId);
  if (!scenario) return [];
  const blueprints = buildStepBlueprints(scenario);
  const rules: ScenarioDetectionRule[] = [];
  const seen = new Set<string>();

  for (const blueprint of blueprints) {
    const event = toSyntheticEvent(blueprint, scenarioId);
    const threatType = classifyEvent(event);
    if (!threatType || seen.has(threatType)) continue;
    seen.add(threatType);
    rules.push({ threatType, condition: `${blueprint.title}（组件：${blueprint.component}，风险等级：${blueprint.riskLevel}）` });
  }
  return rules;
}

function buildSteps(scenarioId: string): ScenarioStep[] {
  const scenario = getAttackScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`[attack-scenario-engine] linkedAttackScenarioId "${scenarioId}" 在 @/lib/shared/entities.attackScenarios 中不存在`);
  }
  const blueprints = buildStepBlueprints(scenario);
  return blueprints.map((blueprint, i) => ({
    order: blueprint.stepIndex + 1,
    title: blueprint.title,
    actor: actorForComponent(blueprint.component),
    component: blueprint.component,
    riskLevel: blueprint.riskLevel,
    mockAction: mockActionForBlueprint(blueprint, scenario.chain[i]),
  }));
}

function buildScenario(seed: ScenarioSeed): AttackScenario {
  const linked = getAttackScenarioById(seed.linkedAttackScenarioId);
  if (!linked) {
    throw new Error(`[attack-scenario-engine] "${seed.id}" 引用的 linkedAttackScenarioId "${seed.linkedAttackScenarioId}" 不存在`);
  }
  const lastStep = linked.chain[linked.chain.length - 1];
  const finalStatus = resolveFinalStatus(lastStep);
  const dapp = seed.dappId ? getDAppById(seed.dappId) : undefined;

  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    description: seed.description,
    severity: linked.riskLevel,
    initialState: {
      walletLabel: seed.walletLabel,
      network: seed.network,
      dappId: seed.dappId,
      tokenIds: seed.tokenIds,
      narrative: dapp ? `${seed.narrative}（涉及 DApp：${dapp.name}，${dapp.domain}）` : seed.narrative,
    },
    steps: buildSteps(seed.linkedAttackScenarioId),
    riskRules: CATEGORY_RISK_RULES[seed.category],
    detectionRules: buildDetectionRules(seed.linkedAttackScenarioId),
    simulationOutcome: {
      finalStatus,
      narrative:
        finalStatus === "BLOCKED"
          ? "风险引擎/保护引擎在授权或签名生效前完成拦截，未发生任何真实资产转移。"
          : finalStatus === "DETECTED"
            ? "安全引擎检测到攻击特征并标记告警，本次推演到检测为止（教育用途，未分析自动拦截）。"
            : "推演完整走完攻击链，用于展示攻击手法的完整时序。",
      projectedLossNote: "Projected Loss 按当前 Mock 持仓与本场景风险等级推算得出，仅用于教育展示，具体数值见每次 runFullAttack体验() 的 SecurityReport。",
      actualLoss: 0,
      transactionExecuted: false,
      blockchainConnected: false,
    },
    recommendations: [linked.recommendation, "本场景产生的一切数据均为 Mock 分析，不代表、不触发任何真实资产操作或链上行为。"],
    linkedAttackScenarioId: seed.linkedAttackScenarioId,
  };
}

const SEEDS: ScenarioSeed[] = [
  {
    id: "scn-fake-airdrop",
    name: "Fake Airdrop",
    category: "Phishing DApp",
    description: "伪造官方空投页面，诱导用户连接钱包并领取代币，实际触发无限额度授权。",
    linkedAttackScenarioId: "atk-fake-airdrop",
    dappId: "dapp-02",
    tokenIds: ["tok-adc"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "一个持有主流资产的 Mock 钱包，收到「限时空投」的社交媒体推广链接。",
  },
  {
    id: "scn-fake-claim",
    name: "Fake Claim",
    category: "Phishing DApp",
    description: "伪造代币领取页面，诱导用户在领取前先签署一笔看似「Gas 补贴」的授权。",
    linkedAttackScenarioId: "atk-fake-claim",
    dappId: "dapp-09",
    tokenIds: ["tok-adc"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包在浏览器插件里看到「有 1 笔待领取奖励」的提示。",
  },
  {
    id: "scn-fake-mint",
    name: "Fake Mint",
    category: "Phishing DApp",
    description: "伪造代币免费增发页面，Mint 交易内嵌隐藏的资产转移调用。",
    linkedAttackScenarioId: "atk-fake-mint",
    dappId: "dapp-03",
    tokenIds: ["tok-smnx"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包在社群里看到「免费 Mint 新代币」的宣传。",
  },
  {
    id: "scn-fake-staking",
    name: "Fake Staking",
    category: "Phishing DApp",
    description: "伪造高收益质押页面，存入操作附带无限额度授权请求，为后续提走全部资产铺路。",
    linkedAttackScenarioId: "atk-fake-staking",
    dappId: "dapp-04",
    tokenIds: ["tok-eth"],
    walletLabel: "高净值 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包被「年化 300%」的质押广告吸引，尝试存入资产。",
  },
  {
    id: "scn-fake-swap",
    name: "Fake Swap",
    category: "Phishing DApp",
    description: "诱导用户在仿冒 DEX 页面完成兑换，实际兑换路径经过攻击者控制的中间合约。",
    linkedAttackScenarioId: "atk-suspicious-swap",
    dappId: "dapp-01",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包通过一条推广链接访问了一个界面与官方 DEX 高度相似的兑换页面。",
  },
  {
    id: "scn-fake-bridge",
    name: "Fake Bridge",
    category: "Phishing DApp",
    description: "伪造跨链桥页面，存入资产等待跨链到账，实际目标链合约从未部署。",
    linkedAttackScenarioId: "atk-fake-bridge",
    dappId: "dapp-05",
    tokenIds: ["tok-eth"],
    walletLabel: "跨链用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包尝试把资产从 Ethereum 跨链到另一条链，访问了一个仿冒的跨链桥页面。",
  },
  {
    id: "scn-fake-presale",
    name: "Fake Presale",
    category: "Phishing DApp",
    description: "发布虚假代币预售页面，募集资金后无锁仓机制、无法赎回。",
    linkedAttackScenarioId: "atk-fake-presale",
    dappId: "dapp-07",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包看到一个「即将上线交易所」的代币预售页面。",
  },
  {
    id: "scn-fake-giveaway",
    name: "Fake Giveaway",
    category: "Social Engineering",
    description: "社交媒体发布「充值 1 份返 2 份」赠送活动，诱导用户主动转账到攻击者地址。",
    linkedAttackScenarioId: "atk-fake-giveaway",
    dappId: "dapp-06",
    tokenIds: ["tok-eth"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包关注的社交账号（实为仿冒）发布了一条「充值返赠」活动。",
  },
  {
    id: "scn-malicious-approval",
    name: "Malicious Approval",
    category: "Malicious Approval",
    description: "DApp 弹出的授权确认框仅展示部分额度信息，实际请求的授权额度远超 UI 展示值。",
    linkedAttackScenarioId: "atk-malicious-approval",
    dappId: "dapp-10",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包在一个日常使用的 DApp 上执行一笔普通操作，触发了一次授权确认。",
  },
  {
    id: "scn-unlimited-approval",
    name: "Unlimited Approval",
    category: "Malicious Approval",
    description: "DApp 请求超出实际需要的无限代币额度，为后续资产提取铺路。",
    linkedAttackScenarioId: "atk-unlimited-approval",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包对一个 DApp 发起 approve 请求，用于一次日常的代币兑换。",
  },
  {
    id: "scn-permit-abuse",
    name: "Permit Abuse",
    category: "Signature Abuse",
    description: "利用 ERC-20 Permit 免 Gas 签名机制，诱导用户签署脱离交易上下文的授权。",
    linkedAttackScenarioId: "atk-permit-abuse",
    dappId: "dapp-01",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包访问一个钓鱼页面，页面弹出一条不产生链上交易的 Permit 签名请求。",
  },
  {
    id: "scn-signature-phishing",
    name: "Signature Phishing",
    category: "Signature Abuse",
    description: "伪造签名请求，签名内容与页面展示不符，实际授权攻击者操作资产。",
    linkedAttackScenarioId: "atk-signature-phishing",
    tokenIds: ["tok-eth"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包收到一条签名请求，钱包插件展示的内容与页面描述并不一致。",
  },
  {
    id: "scn-fake-revoke",
    name: "Fake Revoke",
    category: "Malicious Approval",
    description: "冒充安全提示诱导用户使用仿冒 Revoke 工具，'撤销'按钮实际发起新的无限额度授权。",
    linkedAttackScenarioId: "atk-fake-revoke",
    dappId: "dapp-08",
    tokenIds: ["tok-usdt"],
    walletLabel: "安全意识用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包收到「检测到风险授权，请立即撤销」的提示，尝试使用撤销工具。",
  },
  {
    id: "scn-suspicious-dapp",
    name: "Suspicious DApp",
    category: "Suspicious Contract",
    description: "用户访问一个新上线、无历史交互记录、域名注册时间极短的 DApp 并尝试连接钱包。",
    linkedAttackScenarioId: "atk-suspicious-dapp",
    dappId: "dapp-11",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包点开一个刚刚在社群里被分享的新 DApp 链接。",
  },
  {
    id: "scn-suspicious-contract",
    name: "Suspicious Contract",
    category: "Suspicious Contract",
    description: "用户与一个未经审计的合约交互，其字节码与已知恶意合约模板高度相似。",
    linkedAttackScenarioId: "atk-suspicious-contract",
    dappId: "dapp-11",
    tokenIds: ["tok-eth"],
    walletLabel: "开发者 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包与一个刚部署不久、尚未开源验证的合约发起了一笔交互。",
  },
  {
    id: "scn-address-poisoning",
    name: "Address Poisoning",
    category: "Address Poisoning",
    description: "攻击者发送小额转账伪造相似地址记录，诱导用户误复制粘贴到相似的攻击者地址。",
    linkedAttackScenarioId: "atk-address-poisoning",
    tokenIds: ["tok-usdt"],
    walletLabel: "高频转账 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包的交易记录中，出现了一笔与自己常用收款地址首尾字符相同的 0 元转账。",
  },
  {
    id: "scn-fake-nft-mint",
    name: "Fake NFT Mint",
    category: "Phishing DApp",
    description: "伪造热门 NFT 系列铸造页面，铸造按钮实际触发资产转移或恶意授权。",
    linkedAttackScenarioId: "atk-fake-nft-mint",
    dappId: "dapp-03",
    tokenIds: ["tok-eth"],
    walletLabel: "NFT 收藏者 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包想要参与一个热门 NFT 系列的公售，访问了一个搜索引擎排名靠前的铸造页面。",
  },
  {
    id: "scn-fake-token-migration",
    name: "Fake Token Migration",
    category: "Phishing DApp",
    description: "冒充项目方发布「旧代币需迁移至新合约」公告，收取旧代币授权后不发放新代币。",
    linkedAttackScenarioId: "atk-fake-token-migration",
    dappId: "dapp-12",
    tokenIds: ["tok-smnx"],
    walletLabel: "长期持仓 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包持有的某代币项目方（仿冒）宣布因合约升级需要进行代币迁移。",
  },
  {
    id: "scn-transaction-manipulation",
    name: "Transaction Manipulation",
    category: "Transaction Manipulation",
    description: "在用户确认交易后，通过恶意合约篡改实际执行的转账对象或金额。",
    linkedAttackScenarioId: "atk-transaction-manipulation",
    tokenIds: ["tok-eth"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包发起一笔看起来完全正常的转账，目标地址是自己核实过的收款方。",
  },
  {
    id: "scn-social-engineering",
    name: "Social Engineering",
    category: "Social Engineering",
    description: "冒充官方客服或团队成员，诱导用户主动提供助记词或签署恶意授权。",
    linkedAttackScenarioId: "atk-social-engineering",
    tokenIds: ["tok-usdt"],
    walletLabel: "普通用户 Mock 钱包",
    network: "Ethereum",
    narrative: "Mock 钱包用户在提交工单后，收到一条自称「官方客服」的私信。",
  },
];

export const attackScenarioLibrary: AttackScenario[] = SEEDS.map(buildScenario);

export function listAttackScenarios(): AttackScenario[] {
  return attackScenarioLibrary;
}

export function getScenarioById(id: string): AttackScenario | undefined {
  return attackScenarioLibrary.find((s) => s.id === id);
}

export function requireScenario(id: string): AttackScenario {
  const scenario = getScenarioById(id);
  if (!scenario) {
    throw new Error(`[attack-scenario-engine] 未知的 scenario id="${id}"，请检查 attack-scenario-library.ts`);
  }
  return scenario;
}

export function listScenariosByCategory(category: AttackScenarioCategory): AttackScenario[] {
  return attackScenarioLibrary.filter((s) => s.category === category);
}
