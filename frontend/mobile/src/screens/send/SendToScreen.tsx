import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SendStackParamList } from '../../types/navigation';
import { useLookupAccount } from '../../api/accounts';
import { apiClient } from '../../api/apiClient';
import { AppAlert } from '../../components/AppAlert';
import { ApiResponse, BankAccount } from '@bankapp/shared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<SendStackParamList, 'SendTo'>;

const ACCOUNT_ICONS: Record<string, string> = {
  CHECKING: '💳',
  SAVINGS: '🏦',
  WALLET: '👛',
};

export function SendToScreen({ navigation }: Props) {
  const [accountNumber, setAccountNumber] = useState('');
  const [lookupKey, setLookupKey] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);

  const { data: recipientAccount, isLoading, isError } = useLookupAccount(lookupKey);

  const isVerified = !!recipientAccount && !isLoading && lookupKey === accountNumber.trim();

  // Show error popup when Verify lookup fails
  useEffect(() => {
    if (isError && lookupKey) {
      setErrorMsg('The account number you entered could not be found. Please check the number and try again.');
      setShowError(true);
    }
  }, [isError, lookupKey]);

  function handleInputChange(text: string) {
    setAccountNumber(text);
    if (lookupKey && text.trim() !== lookupKey) {
      setLookupKey('');
    }
  }

  function handleVerify() {
    const trimmed = accountNumber.trim();
    if (!trimmed) {
      setErrorMsg('Please enter an account number before verifying.');
      setShowError(true);
      return;
    }
    // Clear key first so React Query always re-fetches even for the same number
    setLookupKey('');
    setTimeout(() => setLookupKey(trimmed), 0);
  }

  async function handleContinue() {
    // Already verified — navigate immediately
    if (isVerified && recipientAccount) {
      doNavigate(recipientAccount);
      return;
    }
    const trimmed = accountNumber.trim();
    if (!trimmed) {
      setErrorMsg('Please enter an account number before continuing.');
      setShowError(true);
      return;
    }
    // Load info first (same as Verify), then navigate on success
    setIsContinuing(true);
    try {
      const res = await apiClient.get<ApiResponse<BankAccount>>(
        `/accounts/lookup?accountNumber=${encodeURIComponent(trimmed)}`,
      );
      // Show verified row, then navigate
      setLookupKey(trimmed);
      doNavigate(res.data.data);
    } catch {
      setErrorMsg('The account number you entered could not be found. Please check the number and try again.');
      setShowError(true);
    } finally {
      setIsContinuing(false);
    }
  }

  function doNavigate(account: BankAccount) {
    navigation.navigate('EnterAmount', {
      toAccountId: account.id,
      recipientName: account.holderName || `${account.accountType} ••••${account.accountNumber.slice(-4)}`,
      recipientAccountNumber: account.accountNumber,
      recipientCurrency: account.currency,
    });
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 1 of 3</Text>
          </View>
        </View>
        <Text style={styles.title}>Transfer money to</Text>
        <Text style={styles.subtitle}>Enter the recipient's account number (IBAN)</Text>
      </View>

      <View style={styles.body}>
        {/* Input row */}
        <View style={[styles.inputRow, isVerified && styles.inputRowVerified]}>
          <TextInput
            style={styles.input}
            placeholder="e.g. GB60BANK393057417101"
            placeholderTextColor={colors.textMuted}
            value={accountNumber}
            onChangeText={handleInputChange}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.verifyChip}
            onPress={handleVerify}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.verifyChipText}>Verify</Text>}
          </TouchableOpacity>
        </View>

        {/* Verified account info */}
        {isVerified && (
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedIcon}>
              {ACCOUNT_ICONS[recipientAccount.accountType] ?? '🏦'}
            </Text>
            <Text style={styles.verifiedName} numberOfLines={1}>
              {recipientAccount.holderName
                ? `${recipientAccount.holderName} · ${recipientAccount.accountType} · ${recipientAccount.currency}`
                : `${recipientAccount.accountType} · ${recipientAccount.currency}`}
            </Text>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          </View>
        )}

        {/* Gradient tip box */}
        <LinearGradient
          colors={['#EEF2FF', '#E0E7FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipBox}
        >
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Always double-check the account number before sending. Money transfers cannot be reversed once completed.
          </Text>
        </LinearGradient>
      </View>

      {/* Continue — fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          {isContinuing
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.continueBtnText}>Continue</Text>}
        </TouchableOpacity>
      </View>

      {/* Error popup */}
      <AppAlert
        visible={showError}
        type="error"
        title="Account Not Found"
        message={errorMsg}
        onDismiss={() => { setShowError(false); setLookupKey(''); }}
        buttonLabel="Close"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
  },

  header: { paddingHorizontal: 20, marginBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.body, color: colors.primary },
  stepBadge: { backgroundColor: colors.primaryBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  stepText: { ...typography.small, color: colors.primary, fontWeight: '600' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary },

  body: { flex: 1, paddingHorizontal: 20 },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 10,
    marginBottom: 12,
  },
  inputRowVerified: {
    borderColor: colors.success,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 8,
  },
  verifyChip: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 64,
    alignItems: 'center',
  },
  verifyChipText: { ...typography.small, color: colors.white, fontWeight: '700' },

  // Verified name row
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  verifiedIcon: { fontSize: 14 },
  verifiedName: {
    flex: 1,
    ...typography.label,
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },

  // Tip box
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  tipIcon: { marginTop: 1 },
  tipText: {
    flex: 1,
    ...typography.small,
    color: colors.primary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 110 : 120,
    paddingTop: 12,
  },
  continueBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '700' },
});
