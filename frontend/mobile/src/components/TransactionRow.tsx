import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { TransactionStatus } from '@bankapp/shared';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { MoneyAmount } from './MoneyAmount';

interface Props {
  description?: string;
  amount: number;
  currency: string;
  date: string;
  status: TransactionStatus;
  isOutgoing?: boolean;
}

const STATUS_DOT: Record<TransactionStatus, string> = {
  PENDING:    colors.warning,
  PROCESSING: colors.warning,
  COMPLETED:  colors.success,
  FAILED:     colors.danger,
  REVERSED:   colors.textMuted,
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  COMPLETED:  'Completed',
  FAILED:     'Failed',
  REVERSED:   'Reversed',
};

const SEND_ARROW_ICON    = require('../../assets/icons/send-arrow.png');
const RECEIVE_ARROW_ICON = require('../../assets/icons/receive-arrow.png');

type CategoryResult = { emoji: string | null; arrowImg: 'send' | 'receive' | null; bg: string };

function getCategoryIcon(description?: string, isOutgoing?: boolean): CategoryResult {
  const desc = (description ?? '').toLowerCase();
  if (desc.includes('top') || desc.includes('deposit')) return { emoji: '💰', arrowImg: null, bg: 'transparent' };
  if (desc.includes('food') || desc.includes('dinner') || desc.includes('pizza')) return { emoji: '🍕', arrowImg: null, bg: 'transparent' };
  if (desc.includes('coffee') || desc.includes('cafe'))                            return { emoji: '☕', arrowImg: null, bg: 'transparent' };
  if (desc.includes('shop') || desc.includes('store') || desc.includes('market'))  return { emoji: '🛍️', arrowImg: null, bg: 'transparent' };
  if (isOutgoing) return { emoji: null, arrowImg: 'send',    bg: 'transparent' };
  return           { emoji: null, arrowImg: 'receive', bg: 'transparent' };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TransactionRow({ description, amount, currency, date, status, isOutgoing = true }: Props) {
  const displayAmount = isOutgoing ? -Math.abs(amount) : Math.abs(amount);
  const { emoji, arrowImg, bg } = getCategoryIcon(description, isOutgoing);
  const dotColor = STATUS_DOT[status];

  return (
    <View style={styles.row}>
      {/* Category icon */}
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        {arrowImg === 'send'
          ? <Image source={SEND_ARROW_ICON} style={styles.arrowIcon} />
          : arrowImg === 'receive'
            ? <Image source={RECEIVE_ARROW_ICON} style={styles.arrowIcon} />
            : <Text style={styles.iconText}>{emoji}</Text>}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {description ?? (isOutgoing ? 'Transfer Sent' : 'Transfer Received')}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text style={styles.meta}>{STATUS_LABEL[status]} · {formatDate(date)}</Text>
        </View>
      </View>

      {/* Amount */}
      <MoneyAmount value={displayAmount} currency={currency} size="small" signed colorCoded />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  arrowIcon: {
    width: 26,
    height: 26,
  },
  iconText: {
    fontSize: 20,
  },
  info: { flex: 1 },
  title: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 3,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
