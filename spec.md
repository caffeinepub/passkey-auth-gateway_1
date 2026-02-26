# Avantkey

## Current State
Full-featured B2B SaaS passkey auth gateway on Internet Computer. Backend (main.mo, ~1043 lines) includes: multi-tenant management, API key system (SHA-256 hashed), webhook system with HMAC signatures and retry logic, analytics with daily aggregates, RBAC (Admin/Member/Viewer), rate limiting (1000 req/hour sliding window), public auth API (verifyAuth, validateSession), and IDL file served at /avantkey.did.js. Frontend has: landing page, dashboard, webhooks, settings, billing, cycles/ops, and /docs pages.

## Requested Changes (Diff)

### Add
1. **Certified Audit Log** - A tamper-proof, on-chain log of every auth event per tenant. Every entry records: event type, timestamp, tenantId, userId, success/failure, IP hint (caller principal). A new `getAuditLog(tenantId, limit)` query function returns the last N entries (max 500). A new `getAuditLogCount(tenantId)` query returns total event count. Audit log entries are append-only -- no delete function. Separate from existing `authEvents` (which is analytics-focused and gets cleaned up). Audit log entries are retained indefinitely (no cleanup). Admin-only access in dashboard.

2. **Verified Canister Attestation Endpoint** - A public, unauthenticated query function `getCanisterAttestation()` that returns a signed attestation object proving this canister runs on ICP. Returns: canisterId (as text), timestamp, version string ("avantkey-v1"), and a message field ("This canister is deployed on the Internet Computer. Verify at: https://dashboard.internetcomputer.org/canister/<id>"). Also a new public route `/verify` in the frontend that displays this attestation in a human-readable, developer-friendly page with a direct link to the ICP dashboard for on-chain verification.

### Modify
- `recordAuthEvent` -- also append to the audit log (new separate store) in addition to existing analytics behavior.
- `verifyAuth` -- also append an audit log entry on every call.
- `/dashboard/settings` or a new `/dashboard/audit` route -- add Audit Log viewer (Admin only).
- `/docs` page -- add section for Canister Attestation with usage examples.
- Landing page -- add brief mention of certified audit log and on-chain attestation as ICP differentiators in the features section.

### Remove
- Nothing removed.

## Implementation Plan
1. Write spec.md (this file)
2. Generate backend Motoko -- add AuditLogEntry type, auditLog store (Map<TenantId, List<AuditLogEntry>>), append-only addAuditLogEntry helper called from recordAuthEvent and verifyAuth, getAuditLog(tenantId, limit) query (Admin-gated), getAuditLogCount(tenantId) query (Admin-gated), getCanisterAttestation() public query returning attestation object.
3. Frontend -- new /dashboard/audit page (Admin only) showing audit log table with event type, userId, timestamp, success badge. Add "Audit Log" nav item (Admin only). New public /verify page showing attestation card with canister ID, timestamp, ICP dashboard link. Update /docs with attestation section. Add audit log + attestation bullets to landing page features.

## UX Notes
- Audit log page: table with columns Event, User ID, Timestamp, Status. Paginated or virtualized (show last 100 by default). Admin-only -- redirect Viewer/Member.
- /verify page: public, no auth required. Clean card layout. Big canister ID with copy button. Direct link to ICP dashboard. Short explainer: "This is cryptographic proof that Avantkey runs on Internet Computer infrastructure -- not a centralized server." Developer tone, no fluff.
- Attestation on landing page: one bullet point in the features grid -- "On-chain verified infrastructure. Check our canister ID anytime."
- Docs section: code example showing how to fetch attestation programmatically via ICP agent.
