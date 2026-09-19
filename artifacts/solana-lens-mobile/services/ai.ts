import type { NormalizedTransaction, WalletData } from '@/types/transaction';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function askWalletAssistant(
  question: string,
  wallet: WalletData,
): Promise<string> {
  if (!apiUrl) {
    throw new Error(
      'The AI service is not configured for this build. Set EXPO_PUBLIC_API_URL to the API server URL.',
    );
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      wallet: {
        address: wallet.address,
        balanceSol: wallet.balanceSol,
        tokens: wallet.tokens,
        transactions: wallet.transactions,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { answer?: string; error?: string }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? 'The wallet assistant is unavailable.');
  }
  if (!payload?.answer) {
    throw new Error('The wallet assistant returned an empty response.');
  }
  return payload.answer;
}

export function explainTransactionLocally(
  transaction: NormalizedTransaction,
): string {
  if (transaction.type === 'unknown') {
    return 'This transaction could not be confidently classified from the available on-chain data.';
  }
  if (transaction.status === 'failed') {
    return 'This transaction failed on-chain. The network fee shown below may still have been charged.';
  }
  if (transaction.type === 'transfer') {
    return transaction.solChange > 0
      ? `This wallet received ${transaction.solChange.toFixed(6)} SOL.`
      : `This wallet sent ${Math.abs(transaction.solChange).toFixed(6)} SOL.`;
  }
  if (transaction.type === 'token_transfer') {
    const changes = transaction.tokenChanges
      .map(
        (change) =>
          `${change.direction === 'in' ? 'received' : 'sent'} ${change.amount} of mint ${change.mint.slice(0, 8)}…`,
      )
      .join(' and ');
    return `On-chain token movement detected: ${changes}.`;
  }
  return 'This transaction was confirmed, but the available data is not sufficient to explain it confidently.';
}