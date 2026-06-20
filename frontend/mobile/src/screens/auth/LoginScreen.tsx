import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useLogin } from '../../api/auth';
import { AppAlert, AlertType } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onDismiss: () => void;
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onDismiss: () => setAlert((a) => ({ ...a, visible: false })),
  });

  const { setTokens } = useAuthStore();
  const login = useLogin();

  function showAlert(type: AlertType, title: string, message: string) {
    setAlert({
      visible: true,
      type,
      title,
      message,
      onDismiss: () => setAlert((a) => ({ ...a, visible: false })),
    });
  }

  async function handleLogin() {
    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email is required.');
      hasError = true;
    }
    if (!password) {
      showAlert('warning', 'Missing password', 'Please enter your password to sign in.');
      return;
    }
    if (hasError) return;

    try {
      const tokens = await login.mutateAsync({ email: email.trim(), password });
      if (tokens.requiresMfa) {
        navigation.navigate('MFA');
      } else {
        await setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Incorrect email or password. Please try again.';
      showAlert('error', 'Sign In Failed', msg);
    }
  }

  async function handleBiometric() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      showAlert('warning', 'Biometric Unavailable', 'No biometric authentication is set up on this device.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to BankApp',
      fallbackLabel: 'Use password',
    });
    if (result.success) {
      showAlert('info', 'Sign in with Biometrics', 'Please sign in with email and password first to link your biometrics.');
    }
  }

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(v) => { setEmail(v); setEmailError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, login.isPending && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={login.isPending}
          >
            <Text style={styles.buttonText}>{login.isPending ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
            <Text style={styles.biometricIcon}>⬡</Text>
            <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.link}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onDismiss={alert.onDismiss}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 32 },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  input: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 4,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#fff8f8',
  },
  errorText: { ...typography.small, color: colors.danger, marginBottom: 10, marginLeft: 4 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20, marginTop: 8 },
  forgotText: { ...typography.small, color: colors.primaryLight, fontWeight: '600' },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.small, color: colors.textMuted },
  biometricButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  biometricIcon: { fontSize: 20, color: colors.primary },
  biometricText: { ...typography.label, color: colors.textPrimary, fontSize: 15 },
  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { ...typography.body, color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600' },
});
