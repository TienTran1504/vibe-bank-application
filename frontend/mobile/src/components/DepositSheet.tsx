import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Pressable, Platform, ScrollView,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CURRENCY_SYMBOLS } from '@bankapp/shared';
import { useAccounts, useTopUp, accountKeys } from '../api/accounts';
import { AppAlert } from './AppAlert';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DepositSheet({ visible, onClose }: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: accounts } = useAccounts();
  const topUp = useTopUp();
  const queryClient = useQueryClient();

  // Auto-select first account whenever the sheet becomes visible
  useEffect(() => {
    if (visible && accounts && accounts.length > 0) {
      setSelectedAccountId((prev) => prev ?? accounts[0].id);
    }
  }, [visible, accounts]);

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);
  const parsedAmount = parseFloat(amount || '0');
  const canSubmit = !!selectedAccountId && parsedAmount > 0 && !topUp.isPending;

  async function handleDeposit() {
    if (!selectedAccountId || parsedAmount <= 0) return;
    try {
      await topUp.mutateAsync({ accountId: selectedAccountId, amount: parsedAmount });
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Deposit failed. Please try again.';
      setErrorMsg(msg);
    }
  }

  function handleSuccessDismiss() {
    setSuccess(false);
    setAmount('');
    setSelectedAccountId(null);
    onClose();
  }

  function handleClose() {
    setAmount('');
    setSelectedAccountId(null);
    onClose();
  }

  const symbol = selectedAccount ? (CURRENCY_SYMBOLS[selectedAccount.currency] ?? selectedAccount.currency) : '$';

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Deposit</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account picker */}
          <Text style={styles.sectionLabel}>To Account</Text>
          {accounts && accounts.length === 0 && (
            <Text style={styles.noAccountText}>Create an account first before depositing.</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
            {(accounts ?? []).map((account) => {
              const active = account.id === selectedAccountId;
              const sym = CURRENCY_SYMBOLS[account.currency] ?? account.currency;
              return (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.accountCard, active && styles.accountCardActive]}
                  onPress={() => setSelectedAccountId(account.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.accountType, active && styles.accountTextActive]}>
                    {account.accountType}
                  </Text>
                  <Text style={[styles.accountBalance, active && styles.accountTextActive]}>
                    {sym}{account.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.accountCurrency, active && styles.accountSubActive]}>
                    {account.currency}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Amount input */}
          <Text style={styles.sectionLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.symbol}>{symbol}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Quick amount chips */}
          <View style={styles.chipRow}>
            {['10', '50', '100', '500'].map((v) => (
              <TouchableOpacity key={v} style={styles.chip} onPress={() => setAmount(v)}>
                <Text style={styles.chipText}>{symbol}{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.depositBtn, !canSubmit && styles.depositBtnDisabled]}
            onPress={handleDeposit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {topUp.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.depositBtnText}>
                Deposit {parsedAmount > 0 ? `${symbol}${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <AppAlert
        visible={success}
        type="success"
        title="Deposit Successful!"
        message={`${symbol}${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been added to your ${selectedAccount?.accountType.toLowerCase()} account.`}
        onDismiss={handleSuccessDismiss}
        buttonLabel="Done"
      />

      <AppAlert
        visible={!!errorMsg}
        type="error"
        title="Deposit Failed"
        message={errorMsg}
        onDismiss={() => setErrorMsg('')}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  closeIcon: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  noAccountText: { ...typography.body, color: colors.textMuted, marginBottom: 16 },
  accountScroll: { marginBottom: 24 },
  accountCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountCardActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  accountType: { ...typography.label, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  accountBalance: { ...typography.amountSmall, color: colors.textPrimary },
  accountCurrency: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  accountTextActive: { color: colors.primary },
  accountSubActive: { color: colors.primaryLight },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    marginBottom: 16,
    paddingBottom: 6,
  },
  symbol: { ...typography.amountMedium, color: colors.textPrimary, marginRight: 6 },
  amountInput: {
    flex: 1,
    ...typography.amountMedium,
    color: colors.textPrimary,
  },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
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

  depositBtn: {
    height: 54,
    backgroundColor: colors.actionReceive,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositBtnDisabled: { opacity: 0.45 },
  depositBtnText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '700' },
});
