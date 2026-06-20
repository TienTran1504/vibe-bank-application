import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width, height, borderRadius = 4, style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: colors.shimmer, opacity },
        style,
      ]}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="70%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonBox width="40%" height={11} />
      </View>
      <SkeletonBox width={60} height={14} />
    </View>
  );
}

export function AccountCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width="40%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
      <SkeletonBox width="60%" height={32} borderRadius={4} style={{ marginBottom: 12 }} />
      <SkeletonBox width="30%" height={12} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.shimmer,
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    marginVertical: 6,
    justifyContent: 'space-between',
  },
});
