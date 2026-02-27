# Avantkey

## Current State
- Full B2B SaaS Passkey Auth Gateway on ICP — Draft 30 live
- Branded login modal (LoginModal.tsx) wrapping Internet Identity silently — Step 1 complete
- Dashboard shows error: "Something went wrong / An unexpected error occurred" — caused by the generic fallback in getUserFriendlyError() being triggered when getOrCreateTenant() or getTenantMembers() fails with an unrecognized error string
- The error is shown via ErrorCard in Dashboard.tsx when tenantError || membersError is set
- Backend has verifyAuth() and validateSession() as public auth API functions
- Sessions and EndUsers are stored in backend state (sessions, endUsers maps)
- No delegation interceptor exists yet — II delegation flows directly to the canister

## Requested Changes (Diff)

### Add
- `registerDelegation(principalText: string, tenantId: string): async AvantKeySession` — backend function that accepts a caller's principal (from II delegation), creates or updates an Avantkey-issued session, logs the auth event to the audit log, and returns session metadata. This is the delegation interceptor: Avantkey canister becomes the session authority.
- `getMySession(): async ?AvantKeySession` — query function to retrieve the current user's active Avantkey session (by caller principal)
- `revokeMySession(): async ()` — function to revoke the caller's active Avantkey session
- Frontend: `useRegisterDelegation()` hook that calls `registerDelegation` after login completes, stores the AvantKeySession in state
- Frontend: Session context display in DashboardLayout header showing "Session active" badge with expiry info
- Frontend: Dashboard shows Avantkey session info panel with session token (truncated), issued time, expiry, and revoke button

### Modify
- `getUserFriendlyError()` in errorMessages.ts — add broader catch patterns for "anonymous calls not allowed", "trap", "reject", and any error containing "canister" to map to "Connection Issue" rather than falling through to the generic fallback. This fixes the dashboard error.
- Dashboard.tsx — add improved error handling that shows the actual error detail in development/debug mode

### Remove
- Nothing removed

## Implementation Plan
1. Fix getUserFriendlyError() to catch more backend error patterns (anonymous, trap, reject, canister errors)
2. Generate backend: add registerDelegation(), getMySession(), revokeMySession() functions
3. Frontend: add useRegisterDelegation hook that fires after login
4. Frontend: wire session registration in App.tsx or DashboardLayout after identity is confirmed
5. Frontend: add session panel to Dashboard showing session status, token, expiry, revoke button

## UX Notes
- Session registration should be transparent — fires automatically after login, no user action needed
- Session panel in dashboard is informational: shows that Avantkey has issued its own session on top of II
- "Revoke Session" button lets users invalidate their session (forces re-login next time)
- Session token shown as truncated: first 8 chars + "..." — never show full token in UI
- Session expiry shown as human-readable "Expires in X hours" format
