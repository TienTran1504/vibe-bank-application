import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  amountLarge: { fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  amountMedium: { fontSize: 24, fontWeight: '600' },
  amountSmall: { fontSize: 16, fontWeight: '600' },

  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '600' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '400' },
};
