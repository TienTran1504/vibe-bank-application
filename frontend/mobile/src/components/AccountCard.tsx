import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ACCOUNT_TYPE_LABELS, CURRENCY_SYMBOLS, getExchangeRate } from '@bankapp/shared';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { MoneyAmount } from './MoneyAmount';

interface Props {
  accountType: string;
  balance: number;
  currency: string;
  accountNumber: string;
  onPress?: () => void;
}

const ACCOUNT_ICONS: Record<string, string> = {
  CHECKING: '💳',
  SAVINGS:  '🏦',
  WALLET:   '👛',
};

const COPY_ICON = require('../../assets/icons/copy.png');

export function AccountCard({ accountType, balance, currency, accountNumber, onPress }: Props) {
  const lastFour = accountNumber.slice(-4);
  const label = ACCOUNT_TYPE_LABELS[accountType] ?? accountType;
  const icon = ACCOUNT_ICONS[accountType] ?? '🏦';

  const showUsdEquiv = currency !== 'USD';
  const usdEquiv = showUsdEquiv
    ? (balance * getExchangeRate(currency, 'USD')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  async function handleCopy() {
    await Clipboard.setStringAsync(accountNumber);
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.wrapper}>
      <LinearGradient
        colors={[colors.cardDark, colors.cardDark2, '#4338CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.iconBadge}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
          </View>
          <View style={styles.chip} />
        </View>

        {/* Balance */}
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <MoneyAmount value={balance} currency={currency} size="large" style={styles.balance} />
          {showUsdEquiv && (
            <Text style={styles.usdEquiv}>≈ ${usdEquiv} USD</Text>
          )}
        </View>

        {/* Account number row */}
        <View style={styles.accountNumberRow}>
          <Text style={styles.accountNumberText}>{accountNumber}</Text>
          <TouchableOpacity onPress={handleCopy} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={COPY_ICON} style={styles.copyIcon} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.cardNumber}>•••• •••• •••• {lastFour}</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{label}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: colors.cardDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    opacity: 0.9,
  },
  balanceBlock: { marginTop: 16 },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balance: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  usdEquiv: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  accountNumberText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  copyIcon: {
    width: 15,
    height: 15,
    tintColor: 'rgba(255,255,255,0.6)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  cardNumber: {
    ...typography.small,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2,
    fontWeight: '500',
  },
  typeTag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
});
