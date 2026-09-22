// ---------------------------------------------------------------------------
// 统一分析数据源（Single Source of Truth） —— 纯分析安全研究平台
//
// 本文件是全站"钱包 / Token / DApp / 授权 / 签名 / 威胁 / 告警 / 攻击场景"的
// 唯一权威数据来源。此前这些概念分散在 5～6 个互不关联的文件里，同一个钱包
// 地址在不同页面上会出现不一致甚至相互矛盾的数据（例如同一个 Wallet-001 在
// 运营后台用户列表里的地址和在钱包安全模块里的地址仅一个字符之差）。
//
// 历史遗留文件（lib/admin/wallet-security-data.ts、lib/soc/mock.ts、
// lib/admin-security-data.ts、lib/simulation-data.ts 等）现在都从这里派生
// 数据，而不是各自硬编码一份，从而保证"同一个钱包 / 同一个 Token 在任何页面
// 看到的都是同一份数据"。
//
// 重要：以下全部为本地确定性生成的虚构隔离数据，不查询、不连接任何真实钱包、
// 真实区块链节点、区块浏览器或第三方 API。
// ---------------------------------------------------------------------------

import { seededRandom, mockAddress } from "./prng";
import { riskLevelFromScore, walletStatusFromRiskLevel } from "./risk";
import type {
  AttackScenario,
  MockAlert,
  MockApproval,
  MockDApp,
  MockThreatEvent,
  MockToken,
  MockWallet,
  WalletNetwork,
  WalletType,
} from "./types";

// —— 1. 钱包（Wallet）：核心 8 个 + 扩展 36 个，共 44 个，唯一数据源 ————————

interface CoreWalletSeed {
  id: string;
  label: string;
  address: string;
  walletType: WalletType;
  network: WalletNetwork;
  totalValueUsd: number;
  riskScore: number;
  lastActiveAgo: string;
  frozen?: boolean;
  linkedUserId?: string;
}

// 8 个"核心隔离钱包"，地址在此第一次也是唯一一次被定义 —— 运营后台用户列表、
// 钱包与资产安全模块、攻击案例分析等所有引用同一批钱包的地方，都从下面这份
// 列表派生，不再各自重复书写（并因此产生不一致）。
const CORE_WALLET_SEEDS: CoreWalletSeed[] = [
  { id: "wallet-01", label: "Wallet-001", address: "0x71D4...A82F", walletType: "智能钱包", network: "Ethereum", totalValueUsd: 128520.42, riskScore: 12, lastActiveAgo: "2 分钟前", linkedUserId: "U-482910" },
  { id: "wallet-02", label: "Wallet-002", address: "0x9A21...71EF", walletType: "智能钱包", network: "Ethereum", totalValueUsd: 48520.18, riskScore: 97, lastActiveAgo: "6 分钟前", linkedUserId: "U-482884" },
  { id: "wallet-03", label: "Wallet-003", address: "0x4F2C...C918", walletType: "普通钱包", network: "BNB Chain", totalValueUsd: 62140.0, riskScore: 34, lastActiveAgo: "18 分钟前", linkedUserId: "U-481022" },
  { id: "wallet-04", label: "Wallet-004", address: "0x2A71...B103", walletType: "交易所钱包", network: "Polygon", totalValueUsd: 892400.5, riskScore: 8, lastActiveAgo: "35 分钟前", linkedUserId: "U-479881" },
  { id: "wallet-05", label: "Wallet-005", address: "0x6C0F...F721", walletType: "普通钱包", network: "Arbitrum", totalValueUsd: 15900.3, riskScore: 76, lastActiveAgo: "1 小时前", linkedUserId: "U-475120" },
  { id: "wallet-06", label: "Wallet-006", address: "0x3BC1...44F0", walletType: "测试钱包", network: "Ethereum", totalValueUsd: 2400.0, riskScore: 55, lastActiveAgo: "2 小时前", linkedUserId: "U-461209" },
  { id: "wallet-07", label: "Wallet-007", address: "0x8B1D...44D0", walletType: "智能钱包", network: "Solana", totalValueUsd: 331200.0, riskScore: 21, lastActiveAgo: "3 小时前", linkedUserId: "U-458811" },
  { id: "wallet-08", label: "Wallet-008", address: "0x0A5E...9E12", walletType: "普通钱包", network: "Ethereum", totalValueUsd: 0, riskScore: 100, lastActiveAgo: "1 天前", frozen: true, linkedUserId: "U-468042" },
];

function buildCoreWallets(): MockWallet[] {
  return CORE_WALLET_SEEDS.map((seed) => {
    const riskLevel = riskLevelFromScore(seed.riskScore);
    return {
      id: seed.id,
      label: seed.label,
      address: seed.address,
      network: seed.network,
      walletType: seed.walletType,
      totalValueUsd: seed.totalValueUsd,
      riskScore: seed.riskScore,
      riskLevel,
      status: walletStatusFromRiskLevel(riskLevel, seed.frozen),
      lastActiveAgo: seed.lastActiveAgo,
      pool: "core",
      linkedUserId: seed.linkedUserId,
    };
  });
}

const EXTENDED_NETWORKS: WalletNetwork[] = ["Ethereum", "BNB Chain", "Polygon", "Arbitrum", "Solana", "Base"];

/** 自动扫描模块使用的扩展 Mock 钱包池（36 个），与核心 8 个钱包共用同一套类型与风险判定。 */
function buildExtendedWallets(): MockWallet[] {
  return Array.from({ length: 36 }, (_, i) => {
    const rnd = seededRandom(i * 977 + 13);
    const riskScore = Math.floor(rnd() * 100);
    const totalValueUsd = Math.round(rnd() * 480000 * 100) / 100;
    const riskLevel = riskLevelFromScore(riskScore);
    return {
      id: `scan-${String(i + 1).padStart(3, "0")}`,
      label: `体验-Wallet-${String(i + 1).padStart(3, "0")}`,
      address: mockAddress(rnd),
      network: EXTENDED_NETWORKS[i % EXTENDED_NETWORKS.length],
      walletType: "普通钱包" as WalletType,
      totalValueUsd,
      riskScore,
      riskLevel,
      status: walletStatusFromRiskLevel(riskLevel),
      lastActiveAgo: `${(i % 12) + 1} 小时前`,
      pool: "extended",
    };
  });
}

export const mockWallets: MockWallet[] = [...buildCoreWallets(), ...buildExtendedWallets()];

export function getWalletById(id: string): MockWallet | undefined {
  return mockWallets.find((w) => w.id === id);
}

export function getWalletByAddress(address: string): MockWallet | undefined {
  return mockWallets.find((w) => w.address === address);
}

/** 在核心/扩展钱包池中查找地址"前缀"最相似的一条，用于把历史遗留的截断地址关联回canonical 钱包。 */
export function findWalletByAddressFragment(fragment: string): MockWallet | undefined {
  const head = fragment.split("...")[0];
  return mockWallets.find((w) => w.address.startsWith(head));
}

// —— 2. Token —————————————————————————————————————————————————————————

export const mockTokens: MockToken[] = [
  { id: "tok-btc", symbol: "BTC", name: "Mock Bitcoin", network: "Ethereum", decimals: 8, mockPriceUsd: 61200, totalSupply: "21,000,000", riskLevel: "SAFE" },
  { id: "tok-eth", symbol: "ETH", name: "Mock Ether", network: "Ethereum", decimals: 18, mockPriceUsd: 3120, totalSupply: "120,000,000", riskLevel: "SAFE" },
  { id: "tok-usdt", symbol: "USDT", name: "Mock Tether", network: "Ethereum", decimals: 6, mockPriceUsd: 1, totalSupply: "1,000,000,000", riskLevel: "SAFE" },
  { id: "tok-usdc", symbol: "USDC", name: "Mock USD Coin", network: "Ethereum", decimals: 6, mockPriceUsd: 1, totalSupply: "800,000,000", riskLevel: "SAFE" },
  { id: "tok-sol", symbol: "SOL", name: "Mock Solana", network: "Solana", decimals: 9, mockPriceUsd: 168, totalSupply: "580,000,000", riskLevel: "SAFE" },
  { id: "tok-wbtc", symbol: "WBTC", name: "Mock Wrapped BTC", network: "Ethereum", decimals: 8, mockPriceUsd: 61200, totalSupply: "210,000", riskLevel: "LOW" },
  { id: "tok-smnx", symbol: "SMNX", name: "SafeMoonX（仿冒）", network: "Ethereum", decimals: 9, mockPriceUsd: 0.0002, totalSupply: "999,999,999,999", riskLevel: "CRITICAL" },
  { id: "tok-adc", symbol: "ADC", name: "AirdropCoin（仿冒）", network: "Ethereum", decimals: 18, mockPriceUsd: 0.01, totalSupply: "10,000,000,000", riskLevel: "HIGH" },
];

export function getTokenById(id: string): MockToken | undefined {
  return mockTokens.find((t) => t.id === id);
}
export function getTokenBySymbol(symbol: string): MockToken | undefined {
  return mockTokens.find((t) => t.symbol === symbol);
}

// —— 3. DApp（仿冒 / 高风险样本库） ——————————————————————————————————

export const mockDApps: MockDApp[] = [
  { id: "dapp-01", name: "TokenSwap DEX", domain: "tokenswap.app", category: "Decentralized Exchange", riskLevel: "CRITICAL", contractAddress: "0xA3C5...9F3C", status: "Active" },
  { id: "dapp-02", name: "AirdropReward", domain: "airdrop-reward.app", category: "Token Distribution", riskLevel: "CRITICAL", contractAddress: "0xB7D2...1120", status: "Active" },
  { id: "dapp-03", name: "NFT Marketplace", domain: "nft-genesis.app", category: "NFT Trading", riskLevel: "HIGH", contractAddress: "0xC1E9...7781", status: "Active" },
  { id: "dapp-04", name: "Stake Protocol", domain: "stake-protocol.app", category: "Yield Farming", riskLevel: "HIGH", contractAddress: "0xD4F6...4402", status: "Active" },
  { id: "dapp-05", name: "Bridge Protocol", domain: "bridge-protocol.app", category: "Cross-Chain Bridge", riskLevel: "CRITICAL", contractAddress: "0xE2A8...6690", status: "Active" },
  { id: "dapp-06", name: "Reward Hub", domain: "reward-hub.app", category: "Incentive Platform", riskLevel: "MEDIUM", contractAddress: "0xF5B1...3321", status: "Disabled" },
  { id: "dapp-07", name: "LaunchPad Plus", domain: "launch-pad.app", category: "Token Launch", riskLevel: "HIGH", contractAddress: "0xG3C4...8843", status: "Active" },
  { id: "dapp-08", name: "ApprovalManager", domain: "approval-manager.app", category: "Token Approval", riskLevel: "MEDIUM", contractAddress: "0xH6D9...2290", status: "Active" },
  { id: "dapp-09", name: "ClaimPortal", domain: "claim-portal.app", category: "Claim Service", riskLevel: "HIGH", contractAddress: "0xI2E7...5510", status: "Active" },
  { id: "dapp-10", name: "ProAccess Vault", domain: "pro-access.app", category: "Access Protocol", riskLevel: "CRITICAL", contractAddress: "0xJ8F1...7742", status: "Active" },
  { id: "dapp-11", name: "SmartRouter", domain: "smart-router.app", category: "Routing Protocol", riskLevel: "MEDIUM", contractAddress: "0xK4G5...1187", status: "Active" },
  { id: "dapp-12", name: "MigrateCenter V2", domain: "migrate-center.app", category: "Token Migration", riskLevel: "CRITICAL", contractAddress: "0xL9H3...9034", status: "Active" },
];

export function getDAppById(id: string): MockDApp | undefined {
  return mockDApps.find((d) => d.id === id);
}
export function getDAppByName(name: string): MockDApp | undefined {
  return mockDApps.find((d) => d.name === name);
}

// —— 4. 授权记录（历史事件，非交互式预设） ——————————————————————————

export const mockApprovals: MockApproval[] = [
  { id: "APR-10281", walletId: undefined, tokenId: "tok-usdt", ownerAddress: "0xA7E3...821A", spenderAddress: "0x2D4F...7A21", tokenSymbol: "USDT", allowance: "48,520", type: "Large Approval", riskLevel: "HIGH", status: "待处理", createdAt: "10:42" },
  { id: "APR-10277", walletId: undefined, tokenId: "tok-eth", ownerAddress: "0xB9C2...5F3C", spenderAddress: "0x5E8A...44D0", tokenSymbol: "ETH", allowance: "8.40", type: "Unlimited Approval", riskLevel: "CRITICAL", status: "待处理", createdAt: "10:12" },
  { id: "APR-10264", walletId: undefined, tokenId: "tok-btc", ownerAddress: "0xC4D1...B7A2", spenderAddress: "0x3F6B...C918", tokenSymbol: "BTC", allowance: "0.42", type: "Limited Approval", riskLevel: "MEDIUM", status: "已处理", createdAt: "09:58" },
  { id: "APR-10251", walletId: undefined, tokenId: "tok-usdc", ownerAddress: "0xD8E5...19DE", spenderAddress: "0x7C2E...F721", tokenSymbol: "USDC", allowance: "28,500", type: "Unlimited Approval", riskLevel: "CRITICAL", status: "待处理", createdAt: "09:30" },
  { id: "APR-10238", walletId: undefined, tokenId: "tok-sol", ownerAddress: "0xE2F9...C441", spenderAddress: "0x6A4D...9E12", tokenSymbol: "SOL", allowance: "120", type: "Limited Approval", riskLevel: "LOW", status: "已忽略", createdAt: "08:47" },
  { id: "APR-10229", walletId: undefined, tokenId: "tok-usdt", ownerAddress: "0xF6A3...7702", spenderAddress: "0x9B1C...5A9F", tokenSymbol: "USDT", allowance: "9,120", type: "Large Approval", riskLevel: "MEDIUM", status: "已处理", createdAt: "08:15" },
];

export function getApprovalById(id: string): MockApproval | undefined {
  return mockApprovals.find((a) => a.id === id);
}

// —— 5. 威胁事件（Threat）—— 统一自 admin-security-data 的 riskAddresses 与
//    soc 的 threatActivity，作为唯一威胁事件源，两个页面都可以引用同一份。 —————

const CORE_WALLET_BY_ID = new Map(buildCoreWallets().map((w) => [w.id, w]));

function walletRisk(id: string): MockWallet {
  const w = CORE_WALLET_BY_ID.get(id);
  if (!w) throw new Error(`unknown core wallet id: ${id}`);
  return w;
}

export const mockThreatEvents: MockThreatEvent[] = [
  { id: "thr-001", category: "Unlimited Approval", riskLevel: walletRisk("wallet-02").riskLevel, walletId: "wallet-02", dappId: "dapp-02", description: "钱包对未知合约发起无限额度授权请求", detectedAt: "13:42:07", status: "Blocked" },
  { id: "thr-002", category: "Permit Abuse", riskLevel: "HIGH", walletId: "wallet-05", dappId: "dapp-01", description: "Permit 请求域名与已知 DApp 不匹配", detectedAt: "13:38:52", status: "Detected" },
  { id: "thr-003", category: "Fake Airdrop", riskLevel: "HIGH", walletId: "wallet-06", dappId: "dapp-02", description: "识别到高风险地址访问伪造空投页面", detectedAt: "13:21:04", status: "Detected" },
  { id: "thr-004", category: "Address Poisoning", riskLevel: walletRisk("wallet-06").riskLevel, walletId: "wallet-06", description: "转入地址与常用地址仅首尾相似", detectedAt: "12:58:31", status: "Simulated" },
  { id: "thr-005", category: "Transaction Manipulation", riskLevel: walletRisk("wallet-02").riskLevel, walletId: "wallet-02", dappId: "dapp-05", description: "交易目标地址与用户预期地址不一致", detectedAt: "12:40:19", status: "Blocked" },
  { id: "thr-006", category: "Suspicious DApp", riskLevel: "LOW", walletId: "wallet-07", dappId: "dapp-06", description: "钱包首次与该 DApp 产生交互记录", detectedAt: "12:12:45", status: "Pending" },
  { id: "thr-007", category: "资金流向异常", riskLevel: walletRisk("wallet-08").riskLevel, walletId: "wallet-08", description: "已冻结钱包关联异常资金流出路径", detectedAt: "1 天前", status: "Blocked" },
];

export function getThreatEventById(id: string): MockThreatEvent | undefined {
  return mockThreatEvents.find((t) => t.id === id);
}

// —— 6. 告警（Alerts）—— 统一引用威胁事件 / 钱包 / DApp，而不是各自硬编码地址 ——

export const mockAlerts: MockAlert[] = [
  { id: "ALT-9001", level: "Critical", title: "检测到可疑代币授权", detail: mockThreatEvents[0].description, walletId: "wallet-02", dappId: "dapp-02", tokenId: "tok-usdt", ruleId: "RULE-002", time: "2 分钟前", read: false },
  { id: "ALT-9000", level: "High", title: "检测到高风险 Permit 签名", detail: mockThreatEvents[1].description, walletId: "wallet-05", dappId: "dapp-01", tokenId: "tok-usdc", ruleId: "RULE-003", time: "18 分钟前", read: false },
  { id: "ALT-8998", level: "High", title: "检测到无限额度授权", detail: "requestedAmount 达到 MaxUint256", walletId: "wallet-06", dappId: "dapp-04", tokenId: "tok-eth", ruleId: "RULE-001", time: "1 小时前", read: true },
  { id: "ALT-8990", level: "Medium", title: "检测到地址污染尝试", detail: mockThreatEvents[3].description, walletId: "wallet-06", tokenId: "tok-usdt", ruleId: "RULE-004", time: "3 小时前", read: true },
  { id: "ALT-8977", level: "Low", title: "新 DApp 首次交互", detail: "钱包首次与该 DApp 产生交互记录", walletId: "wallet-07", dappId: "dapp-07", ruleId: "RULE-001", time: "6 小时前", read: true },
];

export function getAlertById(id: string): MockAlert | undefined {
  return mockAlerts.find((a) => a.id === id);
}

// —— 7. 攻击场景（攻击"手法/技术"定义，Attack 案例库与 SOC 共用同一份）———————

export const attackScenarios: AttackScenario[] = [
  {
    id: "atk-fake-airdrop", name: "Fake Airdrop", nameZh: "伪造空投钓鱼", category: "钓鱼诱导",
    description: "伪造官方空投页面，诱导用户连接钱包并领取代币，实际触发无限额度授权。",
    attackVector: "钓鱼链接 + 伪造 Claim 按钮 + 无限授权请求", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "用户访问钓鱼空投页面", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "点击 Claim 5,000 USDT", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "发起 Unlimited Approval 请求", component: "Approval Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "风险引擎拦截并告警", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "未知 DApp + 请求无限额度授权 → 风险等级判定为 CRITICAL",
    recommendation: "永远不要为陌生空投页面签署无限额度授权，优先使用限额授权。",
  },
  {
    id: "atk-unlimited-approval", name: "Unlimited Approval", nameZh: "无限额度授权", category: "恶意授权",
    description: "DApp 请求超出实际需要的无限代币额度，为后续资产提取铺路。",
    attackVector: "approve(spender, 2^256-1)", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "DApp 发起 approve 请求", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "钱包弹出授权确认", component: "Wallet Mock", risk: "MEDIUM", status: "Simulated" },
      { step: 3, action: "额度更新为 Unlimited", component: "Approval Engine", risk: "HIGH", status: "Detected" },
      { step: 4, action: "标记为高风险并记录", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "requestedAmount == MaxUint256 → 风险等级至少为 HIGH",
    recommendation: "使用 Limited Approval，仅授权当前交易所需的额度。",
  },
  {
    id: "atk-permit-abuse", name: "Permit Abuse Simulation", nameZh: "Permit 签名滥用", category: "签名滥用",
    description: "利用 ERC-20 Permit 免 Gas 签名机制，诱导用户签署脱离交易上下文的授权。",
    attackVector: "EIP-2612 Permit 离线签名钓鱼", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "钓鱼页面发起 Permit 请求", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 2, action: "用户签署 Permit（未产生链上交易）", component: "Wallet Mock", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "签名被提交换取 Mock 授权", component: "Permit Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "安全引擎拦截并告警", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "Permit 请求域名与已知 DApp 不匹配 → CRITICAL",
    recommendation: "签名前核对域名（Domain）与请求内容，警惕未知来源的免 Gas 签名请求。",
  },
  {
    id: "atk-signature-phishing", name: "Signature Phishing", nameZh: "签名钓鱼", category: "签名钓鱼",
    description: "伪造签名请求，签名内容与页面展示不符，实际授权攻击者操作资产。",
    attackVector: "eth_signTypedData_v4 内容伪装", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "弹出签名请求", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "签名内容与页面展示不一致", component: "Signature Engine", risk: "HIGH", status: "Detected" },
      { step: 3, action: "标记 Signature Mismatch", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "签名 payload 中的 spender/amount 与 UI 展示不一致 → HIGH",
    recommendation: "使用支持签名内容解析的钱包，签名前逐项核对字段。",
  },
  {
    id: "atk-transaction-manipulation", name: "Transaction Manipulation", nameZh: "交易篡改", category: "交易篡改",
    description: "在用户确认交易后，通过恶意合约篡改实际执行的转账对象或金额。",
    attackVector: "delegatecall 代理合约替换目标地址", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "用户发起正常转账", component: "Wallet Mock", risk: "LOW", status: "Simulated" },
      { step: 2, action: "恶意合约篡改目标地址", component: "Malicious Contract", risk: "CRITICAL", status: "Detected" },
      { step: 3, action: "交易被安全引擎拦截", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "交易目标地址与用户预期地址不一致 → CRITICAL",
    recommendation: "使用交易预执行/预执行功能，确认实际执行效果后再签署。",
  },
  {
    id: "atk-address-poisoning", name: "Address Poisoning", nameZh: "地址污染", category: "地址污染",
    description: "攻击者发送小额转账伪造相似地址记录，诱导用户误复制粘贴到相似的攻击者地址。",
    attackVector: "生成靠前/靠后字符相同的相似地址", riskLevel: "MEDIUM",
    chain: [
      { step: 1, action: "攻击者发送 0 USDT 到用户钱包", component: "Malicious Contract", risk: "LOW", status: "Simulated" },
      { step: 2, action: "相似地址出现在交易记录中", component: "Wallet Mock", risk: "MEDIUM", status: "Simulated" },
      { step: 3, action: "用户误从历史记录复制相似地址", component: "Risk Engine", risk: "HIGH", status: "Detected" },
    ],
    detectionLogic: "转入地址与用户常用地址仅首尾相似 → 标记为潜在污染地址",
    recommendation: "转账前完整核对地址，不要仅凭首尾字符判断，使用地址簿功能。",
  },
  {
    id: "atk-fake-nft-mint", name: "Fake NFT Mint", nameZh: "伪造 NFT 铸造", category: "钓鱼诱导",
    description: "伪造热门 NFT 系列铸造页面，铸造按钮实际触发资产转移或恶意授权。",
    attackVector: "伪造 Mint 页面 + 隐藏的 transferFrom 调用", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "用户访问伪造 Mint 页面", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "点击 Mint NFT", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "触发隐藏资产转移请求", component: "Risk Engine", risk: "HIGH", status: "Detected" },
      { step: 4, action: "拦截并生成安全告警", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "Mint 交互中出现非预期的资产转移调用 → HIGH",
    recommendation: "Mint 前确认合约地址与官方公告一致，警惕异常的额外权限请求。",
  },
  {
    id: "atk-social-engineering", name: "Social Engineering Attack", nameZh: "社会工程攻击", category: "社会工程",
    description: "冒充官方客服或团队成员，诱导用户主动提供助记词或签署恶意授权。",
    attackVector: "仿冒社交账号 + 私信诱导 + 远程协助话术", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "攻击者冒充官方客服私信联系", component: "Social Channel", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "诱导用户点击'验证钱包'链接", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "请求异常授权 / 索要助记词", component: "Risk Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "标记为社会工程攻击并告警", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "官方客服话术特征 + 异常授权请求同时出现 → CRITICAL",
    recommendation: "任何人索要助记词/私钥均为诈骗；官方客服不会主动私信要求签署交易。",
  },
  // —— 以下两个为本次数据层梳理新增，补齐 simulation-data.ts 中此前找不到
  //    对应"攻击手法定义"的两类场景（suspicious-swap / abnormal-fund-flow）。
  {
    id: "atk-suspicious-swap", name: "Suspicious Swap", nameZh: "异常兑换行为", category: "恶意 DeFi 交互",
    description: "诱导用户在仿冒 DEX 页面上完成兑换，实际兑换路径经过攻击者控制的中间合约，造成滑点异常或资产被截留。",
    attackVector: "swapExactTokens() 调用路径被替换为恶意中间合约", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "用户在仿冒 DEX 发起兑换", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "兑换路径经过未知中间合约", component: "Malicious Contract", risk: "HIGH", status: "Detected" },
      { step: 3, action: "安全引擎拦截异常兑换路径", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "兑换路径（path）包含未审计的中间合约地址 → HIGH",
    recommendation: "优先使用官方聚合器，兑换前核对实际路径与预期滑点。",
  },
  {
    id: "atk-abnormal-fund-flow", name: "Abnormal Fund Flow", nameZh: "异常资金流向", category: "资金流分析",
    description: "资产在多个中转地址间快速流转后汇聚到同一目标地址，呈现典型洗币/归集特征。",
    attackVector: "multiSend() 批量转账 + 多层中转地址", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "源钱包发起批量转账", component: "Wallet Mock", risk: "LOW", status: "Simulated" },
      { step: 2, action: "资金经多个中转地址快速流转", component: "Fund Flow Engine", risk: "HIGH", status: "Detected" },
      { step: 3, action: "多笔资金汇聚到同一目标地址", component: "Risk Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "标记目标地址并拦截后续转入", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "资金在 <5 分钟内经 ≥2 个中转地址汇聚到同一目标 → CRITICAL",
    recommendation: "对资金停留时间异常短的中转地址保持警惕，结合资产流转图核实最终去向。",
  },
  // —— 以下为 Attack Scenario Engine（src/lib/attack-scenarios）补齐的攻击链，
  //    对应 20 个标准场景目录里此前在这里找不到执行蓝图的条目。
  {
    id: "atk-fake-claim", name: "Fake Claim", nameZh: "伪造领取诈骗", category: "钓鱼诱导",
    description: "伪造代币领取页面，诱导用户在领取前先签署一笔看似\"Gas 补贴\"的授权，实际是资产授权。",
    attackVector: "伪造 Claim 页面 + 领取前置授权请求", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "用户访问伪造代币领取页面", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "点击 Claim 领取奖励代币", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "领取合约要求先行授权抵扣 Gas 补贴", component: "Approval Engine", risk: "HIGH", status: "Detected" },
      { step: 4, action: "风险引擎识别虚假领取合约并拦截", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "Claim 合约地址不在官方白名单 + 领取前附带授权请求 → HIGH",
    recommendation: "警惕任何要求先授权代币才能领取奖励的 Claim 页面，官方空投不需要预先授权。",
  },
  {
    id: "atk-fake-mint", name: "Fake Mint", nameZh: "伪造增发诈骗", category: "钓鱼诱导",
    description: "伪造代币免费增发/铸造页面，Mint 交易内嵌隐藏的资产转移调用。",
    attackVector: "伪造 Mint 页面 + 隐藏 transferFrom 调用", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "用户访问伪造代币增发页面", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "点击 Mint 免费代币", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 3, action: "Mint 交易内嵌恶意 transferFrom 调用", component: "Malicious Contract", risk: "HIGH", status: "Detected" },
      { step: 4, action: "安全引擎拦截隐藏转账调用", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "Mint 交易 calldata 中检出与铸造无关的 transferFrom 调用 → HIGH",
    recommendation: "Mint 前使用交易预执行工具核实实际调用内容，不要盲目签署陌生合约交易。",
  },
  {
    id: "atk-fake-staking", name: "Fake Staking", nameZh: "伪造质押诈骗", category: "资金盘诈骗",
    description: "伪造高收益质押页面，质押合约借存入操作要求无限额度授权，为后续提走全部资产铺路。",
    attackVector: "伪造质押页面 + 无限额度授权请求", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "用户访问伪造高收益质押页面", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "存入资产参与质押", component: "Wallet Mock", risk: "MEDIUM", status: "Simulated" },
      { step: 3, action: "质押合约请求无限额度授权", component: "Approval Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "风险引擎拦截并标记资金盘特征", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "承诺年化收益率异常 + 存入即请求 Unlimited Approval → CRITICAL",
    recommendation: "警惕远超市场水平的质押收益承诺，核实质押合约是否经过审计。",
  },
  {
    id: "atk-fake-bridge", name: "Fake Bridge", nameZh: "伪造跨链桥诈骗", category: "钓鱼诱导",
    description: "伪造跨链桥页面，用户存入资产等待跨链到账，实际目标链合约从未部署，资产被直接转入攻击者地址。",
    attackVector: "伪造跨链桥页面 + 目标链合约缺失", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "用户访问仿冒跨链桥页面", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 2, action: "存入资产等待跨链到账", component: "Wallet Mock", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "目标链合约从未部署，资产被转入攻击者地址", component: "Malicious Contract", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "安全引擎标记桥接合约异常并拦截后续存入", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "目标链上找不到对应的桥接合约部署记录 → CRITICAL",
    recommendation: "只使用官方公布的跨链桥入口，跨链前核实两端合约地址均已验证。",
  },
  {
    id: "atk-fake-presale", name: "Fake Presale", nameZh: "伪造预售诈骗", category: "钓鱼诱导",
    description: "发布虚假代币预售页面，募集资金后无锁仓/无法赎回，预售合约存在单方面控制权限。",
    attackVector: "伪造预售页面 + 无锁仓机制", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "攻击者发布虚假代币预售页面", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "用户参与预售并转入资金", component: "Wallet Mock", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "预售合约无锁仓机制、无法赎回", component: "Risk Engine", risk: "HIGH", status: "Detected" },
      { step: 4, action: "标记为高风险预售并告警", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "预售合约缺少锁仓/退款函数 + 团队地址匿名 → HIGH",
    recommendation: "参与预售前核实代币合约是否包含锁仓与退款机制，核实团队背景。",
  },
  {
    id: "atk-fake-giveaway", name: "Fake Giveaway", nameZh: "伪造赠送诈骗", category: "社会工程",
    description: "社交媒体发布'充值 1 份返 2 份'赠送活动，诱导用户主动转账到攻击者地址。",
    attackVector: "社交媒体虚假赠送活动 + 主动转账诱导", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "社交媒体出现\"充值返赠\"活动", component: "Social Channel", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "用户按提示转账参与赠送", component: "Wallet Mock", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "收款地址被标记为已知诈骗地址", component: "Risk Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "拦截后续转账并告警", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "收款地址命中已知诈骗地址库 + \"充值返赠\"话术特征 → CRITICAL",
    recommendation: "任何要求先转账才能获得赠送/返利的活动均为诈骗，天上不会掉馅饼。",
  },
  {
    id: "atk-malicious-approval", name: "Malicious Approval", nameZh: "恶意授权诱导", category: "恶意授权",
    description: "DApp 弹出的授权确认框仅展示部分额度信息，实际请求的授权额度远超 UI 展示值。",
    attackVector: "授权 UI 展示与实际 calldata 不一致", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "DApp 弹出授权请求，UI 展示额度偏小", component: "Fake DApp", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "钱包确认框仅显示部分额度信息", component: "Wallet Mock", risk: "MEDIUM", status: "Simulated" },
      { step: 3, action: "实际授权额度远超 UI 展示值", component: "Approval Engine", risk: "HIGH", status: "Detected" },
      { step: 4, action: "风险引擎拦截并提示额度不一致", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "calldata 中的 amount 与前端展示值不一致 → HIGH",
    recommendation: "签署授权前核对钱包弹窗里的实际额度字段，而不是只看 DApp 页面上的文案。",
  },
  {
    id: "atk-fake-revoke", name: "Fake Revoke", nameZh: "伪造撤销授权诈骗", category: "恶意授权",
    description: "冒充安全提示诱导用户使用仿冒 Revoke 工具，'撤销'按钮实际发起一笔新的无限额度授权。",
    attackVector: "仿冒 Revoke 工具 + 伪装成撤销的新授权", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "用户收到\"检测到风险授权，请立即撤销\"提示", component: "Social Channel", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "跳转到仿冒 Revoke 工具页面", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "\"撤销\"按钮实际发起新的 Unlimited Approval", component: "Approval Engine", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "安全引擎拦截伪装成撤销的新授权请求", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "标榜为\"撤销\"的交易实际 calldata 是 approve() 而非 approve(spender, 0) → CRITICAL",
    recommendation: "只在官方 Revoke 工具或区块浏览器上撤销授权，撤销交易前核对 calldata 是否为清零操作。",
  },
  {
    id: "atk-suspicious-dapp", name: "Suspicious DApp", nameZh: "可疑 DApp 交互", category: "可疑合约",
    description: "用户访问一个新上线、无历史交互记录、域名注册时间极短的 DApp 并尝试连接钱包。",
    attackVector: "新注册域名 + 无历史交互记录", riskLevel: "MEDIUM",
    chain: [
      { step: 1, action: "用户访问一个新上线、无历史记录的 DApp", component: "Fake DApp", risk: "LOW", status: "Simulated" },
      { step: 2, action: "该 DApp 域名注册时间少于 7 天", component: "Risk Engine", risk: "MEDIUM", status: "Detected" },
      { step: 3, action: "标记为可疑 DApp 并提示用户谨慎交互", component: "Risk Engine", risk: "MEDIUM", status: "Blocked" },
    ],
    detectionLogic: "域名注册时间 < 7 天 + 链上无历史交互记录 → MEDIUM",
    recommendation: "对新上线、缺乏历史交互记录的 DApp 保持警惕，优先小额测试。",
  },
  {
    id: "atk-suspicious-contract", name: "Suspicious Contract", nameZh: "可疑合约交互", category: "可疑合约",
    description: "用户与一个未经审计的合约交互，其字节码与已知恶意合约模板高度相似。",
    attackVector: "未经审计合约 + 恶意字节码模板复用", riskLevel: "HIGH",
    chain: [
      { step: 1, action: "用户与一个未经审计的合约交互", component: "Wallet Mock", risk: "LOW", status: "Simulated" },
      { step: 2, action: "合约字节码与已知恶意合约模板高度相似", component: "Malicious Contract", risk: "HIGH", status: "Detected" },
      { step: 3, action: "拦截并提示该合约存在已知恶意特征", component: "Risk Engine", risk: "HIGH", status: "Blocked" },
    ],
    detectionLogic: "合约字节码与恶意合约特征库相似度 > 90% → HIGH",
    recommendation: "交互前查验合约是否已开源验证、是否经过审计，避免与字节码不透明的合约交互。",
  },
  {
    id: "atk-fake-token-migration", name: "Fake Token Migration", nameZh: "伪造代币迁移诈骗", category: "钓鱼诱导",
    description: "冒充项目方发布'旧代币需迁移至新合约'公告，仿冒迁移页面收取旧代币授权后不发放新代币。",
    attackVector: "伪造迁移公告 + 仿冒迁移页面", riskLevel: "CRITICAL",
    chain: [
      { step: 1, action: "攻击者发布\"旧代币需迁移至新合约\"公告", component: "Social Channel", risk: "MEDIUM", status: "Simulated" },
      { step: 2, action: "用户访问仿冒迁移页面并提交旧代币授权", component: "Fake DApp", risk: "HIGH", status: "Simulated" },
      { step: 3, action: "迁移合约收取旧代币后不发放新代币", component: "Malicious Contract", risk: "CRITICAL", status: "Detected" },
      { step: 4, action: "安全引擎拦截该笔迁移授权", component: "Risk Engine", risk: "CRITICAL", status: "Blocked" },
    ],
    detectionLogic: "迁移合约地址与项目方官方公告地址不一致 → CRITICAL",
    recommendation: "代币迁移前通过项目方官网/官方多签公告核实新合约地址，警惕仅在社交媒体发布的迁移通知。",
  },
];

export function getAttackScenarioById(id: string): AttackScenario | undefined {
  return attackScenarios.find((s) => s.id === id);
}
