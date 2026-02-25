# Passkey Auth Gateway - Step 7e: Permission Enforcement

## Current State

The Passkey Auth Gateway has completed Steps 1-7d:
- ✅ Multi-tenant foundation with Internet Identity authentication
- ✅ API key management (one key per tenant, SHA-256 hashed)
- ✅ Webhook system with HMAC signatures and delivery tracking
- ✅ Analytics dashboard with usage metrics
- ✅ Public landing page
- ✅ Settings page with team viewing (7a)
- ✅ Principal-based team invitations (7b)
- ✅ Role management - change roles and remove members (7d)

**Current Permission Status:**
- Backend has some permission checks (e.g., `addMemberByPrincipal`, `updateMemberRole`, `removeMember` check for Admin role)
- Frontend has role management UI in Settings
- **Missing:** Permission checks on critical operations (`regenerateApiKey`, `configureWebhook`, `testWebhook`)
- **Missing:** Frontend doesn't hide unauthorized UI elements based on user role

## Requested Changes (Diff)

### Add
- Backend permission checks on sensitive operations:
  - `regenerateApiKey()` - require Admin role
  - `configureWebhook()` - require Admin or Member role
  - `testWebhook()` - require Admin or Member role
- Frontend role-based UI hiding:
  - Hide "Regenerate API Key" button from Members and Viewers
  - Hide "Configure Webhook" and "Test Webhook" from Viewers
  - Hide "Settings" navigation link from Viewers

### Modify
- Backend functions to include role verification before operations
- Dashboard.tsx to conditionally render API key regeneration button
- Webhooks.tsx to conditionally render configuration controls
- Navigation component to hide Settings link for Viewers

### Remove
- No removals

## Implementation Plan

**Phase 1: Backend Permission Enforcement (Manual Code Edits)**
1. Add helper function `getUserRoleForTenant(caller, tenantId)` to check caller's role
2. Modify `regenerateApiKey()` to require Admin role:
   - Get tenant for caller
   - Check if caller is Admin
   - Trap with "Only admins can regenerate API keys" if not
3. Modify `configureWebhook()` to require Admin or Member role:
   - Get tenant for caller
   - Check if caller is Admin or Member
   - Trap with "Only admins and members can configure webhooks" if not
4. Modify `testWebhook()` to require Admin or Member role (same as configureWebhook)

**Phase 2: Frontend Permission Enforcement**
1. Add `useGetUserRole()` hook to fetch current user's role
2. Modify Dashboard.tsx:
   - Call `useGetUserRole()` hook
   - Conditionally render "Regenerate API Key" button only if role is Admin
   - Show informational message for non-Admins
3. Modify Webhooks.tsx:
   - Call `useGetUserRole()` hook
   - Hide webhook configuration form from Viewers
   - Show read-only view for Viewers
4. Update navigation (App.tsx or layout component):
   - Hide "Settings" link if user role is Viewer

**Phase 3: Testing & Validation**
1. Test as Admin: should have full access
2. Test as Member: can configure webhooks, cannot regenerate API keys
3. Test as Viewer: read-only access to dashboard and analytics

## UX Notes

- When a non-Admin user attempts to regenerate an API key, backend returns clear error message
- Frontend hides unauthorized buttons entirely (cleaner UX than showing disabled buttons)
- Viewers see a simplified navigation without Settings link
- Members see webhooks and analytics but cannot manage API keys or team members
- All permission checks are enforced on both frontend (UX) and backend (security)
