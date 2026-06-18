---
paths:
  - "mobile/**/*.ts"
  - "mobile/**/*.tsx"
  - "mobile/**/*.js"
---

# React Native (Mobile App) Rules

## Project Setup
- React Native 0.74+ with TypeScript strict mode
- State management: Zustand (lightweight) for global state
- Navigation: React Navigation v6 (Stack + Tab + Drawer)
- API calls: React Query (TanStack Query) — no raw fetch/axios in components
- Styling: StyleSheet.create() — no inline styles objects in JSX
- Icons: React Native Vector Icons or Expo Icons

## TypeScript
- `strict: true` in `tsconfig.json` — no exceptions
- No `any` type — use `unknown` and narrow with type guards
- Prefer `interface` for component props, `type` for unions/tuples
- All API response shapes must be typed — create types in `src/types/`

## Component Rules
- Functional components only — no class components
- One component per file; filename matches component name (PascalCase)
- All props interfaces named `<ComponentName>Props`
- Keep components under 150 lines — extract sub-components if longer
- No business logic in components — put it in custom hooks (`src/hooks/`)

## File Structure
```
mobile/src/
├── screens/          # Full-screen components (one per route)
├── components/       # Reusable UI components
├── hooks/            # Custom hooks (useAuth, useTransactions, etc.)
├── store/            # Zustand stores
├── services/         # API service functions (via React Query)
├── types/            # TypeScript type definitions
├── utils/            # Pure utility functions
├── navigation/       # Navigation stacks and types
├── theme/            # Colors, typography, spacing constants
└── assets/           # Images, fonts, icons
```

## PayPal-Like UX Conventions
- Primary color: deep blue (#003087) with accent green (#009cde)
- Bottom tab bar: Home, Send, Activity, Cards, Profile
- All money amounts: always show currency symbol + 2 decimal places
- Loading states: skeleton loaders (not spinners) for lists
- Empty states: always show an illustration + action button
- Error states: toast notifications for minor errors, full-screen for auth errors
- Biometric prompt before any money transfer

## Security
- NEVER store sensitive data (tokens, PINs) in AsyncStorage — use react-native-keychain
- All API calls must include the JWT Bearer token from secure storage
- Show a confirmation modal before any send/transfer action
- Mask account numbers: show only last 4 digits by default
- Auto-logout after 5 minutes of inactivity

## Performance
- Use `React.memo()` for list item components
- Use `FlatList` (never `ScrollView`) for lists of more than 10 items
- Images: use `FastImage` library, always specify width/height
- Avoid anonymous functions in JSX props for frequently rendered components
