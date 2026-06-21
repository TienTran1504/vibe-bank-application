import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification, NotificationCategory } from '@bankapp/shared';
import { HomeStackParamList } from '../../types/navigation';
import { useNotifications, useMarkRead, notifKeys } from '../../api/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

const TYPE_ICON: Record<NotificationCategory, { name: string; bg: string; color: string }> = {
  TRANSACTION: { name: 'swap-horizontal',     bg: '#eff6ff', color: colors.primary },
  KYC:         { name: 'person-circle',        bg: '#f0fdf4', color: colors.success },
  FRAUD:       { name: 'warning',              bg: '#fff7ed', color: colors.warning },
  WALLET:      { name: 'wallet',               bg: '#faf5ff', color: '#7c3aed' },
  SYSTEM:      { name: 'information-circle',   bg: colors.background, color: colors.textSecondary },
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7)   return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationsScreen({ navigation }: Props) {
  const { data, isLoading, refetch } = useNotifications(0, 50);
  const markRead = useMarkRead();
  const queryClient = useQueryClient();

  const notifications = data?.content ?? [];

  async function handleMarkRead(notif: AppNotification) {
    if (notif.read) return;
    await markRead.mutateAsync(notif.id);
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead.mutateAsync(n.id)));
    queryClient.invalidateQueries({ queryKey: notifKeys.unread });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 88 }} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyBody}>You're all caught up! Notifications from transfers, KYC, and wallet activity will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <NotifRow notif={item} onPress={() => handleMarkRead(item)} />
          )}
        />
      )}
    </View>
  );
}

function NotifRow({ notif, onPress }: { notif: AppNotification; onPress: () => void }) {
  const meta = TYPE_ICON[notif.type] ?? TYPE_ICON['SYSTEM'];
  const timestamp = formatTime(notif.sentAt ?? notif.createdAt);

  return (
    <TouchableOpacity
      style={[styles.row, !notif.read && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {!notif.read && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.name as any} size={22} color={meta.color} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>{notif.title}</Text>
          <Text style={styles.rowTime}>{timestamp}</Text>
        </View>
        <Text style={styles.rowBody2} numberOfLines={2}>{notif.body}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  back:     { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText: { ...typography.body, color: colors.primary },
  header:   { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  markAllBtn: { width: 88, alignItems: 'flex-end' },
  markAllText: { ...typography.small, color: colors.primary, fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 110 },

  separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    position: 'relative',
  },
  rowUnread: {
    backgroundColor: '#f5f7ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginHorizontal: -8,
  },
  unreadDot: {
    position: 'absolute',
    top: 18,
    left: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  rowTitle: { ...typography.label, color: colors.textPrimary, fontWeight: '700', flex: 1, marginRight: 8 },
  rowTime:  { ...typography.caption, color: colors.textMuted, flexShrink: 0 },
  rowBody2: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  emptyBody:  { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
