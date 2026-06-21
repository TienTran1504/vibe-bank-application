import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SendStackParamList } from '../../types/navigation';
import { useAccounts } from '../../api/accounts';
import { AppAlert } from '../../components/AppAlert';
import { CURRENCY_SYMBOLS, getExchangeRate, FX_FEE_RATE } from '@bankapp/shared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<SendStackParamList, 'EnterAmount'>;

export function EnterAmountScreen({ route, navigation }: Props) {
  const { toAccountId, recipientName, recipientAccountNumber, recipientCurrency } = route.params;
  const { data: accounts = [] } = useAccounts();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [showError, setShowError]   = useState(false);

  // Source accounts exclude the recipient account — you can't send to yourself.
  // Match on both id and account number so the recipient is filtered out reliably.
  const sourceAccounts = accounts.filter(
    a =>
      a.status === 'ACTIVE' &&
      a.id !== toAccountId &&
      a.accountNumber !== recipientAccountNumber,
  );

  // Auto-select first eligible source account on load
  useEffect(() => {
    if (sourceAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(sourceAccounts[0].id);
    }
  }, [accounts]);

  const fromAccount = accounts.find(a => a.id === selectedAccountId);
  const fromCurrency = fromAccount?.currency ?? 'USD';
  const symbol = CURRENCY_SYMBOLS[fromCurrency] ?? fromCurrency;
  const parsedAmount = parseFloat(amount || '0');
  const insufficientFunds = !!fromAccount && parsedAmount > fromAccount.availableBalance;

  // FX preview (client-side, indicative)
  const isCrossCurrency = !!amount && parsedAmount > 0 && fromCurrency !== recipientCurrency;
  const exchangeRate    = getExchangeRate(fromCurrency, recipientCurrency);
  const feeAmount       = parsedAmount * FX_FEE_RATE;
  const convertedAmount = parsedAmount * exchangeRate;
  const toSymbol        = CURRENCY_SYMBOLS[recipientCurrency] ?? recipientCurrency;

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function showValidationError(msg: string) {
    setErrorMsg(msg);
    setShowError(true);
  }

  function handleContinue() {
    if (!amount || parsedAmount <= 0) {
      showValidationError('Please enter an amount greater than 0.');
      return;
    }
    if (!fromAccount) {
      showValidationError('Please select an account to send from.');
      return;
    }
    if (fromAccount.id === toAccountId) {
      showValidationError("You can't transfer to the same account you're sending from. Choose a different account.");
      return;
    }
    // For cross-currency: check if sender has enough to cover amount + fee
    const totalDebit = isCrossCurrency ? parsedAmount * (1 + FX_FEE_RATE) : parsedAmount;
    if (fromAccount.availableBalance < totalDebit) {
      showValidationError(
        `Insufficient funds. You need ${symbol}${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (including 1.5% conversion fee) but your available balance is ${symbol}${fromAccount.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      );
      return;
    }
    navigation.navigate('Review', {
      fromAccountId:          fromAccount.id,
      fromAccountNumber:      fromAccount.accountNumber,
      fromCurrency,
      toAccountId,
      amount,
      recipientName,
      recipientAccountNumber,
      recipientCurrency,
      description: description || undefined,
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Step */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
        </View>

        <Text style={styles.title}>Enter amount</Text>
        <Text style={styles.subtitle}>To: {recipientName}</Text>

        {/* From account selector */}
        <Text style={styles.sectionLabel}>From account</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountScroll}
          contentContainerStyle={styles.accountScrollContent}
        >
          {sourceAccounts.map((account) => {
            const isSelected = account.id === selectedAccountId;
            const sym = CURRENCY_SYMBOLS[account.currency] ?? account.currency;
            return (
              <TouchableOpacity
                key={account.id}
                style={[styles.accountCard, isSelected && styles.accountCardActive]}
                onPress={() => setSelectedAccountId(account.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.accountCardType, isSelected && styles.accountCardTextActive]}>
                  {account.accountType}
                </Text>
                <Text style={[styles.accountCardBalance, isSelected && styles.accountCardTextActive]}>
                  {sym}{account.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.accountCardCurrency, isSelected && styles.accountCardSubActive]}>
                  {account.currency} · ••••{account.accountNumber.slice(-4)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Amount input */}
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

        {/* Balance hint */}
        {fromAccount ? (
          <Text style={[styles.balance, insufficientFunds && styles.balanceInsufficient]}>
            Available: {symbol}{fmt(fromAccount.availableBalance)}
            {insufficientFunds ? ' — Insufficient funds' : ''}
          </Text>
        ) : (
          <Text style={styles.balanceInsufficient}>No active account selected</Text>
        )}

        {/* FX conversion preview */}
        {isCrossCurrency && (
          <View style={styles.fxBox}>
            <View style={styles.fxRow}>
              <Text style={styles.fxLabel}>Recipient gets (est.)</Text>
              <Text style={styles.fxValue}>{toSymbol}{fmt(convertedAmount)} {recipientCurrency}</Text>
            </View>
            <View style={styles.fxRow}>
              <Text style={styles.fxLabel}>Conversion fee (1.5%)</Text>
              <Text style={styles.fxFee}>{symbol}{fmt(feeAmount)} {fromCurrency}</Text>
            </View>
            <View style={[styles.fxRow, styles.fxRowLast]}>
              <Text style={styles.fxLabel}>Total deducted</Text>
              <Text style={styles.fxTotal}>{symbol}{fmt(parsedAmount + feeAmount)} {fromCurrency}</Text>
            </View>
            <Text style={styles.fxRate}>Rate: 1 {recipientCurrency} = {symbol}{(1 / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {fromCurrency}</Text>
          </View>
        )}

        {/* Note */}
        <TextInput
          style={styles.noteInput}
          placeholder="Add a note (optional)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          maxLength={200}
        />

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Review Transfer</Text>
        </TouchableOpacity>
      </ScrollView>

      <AppAlert
        visible={showError}
        type="error"
        title="Cannot Continue"
        message={errorMsg}
        onDismiss={() => setShowError(false)}
        buttonLabel="OK"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 120,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText:  { ...typography.body, color: colors.primary },
  stepBadge: { backgroundColor: colors.primaryBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  stepText:  { ...typography.small, color: colors.primary, fontWeight: '600' },

  title:    { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 20 },

  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 10 },

  accountScroll:        { marginBottom: 20, flexGrow: 0 },
  accountScrollContent: { gap: 10, paddingRight: 4 },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
  },
  accountCardActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  accountCardType:      { ...typography.small, color: colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  accountCardBalance:   { ...typography.amountSmall, color: colors.textPrimary, marginBottom: 2 },
  accountCardCurrency:  { ...typography.caption, color: colors.textMuted },
  accountCardTextActive:{ color: colors.white },
  accountCardSubActive: { color: 'rgba(255,255,255,0.7)' },

  amountRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  symbol:      { ...typography.amountLarge, color: colors.textPrimary, marginRight: 4 },
  amountInput: {
    flex: 1,
    ...typography.amountLarge,
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 4,
  },

  balance:             { ...typography.small, color: colors.textSecondary, marginBottom: 12 },
  balanceInsufficient: { ...typography.small, color: colors.danger, marginBottom: 12 },

  fxBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D4FA',
  },
  fxRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fxRowLast: { marginBottom: 4 },
  fxLabel:   { ...typography.small, color: colors.textSecondary },
  fxValue:   { ...typography.small, color: colors.success, fontWeight: '700' },
  fxFee:     { ...typography.small, color: colors.warning, fontWeight: '600' },
  fxTotal:   { ...typography.small, color: colors.textPrimary, fontWeight: '700' },
  fxRate:    { ...typography.caption, color: colors.textMuted, marginTop: 6 },

  noteInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },

  button:     { height: 52, backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { ...typography.label, color: colors.white, fontSize: 16 },
});
