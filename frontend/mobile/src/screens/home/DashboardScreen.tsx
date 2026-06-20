import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Platform, Image,
} from 'react-native';
import { DepositSheet } from '../../components/DepositSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../types/navigation';
import { useAccounts } from '../../api/accounts';
import { getExchangeRate } from '@bankapp/shared';
import { useTransactions } from '../../api/transactions';
import { AccountCard } from '../../components/AccountCard';
import { TransactionRow } from '../../components/TransactionRow';
import { AccountCardSkeleton, TransactionSkeleton } from '../../components/SkeletonLoader';
import { MoneyAmount } from '../../components/MoneyAmount';
import { CreateAccountSheet } from '../../components/CreateAccountSheet';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<HomeStackParamList, 'Dashboard'>;

const NEW_ACCOUNT_ICON = require('../../../assets/icons/new-account.png');
const SEND_ICON = require('../../../assets/icons/send-money.png');
const DEPOSIT_ICON = require('../../../assets/icons/deposit.png');
const CARDS_ICON = require('../../../assets/icons/cards.png');

const QUICK_ACTIONS = [
  { label: 'Transfer', img: SEND_ICON, icon: null, tab: 'SendTab', action: null },
  { label: 'Deposit', img: DEPOSIT_ICON, icon: null, tab: null, action: 'deposit' },
  { label: 'New Acc', img: NEW_ACCOUNT_ICON, icon: null, tab: null, action: 'newAcc' },
  { label: 'Cards', img: CARDS_ICON, icon: null, tab: 'CardsTab', action: null },
];

export function DashboardScreen({ navigation }: Props) {
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showDepositSheet, setShowDepositSheet] = useState(false);

  function handleQuickAction(tab: string | null, action: string | null) {
    if (tab) {
      navigation.getParent()?.navigate(tab);
    } else if (action === 'deposit') {
      setShowDepositSheet(true);
    } else if (action === 'newAcc') {
      setShowCreateSheet(true);
    }
  }
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { data: txPage, isLoading: txLoading, refetch: refetchTx } = useTransactions(0, 5);

  // Sum all account balances converted to USD (no fee — display only)
  const totalBalanceUsd = accounts?.reduce((sum, a) => {
    const rate = getExchangeRate(a.currency, 'USD');
    return sum + a.availableBalance * rate;
  }, 0) ?? 0;
  const recentTx = txPage?.content ?? [];

  async function handleRefresh() {
    await Promise.all([refetchAccounts(), refetchTx()]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.subGreeting}>Welcome back</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Balance Card ───────────────────────── */}
      <LinearGradient
        colors={[colors.cardDark, colors.cardDark2, '#4338CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        {/* Card top row */}
        <View style={styles.cardTopRow}>
          <Text style={styles.bankName}>BankApp</Text>
          <View style={styles.chipGroup}>
            <View style={[styles.chip, { width: 10, height: 10, borderRadius: 5, marginRight: -4 }]} />
            <View style={[styles.chip, { width: 10, height: 10, borderRadius: 5, opacity: 0.6 }]} />
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceGroup}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <MoneyAmount
            value={totalBalanceUsd}
            currency="USD"
            size="large"
            style={styles.balanceAmount}
          />
          <View style={styles.currencyTag}>
            <Text style={styles.currencyText}>USD</Text>
          </View>
        </View>

        {/* Card footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardNumber}>•••• •••• •••• ••••</Text>
          <View style={styles.visaTag}>
            <Text style={styles.visaText}>VISA</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Quick Actions ──────────────────────── */}
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map(({ label, img, icon, tab, action }) => (
          <TouchableOpacity
            key={label}
            style={styles.actionItem}
            activeOpacity={0.75}
            onPress={() => handleQuickAction(tab, action)}
          >
            <View style={[styles.actionCircle, { backgroundColor: colors.primaryBg }]}>
              {img
                ? <Image source={img} style={{ width: 32, height: 32 }} />
                : <Ionicons name={icon as any} size={22} color={colors.primary} />}
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── My Accounts ────────────────────────── */}
      <SectionHeader title="My Accounts" />
      {accountsLoading ? (
        <AccountCardSkeleton />
      ) : accounts && accounts.length > 0 ? (
        <>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              accountType={account.accountType}
              balance={account.availableBalance}
              currency={account.currency}
              accountNumber={account.accountNumber}
              onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
            />
          ))}
          <AddAccountCard onPress={() => setShowCreateSheet(true)} />
        </>
      ) : (
        <AddAccountCard onPress={() => setShowCreateSheet(true)} empty />
      )}

      {/* ── Recent Activity ────────────────────── */}
      <SectionHeader
        title="Recent Activity"
        onSeeAll={() => navigation.getParent()?.navigate('ActivityTab')}
      />
      <View style={styles.txCard}>
        {txLoading ? (
          <>
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </>
        ) : recentTx.length > 0 ? (
          recentTx.map((tx, i) => (
            <View key={tx.id}>
              {i > 0 && <View style={styles.txDivider} />}
              <TransactionRow
                description={tx.description}
                amount={tx.amount}
                currency={tx.currency}
                date={tx.createdAt}
                status={tx.status}
                isOutgoing={accounts?.some((a) => a.id === tx.fromAccountId)}
              />
            </View>
          ))
        ) : (
          <EmptyState icon="receipt-outline" text="No transactions yet" />
        )}
      </View>

      <CreateAccountSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
      />

      <DepositSheet
        visible={showDepositSheet}
        onClose={() => setShowDepositSheet(false)}
      />
    </ScrollView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AddAccountCard({ onPress, empty }: { onPress: () => void; empty?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.addAccountCard, empty && styles.addAccountCardEmpty]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.addAccountIcon}>
        <Ionicons name="add" size={28} color={colors.primary} />
      </View>
      <Text style={styles.addAccountTitle}>
        {empty ? 'Add your first account' : 'Add another account'}
      </Text>
      <Text style={styles.addAccountSub}>Checking · Savings · Wallet</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={32} color={colors.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 110,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  greeting: { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  subGreeting: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // Balance Card
  balanceCard: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginBottom: 24,
    shadowColor: colors.cardDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bankName: { ...typography.label, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  chipGroup: { flexDirection: 'row', alignItems: 'center' },
  chip: { backgroundColor: '#D4AF37' },
  balanceGroup: { marginBottom: 20 },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  balanceAmount: { color: colors.white, fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  currencyTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  currencyText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { ...typography.small, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5 },
  visaTag: { backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  visaText: { color: colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: { alignItems: 'center', gap: 8 },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  // Add Account Card
  addAccountCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    backgroundColor: colors.surface,
  },
  addAccountCardEmpty: {
    paddingVertical: 28,
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  addAccountIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAccountTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  addAccountSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  seeAll: { ...typography.small, color: colors.primary, fontWeight: '600' },

  // Transactions card
  txCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  txDivider: { height: 1, backgroundColor: colors.border, marginLeft: 58 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { ...typography.body, color: colors.textMuted },
});
