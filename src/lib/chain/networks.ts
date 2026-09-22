// 链上只读配置：仅用于读取公开数据（余额、代币、NFT、授权记录）。
// 这里不包含任何私钥、助记词，也不存在任何可以发起交易或授权的能力。

export interface TokenMeta {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface ChainConfig {
  key: ChainKey;
  label: string;
  chainId: number;
  rpcUrls: string[];
  nativeSymbol: string;
  nativeDecimals: number;
  explorer: string;
  /** 用于读取余额的公开代币合约清单（真实主网地址）。 */
  tokens: TokenMeta[];
  /** 日志扫描窗口（区块数），用于读取近期授权与 NFT 转入记录。 */
  logWindow: number;
}

export const CHAIN_KEYS = ["ethereum", "bsc", "polygon", "arbitrum"] as const;
export type ChainKey = (typeof CHAIN_KEYS)[number];

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: "ethereum",
    label: "Ethereum",
    chainId: 1,
    rpcUrls: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    explorer: "https://etherscan.io",
    logWindow: 250_000,
    tokens: [
      { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
      { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
      { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
      { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
      { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
      { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", name: "Chainlink", decimals: 18 },
      { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI", name: "Uniswap", decimals: 18 },
      { address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", symbol: "SHIB", name: "Shiba Inu", decimals: 18 },
    ],
  },
  bsc: {
    key: "bsc",
    label: "BNB Chain",
    chainId: 56,
    rpcUrls: ["https://bsc-rpc.publicnode.com", "https://binance.llamarpc.com", "https://bsc-dataseed.binance.org"],
    nativeSymbol: "BNB",
    nativeDecimals: 18,
    explorer: "https://bscscan.com",
    logWindow: 150_000,
    tokens: [
      { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Binance-Peg USDT", decimals: 18 },
      { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", name: "Binance-Peg USDC", decimals: 18 },
      { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD", name: "Binance USD", decimals: 18 },
      { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", name: "Wrapped BNB", decimals: 18 },
      { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", symbol: "CAKE", name: "PancakeSwap", decimals: 18 },
      { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH", name: "Binance-Peg ETH", decimals: 18 },
    ],
  },
  polygon: {
    key: "polygon",
    label: "Polygon",
    chainId: 137,
    rpcUrls: ["https://polygon-bor-rpc.publicnode.com", "https://polygon.llamarpc.com", "https://polygon-rpc.com"],
    nativeSymbol: "POL",
    nativeDecimals: 18,
    explorer: "https://polygonscan.com",
    logWindow: 150_000,
    tokens: [
      { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", name: "USD Coin", decimals: 6 },
      { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC.e", name: "USD Coin (Bridged)", decimals: 6 },
      { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", name: "Tether USD", decimals: 6 },
      { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
      { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
      { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", symbol: "WPOL", name: "Wrapped POL", decimals: 18 },
      { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
    ],
  },
  arbitrum: {
    key: "arbitrum",
    label: "Arbitrum",
    chainId: 42161,
    rpcUrls: ["https://arbitrum-one-rpc.publicnode.com", "https://arbitrum.llamarpc.com", "https://arb1.arbitrum.io/rpc"],
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    explorer: "https://arbiscan.io",
    logWindow: 400_000,
    tokens: [
      { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", name: "USD Coin", decimals: 6 },
      { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", name: "Tether USD", decimals: 6 },
      { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
      { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
      { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB", name: "Arbitrum", decimals: 18 },
      { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
    ],
  },
};

export const CHAIN_LIST = CHAIN_KEYS.map((k) => CHAINS[k]);

export function chainById(chainId: number): ChainConfig | undefined {
  return CHAIN_LIST.find((c) => c.chainId === chainId);
}

export function isEvmAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function shortAddress(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

/** 链上读取结果类型（供前端复用）。 */
export interface OnchainToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: string;
}

export interface OnchainNft {
  contract: string;
  tokenId: string;
}

export interface OnchainApproval {
  token: string;
  symbol: string;
  spender: string;
  amount: string;
  unlimited: boolean;
  kind: "ERC20" | "ERC721-ALL";
}

export interface OnchainWalletData {
  address: string;
  chainKey: ChainKey;
  chainLabel: string;
  nativeSymbol: string;
  nativeBalance: string;
  blockNumber: number;
  readAt: number;
  tokens: OnchainToken[];
  nfts: OnchainNft[];
  approvals: OnchainApproval[];
  notes: string[];
}
