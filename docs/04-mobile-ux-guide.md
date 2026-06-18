# Mobile UX Guide — PayPal-Like Design

## Design Principles
1. **Trust first** — users are handling real money; every action must feel safe and intentional
2. **Clarity over cleverness** — show balance, status, and amounts clearly at all times
3. **Biometric everywhere** — require biometric confirmation before any money movement
4. **Progressive disclosure** — show essential info first, details on tap
5. **Instant feedback** — every tap gets visual + haptic feedback within 100ms

---

## Color System
```typescript
// theme/colors.ts
export const colors = {
  // PayPal-inspired palette
  primary:      '#003087',  // Deep blue — primary actions, CTAs
  primaryLight: '#009cde',  // Sky blue — accents, links, icons
  success:      '#1aa260',  // Green — positive amounts, success states
  danger:       '#d0021b',  // Red — negative amounts, errors, warnings
  warning:      '#f5a623',  // Amber — pending states, alerts

  // Neutrals
  surface:      '#ffffff',
  background:   '#f5f7fa',
  border:       '#e0e6ed',
  textPrimary:  '#1a1a2e',
  textSecondary:'#6b7280',
  textMuted:    '#9ca3af',

  // Overlays
  overlay:      'rgba(0, 0, 0, 0.5)',
  shimmer:      '#e5e9f0',
};
```

## Typography
```typescript
// theme/typography.ts
export const typography = {
  // Amounts — always prominent
  amountLarge:  { fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  amountMedium: { fontSize: 24, fontWeight: '600' },
  amountSmall:  { fontSize: 16, fontWeight: '600' },

  // UI text
  h1:    { fontSize: 28, fontWeight: '700' },
  h2:    { fontSize: 22, fontWeight: '600' },
  h3:    { fontSize: 18, fontWeight: '600' },
  body:  { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '400', color: colors.textMuted },
};
```

---

## Navigation Structure

```
Bottom Tab Navigator
├── Home (house icon)
│   ├── Dashboard Screen
│   └── Account Detail Screen
├── Send (paper-plane icon)
│   ├── Send To Screen (search recipient)
│   ├── Enter Amount Screen
│   ├── Review Screen
│   └── Confirmation Screen
├── Activity (list icon)
│   ├── Transaction List Screen
│   └── Transaction Detail Screen
├── Cards (credit-card icon)
│   ├── Cards List Screen
│   ├── Card Detail Screen
│   └── Virtual Card Screen
└── Profile (person icon)
    ├── Profile Screen
    ├── KYC Screen
    ├── Security Settings Screen
    └── Notification Settings Screen
```

---

## Screen Specifications

### Dashboard (Home)
```
┌──────────────────────────┐
│ 👋 Good morning, Tien    │
│ ─────────────────────── │
│ ┌──────────────────────┐ │
│ │   Total Balance      │ │
│ │   $12,450.00  [USD▼] │ │
│ │                      │ │
│ │  [Send] [Receive]    │ │
│ │  [Top Up] [More]     │ │
│ └──────────────────────┘ │
│                          │
│ My Accounts              │
│ ┌──────────────────────┐ │
│ │ 💳 Checking  $8,200  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 💰 Savings   $4,250  │ │
│ └──────────────────────┘ │
│                          │
│ Recent Activity          │
│ [skeleton / transactions]│
└──────────────────────────┘
```

**Key rules:**
- Balance card uses gradient background (primary → primaryLight)
- Amounts always formatted: `$1,234.56` (never `$1234.5`)
- Quick action buttons in 2x2 grid below balance
- Recent transactions: last 5, show avatar + name + amount + date
- Positive amounts: `colors.success` green
- Negative amounts: `colors.danger` red

### Send Money Flow (3 screens)

**Screen 1 — Recipient**
- Search bar (by email, name, or account number)
- Recent recipients as avatar chips
- Results list with avatar, name, masked account

**Screen 2 — Amount**
- Large numeric keypad
- Selected recipient shown at top
- Currency selector (if multi-currency)
- "Add note" optional field
- Running balance check (grey if insufficient)

**Screen 3 — Review & Confirm**
- Summary card: From → To, Amount, Fee, Total
- "Send $X.XX" CTA button (primary blue, full width)
- Tap → biometric prompt appears
- On biometric success → loading state → success/failure screen

### Transaction List
- FlatList with pull-to-refresh
- Section headers by date (Today, Yesterday, This Week, etc.)
- Row: [Avatar/Icon] [Name + description] [Amount] [Status badge]
- Filter chips: All / Sent / Received / Pending
- Load more on scroll (infinite scroll)

---

## Component Library

### Money Display
```typescript
// Always use this component for amounts
<MoneyAmount
  value={150.50}
  currency="USD"
  size="large"          // large | medium | small
  signed={true}         // show + or - prefix
  colorCoded={true}     // green for +, red for -
/>
```

### Account Card
```typescript
// Gradient card with account info
<AccountCard
  accountType="Checking"
  balance={8200.00}
  currency="USD"
  lastFour="4321"       // last 4 of account number
  onPress={() => navigate('AccountDetail')}
/>
```

### Transaction Row
```typescript
<TransactionRow
  name="John Doe"
  description="Dinner split"
  amount={-45.50}
  currency="USD"
  date={new Date()}
  status="COMPLETED"    // PENDING | COMPLETED | FAILED
/>
```

### ConfirmModal (for destructive / money actions)
```typescript
<ConfirmModal
  visible={showConfirm}
  title="Send $150.00?"
  subtitle="To: John Doe"
  confirmLabel="Confirm with Face ID"
  onConfirm={handleBiometricConfirm}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## Loading & Empty States

### Loading: Skeleton Loaders
Never show a spinner for list data. Use `SkeletonPlaceholder`:
```typescript
// Shows animated shimmer matching the shape of actual content
<SkeletonPlaceholder>
  <SkeletonPlaceholder.Item width={200} height={20} borderRadius={4} />
</SkeletonPlaceholder>
```

### Empty States
Always show an illustration + action:
```typescript
<EmptyState
  illustration="empty-transactions"   // from assets/illustrations/
  title="No transactions yet"
  subtitle="Send or receive money to get started"
  actionLabel="Send Money"
  onAction={() => navigate('Send')}
/>
```

### Error States
- **Minor error** (API call failed, retry): Toast notification at bottom
- **Auth error** (token expired): Redirect to login, clear storage
- **Critical error** (account frozen): Full-screen error with support link

---

## UX Rules for Money Safety

1. ALWAYS show a review screen before any money movement
2. ALWAYS require biometric before confirming a transfer
3. ALWAYS show the exact amount including currency and decimals on the confirm button
4. NEVER auto-submit forms — the user must explicitly tap a confirm button
5. Show a 3-second countdown on success screen before auto-navigating away
6. On transaction failure, show the exact error reason (insufficient funds, fraud blocked, etc.)
