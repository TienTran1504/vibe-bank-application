export const colors = {
  // Brand — vibrant indigo
  primary:      '#4F46E5',
  primaryDark:  '#3730A3',
  primaryLight: '#818CF8',
  primaryBg:    '#EEF2FF',

  // Status
  success:    '#10B981',
  successBg:  '#D1FAE5',
  danger:     '#EF4444',
  dangerBg:   '#FEE2E2',
  warning:    '#F59E0B',
  warningBg:  '#FEF3C7',

  // Surfaces
  surface:    '#FFFFFF',
  background: '#F0F3FF',   // very light indigo tint
  card:       '#FFFFFF',
  border:     '#E0E7FF',   // indigo-tinted border

  // Premium dark card (balance card)
  cardDark:  '#1E1B4B',    // deep indigo
  cardDark2: '#312E81',

  // Quick action tint pairs [icon color, bg color]
  actionSend:       '#EF4444',
  actionSendBg:     '#FEE2E2',
  actionReceive:    '#10B981',
  actionReceiveBg:  '#D1FAE5',
  actionTopup:      '#4F46E5',
  actionTopupBg:    '#EEF2FF',
  actionHistory:    '#F59E0B',
  actionHistoryBg:  '#FEF3C7',

  // Text
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',

  // Misc
  white:       '#FFFFFF',
  black:       '#000000',
  overlay:     'rgba(0,0,0,0.5)',
  shimmer:     '#E0E7FF',
  transparent: 'transparent',
} as const;
