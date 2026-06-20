import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { SendStackParamList } from '../../types/navigation';
import { useTransfer } from '../../api/transactions';
import { CURRENCY_SYMBOLS, getExchangeRate, FX_FEE_RATE } from '@bankapp/shared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<SendStackParamList, 'Review'>;

export function ReviewScreen({ route, navigation }: Props) {
  const {
    fromAccountId, fromAccountNumber, fromCurrency,
    toAccountId, amount,
    recipientName, recipientAccountNumber, recipientCurrency,
    description,
  } = route.params;
  const transfer = useTransfer();
  const symbol    = CURRENCY_SYMBOLS[fromCurrency] ?? fromCurrency;
  const toSymbol  = CURRENCY_SYMBOLS[recipientCurrency] ?? recipientCurrency;
  const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

  // FX preview
  const isCrossCurrency = fromCurrency !== recipientCurrency;
  const exchangeRate    = getExchangeRate(fromCurrency, recipientCurrency);
  const parsedAmt       = parseFloat(amount);
  const feeAmount       = isCrossCurrency ? parsedAmt * FX_FEE_RATE : 0;
  const convertedAmount = isCrossCurrency ? parsedAmt * exchangeRate : parsedAmt;
  const totalDebit      = parsedAmt + feeAmount;

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleConfirm() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled  = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirm sending ${symbol}${fmt(isCrossCurrency ? totalDebit : parsedAmt)}`,
        fallbackLabel: 'Use passcode',
      });
      if (!result.success) return;
    }

    try {
      const tx = await transfer.mutateAsync({ fromAccountId, toAccountId, amount, description });
      navigation.replace('Confirmation', {
        transactionId: tx.transactionId,
        amount, currency: fromCurrency, recipientName, success: true,
        convertedAmount: isCrossCurrency ? convertedAmount.toFixed(2) : undefined,
        recipientCurrency: isCrossCurrency ? recipientCurrency : undefined,
      });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      const msg = data?.error ?? data?.message ?? (err as { message?: string })?.message ?? 'Transfer failed.';
      navigation.replace('Confirmation', {
        transactionId: '', amount, currency: fromCurrency, recipientName, success: false, errorMessage: msg,
      });
    }
  }

  const maskedFrom = `••••${fromAccountNumber.slice(-4)}`;
  const maskedTo   = `${recipientName} - ${recipientAccountNumber.slice(-4)}`;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back + Step */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 3 of 3</Text>
        </View>
      </View>

      <Text style={styles.title}>Review your transfer</Text>

      {/* Hero amount card */}
      <View style={styles.heroCard}>
        <Text style={styles.transferType}>
          {isCrossCurrency ? 'Currency conversion transfer' : 'Standard bank transfer'}
        </Text>
        <Text style={styles.heroAmount}>{symbol}{fmt(parsedAmt)}</Text>
        {isCrossCurrency ? (
          <Text style={styles.heroConvert}>
            → {toSymbol}{fmt(convertedAmount)} {recipientCurrency} to {recipientName.split(' ')[0]}
          </Text>
        ) : (
          <Text style={styles.heroTo}>To {maskedTo}</Text>
        )}
      </View>

      {/* Transfer details */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>TRANSFER DETAILS</Text>
        <DetailRow label="From" value={maskedFrom} />
        <DetailRow label="To"   value={recipientName} />
        {description ? <DetailRow label="Note" value={description} /> : null}
        {isCrossCurrency ? (
          <>
            <DetailRow label="Exchange rate"
              value={`1 ${recipientCurrency} = ${symbol}${(1 / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`} />
            <DetailRow label="Conversion fee (1.5%)" value={`${symbol}${fmt(feeAmount)}`} highlight="warning" />
            <DetailRow label="Total deducted"        value={`${symbol}${fmt(totalDebit)}`} highlight="danger" />
            <DetailRow label="Recipient gets"        value={`${toSymbol}${fmt(convertedAmount)} ${recipientCurrency}`} highlight="success" isLast />
          </>
        ) : (
          <>
            <DetailRow label="Delivery speed" value="Instant" />
            <DetailRow label="Frequency"      value="Once" />
            <DetailRow label="Date"           value={today} isLast />
          </>
        )}
      </View>

      {/* Biometric hint */}
      <Text style={styles.hint}>
        <Ionicons name="finger-print-outline" size={13} color={colors.textMuted} />
        {' '}You will be asked to confirm with biometrics before sending.
      </Text>

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, transfer.isPending && styles.sendBtnDisabled]}
          onPress={handleConfirm}
          disabled={transfer.isPending}
          activeOpacity={0.85}
        >
          <Text style={styles.sendText}>
            {transfer.isPending
              ? 'Sending…'
              : isCrossCurrency
                ? `Send ${symbol}${fmt(totalDebit)}`
                : `Send ${symbol}${fmt(parsedAmt)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  success: colors.success,
  warning: colors.warning,
  danger:  colors.danger,
};

function DetailRow({ label, value, isLast, highlight }: {
  label: string; value: string; isLast?: boolean; highlight?: 'success' | 'warning' | 'danger';
}) {
  const valueColor = highlight ? HIGHLIGHT_COLORS[highlight] : colors.textPrimary;
  return (
    <View style={[rowStyles.row, isLast && rowStyles.rowLast]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast:  { borderBottomWidth: 0 },
  label:    { ...typography.body, color: colors.textSecondary },
  value:    { ...typography.label, color: colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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

  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 20 },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transferType: { ...typography.small, color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount:   { ...typography.amountLarge, fontSize: 42, color: colors.textPrimary, marginBottom: 8 },
  heroTo:       { ...typography.body, color: colors.textSecondary },
  heroConvert:  { ...typography.label, color: colors.success, fontWeight: '600' },

  detailsCard:  { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  detailsTitle: { ...typography.caption, color: colors.textMuted, letterSpacing: 1, paddingTop: 14, paddingBottom: 4 },

  hint: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },

  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelText:      { ...typography.label, color: colors.textPrimary, fontSize: 15 },
  sendBtn: {
    flex: 2,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendText:        { ...typography.label, color: colors.white, fontSize: 15 },
});
