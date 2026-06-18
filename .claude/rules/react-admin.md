---
paths:
  - "admin/**/*.ts"
  - "admin/**/*.tsx"
  - "admin/**/*.css"
---

# React + Vite Admin Dashboard Rules

## Stack
- React 18 + Vite + TypeScript strict mode
- UI: shadcn/ui + Tailwind CSS
- State: TanStack Query (server state) + Zustand (UI state)
- Tables: TanStack Table v8
- Charts: Recharts
- Forms: React Hook Form + Zod validation

## File Structure
```
admin/src/
├── pages/            # Route-level pages (lazy-loaded)
├── components/
│   ├── ui/           # shadcn/ui base components
│   └── shared/       # App-specific reusable components
├── features/         # Feature modules (users, transactions, kyc, etc.)
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       └── types.ts
├── hooks/            # Global hooks
├── services/         # API service layer
├── store/            # Zustand stores
├── types/            # Global types
└── utils/
```

## TypeScript Rules
- `strict: true` always
- No `any` — use proper types or `unknown`
- All API responses must be typed with Zod schemas (validates at runtime too)
- Generate API types from OpenAPI spec when possible

## Component Rules
- Functional components only, `React.FC` is optional (prefer bare function)
- All pages are lazy-loaded via `React.lazy()` for code splitting
- Use Tailwind utility classes — no custom CSS unless absolutely necessary
- All forms validated with React Hook Form + Zod resolver

## Admin-Specific Features
- **User Management**: search, filter, ban/unban, KYC approval/rejection
- **Transaction Monitor**: real-time table, filter by status/amount/date
- **Fraud Alerts**: priority inbox, resolve/escalate actions
- **Analytics**: charts for daily volume, active users, conversion funnel
- **Audit Log**: read-only, append-only, export to CSV

## Security
- Role-based access: ADMIN, SUPPORT, ANALYST roles with different permissions
- All admin API calls include Bearer token + role header
- Sensitive data masked in UI (show full account number only on explicit click)
- All destructive actions (ban user, reverse transaction) require confirmation dialog
