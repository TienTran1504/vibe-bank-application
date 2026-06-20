import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CardsStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<CardsStackParamList, 'CardsList'>;

export function CardsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
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

      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.cardType}>Virtual Card</Text>
        <Text style={styles.cardNumber}>•••• •••• •••• ••••</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardLabel}>VALID THRU  ••/••</Text>
          <Text style={styles.cardNetwork}>VISA</Text>
        </View>
      </LinearGradient>

      <Text style={styles.comingSoon}>
        Card management (freeze, limits, physical card) coming in Phase 4 once the Card Service is built.
      </Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>+ Request Virtual Card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 56 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back:      { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText:  { ...typography.body, color: colors.primary },
  header: { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  card: {
    borderRadius: 20,
    padding: 24,
    height: 180,
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardType: { ...typography.label, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2 },
  cardNumber: { ...typography.h2, color: colors.white, letterSpacing: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { ...typography.small, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  cardNetwork: { ...typography.h3, color: colors.white, fontStyle: 'italic' },
  comingSoon: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  button: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { ...typography.label, color: colors.primary },
});
