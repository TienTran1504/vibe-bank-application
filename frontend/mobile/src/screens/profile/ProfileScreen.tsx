import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../api/auth';
import { AppAlert } from '../../components/AppAlert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProfileScreen({ navigation }: Props) {
  const { userId, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState('');

  async function handleLogoutConfirm() {
    setShowLogoutConfirm(false);
    try {
      await logoutMutation.mutateAsync();
    } finally {
      await logout();
    }
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.getParent()?.navigate('HomeTab')}
          >
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Profile</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>
          <Text style={styles.userId}>{userId ? `ID: …${userId.slice(-8)}` : 'Loading…'}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>● Active</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem label="KYC Verification" icon="🪪" badge="Pending" onPress={() => navigation.navigate('KYC')} />
          <MenuItem label="Security Settings" icon="🔒" onPress={() => setShowComingSoon('Security settings')} />
          <MenuItem label="Notification Preferences" icon="🔔" onPress={() => setShowComingSoon('Notification preferences')} />
        </View>

        {/* Support section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem label="Help & FAQ" icon="❓" onPress={() => setShowComingSoon('Help & FAQ')} />
          <MenuItem label="Contact Support" icon="💬" onPress={() => setShowComingSoon('Contact support')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutConfirm(true)}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>BankApp v1.0.0</Text>
      </ScrollView>

      {/* Logout confirm */}
      <AppAlert
        visible={showLogoutConfirm}
        type="warning"
        title="Log Out?"
        message="You'll be signed out of your account. Make sure you have your credentials to sign back in."
        onDismiss={() => setShowLogoutConfirm(false)}
        confirmLabel="Log Out"
        onConfirm={handleLogoutConfirm}
      />

      {/* Coming soon */}
      <AppAlert
        visible={!!showComingSoon}
        type="info"
        title="Coming Soon"
        message={`${showComingSoon} will be available in a future update.`}
        onDismiss={() => setShowComingSoon('')}
      />
    </>
  );
}

function MenuItem({
  label,
  icon,
  badge,
  onPress,
}: {
  label: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={menuStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={menuStyles.left}>
        <Text style={menuStyles.icon}>{icon}</Text>
        <Text style={menuStyles.label}>{label}</Text>
      </View>
      <View style={menuStyles.right}>
        {badge && <Text style={menuStyles.badge}>{badge}</Text>}
        <Text style={menuStyles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 18, width: 24, textAlign: 'center' },
  label: { ...typography.body, color: colors.textPrimary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    ...typography.caption,
    color: colors.warning,
    backgroundColor: '#fff8e7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chevron: { ...typography.h3, color: colors.textMuted, lineHeight: 24 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back:      { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText:  { ...typography.body, color: colors.primary },
  header: { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  avatarBlock: { alignItems: 'center', marginBottom: 32 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.h1, color: colors.white, fontSize: 32 },
  userId: { ...typography.small, color: colors.textMuted, marginBottom: 6 },
  verifiedBadge: {
    backgroundColor: '#e8f7f0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logoutBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  logoutText: { ...typography.label, color: colors.danger, fontSize: 16, fontWeight: '600' },
  version: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});
