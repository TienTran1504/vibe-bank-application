import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletTransaction } from '@bankapp/shared';
import { HomeStackParamList } from '../../types/navigation';
import { useWallet, useWalletTransactions, useWalletTopUp, useWalletWithdraw } from '../../api/wallets';
import { useAccounts } from '../../api/accounts';
import { AppAlert } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<HomeStackParamList, 'Wallet'>;

export function WalletScreen({ navigation }: Props) {
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: txPage, isLoading: txLoading, refetch: refetchTx } = useWalletTransactions(0, 20);
  const topUp = useWalletTopUp();
  const withdraw = useWalletWithdraw();
  const { data: accounts } = useAccounts();

  const [topUpSheet, setTopUpSheet] = useState(false);
  const [withdrawSheet, setWithdrawSheet] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  async function handleRefresh() {
    await Promise.all([refetchWallet(), refetchTx()]);
  }

  function openTopUp() {
    setAmount('');
    setTopUpSheet(true);
  }

  function openWithdraw() {
    setAmount('');
    setSelectedAccountId(accounts?.[0]?.id ?? null);
    setWithdrawSheet(true);
  }

  async function handleTopUp() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    try {
      await topUp.mutateAsync({ amount: parsed.toFixed(2), paymentMethodToken: 'mock-card-token' });
      setTopUpSheet(false);
      setAlert({
        type: 'success',
        title: 'Top-Up Successful',
        message: `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added to your wallet.`,
      });
    } catch {
      setAlert({ type: 'error', title: 'Top-Up Failed', message: 'Unable to process top-up. Please try again.' });
    }
  }

  async function handleWithdraw() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !selectedAccountId) return;
    try {
      await withdraw.mutateAsync({ amount: parsed.toFixed(2), toAccountId: selectedAccountId });
      setWithdrawSheet(false);
      setAlert({
        type: 'success',
        title: 'Withdrawal Successful',
        message: `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} transferred to your bank account.`,
      });
    } catch {
      setAlert({ type: 'error', title: 'Withdrawal Failed', message: 'Unable to process withdrawal. Please try again.' });
    }
  }

  const transactions = txPage?.content ?? [];

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Wallet</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Balance card */}
        <LinearGradient
          colors={['#312e81', colors.primary, '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          {walletLoading ? (
            <ActivityIndicator color={colors.white} size="large" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.balanceAmount}>
              ${(wallet?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          )}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: wallet?.status === 'ACTIVE' ? '#4ade80' : '#f87171' }]} />
            <Text style={styles.statusText}>{wallet?.status ?? 'ACTIVE'}</Text>
          </View>
        </LinearGradient>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={openTopUp} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.success} />
            </View>
            <Text style={styles.actionLabel}>Top Up</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionBtn} onPress={openWithdraw} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="arrow-down-circle-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction history */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.txCard}>
          {txLoading ? (
            <>
              <TxSkeleton />
              <TxSkeleton />
              <TxSkeleton />
            </>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No wallet transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx, i) => (
              <View key={tx.id}>
                {i > 0 && <View style={styles.txDivider} />}
                <WalletTxRow tx={tx} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Top-Up Sheet */}
      <AmountSheet
        visible={topUpSheet}
        title="Top Up Wallet"
        subtitle="Funds are added instantly via mock payment gateway."
        buttonLabel="Top Up"
        amount={amount}
        setAmount={setAmount}
        onClose={() => setTopUpSheet(false)}
        onSubmit={handleTopUp}
        isPending={topUp.isPending}
        color={colors.success}
      />

      {/* Withdraw Sheet */}
      <Modal
        visible={withdrawSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setWithdrawSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setWithdrawSheet(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Withdraw to Account</Text>
            <TouchableOpacity onPress={() => setWithdrawSheet(false)} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetLabel}>Destination Account</Text>
          {(!accounts || accounts.length === 0) ? (
            <Text style={styles.hintText}>Create a bank account first to withdraw to.</Text>
          ) : (
            accounts.map((acc) => {
              const active = acc.id === selectedAccountId;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.accRow, active && styles.accRowActive]}
                  onPress={() => setSelectedAccountId(acc.id)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={[styles.accType, active && styles.accTextActive]}>{acc.accountType}</Text>
                    <Text style={[styles.accNum, active && styles.accSubActive]}>···· {acc.accountNumber.slice(-4)}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              );
            })
          )}

          <Text style={[styles.sheetLabel, { marginTop: 16 }]}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountSymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.chipRow}>
            {['10', '50', '100', '500'].map((v) => (
              <TouchableOpacity key={v} style={styles.chip} onPress={() => setAmount(v)}>
                <Text style={styles.chipText}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, (!amount || !selectedAccountId || withdraw.isPending) && styles.btnDisabled]}
            onPress={handleWithdraw}
            disabled={!amount || !selectedAccountId || withdraw.isPending}
            activeOpacity={0.85}
          >
            {withdraw.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Withdraw</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <AppAlert
        visible={!!alert}
        type={alert?.type ?? 'success'}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        onDismiss={() => setAlert(null)}
      />
    </>
  );
}

function AmountSheet({
  visible,
  title,
  subtitle,
  buttonLabel,
  amount,
  setAmount,
  onClose,
  onSubmit,
  isPending,
  color,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  buttonLabel: string;
  amount: string;
  setAmount: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  color: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hintText}>{subtitle}</Text>

        <View style={styles.amountRow}>
          <Text style={styles.amountSymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        </View>
        <View style={styles.chipRow}>
          {['10', '50', '100', '500'].map((v) => (
            <TouchableOpacity key={v} style={styles.chip} onPress={() => setAmount(v)}>
              <Text style={styles.chipText}>${v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: color }, (!amount || isPending) && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={!amount || isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function WalletTxRow({ tx }: { tx: WalletTransaction }) {
  const isTopUp = tx.type === 'TOP_UP';
  const sign = isTopUp ? '+' : '-';
  const iconName = isTopUp ? 'arrow-down-circle' : 'arrow-up-circle';
  const iconColor = isTopUp ? colors.success : colors.danger;
  const amountColor = isTopUp ? colors.success : colors.danger;

  return (
    <View style={txStyles.row}>
      <View style={[txStyles.iconWrap, { backgroundColor: isTopUp ? '#ecfdf5' : '#fff0f0' }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.type}>{tx.type.replace('_', ' ')}</Text>
        <Text style={txStyles.date}>
          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <View style={txStyles.right}>
        <Text style={[txStyles.amount, { color: amountColor }]}>
          {sign}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={txStyles.status}>{tx.status}</Text>
      </View>
    </View>
  );
}

function TxSkeleton() {
  return (
    <View style={[txStyles.row, { opacity: 0.4 }]}>
      <View style={[txStyles.iconWrap, { backgroundColor: colors.border }]} />
      <View style={txStyles.info}>
        <View style={{ height: 14, width: 80, backgroundColor: colors.border, borderRadius: 4, marginBottom: 6 }} />
        <View style={{ height: 12, width: 60, backgroundColor: colors.border, borderRadius: 4 }} />
      </View>
      <View style={{ height: 16, width: 60, backgroundColor: colors.border, borderRadius: 4 }} />
    </View>
  );
}

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  type: { ...typography.label, color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize', marginBottom: 2 },
  date: { ...typography.caption, color: colors.textMuted },
  right: { alignItems: 'flex-end' },
  amount: { ...typography.amountSmall, fontWeight: '700', marginBottom: 2 },
  status: { ...typography.caption, color: colors.textMuted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 110 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  back:     { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText: { ...typography.body, color: colors.primary },
  header:   { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },

  balanceCard: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -1,
    marginBottom: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.caption, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  actionRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  actionDivider: { width: 1, backgroundColor: colors.border, marginVertical: 14 },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { ...typography.label, color: colors.textPrimary, fontWeight: '600' },

  sectionTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700', marginBottom: 12 },
  txCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txDivider: { height: 1, backgroundColor: colors.border, marginLeft: 54 },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { ...typography.body, color: colors.textMuted },

  // Sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  closeIcon: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  sheetLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  hintText: { ...typography.small, color: colors.textMuted, marginBottom: 16 },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    marginBottom: 16,
    paddingBottom: 6,
  },
  amountSymbol: { ...typography.amountMedium, color: colors.textPrimary, marginRight: 6 },
  amountInput: { flex: 1, ...typography.amountMedium, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.label, color: colors.primary, fontWeight: '600' },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45 },
  submitBtnText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '700' },

  accRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  accRowActive: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  accType: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  accNum: { ...typography.caption, color: colors.textMuted },
  accTextActive: { color: colors.primary },
  accSubActive: { color: colors.primaryLight },
});
