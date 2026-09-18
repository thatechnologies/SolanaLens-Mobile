import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

type Screen = 'landing' | 'home' | 'activity' | 'ai' | 'portfolio' | 'settings';
type TxType = 'Swap' | 'Receive' | 'Transfer' | 'Staking' | 'NFT' | 'DeFi' | 'Fee';
type Filter = 'All' | 'Sent' | 'Received' | 'Swaps' | 'DeFi' | 'Other';

type Token = {
  sym: string;
  name: string;
  qty: number;
  price: number;
  color: string;
};

type Transaction = {
  id: string;
  date: string;
  type: TxType;
  token: string;
  amount: string;
  from?: string;
  to?: string;
  usd: number;
  direction: 'in' | 'out';
  program?: string;
  counterparty?: string;
  fee: string;
  signature: string;
};

const WALLET_ADDRESS = '7xKqL3nP9dR2vT8mZaB4cE6fH1jK5wQ92A';
const tokens: Token[] = [
  { sym: 'SOL', name: 'Solana', qty: 10, price: 124.02, color: '#8B6CFF' },
  { sym: 'USDC', name: 'USD Coin', qty: 2810.4, price: 1, color: '#3ECF8E' },
  { sym: 'JUP', name: 'Jupiter', qty: 495.53, price: 0.85, color: '#5B8CFF' },
  { sym: 'BONK', name: 'Bonk', qty: 19974857.14, price: 0.0000175, color: '#FFB84D' },
];

const transactions: Transaction[] = [
  { id: 'tx1', date: 'Sep 15 · 2:32 PM', type: 'Swap', token: 'SOL → JUP', amount: '1.42 SOL → 272.1 JUP', usd: 231.4, direction: 'out', program: 'Jupiter', fee: '0.000005 SOL', signature: '5g7K...pW2q' },
  { id: 'tx2', date: 'Sep 15 · 9:10 AM', type: 'Receive', token: 'USDC', amount: '120 USDC', usd: 120, direction: 'in', counterparty: '3xRp...4k1N', fee: '—', signature: '2mQ8...vD41' },
  { id: 'tx3', date: 'Sep 14 · 7:45 PM', type: 'Transfer', token: 'USDC', amount: '50 USDC', usd: 50, direction: 'out', counterparty: '9pQz...7f2K', fee: '0.000005 SOL', signature: '8nL2...xC90' },
  { id: 'tx4', date: 'Sep 13 · 11:02 AM', type: 'Receive', token: 'SOL', amount: '3.2 SOL', usd: 396.86, direction: 'in', counterparty: 'Coinbase withdrawal', fee: '—', signature: '4vT6...pM33' },
  { id: 'tx5', date: 'Sep 12 · 4:20 PM', type: 'Swap', token: 'USDC → JUP', amount: '200 USDC → 235.1 JUP', usd: 200, direction: 'out', program: 'Jupiter', fee: '0.000005 SOL', signature: '9wZ1...tR75' },
  { id: 'tx6', date: 'Sep 11 · 8:15 AM', type: 'Staking', token: 'SOL', amount: '5 SOL', usd: 620.1, direction: 'out', program: 'Marinade Finance', fee: '0.000005 SOL', signature: '1kD4...nB88' },
  { id: 'tx7', date: 'Sep 10 · 9:03 PM', type: 'NFT', token: 'SOL', amount: '2.1 SOL', usd: 260.44, direction: 'out', program: 'Tensor', counterparty: 'Mad Lads #4821', fee: '0.00001 SOL', signature: '6yH9...zL02' },
  { id: 'tx8', date: 'Sep 9 · 1:11 PM', type: 'Transfer', token: 'USDC', amount: '75 USDC', usd: 75, direction: 'out', counterparty: '5vWx...2mN7', fee: '0.000005 SOL', signature: '3jS7...qA61' },
  { id: 'tx9', date: 'Sep 8 · 10:44 AM', type: 'Receive', token: 'BONK', amount: '500,000 BONK', usd: 8.75, direction: 'in', counterparty: 'Airdrop', fee: '—', signature: '7rF3...bE29' },
  { id: 'tx10', date: 'Sep 7 · 5:30 PM', type: 'Swap', token: 'SOL → USDC', amount: '1.0 SOL → 124.0 USDC', usd: 124.02, direction: 'out', program: 'Jupiter', fee: '0.000005 SOL', signature: '2xN8...wY14' },
  { id: 'tx11', date: 'Sep 6 · 12:00 PM', type: 'DeFi', token: 'USDC', amount: '300 USDC', usd: 300, direction: 'out', program: 'Kamino Lend', fee: '0.00002 SOL', signature: '8cT5...rP48' },
  { id: 'tx12', date: 'Sep 5 · 9:25 AM', type: 'Receive', token: 'SOL', amount: '0.8 SOL', usd: 99.22, direction: 'in', counterparty: '7xKz...92Af', fee: '—', signature: '5mV2...kQ76' },
  { id: 'tx13', date: 'Sep 4 · 3:40 PM', type: 'Transfer', token: 'USDC', amount: '20 USDC', usd: 20, direction: 'out', counterparty: 'Binance deposit', fee: '0.000005 SOL', signature: '9dW6...hU33' },
  { id: 'tx14', date: 'Sep 3 · 8:12 PM', type: 'Swap', token: 'JUP → SOL', amount: '150 JUP → 1.03 SOL', usd: 127.5, direction: 'out', program: 'Jupiter', fee: '0.000005 SOL', signature: '1pL9...vN20' },
  { id: 'tx15', date: 'Sep 2 · 8:00 AM', type: 'Receive', token: 'USDC', amount: '60 USDC', usd: 60, direction: 'in', counterparty: 'Payment received', fee: '—', signature: '4kR1...zT85' },
  { id: 'tx16', date: 'Sep 1 · 10:15 PM', type: 'Transfer', token: 'SOL', amount: '1.5 SOL', usd: 186.03, direction: 'out', counterparty: '4mKp...11zC', fee: '0.000005 SOL', signature: '6qX4...jW57' },
];

const filters: Filter[] = ['All', 'Sent', 'Received', 'Swaps', 'DeFi', 'Other'];
const suggestions = ['What did I spend this month?', 'What did I receive this week?', 'What are my largest transactions?', 'What tokens do I hold?', 'How much have I spent on swaps?'];
const timeframeData: Record<string, number[]> = {
  '24H': [4790, 4795, 4780, 4802, 4790, 4810, 4821],
  '7D': [4715, 4740, 4690, 4770, 4760, 4800, 4821],
  '30D': [4556, 4610, 4580, 4650, 4700, 4680, 4750, 4790, 4770, 4821],
  '90D': [4210, 4340, 4290, 4480, 4520, 4460, 4610, 4700, 4650, 4750, 4790, 4821],
  '1Y': [3120, 3350, 3600, 3400, 3800, 4050, 3950, 4200, 4400, 4350, 4600, 4750, 4821],
};

const totalValue = tokens.reduce((sum, token) => sum + token.qty * token.price, 0);
const shortAddress = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;
const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compactMoney = (value: number) => (value < 0.01 ? `$${value.toFixed(4)}` : money(value));

function Icon({ name, size = 20, color = '#8B91A4' }: { name: keyof typeof Feather.glyphMap; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <LinearGradient colors={['#8B6CFF', '#3ECF8E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.logo, small && styles.logoSmall]}>
      <View style={styles.logoLine} />
      <View style={[styles.logoLine, styles.logoLineMid]} />
      <View style={[styles.logoLine, styles.logoLineBottom]} />
    </LinearGradient>
  );
}

function PrimaryButton({ label, onPress, secondary = false, icon }: { label: string; onPress: () => void; secondary?: boolean; icon?: keyof typeof Feather.glyphMap }) {
  return (
    <Pressable className={`min-h-[54px] flex-row items-center justify-center gap-2 rounded-[15px] ${secondary ? 'bg-raised border border-line' : 'bg-violet'}`} onPress={onPress} style={({ pressed }) => [styles.button, secondary ? styles.secondaryButton : styles.primaryButton, pressed && styles.pressed]}>
      {icon && <Icon name={icon} size={17} color={secondary ? '#F3F4F8' : '#FFFFFF'} />}
      <Text className="text-[15px] font-semibold text-white" style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{action && <Pressable onPress={onAction}><Text style={styles.linkText}>{action}</Text></Pressable>}</View>;
}

function TokenIcon({ token, size = 40 }: { token: Token; size?: number }) {
  return <View style={[styles.tokenIcon, { backgroundColor: token.color, width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.tokenIconText}>{token.sym.slice(0, 1)}</Text></View>;
}

function TransactionIcon({ type, colors }: { type: TxType; colors: ReturnType<typeof useColors> }) {
  const settings: Record<TxType, { icon: keyof typeof Feather.glyphMap; bg: string; fg: string }> = {
    Receive: { icon: 'arrow-down-left', bg: colors.positiveSoft, fg: colors.positive },
    Transfer: { icon: 'arrow-up-right', bg: colors.surface3, fg: colors.mutedForeground },
    Swap: { icon: 'repeat', bg: '#282340', fg: colors.tint },
    NFT: { icon: 'box', bg: '#3B2F1D', fg: '#FFB84D' },
    DeFi: { icon: 'shield', bg: '#202F48', fg: colors.accent },
    Staking: { icon: 'clock', bg: colors.positiveSoft, fg: colors.positive },
    Fee: { icon: 'minus-circle', bg: colors.surface3, fg: colors.faint },
  };
  const value = settings[type];
  return <View style={[styles.txIcon, { backgroundColor: value.bg }]}><Icon name={value.icon} size={18} color={value.fg} /></View>;
}

function TransactionRow({ tx, colors, onPress }: { tx: Transaction; colors: ReturnType<typeof useColors>; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.transactionRow, pressed && styles.rowPressed]}>
      <TransactionIcon type={tx.type} colors={colors} />
      <View style={styles.rowInfo}><Text style={styles.rowTitle}>{tx.type === 'Receive' ? 'Received' : tx.type === 'Transfer' ? 'Sent' : tx.type}</Text><Text style={styles.rowSub} numberOfLines={1}>{tx.program ?? tx.counterparty ?? tx.amount}</Text></View>
      <View style={styles.amountBlock}><Text style={[styles.rowAmount, tx.direction === 'in' && { color: colors.positive }]}>{tx.direction === 'in' ? '+' : '−'}{compactMoney(tx.usd)}</Text><Text style={styles.rowDate}>{tx.date}</Text></View>
    </Pressable>
  );
}

function Landing({ onDemo, onConnect }: { onDemo: () => void; onConnect: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.landingContent}>
        <LogoMark />
        <Text style={styles.landingTitle}>Ask your Solana wallet anything.</Text>
        <Text style={styles.landingSubtitle}>Understand your wallet, transactions and portfolio with AI-powered analysis — in plain language.</Text>
        <View style={styles.chartPreview}>
          <Svg width="100%" height="150" viewBox="0 0 380 150">
            <Defs><SvgGradient id="landingLine" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#8B6CFF" /><Stop offset="1" stopColor="#3ECF8E" /></SvgGradient></Defs>
            <Path d="M20 110 C60 110 60 60 100 60 C140 60 140 95 180 95 C220 95 220 40 260 40 C300 40 300 75 360 30" stroke="url(#landingLine)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <Circle cx="100" cy="60" r="4" fill="#8B6CFF" /><Circle cx="260" cy="40" r="4" fill="#3ECF8E" /><Circle cx="360" cy="30" r="5" fill="#5B8CFF" />
          </Svg>
        </View>
      </View>
      <View style={styles.landingActions}>
        <PrimaryButton label="Connect Solana Wallet" onPress={onConnect} icon="link" />
        <PrimaryButton label="Explore Demo" onPress={onDemo} secondary />
        <View style={styles.securityNote}><Icon name="shield" size={15} color="#565C70" /><Text style={styles.securityText}>Read-only analytics. We never ask for or store your private keys.</Text></View>
      </View>
    </View>
  );
}

function Header({ eyebrow, title, right, colors }: { eyebrow: string; title: string; right?: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.header, { paddingTop: insets.top + 14 }]}><View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.headerTitle}>{title}</Text></View>{right}</View>;
}

function WalletChip({ onPress, colors }: { onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable onPress={onPress} style={styles.walletChip}><View style={styles.walletDot} /><Text style={styles.walletChipText}>{shortAddress(WALLET_ADDRESS)}</Text><Icon name="chevron-right" size={14} color={colors.mutedForeground} /></Pressable>;
}

function Home({ colors, onNavigate, onDetail, onSettings }: { colors: ReturnType<typeof useColors>; onNavigate: (screen: Screen) => void; onDetail: (tx: Transaction) => void; onSettings: () => void }) {
  return (
    <View style={styles.screen}>
      <Header eyebrow="Welcome back" title="Dashboard" colors={colors} right={<WalletChip onPress={onSettings} colors={colors} />} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.portfolioHero}>
          <View style={styles.heroGlow} /><Text style={styles.label}>Total portfolio value</Text><Text style={styles.heroValue}>{money(totalValue)}</Text>
          <View style={styles.changePill}><Icon name="trending-up" size={13} color={colors.positive} /><Text style={styles.changeText}>5.82% this month</Text></View>
          <View style={styles.metaRow}><View><Text style={styles.metaLabel}>SOL balance</Text><Text style={styles.metaValue}>10.00 SOL</Text></View><View><Text style={styles.metaLabel}>Transactions</Text><Text style={styles.metaValue}>{transactions.length}</Text></View><View><Text style={styles.metaLabel}>7d change</Text><Text style={[styles.metaValue, { color: colors.positive }]}>+2.14%</Text></View></View>
        </View>
        <View style={styles.section}><SectionTitle title="Token holdings" action="View all" onAction={() => onNavigate('portfolio')} /><View style={styles.card}>{tokens.map((token) => <View key={token.sym} style={styles.holdingRow}><TokenIcon token={token} /><View style={styles.rowInfo}><Text style={styles.rowTitle}>{token.sym}</Text><Text style={styles.rowSub}>{token.qty.toLocaleString('en-US', { maximumFractionDigits: token.sym === 'BONK' ? 0 : 2 })} {token.sym}</Text></View><View style={styles.amountBlock}><Text style={styles.rowAmount}>{money(token.qty * token.price)}</Text><Text style={styles.rowDate}>{((token.qty * token.price) / totalValue * 100).toFixed(1)}%</Text></View></View>)}</View></View>
        <View style={styles.section}><SectionTitle title="Recent activity" action="View all" onAction={() => onNavigate('activity')} /><View style={styles.card}>{transactions.slice(0, 4).map((tx) => <TransactionRow key={tx.id} tx={tx} colors={colors} onPress={() => onDetail(tx)} />)}</View></View>
        <View style={styles.section}><PrimaryButton label="Ask the AI about this wallet" onPress={() => onNavigate('ai')} secondary icon="star" /></View>
      </ScrollView>
    </View>
  );
}

function Activity({ colors, onDetail }: { colors: ReturnType<typeof useColors>; onDetail: (tx: Transaction) => void }) {
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => transactions.filter((tx) => {
    const matches = filter === 'All' || (filter === 'Sent' && tx.direction === 'out' && ['Transfer', 'NFT'].includes(tx.type)) || (filter === 'Received' && tx.direction === 'in') || (filter === 'Swaps' && tx.type === 'Swap') || (filter === 'DeFi' && ['DeFi', 'Staking'].includes(tx.type)) || (filter === 'Other' && ['Fee', 'NFT'].includes(tx.type) && tx.direction === 'out');
    const query = search.toLowerCase();
    return matches && (!query || `${tx.token} ${tx.type} ${tx.program ?? ''} ${tx.counterparty ?? ''} ${tx.signature}`.toLowerCase().includes(query));
  }), [filter, search]);
  return <View style={styles.screen}><Header eyebrow="Transaction history" title="Activity" colors={colors} /><View style={styles.searchBox}><Icon name="search" size={17} color={colors.faint} /><TextInput value={search} onChangeText={setSearch} placeholder="Search token, program or address" placeholderTextColor={colors.faint} style={styles.searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{filters.map((item) => <Pressable key={item} onPress={() => { setFilter(item); Haptics.selectionAsync(); }} style={[styles.chip, filter === item && styles.chipActive]}><Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView><ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.card}>{filtered.length ? filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} colors={colors} onPress={() => onDetail(tx)} />) : <View style={styles.emptyState}><Icon name="search" size={34} color={colors.faint} /><Text style={styles.emptyTitle}>No transactions match</Text><Text style={styles.emptyText}>Try a different search or filter.</Text></View>}</View></ScrollView></View>;
}

function Portfolio({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [timeframe, setTimeframe] = useState('30D');
  const data = timeframeData[timeframe];
  const first = data[0];
  const last = data[data.length - 1];
  const change = ((last - first) / first) * 100;
  const sol = tokens[0].qty * tokens[0].price;
  const stable = tokens[1].qty * tokens[1].price;
  const other = totalValue - sol - stable;
  return <View style={styles.screen}><Header eyebrow="Analytics" title="Portfolio" colors={colors} /><ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.timeframeRow}>{Object.keys(timeframeData).map((item) => <Pressable key={item} onPress={() => { setTimeframe(item); Haptics.selectionAsync(); }} style={[styles.timeframe, timeframe === item && styles.chipActive]}><Text style={[styles.chipText, timeframe === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View><View style={styles.chartCard}><Text style={styles.chartValue}>{money(totalValue)}</Text><View style={styles.changePill}><Icon name={change >= 0 ? 'trending-up' : 'trending-down'} size={13} color={change >= 0 ? colors.positive : colors.negative} /><Text style={[styles.changeText, change < 0 && { color: colors.negative }]}>{Math.abs(change).toFixed(2)}%</Text></View><LineChart data={data} positive={change >= 0} colors={colors} /></View><View style={styles.section}><SectionTitle title="Allocation" /><View style={styles.card}><View style={styles.allocation}><DonutChart values={tokens.map((token) => token.qty * token.price)} colors={tokens.map((token) => token.color)} /><View style={styles.legend}>{tokens.map((token) => <View key={token.sym} style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: token.color }]} /><Text style={styles.legendText}>{token.sym}</Text><Text style={styles.legendPct}>{((token.qty * token.price) / totalValue * 100).toFixed(1)}%</Text></View>)}</View></View></View></View><View style={styles.section}><SectionTitle title="Breakdown" /><View style={styles.card}>{[['SOL', sol], ['Stablecoins (USDC)', stable], ['Other tokens', other]].map(([label, value]) => <View key={label as string} style={styles.breakdownRow}><Text style={styles.breakdownLabel}>{label as string}</Text><Text style={styles.breakdownValue}>{((value as number) / totalValue * 100).toFixed(1)}%</Text></View>)}</View></View></ScrollView></View>;
}

function LineChart({ data, positive, colors }: { data: number[]; positive: boolean; colors: ReturnType<typeof useColors> }) {
  const width = 340;
  const height = 125;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((value, index) => [6 + (index * (width - 12)) / (data.length - 1), height - 8 - ((value - min) / (max - min || 1)) * (height - 20)]);
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><Defs><SvgGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={positive ? colors.positive : colors.negative} stopOpacity="0.32" /><Stop offset="1" stopColor={positive ? colors.positive : colors.negative} stopOpacity="0" /></SvgGradient></Defs><Path d={`${path} L${width - 6},${height} L6,${height} Z`} fill="url(#chartFill)" /><Path d={path} fill="none" stroke={positive ? colors.positive : colors.negative} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><Circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="4" fill={positive ? colors.positive : colors.negative} /></Svg>;
}

function DonutChart({ values, colors }: { values: number[]; colors: string[] }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <Svg width={112} height={112} viewBox="0 0 112 112"><Circle cx="56" cy="56" r={radius} fill="none" stroke="#20242F" strokeWidth="14" />{values.map((value, index) => { const length = (value / totalValue) * circumference; const circle = <Circle key={colors[index]} cx="56" cy="56" r={radius} fill="none" stroke={colors[index]} strokeWidth="14" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 56 56)" />; offset += length; return circle; })}</Svg>;
}

function Assistant({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const answer = (query: string) => {
    const lower = query.toLowerCase();
    if (lower.includes('spend') || lower.includes('spent')) { const total = transactions.filter((tx) => tx.direction === 'out').reduce((sum, tx) => sum + tx.usd, 0); return `From your retrieved wallet data, you sent approximately ${money(total)} across ${transactions.filter((tx) => tx.direction === 'out').length} transactions this month. Your largest outgoing transaction was ${compactMoney(Math.max(...transactions.filter((tx) => tx.direction === 'out').map((tx) => tx.usd)))}.`; }
    if (lower.includes('receiv')) { const total = transactions.filter((tx) => tx.direction === 'in').reduce((sum, tx) => sum + tx.usd, 0); return `This wallet received approximately ${money(total)} across ${transactions.filter((tx) => tx.direction === 'in').length} transactions in the last 30 days.`; }
    if (lower.includes('largest') || lower.includes('biggest')) return `Your three largest recorded transactions are ${transactions.slice().sort((a, b) => b.usd - a.usd).slice(0, 3).map((tx) => `${tx.type} — ${compactMoney(tx.usd)}`).join(', ')}.`;
    if (lower.includes('token') && (lower.includes('hold') || lower.includes('have'))) return `You currently hold ${tokens.length} tokens worth ${money(totalValue)}: ${tokens.map((token) => `${token.sym} (${money(token.qty * token.price)})`).join(', ')}.`;
    if (lower.includes('swap')) return `You routed approximately ${money(transactions.filter((tx) => tx.type === 'Swap').reduce((sum, tx) => sum + tx.usd, 0))} through ${transactions.filter((tx) => tx.type === 'Swap').length} swaps, all via Jupiter.`;
    return 'I can answer questions about spending, receiving, largest transactions, token holdings, and swap activity using only this wallet’s retrieved data.';
  };
  const send = (text = input) => { const trimmed = text.trim(); if (!trimmed || typing) return; setMessages((current) => [...current, { role: 'user', text: trimmed }]); setInput(''); setTyping(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTimeout(() => { setMessages((current) => [...current, { role: 'ai', text: answer(trimmed) }]); setTyping(false); }, 550); };
  return <View style={styles.screen}><Header eyebrow="Wallet intelligence" title="Assistant" colors={colors} /><ScrollView contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>{messages.length === 0 && <View style={styles.chatIntro}><View style={styles.aiBadge}><Icon name="star" size={18} color="#FFFFFF" /></View><Text style={styles.chatIntroTitle}>Ask about your wallet</Text><Text style={styles.chatIntroText}>Answers are generated from your retrieved wallet data — never invented.</Text></View>}{messages.map((message, index) => <View key={`${message.role}-${index}`} style={[styles.message, message.role === 'user' ? styles.userMessage : styles.aiMessage]}><Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>{message.text}</Text></View>)}{typing && <View style={[styles.message, styles.aiMessage]}><Text style={styles.typingText}>Thinking…</Text></View>}{messages.length === 0 && <View style={styles.suggestions}>{suggestions.map((suggestion) => <Pressable key={suggestion} onPress={() => send(suggestion)} style={styles.suggestion}><Text style={styles.suggestionText}>{suggestion}</Text><Icon name="arrow-up-right" size={15} color={colors.faint} /></Pressable>)}</View>}</ScrollView><View style={[styles.chatBar, { paddingBottom: useSafeAreaInsets().bottom + 10 }]}><View style={styles.chatInputRow}><TextInput value={input} onChangeText={setInput} onSubmitEditing={() => send()} placeholder="Ask anything about your wallet..." placeholderTextColor={colors.faint} style={styles.chatInput} returnKeyType="send" /><Pressable onPress={() => send()} style={styles.sendButton}><Icon name="arrow-up" size={17} color="#FFFFFF" /></Pressable></View></View></View>;
}

function Settings({ colors, onDisconnect }: { colors: ReturnType<typeof useColors>; onDisconnect: () => void }) {
  const Row = ({ icon, label, value, onPress, destructive = false }: { icon: keyof typeof Feather.glyphMap; label: string; value?: string; onPress?: () => void; destructive?: boolean }) => <Pressable onPress={onPress} style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}><View style={styles.settingIcon}><Icon name={icon} size={17} color={destructive ? colors.negative : colors.mutedForeground} /></View><Text style={[styles.settingLabel, destructive && { color: colors.negative }]}>{label}</Text>{value && <Text style={styles.settingValue}>{value}</Text>}{onPress && !destructive && <Icon name="chevron-right" size={16} color={colors.faint} />}</Pressable>;
  return <View style={styles.screen}><Header eyebrow="Account" title="Settings" colors={colors} /><ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.demoBanner}><Icon name="alert-triangle" size={15} color={colors.tint} /><Text style={styles.demoText}>Demo Wallet — simulated data. Connect a real wallet to see your own activity.</Text></View><View style={styles.section}><SectionTitle title="Wallet" /><View style={styles.card}><View style={styles.addressRow}><View style={styles.walletDotLarge} /><View style={styles.rowInfo}><Text style={styles.rowTitle}>Public address</Text><Text style={styles.rowSub}>{shortAddress(WALLET_ADDRESS)}</Text></View><Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={styles.copyButton}><Text style={styles.copyText}>Copy</Text></Pressable></View><Row icon="external-link" label="View on Solana Explorer" onPress={() => Linking.openURL('https://explorer.solana.com')} /><Row icon="log-out" label="Disconnect wallet" onPress={onDisconnect} destructive /></View></View><View style={styles.section}><SectionTitle title="Preferences" /><View style={styles.card}><Row icon="moon" label="Appearance" value="Dark" /><Row icon="dollar-sign" label="Currency" value="USD" /><Row icon="bell-off" label="Notifications" value="Off" /></View></View><View style={styles.section}><SectionTitle title="About" /><View style={styles.card}><Row icon="info" label="SolanaLens" value="v0.1 prototype" /></View></View></ScrollView></View>;
}

function AppNav({ active, onNavigate, colors }: { active: Screen; onNavigate: (screen: Screen) => void; colors: ReturnType<typeof useColors> }) {
  const items: { screen: Screen; label: string; icon: keyof typeof Feather.glyphMap }[] = [{ screen: 'home', label: 'Home', icon: 'home' }, { screen: 'activity', label: 'Activity', icon: 'activity' }, { screen: 'ai', label: 'AI', icon: 'star' }, { screen: 'portfolio', label: 'Portfolio', icon: 'pie-chart' }, { screen: 'settings', label: 'Settings', icon: 'settings' }];
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 7 }]}>{items.map((item) => <Pressable key={item.screen} onPress={() => { onNavigate(item.screen); Haptics.selectionAsync(); }} style={styles.navItem}><View style={[styles.navIconWrap, item.screen === 'ai' && styles.aiNavWrap, active === item.screen && styles.navIconActive]}><Icon name={item.icon} size={20} color={active === item.screen ? '#FFFFFF' : colors.faint} /></View><Text style={[styles.navLabel, active === item.screen && { color: colors.tint }]}>{item.label}</Text></Pressable>)}</View>;
}

export default function Index() {
  const colors = useColors();
  const [screen, setScreen] = useState<Screen>('landing');
  const [connectVisible, setConnectVisible] = useState(false);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => { AsyncStorage.getItem('solanalens-intro-seen').then((value) => { if (value === 'true') setScreen('home'); }); }, []);
  const enterApp = () => { AsyncStorage.setItem('solanalens-intro-seen', 'true'); setScreen('home'); };
  const disconnect = () => { AsyncStorage.removeItem('solanalens-intro-seen'); setScreen('landing'); };
  if (screen === 'landing') return <><Landing onDemo={enterApp} onConnect={() => setConnectVisible(true)} /><ConnectSheet visible={connectVisible} onClose={() => setConnectVisible(false)} onConnect={(name) => { setConnectVisible(false); enterApp(); }} colors={colors} /></>;
  return <View className="flex-1 bg-ink" style={styles.app}><View className="flex-1" style={styles.main}>{screen === 'home' && <Home colors={colors} onNavigate={setScreen} onDetail={setDetail} onSettings={() => setScreen('settings')} />}{screen === 'activity' && <Activity colors={colors} onDetail={setDetail} />}{screen === 'portfolio' && <Portfolio colors={colors} />}{screen === 'ai' && <Assistant colors={colors} />}{screen === 'settings' && <Settings colors={colors} onDisconnect={disconnect} />}</View><AppNav active={screen} onNavigate={setScreen} colors={colors} /><TransactionDetail tx={detail} onClose={() => setDetail(null)} colors={colors} insetTop={insets.top} /></View>;
}

function ConnectSheet({ visible, onClose, onConnect, colors }: { visible: boolean; onClose: () => void; onConnect: (name: string) => void; colors: ReturnType<typeof useColors> }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.sheet, { paddingBottom: 28 }]}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>Connect a wallet</Text><Text style={styles.sheetHint}>SolanaLens only requests your public address. It’s read-only — we can never move your funds.</Text>{[['Phantom', 'Popular Solana wallet', 'ghost'], ['Solflare', 'Browser & mobile wallet', 'flame'], ['Backpack', 'Wallet & xNFT platform', 'briefcase']].map(([name, description, icon]) => <Pressable key={name} onPress={() => onConnect(name)} style={styles.walletOption}><View style={styles.walletOptionIcon}><Icon name={icon as keyof typeof Feather.glyphMap} size={18} color={colors.tint} /></View><View style={styles.rowInfo}><Text style={styles.walletName}>{name}</Text><Text style={styles.rowSub}>{description}</Text></View><Icon name="chevron-right" size={17} color={colors.faint} /></Pressable>)}<View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} /></View><PrimaryButton label="Continue with Demo Wallet" onPress={() => onConnect('Demo')} secondary /></View></View></Modal>;
}

function TransactionDetail({ tx, onClose, colors, insetTop }: { tx: Transaction | null; onClose: () => void; colors: ReturnType<typeof useColors>; insetTop: number }) {
  const [explaining, setExplaining] = useState(false);
  if (!tx) return null;
  const explanation = tx.type === 'Swap' ? `You swapped ${tx.amount} through ${tx.program}. The transaction confirmed successfully and incurred a network fee of ${tx.fee}.` : tx.direction === 'in' ? `This wallet received ${tx.amount} from ${tx.counterparty ?? 'an external wallet'}, worth approximately ${compactMoney(tx.usd)}.` : `You sent ${tx.amount} to ${tx.counterparty ?? tx.program ?? 'an external wallet'}, worth approximately ${compactMoney(tx.usd)}, with a network fee of ${tx.fee}.`;
  return <Modal visible={Boolean(tx)} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.detailSheet, { paddingTop: insetTop + 12 }]}><View style={styles.detailTop}><Pressable onPress={onClose} style={styles.iconButton}><Icon name="chevron-down" size={20} color={colors.foreground} /></Pressable><Text style={styles.detailTitle}>Transaction</Text><Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={styles.iconButton}><Icon name="copy" size={16} color={colors.foreground} /></Pressable></View><ScrollView showsVerticalScrollIndicator={false}><View style={styles.detailHero}><View style={styles.detailBadge}><Text style={styles.detailBadgeText}>{tx.type.toUpperCase()}</Text></View><Text style={styles.detailAmount}>{tx.direction === 'in' ? '+' : '−'}{tx.amount}</Text><Text style={styles.detailUsd}>Estimated value: {money(tx.usd)}</Text></View><View style={styles.detailRows}>{[['Network', 'Solana'], ...(tx.program ? [['Program', tx.program]] : []), ...(tx.counterparty ? [[tx.direction === 'in' ? 'From' : 'To', tx.counterparty]] : []), ['Network fee', tx.fee], ['Status', 'Confirmed'], ['Timestamp', tx.date], ['Signature', tx.signature]].map(([key, value]) => <View key={key} style={styles.detailRow}><Text style={styles.detailKey}>{key}</Text><Text style={[styles.detailVal, key === 'Status' && { color: colors.positive }]}>{value}</Text></View>)}</View><View style={styles.section}><PrimaryButton label={explaining ? 'Generating explanation…' : 'Explain this transaction'} onPress={() => { setExplaining(true); setTimeout(() => setExplaining(false), 900); }} secondary icon="star" />{!explaining && <View style={styles.explainBox}><Text style={styles.explainLabel}>AI INTERPRETATION</Text><Text style={styles.explainText}>{explanation}</Text></View>}</View><View style={{ height: 40 }} /></ScrollView></View></View></Modal>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#0B0D13' },
  main: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0B0D13' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 118 },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { fontSize: 13, color: '#8B91A4', marginBottom: 2, fontFamily: 'Inter_500Medium' },
  headerTitle: { fontSize: 25, lineHeight: 30, color: '#F3F4F8', fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  landingContent: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  logo: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: '#8B6CFF', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  logoSmall: { width: 42, height: 42, borderRadius: 13, marginBottom: 0 },
  logoLine: { width: 34, height: 4, backgroundColor: '#FFFFFF', borderRadius: 3, transform: [{ skewX: '-32deg' }], position: 'absolute', top: 20 },
  logoLineMid: { top: 29, opacity: 0.8 },
  logoLineBottom: { top: 38, opacity: 0.95 },
  landingTitle: { color: '#F3F4F8', fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 38, letterSpacing: -0.8, textAlign: 'center', maxWidth: 340 },
  landingSubtitle: { color: '#8B91A4', fontFamily: 'Inter_400Regular', fontSize: 15.5, lineHeight: 24, textAlign: 'center', marginTop: 14, maxWidth: 325 },
  chartPreview: { width: '100%', marginTop: 26 },
  landingActions: { paddingHorizontal: 24 },
  button: { minHeight: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
  primaryButton: { backgroundColor: '#8B6CFF', shadowColor: '#8B6CFF', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  secondaryButton: { backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837' },
  buttonText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  securityNote: { flexDirection: 'row', gap: 8, paddingHorizontal: 5, marginTop: 8, alignItems: 'flex-start' },
  securityText: { flex: 1, color: '#565C70', fontSize: 12.5, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  walletChip: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 7 },
  walletChipText: { color: '#8B91A4', fontSize: 12, fontFamily: 'Inter_500Medium' },
  walletDot: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#8B6CFF', borderWidth: 2, borderColor: '#3ECF8E' },
  walletDotLarge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#8B6CFF', borderWidth: 3, borderColor: '#3ECF8E' },
  portfolioHero: { backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 20, padding: 21, overflow: 'hidden', marginBottom: 20 },
  heroGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#282340', right: -74, top: -88 },
  label: { color: '#8B91A4', fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 7 },
  heroValue: { color: '#F3F4F8', fontSize: 36, lineHeight: 43, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  changePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#19352D', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 },
  changeText: { color: '#3ECF8E', fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
  metaRow: { flexDirection: 'row', gap: 22, marginTop: 20 },
  metaLabel: { color: '#565C70', fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  metaValue: { color: '#F3F4F8', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  section: { marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#8B91A4', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  linkText: { color: '#8B6CFF', fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
  card: { backgroundColor: '#12151D', borderWidth: 1, borderColor: '#232837', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  holdingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1E29' },
  tokenIcon: { alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tokenIconText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { color: '#F3F4F8', fontSize: 14.5, fontFamily: 'Inter_600SemiBold' },
  rowSub: { color: '#565C70', fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 2 },
  amountBlock: { alignItems: 'flex-end', minWidth: 92 },
  rowAmount: { color: '#F3F4F8', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rowDate: { color: '#565C70', fontSize: 11.5, fontFamily: 'Inter_400Regular', marginTop: 2 },
  transactionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1A1E29' },
  rowPressed: { opacity: 0.65 },
  txIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  searchBox: { marginHorizontal: 20, height: 46, backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: '#F3F4F8', fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterRow: { paddingHorizontal: 20, paddingBottom: 15, gap: 8 },
  chip: { backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8 },
  chipActive: { backgroundColor: '#8B6CFF', borderColor: '#8B6CFF' },
  chipText: { color: '#8B91A4', fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
  chipTextActive: { color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { color: '#F3F4F8', fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 14 },
  emptyText: { color: '#565C70', fontFamily: 'Inter_400Regular', fontSize: 13.5, marginTop: 5 },
  timeframeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  timeframe: { flex: 1, alignItems: 'center', backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 10, paddingVertical: 8 },
  chartCard: { backgroundColor: '#12151D', borderWidth: 1, borderColor: '#232837', borderRadius: 20, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, marginBottom: 20 },
  chartValue: { color: '#F3F4F8', fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  allocation: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 8 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: '#F3F4F8', fontSize: 13, fontFamily: 'Inter_500Medium' },
  legendPct: { color: '#8B91A4', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginLeft: 'auto' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  breakdownLabel: { color: '#8B91A4', fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  breakdownValue: { color: '#F3F4F8', fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
  chatContent: { paddingHorizontal: 16, paddingBottom: 128, flexGrow: 1 },
  chatIntro: { alignItems: 'center', paddingTop: 40, paddingBottom: 22 },
  aiBadge: { width: 44, height: 34, borderRadius: 11, backgroundColor: '#8B6CFF', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  chatIntroTitle: { color: '#F3F4F8', fontSize: 22, fontFamily: 'Inter_700Bold' },
  chatIntroText: { color: '#8B91A4', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 300 },
  suggestions: { gap: 8 },
  suggestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#12151D', borderWidth: 1, borderColor: '#232837', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13 },
  suggestionText: { color: '#8B91A4', fontSize: 13, fontFamily: 'Inter_500Medium' },
  message: { maxWidth: '88%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 17, marginBottom: 12 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#8B6CFF', borderBottomRightRadius: 5 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderBottomLeftRadius: 5 },
  messageText: { color: '#F3F4F8', fontSize: 13.8, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  userMessageText: { color: '#FFFFFF' },
  typingText: { color: '#8B91A4', fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  chatBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#0B0D13', paddingHorizontal: 14, paddingTop: 10 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 16, paddingLeft: 16, paddingRight: 6 },
  chatInput: { flex: 1, color: '#F3F4F8', fontSize: 14, paddingVertical: 11, fontFamily: 'Inter_400Regular' },
  sendButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#8B6CFF', alignItems: 'center', justifyContent: 'center' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0F1118', borderTopWidth: 1, borderTopColor: '#232837', flexDirection: 'row', paddingTop: 7 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIconWrap: { width: 38, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: '#282340' },
  aiNavWrap: { width: 42, height: 28 },
  navLabel: { color: '#565C70', fontSize: 10.5, fontFamily: 'Inter_600SemiBold' },
  demoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#282340', borderWidth: 1, borderColor: '#3A315F', borderRadius: 13, padding: 13, marginBottom: 20 },
  demoText: { flex: 1, color: '#F3F4F8', fontSize: 12.5, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  addressRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#1A1E29' },
  copyButton: { backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  copyText: { color: '#F3F4F8', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  settingsRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1A1E29' },
  settingIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#191D28', alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: '#F3F4F8', fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  settingValue: { color: '#565C70', fontSize: 13, fontFamily: 'Inter_400Regular' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,4,7,0.68)' },
  sheet: { backgroundColor: '#12151D', borderTopLeftRadius: 25, borderTopRightRadius: 25, borderWidth: 1, borderColor: '#232837', paddingHorizontal: 20 },
  sheetHandle: { width: 37, height: 4, borderRadius: 2, backgroundColor: '#232837', alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  sheetTitle: { color: '#F3F4F8', fontSize: 20, fontFamily: 'Inter_700Bold' },
  sheetHint: { color: '#8B91A4', fontSize: 13.5, lineHeight: 20, marginTop: 6, marginBottom: 18, fontFamily: 'Inter_400Regular' },
  walletOption: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', borderRadius: 14, marginBottom: 9 },
  walletOptionIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#282340', alignItems: 'center', justifyContent: 'center' },
  walletName: { color: '#F3F4F8', fontSize: 14.5, fontFamily: 'Inter_600SemiBold' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#232837' },
  dividerText: { color: '#565C70', fontSize: 12, fontFamily: 'Inter_500Medium' },
  detailSheet: { flex: 1, backgroundColor: '#0B0D13', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20 },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  detailTitle: { color: '#F3F4F8', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  iconButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#191D28', borderWidth: 1, borderColor: '#232837', alignItems: 'center', justifyContent: 'center' },
  detailHero: { alignItems: 'center', paddingVertical: 25 },
  detailBadge: { backgroundColor: '#282340', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 },
  detailBadgeText: { color: '#8B6CFF', fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  detailAmount: { color: '#F3F4F8', fontSize: 25, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  detailUsd: { color: '#8B91A4', fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8 },
  detailRows: { backgroundColor: '#12151D', borderWidth: 1, borderColor: '#232837', borderRadius: 20, overflow: 'hidden' },
  detailRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: '#1A1E29' },
  detailKey: { color: '#565C70', fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  detailVal: { color: '#F3F4F8', fontSize: 13.5, maxWidth: '60%', textAlign: 'right', fontFamily: 'Inter_600SemiBold' },
  explainBox: { backgroundColor: '#282340', borderWidth: 1, borderColor: '#3A315F', borderRadius: 14, padding: 15, marginTop: 12 },
  explainLabel: { color: '#8B6CFF', fontSize: 10.5, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  explainText: { color: '#F3F4F8', fontSize: 13.5, lineHeight: 21, fontFamily: 'Inter_400Regular' },
});