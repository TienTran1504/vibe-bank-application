import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useRegister } from '../../api/auth';
import { AppAlert, AlertType } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface FieldErrors {
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
}

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onDismiss: () => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Accepts +84xxxxxxxxx, +1xxxxxxxxxx style, or 0xxxxxxxxx (9-10 digits) local
const PHONE_REGEX = /^(\+[1-9]\d{7,14}|0\d{9,10})$/;
// min 8, uppercase, lowercase, digit, special
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validate(
  email: string,
  phone: string,
  password: string,
  confirm: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Enter a valid email address (e.g. you@example.com).';
  }

  if (!phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_REGEX.test(phone.trim())) {
    errors.phone = 'Enter a valid phone number (e.g. +84901234567 or 0901234567).';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.password = 'Min 8 characters with uppercase, lowercase, digit & special character (@$!%*?&).';
  }

  if (!confirm) {
    errors.confirm = 'Please confirm your password.';
  } else if (password !== confirm) {
    errors.confirm = 'Passwords do not match.';
  }

  return errors;
}

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onDismiss: () => setAlert((a) => ({ ...a, visible: false })),
  });

  const register = useRegister();

  function showAlert(type: AlertType, title: string, message: string, afterDismiss?: () => void) {
    setAlert({
      visible: true,
      type,
      title,
      message,
      onDismiss: () => {
        setAlert((a) => ({ ...a, visible: false }));
        afterDismiss?.();
      },
    });
  }

  async function handleRegister() {
    const errors = validate(email, phone, password, confirm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      await register.mutateAsync({ email: email.trim(), phone: phone.trim(), password });
      showAlert('success', 'Account Created!', 'Your account is ready. Please sign in to continue.', () =>
        navigation.navigate('Login'),
      );
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { message?: string; details?: { field: string; message: string }[] } } })?.response?.data;

      // Map server field-level errors inline
      if (apiError?.details && apiError.details.length > 0) {
        const serverErrors: FieldErrors = {};
        for (const detail of apiError.details) {
          if (detail.field === 'email') serverErrors.email = detail.message;
          else if (detail.field === 'phone') serverErrors.phone = detail.message;
          else if (detail.field === 'password') serverErrors.password = detail.message;
        }
        if (Object.keys(serverErrors).length > 0) {
          setFieldErrors(serverErrors);
          return;
        }
      }

      showAlert('error', 'Registration Failed', apiError?.message ?? 'Something went wrong. Please try again.');
    }
  }

  const inputStyle = (field: keyof FieldErrors) => [
    styles.input,
    fieldErrors[field] ? styles.inputError : null,
  ];

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join BankApp today</Text>

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldErrors((e) => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}

          {/* Phone */}
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={inputStyle('phone')}
            placeholder="+84901234567 or 0901234567"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={(v) => { setPhone(v); setFieldErrors((e) => ({ ...e, phone: undefined })); }}
            keyboardType="phone-pad"
          />
          {fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={inputStyle('password')}
            placeholder="Min 8 chars · A-Z · 0-9 · @$!%*?&"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={(v) => { setPassword(v); setFieldErrors((e) => ({ ...e, password: undefined })); }}
            secureTextEntry
          />
          {fieldErrors.password
            ? <Text style={styles.errorText}>{fieldErrors.password}</Text>
            : <Text style={styles.hint}>Uppercase · lowercase · digit · special (@$!%*?&)</Text>}

          {/* Confirm */}
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={inputStyle('confirm')}
            placeholder="Re-enter your password"
            placeholderTextColor={colors.textMuted}
            value={confirm}
            onChangeText={(v) => { setConfirm(v); setFieldErrors((e) => ({ ...e, confirm: undefined })); }}
            secureTextEntry
          />
          {fieldErrors.confirm && <Text style={styles.errorText}>{fieldErrors.confirm}</Text>}

          <TouchableOpacity
            style={[styles.button, register.isPending && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={register.isPending}
          >
            <Text style={styles.buttonText}>
              {register.isPending ? 'Creating account…' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.loginHint}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Sign in</Text>
          </Text>
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
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { ...typography.h3, color: colors.primary },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 28 },

  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
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
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginBottom: 12,
    marginLeft: 4,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '600' },
  loginHint: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },
  loginLink: { color: colors.primary, fontWeight: '600' },
});
