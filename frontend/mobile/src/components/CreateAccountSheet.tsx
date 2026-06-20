import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Pressable, Platform,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AccountType, Currency } from '@bankapp/shared';
import { useCreateAccount, accountKeys } from '../api/accounts';
import { AppAlert } from './AppAlert';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string; desc: string }[] = [
  { value: 'CHECKING', label: 'Checking',  icon: '💳', desc: 'Everyday spending' },
  { value: 'SAVINGS',  label: 'Savings',   icon: '🏦', desc: 'Grow your money'   },
  { value: 'WALLET',   label: 'Wallet',    icon: '👛', desc: 'Quick payments'     },
];

const CURRENCIES: { value: Currency; symbol: string; name: string }[] = [
  { value: 'USD', symbol: '$', name: 'US Dollar'        },
  { value: 'EUR', symbol: '€', name: 'Euro'             },
  { value: 'VND', symbol: '₫', name: 'Vietnamese Dong'  },
];

export function CreateAccountSheet({ visible, onClose }: Props) {
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [currency, setCurrency]       = useState<Currency>('USD');
  const [success, setSuccess]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  const createAccount = useCreateAccount();
  const queryClient   = useQueryClient();

  async function handleCreate() {
    try {
      await createAccount.mutateAsync({ type: accountType, currency });
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create account. Please try again.';
      setErrorMsg(msg);
    }
  }

  function handleSuccessDismiss() {
    setSuccess(false);
    onClose();
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet */}
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account type */}
          <Text style={styles.sectionLabel}>Account Type</Text>
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map(({ value, label, icon, desc }) => {
              const active = accountType === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => setAccountType(value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.typeIcon}>{icon}</Text>
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{label}</Text>
                  <Text style={[styles.typeDesc, active && styles.typeDescActive]}>{desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Currency */}
          <Text style={styles.sectionLabel}>Currency</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map(({ value, symbol, name }) => {
              const active = currency === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.currencyCard, active && styles.currencyCardActive]}
                  onPress={() => setCurrency(value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currencySymbol, active && styles.currencySymbolActive]}>
                    {symbol}
                  </Text>
                  <Text style={[styles.currencyCode, active && styles.currencyCodeActive]}>
                    {value}
                  </Text>
                  <Text style={[styles.currencyName, active && styles.currencyNameActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Opening a{' '}
              <Text style={styles.summaryBold}>{accountType.charAt(0) + accountType.slice(1).toLowerCase()}</Text>
              {' '}account in{' '}
              <Text style={styles.summaryBold}>{currency}</Text>
            </Text>
          </View>

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createBtn, createAccount.isPending && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={createAccount.isPending}
            activeOpacity={0.85}
          >
            {createAccount.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Success alert */}
      <AppAlert
        visible={success}
        type="success"
        title="Account Created!"
        message={`Your ${accountType.charAt(0) + accountType.slice(1).toLowerCase()} account in ${currency} is ready to use.`}
        onDismiss={handleSuccessDismiss}
        buttonLabel="View Accounts"
      />

      {/* Error alert */}
      <AppAlert
        visible={!!errorMsg}
        type="error"
        title="Creation Failed"
        message={errorMsg}
        onDismiss={() => setErrorMsg('')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
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

  // Handle + header
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

  // Section label
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Account type cards
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  typeIcon:  { fontSize: 24, marginBottom: 6 },
  typeLabel: { ...typography.label, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  typeLabelActive: { color: colors.primary },
  typeDesc:  { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  typeDescActive: { color: colors.primaryLight },

  // Currency cards
  currencyRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  currencyCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyCardActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  currencySymbolActive: { color: colors.primary },
  currencyCode: { ...typography.label, color: colors.textSecondary, fontWeight: '700' },
  currencyCodeActive: { color: colors.primary },
  currencyName: { fontSize: 9, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  currencyNameActive: { color: colors.primaryLight },

  // Summary
  summary: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryText: { ...typography.body, color: colors.textSecondary },
  summaryBold: { color: colors.textPrimary, fontWeight: '700' },

  // Create button
  createBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.65 },
  createBtnText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '700' },
});
