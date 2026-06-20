import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../types/navigation';
import { useTransaction } from '../../api/transactions';
import { CURRENCY_SYMBOLS, TRANSACTION_STATUS_LABELS } from '@bankapp/shared';
import { MoneyAmount } from '../../components/MoneyAmount';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ActivityStackParamList, 'TransactionDetail'>;

const statusColors: Record<string, string> = {
  PENDING: colors.warning,
  PROCESSING: colors.warning,
  COMPLETED: colors.success,
  FAILED: colors.danger,
  REVERSED: colors.textSecondary,
};

export function TransactionDetailScreen({ route, navigation }: Props) {
  const { transactionId } = route.params;
  const { data: tx, isLoading } = useTransaction(transactionId);

  if (isLoading || !tx) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const dateStr = new Date(tx.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Transaction Details</Text>

      <View style={styles.amountBlock}>
        <MoneyAmount value={tx.amount} currency={tx.currency} size="large" colorCoded={false} />
        <Text style={[styles.status, { color: statusColors[tx.status] ?? colors.textMuted }]}>
          {TRANSACTION_STATUS_LABELS[tx.status] ?? tx.status}
        </Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Type" value={tx.type} />
        <DetailRow label="From account" value={`…${tx.fromAccountId.slice(-8)}`} />
        <DetailRow label="To account" value={`…${tx.toAccountId.slice(-8)}`} />
        <DetailRow label="Currency" value={tx.currency} />
        <DetailRow label="Date" value={dateStr} />
        {tx.description && <DetailRow label="Note" value={tx.description} />}
        {tx.completedAt && (
          <DetailRow label="Completed" value={new Date(tx.completedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
        )}
        {tx.errorCode && <DetailRow label="Error" value={tx.errorCode} error />}
      </View>

      <Text style={styles.txId}>ID: {tx.id}</Text>
    </View>
  );
}

function DetailRow({ label, value, error }: { label: string; value: string; error?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, error && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { ...typography.body, color: colors.textSecondary },
  value: { ...typography.label, color: colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { ...typography.h3, color: colors.primary },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: 24 },
  amountBlock: { alignItems: 'center', marginBottom: 32 },
  status: { ...typography.label, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  txId: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
