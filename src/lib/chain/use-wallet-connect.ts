"use client";

import { useCallback, useEffect, useState } from "react";
import { chainById, type ChainKey } from "@/lib/chain/networks";

// 只读连接：仅请求钱包公开地址与当前链 ID。
// 不请求签名权限、不发起交易、不发起授权，也无法读取私钥或助记词。

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

function getProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const injected = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return injected ?? null;
}

export interface WalletConnectState {
  available: boolean;
  connecting: boolean;
  account: string | null;
  chainKey: ChainKey | null;
  chainId: number | null;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
}

export function useWalletConnect(): WalletConnectState {
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(getProvider() !== null);
  }, []);

  useEffect(() => {
    const provider = getProvider();
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const list = args[0];
      setAccount(Array.isArray(list) && typeof list[0] === "string" ? (list[0] as string) : null);
    };
    const onChain = (...args: unknown[]) => {
      const value = args[0];
      setChainId(typeof value === "string" ? Number(BigInt(value)) : null);
    };
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError("未检测到浏览器钱包扩展，可直接粘贴地址进行只读查询。");
      return null;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as unknown;
      const first = Array.isArray(accounts) && typeof accounts[0] === "string" ? (accounts[0] as string) : null;
      setAccount(first);
      try {
        const id = (await provider.request({ method: "eth_chainId" })) as unknown;
        setChainId(typeof id === "string" ? Number(BigInt(id)) : null);
      } catch {
        setChainId(null);
      }
      return first;
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接钱包失败");
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  return {
    available,
    connecting,
    account,
    chainKey: chainId ? (chainById(chainId)?.key ?? null) : null,
    chainId,
    error,
    connect,
    disconnect,
  };
}
