import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AppAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onDismiss: () => void;
  /** Label for the primary dismiss / OK button */
  buttonLabel?: string;
  /** When provided, renders a two-button confirm dialog */
  confirmLabel?: string;
  onConfirm?: () => void;
}

const CONFIG = {
  success: { icon: '✓', iconBg: '#e8f7f0', iconColor: colors.success, accentColor: colors.success },
  error:   { icon: '✕', iconBg: '#fde8ea', iconColor: colors.danger,  accentColor: colors.danger  },
  warning: { icon: '!', iconBg: '#fff8e6', iconColor: colors.warning,  accentColor: colors.warning },
  info:    { icon: 'i', iconBg: '#e6f0ff', iconColor: colors.primary,  accentColor: colors.primary },
} as const;

export function AppAlert({
  visible,
  type,
  title,
  message,
  onDismiss,
  buttonLabel = 'Got it',
  confirmLabel,
  onConfirm,
}: AppAlertProps) {
  const cfg = CONFIG[type];
  const isConfirmMode = !!onConfirm && !!confirmLabel;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top accent stripe */}
          <View style={[styles.stripe, { backgroundColor: cfg.accentColor }]} />

          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
            <Text style={[styles.iconText, { color: cfg.iconColor }]}>{cfg.icon}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {isConfirmMode ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: cfg.accentColor }]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.singleBtn, { backgroundColor: cfg.accentColor }]}
              onPress={onDismiss}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>{buttonLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  stripe: {
    width: '100%',
    height: 6,
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  singleBtn: {
    width: '85%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '90%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    ...typography.label,
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
