import { createServerFn } from "@tanstack/react-start";
import {
  CHAINS,
  CHAIN_KEYS,
  isEvmAddress,
  type ChainConfig,
  type ChainKey,
  type OnchainApproval,
  type OnchainNft,
  type OnchainToken,
  type OnchainWalletData,
} from "@/lib/chain/networks";

// 只读链上访问层：只调用 eth_getBalance / eth_call(view) / eth_getLogs / eth_blockNumber。
// 不签名、不广播交易、不发起授权，也不接触任何私钥或助记词。

const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const APPROVAL_FOR_ALL_TOPIC = "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const SEL_BALANCE_OF = "0x70a08231";
const SEL_ALLOWANCE = "0xdd62ed3e";
const SEL_OWNER_OF = "0x6352211e";

const MAX_UINT = (1n << 256n) - 1n;
const UNLIMITED_FLOOR = MAX_UINT / 2n;

interface RpcCall {
  method: string;
  params: unknown[];
}

function pad32(hexNoPrefix: string): string {
  return hexNoPrefix.toLowerCase().padStart(64, "0");
}

function addrTopic(address: string): string {
  return `0x${pad32(address.replace(/^0x/, ""))}`;
}

function toHex(n: number): string {
  return `0x${n.toString(16)}`;
}

function hexToBigInt(value: unknown): bigint {
  if (typeof value !== "string" || !value.startsWith("0x") || value.length < 3) return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function formatUnits(raw: bigint, decimals: number, maxFraction = 6): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  if (frac === 0n) return whole.toString();
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFraction).replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

async function rpcBatch(chain: ChainConfig, calls: RpcCall[]): Promise<unknown[]> {
  if (calls.length === 0) return [];
  const payload = calls.map((c, i) => ({ jsonrpc: "2.0", id: i + 1, method: c.method, params: c.params }));
  let lastError: unknown = null;
  for (const url of chain.rpcUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        lastError = new Error(`RPC ${url} 返回 ${res.status}`);
        continue;
      }
      const json = (await res.json()) as unknown;
      const list = Array.isArray(json) ? json : [json];
      const out: unknown[] = new Array(calls.length).fill(null);
      for (const item of list as Array<{ id?: number; result?: unknown }>) {
        const idx = typeof item.id === "number" ? item.id - 1 : 0;
        out[idx] = item.result ?? null;
      }
      return out;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("所有公共节点均不可用");
}

async function rpcSingle(chain: ChainConfig, call: RpcCall): Promise<unknown> {
  const [result] = await rpcBatch(chain, [call]);
  return result;
}

interface LogEntry {
  address: string;
  topics: string[];
  data: string;
}

function asLogs(value: unknown): LogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (l): l is LogEntry =>
      !!l && typeof l === "object" && Array.isArray((l as LogEntry).topics) && typeof (l as LogEntry).address === "string"
  );
}

function topicToAddress(topic: string | undefined): string {
  if (!topic) return "0x";
  return `0x${topic.slice(-40)}`;
}

export const readOnchainWallet = createServerFn({ method: "POST" })
  .inputValidator((input: { address: string; chainKey: string }) => {
    const address = String(input?.address ?? "").trim();
    const chainKey = String(input?.chainKey ?? "");
    if (!isEvmAddress(address)) throw new Error("请输入合法的 EVM 地址（0x + 40 位十六进制）");
    if (!(CHAIN_KEYS as readonly string[]).includes(chainKey)) throw new Error("不支持的链");
    return { address: address.toLowerCase(), chainKey: chainKey as ChainKey };
  })
  .handler(async ({ data }): Promise<OnchainWalletData> => {
    const chain = CHAINS[data.chainKey];
    const owner = data.address;
    const notes: string[] = [];

    // 1) 区块高度 + 原生余额 + 代币余额（全部为 view 读取）
    const calls: RpcCall[] = [
      { method: "eth_blockNumber", params: [] },
      { method: "eth_getBalance", params: [owner, "latest"] },
      ...chain.tokens.map((t) => ({
        method: "eth_call",
        params: [{ to: t.address, data: `${SEL_BALANCE_OF}${pad32(owner.replace(/^0x/, ""))}` }, "latest"],
      })),
    ];
    const base = await rpcBatch(chain, calls);
    const blockNumber = Number(hexToBigInt(base[0]));
    const nativeBalance = formatUnits(hexToBigInt(base[1]), chain.nativeDecimals);

    const tokens: OnchainToken[] = [];
    chain.tokens.forEach((t, i) => {
      const raw = hexToBigInt(base[2 + i]);
      if (raw > 0n) {
        tokens.push({
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          amount: formatUnits(raw, t.decimals),
        });
      }
    });

    const fromBlock = toHex(Math.max(0, blockNumber - chain.logWindow));
    const ownerTopic = addrTopic(owner);
    const approvals: OnchainApproval[] = [];
    const nfts: OnchainNft[] = [];

    // 2) ERC-20 真实授权记录（Approval 事件 → 再读当前 allowance）
    try {
      const logs = asLogs(
        await rpcSingle(chain, {
          method: "eth_getLogs",
          params: [
            {
              fromBlock,
              toBlock: "latest",
              address: chain.tokens.map((t) => t.address),
              topics: [APPROVAL_TOPIC, ownerTopic],
            },
          ],
        })
      );
      const pairs = new Map<string, { token: string; spender: string }>();
      for (const log of logs) {
        const spender = topicToAddress(log.topics[2]);
        if (spender.length !== 42) continue;
        const key = `${log.address.toLowerCase()}:${spender.toLowerCase()}`;
        if (!pairs.has(key)) pairs.set(key, { token: log.address.toLowerCase(), spender });
        if (pairs.size >= 40) break;
      }
      const pairList = [...pairs.values()];
      if (pairList.length > 0) {
        const results = await rpcBatch(
          chain,
          pairList.map((p) => ({
            method: "eth_call",
            params: [
              {
                to: p.token,
                data: `${SEL_ALLOWANCE}${pad32(owner.replace(/^0x/, ""))}${pad32(p.spender.replace(/^0x/, ""))}`,
              },
              "latest",
            ],
          }))
        );
        pairList.forEach((p, i) => {
          const raw = hexToBigInt(results[i]);
          if (raw === 0n) return;
          const meta = chain.tokens.find((t) => t.address.toLowerCase() === p.token);
          approvals.push({
            token: p.token,
            symbol: meta?.symbol ?? "ERC20",
            spender: p.spender,
            amount: raw >= UNLIMITED_FLOOR ? "Unlimited" : formatUnits(raw, meta?.decimals ?? 18),
            unlimited: raw >= UNLIMITED_FLOOR,
            kind: "ERC20",
          });
        });
      }
    } catch {
      notes.push("公共节点未返回 ERC-20 授权日志，授权列表可能不完整。");
    }

    // 3) NFT 全量授权（setApprovalForAll）
    try {
      const logs = asLogs(
        await rpcSingle(chain, {
          method: "eth_getLogs",
          params: [{ fromBlock, toBlock: "latest", topics: [APPROVAL_FOR_ALL_TOPIC, ownerTopic] }],
        })
      );
      const seen = new Set<string>();
      for (const log of logs.slice(-30)) {
        const spender = topicToAddress(log.topics[2]);
        const approved = hexToBigInt(log.data) === 1n;
        const key = `${log.address.toLowerCase()}:${spender.toLowerCase()}`;
        if (seen.has(key) || !approved) continue;
        seen.add(key);
        approvals.push({
          token: log.address.toLowerCase(),
          symbol: "NFT 系列",
          spender,
          amount: "全部 NFT",
          unlimited: true,
          kind: "ERC721-ALL",
        });
      }
    } catch {
      notes.push("公共节点未返回 NFT 全量授权日志。");
    }

    // 4) NFT 持仓：扫描转入本地址的 ERC-721 Transfer，再用 ownerOf 校验当前归属
    try {
      const logs = asLogs(
        await rpcSingle(chain, {
          method: "eth_getLogs",
          params: [{ fromBlock, toBlock: "latest", topics: [TRANSFER_TOPIC, null, ownerTopic] }],
        })
      );
      const candidates = new Map<string, { contract: string; tokenId: bigint }>();
      for (const log of logs) {
        if (log.topics.length !== 4) continue; // 只保留 ERC-721（tokenId 为 indexed）
        const tokenId = hexToBigInt(log.topics[3]);
        const key = `${log.address.toLowerCase()}:${tokenId.toString()}`;
        if (!candidates.has(key)) candidates.set(key, { contract: log.address.toLowerCase(), tokenId });
        if (candidates.size >= 30) break;
      }
      const list = [...candidates.values()];
      if (list.length > 0) {
        const owners = await rpcBatch(
          chain,
          list.map((c) => ({
            method: "eth_call",
            params: [{ to: c.contract, data: `${SEL_OWNER_OF}${pad32(c.tokenId.toString(16))}` }, "latest"],
          }))
        );
        list.forEach((c, i) => {
          const current = topicToAddress(typeof owners[i] === "string" ? (owners[i] as string) : undefined);
          if (current.toLowerCase() === owner) nfts.push({ contract: c.contract, tokenId: c.tokenId.toString() });
        });
      }
    } catch {
      notes.push("公共节点未返回 NFT 转入日志，NFT 列表可能不完整。");
    }

    return {
      address: owner,
      chainKey: chain.key,
      chainLabel: chain.label,
      nativeSymbol: chain.nativeSymbol,
      nativeBalance,
      blockNumber,
      readAt: Date.now(),
      tokens,
      nfts,
      approvals,
      notes,
    };
  });
