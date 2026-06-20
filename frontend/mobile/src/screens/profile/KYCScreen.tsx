import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types/navigation';
import { AppAlert } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ProfileStackParamList, 'KYC'>;

const STEPS = [
  { step: '1', icon: '🪪', title: 'National ID / Passport', subtitle: 'Front and back of your ID document' },
  { step: '2', icon: '🤳', title: 'Selfie', subtitle: 'A clear photo of your face' },
  { step: '3', icon: '✅', title: 'Review', subtitle: 'Our team reviews within 24 hours' },
];

export function KYCScreen({ navigation }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          Verifying your identity unlocks full account features, higher transfer limits, and KYC-required actions.
        </Text>

        <View style={styles.stepsCard}>
          {STEPS.map(({ step, icon, title, subtitle }, i) => (
            <View key={step}>
              <View style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{step}</Text>
                  </View>
                  {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
                </View>
                <View style={styles.stepInfo}>
                  <View style={styles.stepTitleRow}>
                    <Text style={styles.stepIcon}>{icon}</Text>
                    <Text style={styles.stepTitle}>{title}</Text>
                  </View>
                  <Text style={styles.stepSubtitle}>{subtitle}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={() => setShowInfo(true)}>
          <Text style={styles.buttonText}>Start Verification</Text>
        </TouchableOpacity>
      </View>

      <AppAlert
        visible={showInfo}
        type="info"
        title="Coming in Phase 4"
        message="Camera integration and KYC document upload are being built as part of the next release. Stay tuned!"
        onDismiss={() => setShowInfo(false)}
        buttonLabel="Got it"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { ...typography.h3, color: colors.primary },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 28, lineHeight: 22 },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepLeft: { alignItems: 'center', marginRight: 16, width: 28 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { ...typography.label, color: colors.white, fontSize: 13 },
  stepConnector: { width: 2, flex: 1, minHeight: 32, backgroundColor: colors.border, marginVertical: 4 },
  stepInfo: { flex: 1, paddingBottom: 20 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stepIcon: { fontSize: 18 },
  stepTitle: { ...typography.h3, color: colors.textPrimary },
  stepSubtitle: { ...typography.body, color: colors.textSecondary },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { ...typography.label, color: colors.white, fontSize: 16, fontWeight: '600' },
});
