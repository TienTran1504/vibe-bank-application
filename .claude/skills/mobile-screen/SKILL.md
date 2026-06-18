---
name: mobile-screen
description: Create a new React Native screen with PayPal-like design — navigation setup, API integration with React Query, proper loading/error/empty states.
disable-model-invocation: true
---

Create a new mobile screen. Description: $ARGUMENTS

Steps:

1. **Read the UX guide** at `docs/04-mobile-ux-guide.md` and an existing screen in `mobile/src/screens/` to match the patterns.

2. **Create the screen component** at `mobile/src/screens/<ScreenName>Screen.tsx`:
   - Functional component with TypeScript
   - Use `StyleSheet.create()` for all styles
   - Follow the PayPal color scheme: primary `#003087`, accent `#009cde`
   - Skeleton loader for data loading state
   - Empty state with illustration placeholder + action button
   - Error state with retry button

3. **Create a custom hook** at `mobile/src/hooks/use<Feature>.ts` for the screen's data fetching:
   - Use `useQuery` or `useMutation` from TanStack Query
   - Export typed data + loading + error + refetch

4. **Create the API service function** at `mobile/src/services/<feature>Service.ts`:
   - Typed request/response interfaces
   - Uses the shared `apiClient` (with auth token)

5. **Register the screen** in the appropriate navigator in `mobile/src/navigation/`.

6. **If the screen handles money**:
   - Add biometric confirmation before any submit action
   - Mask sensitive data by default
   - Show amounts with currency symbol + 2 decimal places

7. **Add navigation types** for the new route in `mobile/src/navigation/types.ts`.

8. Use the `mobile-reviewer` subagent to review the final screen before reporting done.
