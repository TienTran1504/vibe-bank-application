import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useVerifyMfa, useSendMfa } from '../../api/auth';
import { AppAlert, AlertType } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'MFA'>;

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
}

export function MFAScreen({ navigation }: Props) {
  const [otp, setOtp] = useState('');
  const [alert, setAlert] = useState<AlertState>({ visible: false, type: 'info', title: '', message: '' });

  const { setTokens } = useAuthStore();
  const verifyMfa = useVerifyMfa();
  const sendMfa = useSendMfa();

  function showAlert(type: AlertType, title: string, message: string) {
    setAlert({ visible: true, type, title, message });
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      showAlert('warning', 'Incomplete Code', 'Please enter the full 6-digit verification code.');
      return;
    }
    try {
      const tokens = await verifyMfa.mutateAsync({ otp });
      await setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    } catch {
      showAlert('error', 'Invalid Code', 'The code is incorrect or has expired. Request a new one below.');
    }
  }

  async function handleResend() {
    try {
      await sendMfa.mutateAsync();
      showAlert('success', 'Code Sent!', 'A new 6-digit code has been sent to your phone. It expires in 5 minutes.');
    } catch {
      showAlert('error', 'Send Failed', 'Unable to resend the code right now. Please try again.');
    }
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Text style={styles.lockIcon}>🔐</Text>
        </View>

        <Text style={styles.title}>Verification code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your phone.{'\n'}It expires in 5 minutes.
        </Text>

        <TextInput
          style={[styles.otpInput, otp.length > 0 && otp.length < 6 ? styles.otpPartial : null]}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="• • • • • •"
          placeholderTextColor={colors.textMuted}
          textAlign="center"
        />

        {otp.length > 0 && otp.length < 6 && (
          <Text style={styles.partialHint}>{6 - otp.length} digit{otp.length !== 5 ? 's' : ''} remaining</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (verifyMfa.isPending || otp.length !== 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={verifyMfa.isPending || otp.length !== 6}
        >
          <Text style={styles.buttonText}>{verifyMfa.isPending ? 'Verifying…' : 'Verify Code'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={sendMfa.isPending} style={styles.resendRow}>
          <Text style={styles.resendText}>
            {sendMfa.isPending ? 'Sending…' : "Didn't receive it? Resend code"}
          </Text>
        </TouchableOpacity>
      </View>

      <AppAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onDismiss={() => setAlert((a) => ({ ...a, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { ...typography.h3, color: colors.primary },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  lockIcon: { fontSize: 56 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 36, textAlign: 'center', lineHeight: 22 },
  otpInput: {
    height: 72,
    backgroundColor: colors.surface,
    borderRadius: 16,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
    letterSpacing: 16,
    marginBottom: 8,
  },
  otpPartial: {
    borderColor: colors.primaryLight,
  },
  partialHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '600' },
  resendRow: { marginTop: 20, alignItems: 'center' },
  resendText: { ...typography.body, color: colors.primaryLight, fontWeight: '500' },
});
