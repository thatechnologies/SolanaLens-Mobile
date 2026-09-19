import {
  Connection,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
  SystemProgram,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type {
  NormalizedTokenChange,
  NormalizedTransaction,
  WalletData,
  WalletToken,
} from '@/types/transaction';

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL ??
  'https://api.mainnet-beta.solana.com';

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

function getAccountAddress(account: unknown): string | null {
  if (typeof account === 'string') return account;
  if (account instanceof PublicKey) return account.toBase58();
  if (account && typeof account === 'object' && 'pubkey' in account) {
    const pubkey = (account as { pubkey: unknown }).pubkey;
    return pubkey instanceof PublicKey ? pubkey.toBase58() : String(pubkey);
  }
  return null;
}

function getProgramName(instruction: ParsedInstruction | { programId?: PublicKey }) {
  if ('program' in instruction && instruction.program) {
    return instruction.program;
  }
  if ('programId' in instruction && instruction.programId) {
    return instruction.programId.toBase58();
  }
  return null;
}

function getTransferEndpoints(
  raw: ParsedTransactionWithMeta,
  owner: string,
): { source: string | null; destination: string | null } {
  const instructions = raw.transaction.message.instructions;
  for (const instruction of instructions) {
    if (!('parsed' in instruction) || !instruction.parsed) continue;
    const parsed = instruction.parsed as {
      type?: string;
      info?: { source?: string; destination?: string };
    };
    if (parsed.type === 'transfer' && parsed.info) {
      const source = parsed.info.source ?? null;
      const destination = parsed.info.destination ?? null;
      if (source === owner || destination === owner) {
        return { source, destination };
      }
    }
  }
  return { source: null, destination: null };
}

function normalizeTokenChanges(
  raw: ParsedTransactionWithMeta,
  owner: string,
): NormalizedTokenChange[] {
  const meta = raw.meta;
  if (!meta) return [];

  const changes = new Map<string, { mint: string; owner: string | null; before: number; after: number; decimals: number }>();
  const addBalances = (
    balances:
      | readonly {
          accountIndex: number;
          mint: string;
          owner?: string;
          uiTokenAmount: { uiAmount: number | null; uiAmountString?: string; decimals: number };
        }[]
      | null
      | undefined,
    field: 'before' | 'after',
  ) => {
    balances?.forEach((balance) => {
      if (balance.owner && balance.owner !== owner) return;
      const key = `${balance.accountIndex}:${balance.mint}`;
      const entry = changes.get(key) ?? {
        mint: balance.mint,
        owner: balance.owner ?? null,
        before: 0,
        after: 0,
        decimals: balance.uiTokenAmount.decimals,
      };
      entry[field] = Number(
        balance.uiTokenAmount.uiAmountString ??
          balance.uiTokenAmount.uiAmount ??
          0,
      );
      changes.set(key, entry);
    });
  };

  addBalances(meta.preTokenBalances ?? [], 'before');
  addBalances(meta.postTokenBalances ?? [], 'after');

  return Array.from(changes.values())
    .map((change) => {
      const amount = change.after - change.before;
      return {
        mint: change.mint,
        owner: change.owner,
        amount: Math.abs(amount),
        decimals: change.decimals,
        direction: amount > 0 ? 'in' : amount < 0 ? 'out' : 'neutral',
      } satisfies NormalizedTokenChange;
    })
    .filter((change) => change.direction !== 'neutral');
}

export function normalizeTransaction(
  signature: string,
  raw: ParsedTransactionWithMeta | null,
  owner: string,
  blockTime: number | null,
): NormalizedTransaction {
  if (!raw?.meta) {
    return {
      signature,
      timestamp: blockTime,
      status: 'failed',
      type: 'unknown',
      protocol: null,
      feeSol: 0,
      solChange: 0,
      tokenChanges: [],
      source: null,
      destination: null,
    };
  }

  const accountKeys = raw.transaction.message.accountKeys.map(getAccountAddress);
  const ownerIndex = accountKeys.findIndex((account) => account === owner);
  const solChange =
    ownerIndex >= 0
      ? ((raw.meta.postBalances[ownerIndex] ?? 0) -
          (raw.meta.preBalances[ownerIndex] ?? 0)) /
        LAMPORTS_PER_SOL
      : 0;
  const tokenChanges = normalizeTokenChanges(raw, owner);
  const endpoints = getTransferEndpoints(raw, owner);
  const programs = raw.transaction.message.instructions
    .map(getProgramName)
    .filter(Boolean);
  const protocol =
    programs.find((program) => program !== 'system' && program !== SystemProgram.programId.toBase58()) ??
    null;
  const hasTokenTransfer = tokenChanges.length > 0;
  const hasSolTransfer =
    endpoints.source !== null ||
    endpoints.destination !== null ||
    Math.abs(solChange) > 0;

  return {
    signature,
    timestamp: blockTime,
    status: raw.meta.err ? 'failed' : 'success',
    type: hasTokenTransfer ? 'token_transfer' : hasSolTransfer ? 'transfer' : 'unknown',
    protocol,
    feeSol: (raw.meta.fee ?? 0) / LAMPORTS_PER_SOL,
    solChange,
    tokenChanges,
    source: endpoints.source,
    destination: endpoints.destination,
  };
}

async function getTokenPriceMap(mints: string[]): Promise<Map<string, number>> {
  const uniqueMints = Array.from(new Set(mints.filter(Boolean)));
  if (!uniqueMints.length) return new Map();
  try {
    const response = await fetch(
      `https://lite-api.jup.ag/price/v2?ids=${encodeURIComponent(uniqueMints.join(','))}`,
    );
    if (!response.ok) return new Map();
    const payload = (await response.json()) as {
      data?: Record<string, { price?: string }>;
    };
    return new Map(
      Object.entries(payload.data ?? {}).flatMap(([mint, value]) =>
        value.price ? [[mint, Number(value.price)] as const] : [],
      ),
    );
  } catch {
    return new Map();
  }
}

async function getTokenAccounts(owner: PublicKey): Promise<WalletToken[]> {
  const [classic, token2022] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
  ]);
  const accounts = [...classic.value, ...token2022.value];
  const grouped = new Map<string, WalletToken>();

  accounts.forEach(({ account }) => {
    const data = account.data as ParsedAccountData;
    const info = data.parsed?.info as {
      mint?: string;
      tokenAmount?: { uiAmount?: number | null; decimals: number };
    };
    if (!info.mint || !info.tokenAmount) return;
    const amount = info.tokenAmount.uiAmount ?? 0;
    if (amount === 0) return;
    const existing = grouped.get(info.mint);
    grouped.set(info.mint, {
      mint: info.mint,
      symbol: existing?.symbol ?? `${info.mint.slice(0, 4)}…`,
      name: existing?.name ?? 'SPL token',
      amount: (existing?.amount ?? 0) + amount,
      decimals: info.tokenAmount.decimals,
      priceUsd: null,
    });
  });

  const tokens = Array.from(grouped.values());
  const prices = await getTokenPriceMap(tokens.map((token) => token.mint));
  return tokens.map((token) => ({ ...token, priceUsd: prices.get(token.mint) ?? null }));
}

export async function getWalletData(address: string, limit = 25): Promise<WalletData> {
  const owner = new PublicKey(address);
  const [balance, tokenAccounts, signatures, prices] = await Promise.all([
    connection.getBalance(owner, 'confirmed'),
    getTokenAccounts(owner),
    connection.getSignaturesForAddress(owner, { limit }, 'confirmed'),
    getTokenPriceMap([SOL_MINT]),
  ]);

  const transactions = await Promise.all(
    signatures.map(async (signatureInfo) => {
      const raw = await connection.getParsedTransaction(signatureInfo.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      return normalizeTransaction(
        signatureInfo.signature,
        raw,
        address,
        signatureInfo.blockTime ?? null,
      );
    }),
  );

  return {
    address,
    balanceSol: balance / LAMPORTS_PER_SOL,
    tokens: [
      {
        mint: SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        amount: balance / LAMPORTS_PER_SOL,
        decimals: 9,
        priceUsd: prices.get(SOL_MINT) ?? null,
      },
      ...tokenAccounts,
    ],
    transactions,
    fetchedAt: Date.now(),
  };
}