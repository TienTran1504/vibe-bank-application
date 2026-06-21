import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SpendSummary } from '@bankapp/shared';
import { ProfileStackParamList } from '../../types/navigation';
import { useCurrentMonthSpend, useSpendHistory } from '../../api/analytics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Spend'>;

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatAmount(amount: number, currency: string): string {
  return `${currency === 'USD' ? '$' : currency + ' '}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SpendScreen({ navigation }: Props) {
  const {
    data: currentMonth,
    isLoading: currentLoading,
    refetch: refetchCurrent,
  } = useCurrentMonthSpend();
  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useSpendHistory();

  async function handleRefresh() {
    await Promise.all([refetchCurrent(), refetchHistory()]);
  }

  const pastMonths = history?.filter((s) => s.period !== currentMonth?.period) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Spend Analytics</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Current month hero */}
      {currentLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : currentMonth ? (
        <LinearGradient
          colors={[colors.primary, '#4f46e5', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroPeriod}>{formatPeriod(currentMonth.period)}</Text>
          <Text style={styles.heroLabel}>This month you spent</Text>
          <Text style={styles.heroAmount}>{formatAmount(currentMonth.totalSpent, currentMonth.currency)}</Text>

          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-up-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
              <View>
                <Text style={styles.heroStatLabel}>Sent</Text>
                <Text style={styles.heroStatValue}>
                  {formatAmount(currentMonth.totalSpent, currentMonth.currency)}
                </Text>
              </View>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Ionicons name="arrow-down-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
              <View>
                <Text style={styles.heroStatLabel}>Received</Text>
                <Text style={styles.heroStatValue}>
                  {formatAmount(currentMonth.totalReceived, currentMonth.currency)}
                </Text>
              </View>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Ionicons name="swap-horizontal-outline" size={18} color="rgba(255,255,255,0.7)" />
              <View>
                <Text style={styles.heroStatLabel}>Transactions</Text>
                <Text style={styles.heroStatValue}>{currentMonth.transactionCount}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.emptyHero}>
          <Ionicons name="analytics-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyHeroText}>No activity this month yet</Text>
        </View>
      )}

      {/* Net flow */}
      {currentMonth && (
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Net Cash Flow</Text>
          <Text
            style={[
              styles.netAmount,
              { color: currentMonth.totalReceived >= currentMonth.totalSpent ? colors.success : colors.danger },
            ]}
          >
            {currentMonth.totalReceived >= currentMonth.totalSpent ? '+' : ''}
            {formatAmount(currentMonth.totalReceived - currentMonth.totalSpent, currentMonth.currency)}
          </Text>
          <Text style={styles.netSub}>Received minus spent this month</Text>
        </View>
      )}

      {/* History */}
      {pastMonths.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Previous Months</Text>
          <View style={styles.historyCard}>
            {(historyLoading ? [] : pastMonths).map((summary, i) => (
              <View key={summary.period}>
                {i > 0 && <View style={styles.divider} />}
                <HistoryRow summary={summary} />
              </View>
            ))}
          </View>
        </>
      )}

      {!currentLoading && !historyLoading && !currentMonth && pastMonths.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No spend data yet</Text>
          <Text style={styles.emptyBody}>
            Complete a transfer or top-up to start seeing your spending analytics.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function HistoryRow({ summary }: { summary: SpendSummary }) {
  const netPositive = summary.totalReceived >= summary.totalSpent;
  return (
    <View style={historyStyles.row}>
      <View style={historyStyles.left}>
        <Text style={historyStyles.period}>{formatPeriod(summary.period)}</Text>
        <Text style={historyStyles.count}>{summary.transactionCount} transactions</Text>
      </View>
      <View style={historyStyles.right}>
        <Text style={historyStyles.spent}>
          -{formatAmount(summary.totalSpent, summary.currency)}
        </Text>
        <Text style={[historyStyles.net, { color: netPositive ? colors.success : colors.danger }]}>
          {netPositive ? '+' : ''}
          {formatAmount(summary.totalReceived - summary.totalSpent, summary.currency)}
        </Text>
      </View>
    </View>
  );
}

const historyStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  left: {},
  period: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  count: { ...typography.caption, color: colors.textMuted },
  right: { alignItems: 'flex-end' },
  spent: { ...typography.label, color: colors.textSecondary, marginBottom: 2 },
  net: { ...typography.label, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 110 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  back:     { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText: { ...typography.body, color: colors.primary },
  header:   { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },

  loadingCard: {
    height: 180,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroPeriod: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  heroLabel: { ...typography.small, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  heroAmount: { fontSize: 36, fontWeight: '700', color: colors.white, letterSpacing: -0.5, marginBottom: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  heroStatValue: { ...typography.label, color: colors.white, fontWeight: '700', fontSize: 13 },

  emptyHero: {
    height: 140,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyHeroText: { ...typography.body, color: colors.textMuted },

  netCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  netLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  netAmount: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  netSub: { ...typography.caption, color: colors.textMuted },

  sectionTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700', marginBottom: 12 },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: { height: 1, backgroundColor: colors.border },

  emptyState: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
