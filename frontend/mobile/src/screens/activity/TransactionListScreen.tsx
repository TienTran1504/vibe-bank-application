import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ActivityStackParamList } from '../../types/navigation';
import { useTransactions } from '../../api/transactions';
import { useAccounts } from '../../api/accounts';
import { TransactionRow } from '../../components/TransactionRow';
import { TransactionSkeleton } from '../../components/SkeletonLoader';
import { Transaction, TransactionStatus } from '@bankapp/shared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ActivityStackParamList, 'TransactionList'>;

const FILTERS: { label: string; status?: TransactionStatus }[] = [
  { label: 'All' },
  { label: 'Completed', status: 'COMPLETED' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Failed', status: 'FAILED' },
];

export function TransactionListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<TransactionStatus | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

  const { data: txPage, isLoading, refetch } = useTransactions(0, showAll ? 500 : 5);
  const { data: accounts } = useAccounts();

  const myAccountIds = new Set(accounts?.map((a) => a.id) ?? []);
  const all = txPage?.content ?? [];
  const filtered = filter ? all.filter((tx) => tx.status === filter) : all;

  async function handleRefresh() {
    setShowAll(false);
    await refetch();
  }

  return (
    <View style={styles.container}>
      {/* Header with Home back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.getParent()?.navigate('HomeTab')}
        >
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Activity</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterBtn, filter === f.status && styles.filterBtnActive]}
            onPress={() => setFilter(f.status)}
          >
            <Text style={[styles.filterText, filter === f.status && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !showAll ? (
        <>
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
        </>
      ) : (
        <FlatList<Transaction>
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}>
              <TransactionRow
                description={item.description}
                amount={item.amount}
                currency={item.currency}
                date={item.createdAt}
                status={item.status}
                isOutgoing={myAccountIds.has(item.fromAccountId)}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
          ListFooterComponent={
            !showAll && !txPage?.last ? (
              isLoading ? (
                <ActivityIndicator style={{ padding: 16 }} color={colors.primary} />
              ) : (
                <TouchableOpacity style={styles.loadMore} onPress={() => setShowAll(true)}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  back:     { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText: { ...typography.body, color: colors.primary },
  header:   { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.small, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  loadMore: { padding: 16, alignItems: 'center' },
  loadMoreText: { ...typography.label, color: colors.primary },
});
