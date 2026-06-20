import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { CURRENCY_SYMBOLS } from '@bankapp/shared';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface Props {
  value: number;
  currency?: string;
  size?: 'large' | 'medium' | 'small';
  signed?: boolean;
  colorCoded?: boolean;
  style?: TextStyle;
}

export function MoneyAmount({ value, currency = 'USD', size = 'medium', signed = false, colorCoded = false, style }: Props) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = signed ? (value >= 0 ? '+' : '-') : '';

  const sizeStyle = size === 'large' ? typography.amountLarge : size === 'small' ? typography.amountSmall : typography.amountMedium;
  const colorStyle: TextStyle = colorCoded
    ? { color: value >= 0 ? colors.success : colors.danger }
    : {};

  return (
    <Text style={[sizeStyle, colorStyle, style]}>
      {prefix}{symbol}{formatted}
    </Text>
  );
}
