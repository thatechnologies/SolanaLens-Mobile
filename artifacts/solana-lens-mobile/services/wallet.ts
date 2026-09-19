import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export type WalletSession = {
  address: string;
  authToken: string;
};

let activeSession: WalletSession | null = null;

function decodeWalletAddress(address: string): string {
  try {
    return new PublicKey(Buffer.from(address, 'base64')).toBase58();
  } catch {
    throw new Error('The connected wallet returned an invalid public address.');
  }
}

export async function connectWallet(): Promise<WalletSession> {
  if (Platform.OS !== 'android') {
    throw new Error(
      'Wallet connection is available on Android development builds with a compatible Solana wallet.',
    );
  }

  const authorization = await transact(async (wallet) =>
    wallet.authorize({
      cluster: 'mainnet-beta',
      identity: {
        name: 'SolanaLens',
      },
    }),
  );

  const account = authorization.accounts[0];
  if (!account) {
    throw new Error('The wallet did not return a public account.');
  }

  const session = {
    address: decodeWalletAddress(account.address),
    authToken: authorization.auth_token,
  };
  activeSession = session;
  return session;
}

export async function disconnectWallet(): Promise<void> {
  const session = activeSession;
  activeSession = null;
  if (!session || Platform.OS !== 'android') return;

  try {
    await transact(async (wallet) => {
      await wallet.deauthorize({ auth_token: session.authToken });
    });
  } catch {
    // Local session state is cleared even when the wallet app is unavailable.
  }
}

export function getActiveWalletSession(): WalletSession | null {
  return activeSession;
}