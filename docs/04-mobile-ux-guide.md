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
├── Transfer (paper-plane icon)          ← renamed from "Send"
│   ├── Transfer To Screen (IBAN lookup)
│   ├── Enter Amount Screen
│   ├── Review Screen
│   └── Confirmation Screen
├── Activity (receipt icon)
│   ├── Transaction List Screen          ← 5 recent on load, "Load more" fetches all
│   └── Transaction Detail Screen
├── Cards (card icon)
│   └── Cards List Screen
└── Profile (person icon)
    ├── Profile Screen
    ├── KYC Screen
    ├── Security Settings Screen
    └── Notification Settings Screen
```

**Back navigation**: Activity, Cards, Profile, and all Transfer screens show a `← Home` button (arrow size 26, `typography.body`) that navigates to the HomeTab. This is consistent across all non-home screens.

---

## Screen Specifications

### Dashboard (Home)
```
┌──────────────────────────┐
│ Good day 👋  Welcome back│
│                    [🔔]  │
│ ┌──────────────────────┐ │
│ │ BankApp         ●●   │ │
│ │ Total Balance        │ │
│ │ $195,390.06          │ │
│ │ [USD]                │ │
│ │ •••• •••• •••• ••••  │ │
│ └──────────────────────┘ │
│                          │
│ [Transfer][Deposit]      │
│ [New Acc ][Cards  ]      │
│                          │
│ My Accounts              │
│ ┌──────────────────────┐ │
│ │ AVAILABLE BALANCE    │ │
│ │ $1,550.00            │ │
│ │ GB60BANK…  [copy]    │ │
│ │ •••• 7880   Checking │ │
│ └──────────────────────┘ │
│                          │
│ Recent Activity  See all │
│ [last 5 transactions]    │
└──────────────────────────┘
```

**Key rules:**
- Total balance sums all account balances converted to USD (no fee)
- Non-USD account cards show `≈ $X.XX USD` below the main balance
- Account cards show full IBAN with a copy-to-clipboard icon
- Quick actions: 4 buttons (Transfer, Deposit, New Acc, Cards) using custom PNG icons, all `colors.primaryBg` background, 64×64px circles
- All amounts formatted with commas: `$1,234.56` (never `$1234.5`)
- Recent transactions: last 5 only — "See all" navigates to Activity tab
- Positive amounts: `colors.success` green; Negative: `colors.danger` red

### Transfer Flow (3 screens, renamed from "Send")

**Screen 1 — Recipient**
- IBAN input field with "Verify" chip button
- Verified account shown with account type, currency, checkmark
- Safety tip box (gradient)
- Title: "Transfer money to"

**Screen 2 — Amount**
- Horizontal account selector (shows balance with commas, currency)
- Large amount input with currency symbol
- FX preview box (visible when sender ≠ recipient currency):
  - Recipient gets (est.) — green
  - Conversion fee (1.5%) — amber
  - Total deducted — primary
  - Rate: e.g. `1 USD = €0.8700 EUR` (2–4 decimal places, never rounded to whole)
- Insufficient funds check includes the 1.5% fee

**Screen 3 — Review & Confirm**
- Hero amount card showing sending amount + converted amount
- Transfer details: From, To, Note
- FX breakdown when cross-currency: rate, fee (amber), total deducted (red), recipient gets (green)
- Biometric hint below details
- Cancel + Send button row (Send shows total debit amount)
- Tap → biometric prompt → API call → Confirmation screen

### Transaction List (Activity)
- Shows 5 most recent transactions on initial load
- "Load more" button fetches all remaining in one request (size=500)
- Filter chips: All / Completed / Pending / Failed
- Pull-to-refresh resets to 5 most recent
- Row icons: custom PNG for outgoing (send-arrow), incoming (receive-arrow), category emoji for food/coffee/shopping
- All icon backgrounds: transparent
- 120px bottom padding so last items clear the floating nav bar

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
// Gradient card — shows full IBAN with copy button, USD equiv for non-USD accounts
<AccountCard
  accountType="Checking"
  balance={8200.00}
  currency="USD"
  accountNumber="GB60BANK39305741710101"  // full IBAN displayed + copy icon
  onPress={() => navigate('AccountDetail')}
/>
// Non-USD accounts additionally show: ≈ $X.XX USD (smaller, 50% opacity)
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
