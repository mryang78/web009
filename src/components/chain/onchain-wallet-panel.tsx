"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Wallet,
  Link2,
  RefreshCw,
  Copy,
  Coins,
  Image as ImageIcon,
  BadgeCheck,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readOnchainWallet } from "@/lib/chain.functions";
import { CHAINS, CHAIN_LIST, isEvmAddress, shortAddress, type ChainKey } from "@/lib/chain/networks";
import { useWalletConnect } from "@/lib/chain/use-wallet-connect";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** 读取成功后向外层回传当前地址，便于其它面板联动。 */
  onAddressChange?: (address: string | null) => void;
}

export function OnchainWalletPanel({ className, onAddressChange }: Props) {
  const [chainKey, setChainKey] = useState<ChainKey>("ethereum");
  const [input, setInput] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const wallet = useWalletConnect();
  const read = useServerFn(readOnchainWallet);

  const query = useQuery({
    queryKey: ["onchain-wallet", address, chainKey],
    queryFn: () => read({ data: { address: address as string, chainKey } }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    onAddressChange?.(address);
  }, [address, onAddressChange]);

  const submit = useCallback(() => {
    const value = input.trim();
    if (!isEvmAddress(value)) return;
    setAddress(value.toLowerCase());
  }, [input]);

  const connect = useCallback(async () => {
    const account = await wallet.connect();
    if (account) {
      setInput(account);
      setAddress(account.toLowerCase());
      const detected = wallet.chainKey;
      if (detected) setChainKey(detected);
    }
  }, [wallet]);

  const copy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [address]);

  const chain = CHAINS[chainKey];
  const data = query.data;
  const inputValid = isEvmAddress(input.trim());

  return (
    <div className={cn("space-y-5", className)}>
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="粘贴任意 EVM 地址 0x…"
            spellCheck={false}
            className="h-10 w-full flex-1 rounded-xl border border-border bg-card px-3 font-mono text-[13px] text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={!inputValid} className="h-10 gap-2 rounded-xl">
              <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />
              读取链上数据
            </Button>
            <Button onClick={connect} variant="outline" className="h-10 gap-2 rounded-xl" disabled={wallet.connecting}>
              <Link2 className="size-4" />
              {wallet.account ? "已连接" : "连接钱包"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CHAIN_LIST.map((c) => (
            <Button
              key={c.key}
              onClick={() => setChainKey(c.key)}
              variant={chainKey === c.key ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-4",
                chainKey !== c.key && "bg-card text-muted-foreground"
              )}
            >
              {c.label}
            </Button>
          ))}
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          <Lock className="mt-px size-3.5 shrink-0 text-primary" />
          连接仅用于读取公开地址；全部数据通过公共节点的只读接口获取，不请求签名、不发起授权、不转移任何资产。
        </p>
        {wallet.error && <p className="mt-2 text-[11.5px] text-amber-500">{wallet.error}</p>}
      </div>

      {!address ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          输入地址或连接钱包后，将从 {chain.label} 主网实时读取余额、代币、NFT 与授权记录。
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-500">
          链上读取失败：{query.error instanceof Error ? query.error.message : "公共节点暂不可用"}，请稍后重试或切换链。
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-border bg-background py-14 text-center text-sm text-muted-foreground">
          正在从 {chain.label} 读取链上数据…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              钱包地址 · {data.chainLabel} · 区块 #{data.blockNumber.toLocaleString()}
            </div>
            <div className="mt-2 flex items-start gap-2">
              <code className="break-all font-mono text-[13px] leading-relaxed text-foreground">{data.address}</code>
              <Button
                variant="outline"
                size="icon"
                onClick={copy}
                aria-label="复制地址"
                className="size-8 shrink-0 rounded-lg"
              >
                <Copy className="size-3.5" />
              </Button>
              <a
                href={`${chain.explorer}/address/${data.address}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="在区块浏览器打开"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            {copied && <div className="mt-1 text-[11px] text-primary">已复制</div>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <div className="text-[11px] text-muted-foreground">原生余额（实时）</div>
                <div className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {data.nativeBalance} {data.nativeSymbol}
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <div className="text-[11px] text-muted-foreground">持仓 / 授权</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {data.tokens.length + data.nfts.length} / {data.approvals.length}
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              数据时间：{new Date(data.readAt).toLocaleTimeString("zh-CN")}（每分钟自动刷新）
            </div>
            {data.notes.length > 0 && (
              <ul className="mt-2 space-y-1">
                {data.notes.map((n) => (
                  <li key={n} className="text-[11px] text-amber-500">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background p-5">
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <Coins className="size-3.5 text-primary" />
              代币资产（{data.tokens.length}）
            </h3>
            {data.tokens.length === 0 ? (
              <p className="mt-2 text-[12px] text-muted-foreground">该地址在本链的监控代币清单中暂无余额。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.tokens.map((t) => (
                  <li
                    key={t.address}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-foreground">{t.symbol}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.name}</div>
                    </div>
                    <div className="shrink-0 font-mono text-[12px] text-foreground">{t.amount}</div>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <ImageIcon className="size-3.5 text-primary" />
              NFT 持仓（{data.nfts.length}）
            </h3>
            {data.nfts.length === 0 ? (
              <p className="mt-2 text-[12px] text-muted-foreground">近期区块窗口内未发现该地址持有的 NFT。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.nfts.map((n) => (
                  <li
                    key={`${n.contract}-${n.tokenId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2"
                  >
                    <div className="min-w-0 font-mono text-[12px] text-foreground">{shortAddress(n.contract)}</div>
                    <div className="shrink-0 text-[11px] text-muted-foreground">#{n.tokenId}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 xl:col-span-2">
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <BadgeCheck className="size-3.5 text-primary" />
              链上授权记录（{data.approvals.length}）
            </h3>
            {data.approvals.length === 0 ? (
              <p className="mt-2 text-[12px] text-muted-foreground">
                近期区块窗口内未发现仍然有效的授权，或公共节点未返回完整日志。
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.approvals.map((a) => (
                  <li
                    key={`${a.token}-${a.spender}-${a.kind}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-border bg-muted px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                          {a.kind === "ERC20" ? "ERC-20" : "NFT 全量"}
                        </span>
                        <span className="text-[13px] font-semibold text-foreground">{a.symbol}</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        spender {shortAddress(a.spender)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
                        a.unlimited
                          ? "border-red-500/40 bg-red-500/10 text-red-500"
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      )}
                    >
                      {a.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
