import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SendStackParamList } from '../../types/navigation';
import { CURRENCY_SYMBOLS } from '@bankapp/shared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<SendStackParamList, 'Confirmation'>;

const ERROR_REASONS: Record<string, { title: string; detail: string }> = {
  INSUFFICIENT_FUNDS:   { title: 'Insufficient funds',      detail: 'Your account balance was too low to complete this transfer.' },
  FRAUD_BLOCKED:        { title: 'Transfer blocked',         detail: 'Our fraud detection system flagged this transaction. Please contact support if you believe this is an error.' },
  KYC_REQUIRED:         { title: 'Verification required',   detail: 'Transfers above $10,000 require completed identity verification (KYC).' },
  ACCOUNT_FROZEN:       { title: 'Account frozen',           detail: 'The source account is currently frozen. Please contact support.' },
  VELOCITY_LIMIT:       { title: 'Too many transfers',       detail: 'You have sent too many transfers in a short time. Please wait a minute and try again.' },
  UNAUTHORIZED:         { title: 'Session expired',          detail: 'Your session expired during the transfer. Please log in again and try again.' },
  DUPLICATE_REQUEST:    { title: 'Duplicate request',        detail: 'This transfer was already processed. Check your activity for the status.' },
};

function parseError(message?: string): { title: string; detail: string } {
  if (!message) return { title: 'Transfer failed', detail: 'Something went wrong. Please try again.' };
  // Check if any known error code appears in the message
  for (const [code, reason] of Object.entries(ERROR_REASONS)) {
    if (message.toUpperCase().includes(code)) return reason;
  }
  return { title: 'Transfer failed', detail: message };
}

export function ConfirmationScreen({ route, navigation }: Props) {
  const { transactionId, amount, currency, recipientName, success, errorMessage,
          convertedAmount, recipientCurrency } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const symbol   = CURRENCY_SYMBOLS[currency] ?? currency;
  const toSymbol = recipientCurrency ? (CURRENCY_SYMBOLS[recipientCurrency] ?? recipientCurrency) : null;
  const error = parseError(errorMessage);
  const isCrossCurrency = !!convertedAmount && !!recipientCurrency && currency !== recipientCurrency;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, []);

  // No auto-redirect — user taps to continue

  return (
    <View style={styles.container}>
      {/* Icon */}
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale }], backgroundColor: success ? colors.success : colors.danger }]}>
        <Ionicons name={success ? 'checkmark' : 'close'} size={48} color={colors.white} />
      </Animated.View>

      <Text style={styles.heading}>{success ? 'Transfer sent!' : error.title}</Text>

      {success ? (
        <>
          <Text style={styles.amount}>{symbol}{parseFloat(amount).toFixed(2)}</Text>
          {isCrossCurrency ? (
            <Text style={styles.recipient}>
              → {toSymbol}{parseFloat(convertedAmount!).toFixed(2)} {recipientCurrency} to {recipientName}
            </Text>
          ) : (
            <Text style={styles.recipient}>sent to {recipientName}</Text>
          )}
        </>
      ) : (
        <>
          <Text style={styles.errorDetail}>{error.detail}</Text>
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={styles.hintText}>
              No money was deducted from your account. You can try again or contact support if the issue persists.
            </Text>
          </View>
        </>
      )}

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'SendTo' }] })}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane-outline" size={18} color={colors.white} />
          <Text style={styles.retryText}>Send another</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeBtnOutline}
          onPress={() => navigation.getParent()?.navigate(success ? 'ActivityTab' : 'HomeTab')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnTextOutline}>
            {success ? 'View Activity' : 'Back to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingBottom: Platform.OS === 'android' ? 130 : 130,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading:   { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  amount:    { ...typography.amountLarge, color: colors.success, marginBottom: 4 },
  recipient: { ...typography.body, color: colors.textSecondary, marginBottom: 24 },

  errorDetail: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 24 },
  hintBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primaryBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  hintText: { flex: 1, ...typography.small, color: colors.primary, lineHeight: 18 },

  actions: { position: 'absolute', bottom: 110, left: 32, right: 32, gap: 10 },

  retryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  retryText: { ...typography.label, color: colors.white, fontSize: 16 },

  homeBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnOutline: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnTextOutline: { ...typography.label, color: colors.textPrimary, fontSize: 16 },
});
