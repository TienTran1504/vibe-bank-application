import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../types/navigation';
import { useAccount } from '../../api/accounts';
import { useTransactions } from '../../api/transactions';
import { AccountCard } from '../../components/AccountCard';
import { TransactionRow } from '../../components/TransactionRow';
import { TransactionSkeleton } from '../../components/SkeletonLoader';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Transaction } from '@bankapp/shared';

type Props = NativeStackScreenProps<HomeStackParamList, 'AccountDetail'>;

export function AccountDetailScreen({ route, navigation }: Props) {
  const { accountId } = route.params;
  const [page, setPage] = useState(0);
  const { data: account, isLoading: accountLoading } = useAccount(accountId);
  const { data: txPage, isLoading: txLoading } = useTransactions(page);

  const transactions = txPage?.content ?? [];
  const hasMore = !txPage?.last;

  function renderHeader() {
    if (accountLoading || !account) return null;
    return (
      <>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <AccountCard
          accountType={account.accountType}
          balance={account.availableBalance}
          currency={account.currency}
          accountNumber={account.accountNumber}
        />
        <Text style={styles.sectionTitle}>Transactions</Text>
      </>
    );
  }

  function renderFooter() {
    if (!hasMore) return null;
    return (
      <TouchableOpacity style={styles.loadMore} onPress={() => setPage((p) => p + 1)}>
        <Text style={styles.loadMoreText}>Load more</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {txLoading && transactions.length === 0 ? (
        <View style={styles.content}>
          {renderHeader()}
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
        </View>
      ) : (
        <FlatList<Transaction>
          data={transactions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <TransactionRow
              description={item.description}
              amount={item.amount}
              currency={item.currency}
              date={item.createdAt}
              status={item.status}
              isOutgoing={item.fromAccountId === accountId}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions for this account yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { ...typography.h3, color: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: 24, marginBottom: 8 },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  loadMore: { padding: 16, alignItems: 'center' },
  loadMoreText: { ...typography.label, color: colors.primary },
});
