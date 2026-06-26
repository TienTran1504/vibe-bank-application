import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardTransaction } from '@bankapp/shared';
import { CardsStackParamList } from '../../types/navigation';
import {
  useCards,
  useCreateVirtualCard,
  useFreezeCard,
  useSetSpendingLimit,
  useCardPay,
  useCardTransactions,
} from '../../api/cards';
import { useAccounts } from '../../api/accounts';
import { AppAlert } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<CardsStackParamList, 'CardsList'>;

const DECLINE_MESSAGES: Record<string, string> = {
  CARD_FROZEN: 'This card is frozen. Unfreeze it to make payments.',
  CARD_CANCELLED: 'This card has been cancelled.',
  CARD_EXPIRED: 'This card has expired and can no longer be used.',
  LIMIT_EXCEEDED: "This payment exceeds the card's daily spending limit.",
  INSUFFICIENT_FUNDS: "Your linked account doesn't have enough money for this payment.",
};

export function CardsScreen({ navigation }: Props) {
  const { data: cards, isLoading, refetch } = useCards();
  const { data: accounts } = useAccounts();

  // Refetch whenever the Cards tab gains focus — the tab stays mounted, so without
  // this a changed expiry/status/limit would keep showing stale cached values.
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const createCard = useCreateVirtualCard();
  const freezeCard = useFreezeCard();
  const setLimit = useSetSpendingLimit();
  const cardPay = useCardPay();

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [limitSheet, setLimitSheet] = useState<{ cardId: string; current: string } | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [paySheet, setPaySheet] = useState<Card | null>(null);
  const [merchant, setMerchant] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [historyCard, setHistoryCard] = useState<Card | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  function openPaySheet(card: Card) {
    setMerchant('');
    setPayAmount('');
    setPaySheet(card);
  }

  async function handlePay() {
    if (!paySheet) return;
    const parsed = parseFloat(payAmount);
    if (!merchant.trim()) {
      setAlert({ type: 'error', title: 'Merchant Required', message: 'Enter a merchant name.' });
      return;
    }
    if (isNaN(parsed) || parsed <= 0) {
      setAlert({ type: 'error', title: 'Invalid Amount', message: 'Enter an amount greater than $0.' });
      return;
    }
    try {
      const tx = await cardPay.mutateAsync({
        cardId: paySheet.id,
        merchant: merchant.trim(),
        amount: parsed.toFixed(2),
        currency: 'USD',
      });
      setPaySheet(null);
      setAlert({
        type: 'success',
        title: 'Payment Approved',
        message: `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid to ${tx.merchant}.`,
      });
    } catch (e: any) {
      const code: string | undefined = e?.response?.data?.error;
      const reason = (code && DECLINE_MESSAGES[code]) || e?.response?.data?.message || 'Payment could not be completed.';
      setPaySheet(null);
      setAlert({ type: 'error', title: 'Payment Declined', message: reason });
    }
  }

  async function handleCreate() {
    if (!selectedAccountId) return;
    try {
      await createCard.mutateAsync({ accountId: selectedAccountId });
      setShowCreateSheet(false);
      setSelectedAccountId(null);
      setAlert({ type: 'success', title: 'Card Created', message: 'Your virtual card is ready to use.' });
    } catch {
      setAlert({ type: 'error', title: 'Creation Failed', message: 'Unable to create card. Please try again.' });
    }
  }

  async function handleFreeze(card: Card) {
    const shouldFreeze = card.status === 'ACTIVE';
    try {
      await freezeCard.mutateAsync({ cardId: card.id, freeze: shouldFreeze });
      setAlert({
        type: 'success',
        title: shouldFreeze ? 'Card Frozen' : 'Card Unfrozen',
        message: shouldFreeze
          ? 'Your card is now frozen. No transactions will be approved.'
          : 'Your card has been reactivated.',
      });
    } catch {
      setAlert({ type: 'error', title: 'Action Failed', message: 'Could not update card status. Try again.' });
    }
  }

  function openLimitSheet(card: Card) {
    setLimitInput(card.spendingLimit ? String(card.spendingLimit) : '');
    setLimitSheet({ cardId: card.id, current: card.spendingLimit ? `$${card.spendingLimit}` : 'None' });
  }

  async function handleSaveLimit() {
    if (!limitSheet || !limitInput) return;
    const parsed = parseFloat(limitInput);
    if (isNaN(parsed) || parsed <= 0) {
      setAlert({ type: 'error', title: 'Invalid Amount', message: 'Enter a daily limit greater than $0.' });
      return;
    }
    try {
      await setLimit.mutateAsync({ cardId: limitSheet.cardId, dailyLimit: parsed.toFixed(2) });
      setLimitSheet(null);
      setAlert({
        type: 'success',
        title: 'Limit Updated',
        message: `Daily limit set to $${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      });
    } catch {
      setAlert({ type: 'error', title: 'Update Failed', message: 'Could not update spending limit. Try again.' });
    }
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.getParent()?.navigate('HomeTab')}
          >
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Cards</Text>
          <View style={{ width: 70 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : cards && cards.length > 0 ? (
          cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              accountLast4={accounts?.find((a) => a.id === card.accountId)?.accountNumber.slice(-4)}
              onFreeze={handleFreeze}
              onSetLimit={openLimitSheet}
              onPay={openPaySheet}
              onHistory={setHistoryCard}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptyBody}>
              Create a virtual card linked to one of your accounts.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreateSheet(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>Request Virtual Card</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Card Sheet */}
      <Modal
        visible={showCreateSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCreateSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowCreateSheet(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Request Virtual Card</Text>
            <TouchableOpacity onPress={() => setShowCreateSheet(false)} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetLabel}>Link to Account</Text>
          {(!accounts || accounts.length === 0) ? (
            <Text style={styles.hintText}>Create a bank account first to link a card.</Text>
          ) : (
            accounts.map((acc) => {
              const active = acc.id === selectedAccountId;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.accRow, active && styles.accRowActive]}
                  onPress={() => setSelectedAccountId(acc.id)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={[styles.accType, active && styles.accTextActive]}>
                      {acc.accountType}
                    </Text>
                    <Text style={[styles.accNum, active && styles.accSubActive]}>
                      ···· {acc.accountNumber.slice(-4)}
                    </Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.createBtn, (!selectedAccountId || createCard.isPending) && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={!selectedAccountId || createCard.isPending}
            activeOpacity={0.85}
          >
            {createCard.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createBtnText}>Create Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Spending Limit Sheet */}
      <Modal
        visible={!!limitSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setLimitSheet(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setLimitSheet(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Daily Spending Limit</Text>
            <TouchableOpacity onPress={() => setLimitSheet(null)} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          {limitSheet && (
            <Text style={styles.hintText}>Current limit: {limitSheet.current}</Text>
          )}
          <View style={styles.limitRow}>
            <Text style={styles.limitSymbol}>$</Text>
            <TextInput
              style={styles.limitInput}
              value={limitInput}
              onChangeText={(v) => setLimitInput(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>
          <View style={styles.chipRow}>
            {['100', '500', '1000', '5000'].map((v) => (
              <TouchableOpacity key={v} style={styles.chip} onPress={() => setLimitInput(v)}>
                <Text style={styles.chipText}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.createBtn, (!limitInput || setLimit.isPending) && styles.btnDisabled]}
            onPress={handleSaveLimit}
            disabled={!limitInput || setLimit.isPending}
            activeOpacity={0.85}
          >
            {setLimit.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createBtnText}>Save Limit</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Pay With Card Sheet */}
      <Modal
        visible={!!paySheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPaySheet(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPaySheet(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Pay with card</Text>
            <TouchableOpacity onPress={() => setPaySheet(null)} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>
            Debits the card's linked account. Frozen cards and over-limit payments are declined.
          </Text>

          <Text style={styles.sheetLabel}>Merchant</Text>
          <TextInput
            style={styles.merchantInput}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. Apple Store"
            placeholderTextColor={colors.textMuted}
            maxLength={120}
          />

          <Text style={[styles.sheetLabel, { marginTop: 16 }]}>Amount</Text>
          <View style={styles.limitRow}>
            <Text style={styles.limitSymbol}>$</Text>
            <TextInput
              style={styles.limitInput}
              value={payAmount}
              onChangeText={(v) => setPayAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.chipRow}>
            {['5', '20', '50', '100'].map((v) => (
              <TouchableOpacity key={v} style={styles.chip} onPress={() => setPayAmount(v)}>
                <Text style={styles.chipText}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createBtn, (!merchant || !payAmount || cardPay.isPending) && styles.btnDisabled]}
            onPress={handlePay}
            disabled={!merchant || !payAmount || cardPay.isPending}
            activeOpacity={0.85}
          >
            {cardPay.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createBtnText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Card Transaction History Sheet */}
      <Modal
        visible={!!historyCard}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setHistoryCard(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setHistoryCard(null)} />
        {historyCard && <CardHistorySheet card={historyCard} onClose={() => setHistoryCard(null)} />}
      </Modal>

      <AppAlert
        visible={!!alert}
        type={alert?.type ?? 'success'}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        onDismiss={() => setAlert(null)}
      />
    </>
  );
}

function CardHistorySheet({ card, onClose }: { card: Card; onClose: () => void }) {
  const { data, isLoading } = useCardTransactions(card.id, 0, 50);
  const txns = data?.content ?? [];

  return (
    <View style={[styles.sheet, { maxHeight: '78%' }]}>
      <View style={styles.handle} />
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Card Transactions</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hintText}>{card.cardNumberMasked}</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
      ) : txns.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
          <Text style={styles.hintText}>No card payments yet.</Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {txns.map((tx) => (
            <CardTxRow key={tx.id} tx={tx} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function CardTxRow({ tx }: { tx: CardTransaction }) {
  const declined = tx.status === 'DECLINED';
  return (
    <View style={cardStyles.txRow}>
      <View style={[cardStyles.txIcon, { backgroundColor: declined ? '#fff0f0' : '#ecfdf5' }]}>
        <Ionicons
          name={declined ? 'close-circle' : 'checkmark-circle'}
          size={20}
          color={declined ? colors.danger : colors.success}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cardStyles.txMerchant} numberOfLines={1}>{tx.merchant}</Text>
        <Text style={cardStyles.txMeta}>
          {declined
            ? `Declined · ${tx.declineReason ?? ''}`
            : new Date(tx.authorizedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <Text style={[cardStyles.txAmount, { color: declined ? colors.textMuted : colors.textPrimary }]}>
        {declined ? '' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

function CardItem({
  card,
  accountLast4,
  onFreeze,
  onSetLimit,
  onPay,
  onHistory,
}: {
  card: Card;
  accountLast4?: string;
  onFreeze: (card: Card) => void;
  onSetLimit: (card: Card) => void;
  onPay: (card: Card) => void;
  onHistory: (card: Card) => void;
}) {
  const isFrozen = card.status === 'FROZEN';
  const today = new Date().toISOString().slice(0, 10);
  const isExpired = !!card.expiryDate && card.expiryDate < today;
  const expiry = card.expiryDate
    ? card.expiryDate.substring(5, 7) + '/' + card.expiryDate.substring(2, 4)
    : '••/••';

  return (
    <View style={cardStyles.wrapper}>
      <LinearGradient
        colors={isFrozen || isExpired ? ['#6b7280', '#9ca3af'] : [colors.primary, colors.primaryLight]}
        style={cardStyles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={cardStyles.topRow}>
          <Text style={cardStyles.cardType}>{card.cardType}</Text>
          {isFrozen ? (
            <View style={cardStyles.frozenBadge}>
              <Ionicons name="snow-outline" size={12} color={colors.white} />
              <Text style={cardStyles.frozenText}>Frozen</Text>
            </View>
          ) : isExpired ? (
            <View style={cardStyles.frozenBadge}>
              <Ionicons name="time-outline" size={12} color={colors.white} />
              <Text style={cardStyles.frozenText}>Expired</Text>
            </View>
          ) : null}
        </View>
        <Text style={cardStyles.number}>{card.cardNumberMasked}</Text>
        <View style={cardStyles.footer}>
          <View>
            {accountLast4 ? (
              <Text style={cardStyles.acctLabel}>ACCOUNT  •••• {accountLast4}</Text>
            ) : null}
            <Text style={cardStyles.expiry}>VALID THRU  {expiry}</Text>
          </View>
          <Text style={cardStyles.network}>VISA</Text>
        </View>
      </LinearGradient>

      <View style={cardStyles.actions}>
        <View style={cardStyles.actionRow}>
          <View>
            <Text style={cardStyles.actionLabel}>Freeze Card</Text>
            <Text style={cardStyles.actionSub}>{isFrozen ? 'Card is frozen' : 'Card is active'}</Text>
          </View>
          <Switch
            value={isFrozen}
            onValueChange={() => onFreeze(card)}
            trackColor={{ false: colors.border, true: '#bfdbfe' }}
            thumbColor={isFrozen ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={cardStyles.divider} />

        <TouchableOpacity
          style={cardStyles.actionRow}
          onPress={() => onSetLimit(card)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={cardStyles.actionLabel}>Daily Spending Limit</Text>
            <Text style={cardStyles.actionSub}>
              {card.spendingLimit
                ? `$${Number(card.spendingLimit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day`
                : 'No limit set'}
            </Text>
          </View>
          <Text style={cardStyles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={cardStyles.divider} />

        <TouchableOpacity
          style={cardStyles.actionRow}
          onPress={() => onHistory(card)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={cardStyles.actionLabel}>Transaction History</Text>
            <Text style={cardStyles.actionSub}>View card payments</Text>
          </View>
          <Text style={cardStyles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[cardStyles.payBtn, isFrozen && cardStyles.payBtnFrozen]}
          onPress={() => onPay(card)}
          activeOpacity={0.85}
        >
          <Ionicons name="card-outline" size={18} color={colors.white} />
          <Text style={cardStyles.payBtnText}>Pay with card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  card: {
    borderRadius: 20,
    padding: 24,
    height: 180,
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: {
    ...typography.label,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  frozenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  frozenText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  number: { ...typography.h2, color: colors.white, letterSpacing: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  acctLabel: { ...typography.caption, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, marginBottom: 3, fontWeight: '600' },
  expiry: { ...typography.small, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  network: { ...typography.h3, color: colors.white, fontStyle: 'italic' },
  actions: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionLabel: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  actionSub: { ...typography.caption, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border },
  chevron: { ...typography.h3, color: colors.textMuted, lineHeight: 24 },

  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginVertical: 12,
  },
  payBtnFrozen: { backgroundColor: colors.textMuted },
  payBtnText: { ...typography.label, color: colors.white, fontWeight: '700' },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  txIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  txMerchant: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  txMeta: { ...typography.caption, color: colors.textMuted },
  txAmount: { ...typography.label, fontWeight: '700' },
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

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, gap: 12 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginTop: 8,
  },
  addBtnText: { ...typography.label, color: colors.white, fontSize: 15, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
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
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  sheetLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  hintText: { ...typography.body, color: colors.textMuted, marginBottom: 16 },

  accRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  accRowActive: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  accType: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  accNum: { ...typography.caption, color: colors.textMuted },
  accTextActive: { color: colors.primary },
  accSubActive: { color: colors.primaryLight },

  createBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.45 },
  createBtnText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '700' },

  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    marginBottom: 16,
    paddingBottom: 6,
  },
  limitSymbol: { ...typography.amountMedium, color: colors.textPrimary, marginRight: 6 },
  limitInput: { flex: 1, ...typography.amountMedium, color: colors.textPrimary },
  merchantInput: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.label, color: colors.primary, fontWeight: '600' },
});
