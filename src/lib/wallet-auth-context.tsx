"use client";
// ---------------------------------------------------------------------------
// 钱包认证上下文 — 仅演示，或钱包 API
// ---------------------------------------------------------------------------
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type WalletType = "metamask" | "walletconnect" | "coinbase" | "trust";

export interface WalletSession {
  walletType: WalletType;
  address: string;
  networkName: string;
  balance: string;
  connectedAt: Date;
}

interface WalletAuthContextType {
  session: WalletSession | null;
  isConnecting: boolean;
  connectingWallet: WalletType | null;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
}

/** 钱包地址映射表 */
const MOCK_ADDRESSES: Record<WalletType, string> = {
  metamask:      "0xA2F1...821A",
  walletconnect: "0xB8E3...5F3C",
  coinbase:      "0xC9D4...7E2B",
  trust:         "0xD1F5...3A9C",
};

const MOCK_BALANCES: Record<WalletType, string> = {
  metamask:      "2.4817 ETH",
  walletconnect: "0.9203 ETH",
  coinbase:      "5.1042 ETH",
  trust:         "1.3389 ETH",
};

const WalletAuthContext = createContext<WalletAuthContextType | null>(null);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]                   = useState<WalletSession | null>(null);
  const [isConnecting, setIsConnecting]         = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null);
  const [modalOpen, setModalOpen]               = useState(false);

  const openModal  = useCallback(() => setModalOpen(true),  []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    setConnectingWallet(walletType);

    // 模拟握手延迟（1.6 秒）
    await new Promise<void>((resolve) => setTimeout(resolve, 1600));

    setSession({
      walletType,
      address:     MOCK_ADDRESSES[walletType],
      networkName: "Ethereum Mainnet",
      balance:     MOCK_BALANCES[walletType],
      connectedAt: new Date(),
    });
    setIsConnecting(false);
    setConnectingWallet(null);
    setModalOpen(false);
  }, []);

  const disconnect = useCallback(() => setSession(null), []);

  return (
    <WalletAuthContext.Provider
      value={{ session, isConnecting, connectingWallet, modalOpen, openModal, closeModal, connect, disconnect }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  const ctx = useContext(WalletAuthContext);
  if (!ctx) throw new Error("useWalletAuth must be used within <WalletAuthProvider>");
  return ctx;
}
