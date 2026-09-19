export type NormalizedTokenChange = {
  mint: string;
  owner: string | null;
  amount: number;
  decimals: number;
  direction: 'in' | 'out' | 'neutral';
};

export type NormalizedTransaction = {
  signature: string;
  timestamp: number | null;
  status: 'success' | 'failed';
  type: 'transfer' | 'swap' | 'token_transfer' | 'unknown';
  protocol: string | null;
  feeSol: number;
  solChange: number;
  tokenChanges: NormalizedTokenChange[];
  source: string | null;
  destination: string | null;
};

export type WalletToken = {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  priceUsd: number | null;
};

export type WalletData = {
  address: string;
  balanceSol: number;
  tokens: WalletToken[];
  transactions: NormalizedTransaction[];
  fetchedAt: number;
};