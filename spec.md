# Avantkey

## Current State
The backend (791 lines) already has:
- Rate limiting infrastructure: `RateLimitBucket` type, `rateLimitBuckets` map, `checkAndIncrementRateLimit()` helper function
- Rate limit enforcement on Analytics endpoints (getAnalyticsSummary, getDailyTrend, getEventBreakdown) - Steps B complete
- Rate limit enforcement on Webhook endpoints (configureWebhook, updateWebhookStatus, testWebhook) - Step C complete
- Settings/Team endpoints (addMemberByPrincipal, updateMemberRole, removeMember) currently have NO rate limit enforcement

## Requested Changes (Diff)

### Add
- Rate limit enforcement to `addMemberByPrincipal`: look up caller's tenant, call `checkAndIncrementRateLimit(tenant.apiKeyHash)`, trap if not allowed
- Rate limit enforcement to `updateMemberRole`: look up caller's tenant, call `checkAndIncrementRateLimit(tenant.apiKeyHash)`, trap if not allowed
- Rate limit enforcement to `removeMember`: look up caller's tenant, call `checkAndIncrementRateLimit(tenant.apiKeyHash)`, trap if not allowed

### Modify
- `addMemberByPrincipal`: add rate limit check after the anonymous caller check, before the admin check
- `updateMemberRole`: add rate limit check after the anonymous caller check, before the admin check
- `removeMember`: add rate limit check after the anonymous caller check, before the admin check

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend with all existing functionality preserved
2. Add `checkAndIncrementRateLimit(tenant.apiKeyHash)` call in `addMemberByPrincipal` after finding the tenant but before performing the operation
3. Add `checkAndIncrementRateLimit(tenant.apiKeyHash)` call in `updateMemberRole` after finding the tenant via `findTenantByCaller` and fetching the tenant object
4. Add `checkAndIncrementRateLimit(tenant.apiKeyHash)` call in `removeMember` after finding the tenant via `findTenantByCaller` and fetching the tenant object

## UX Notes
- No frontend changes needed for this step
- Rate limit errors will surface as trapped errors, which the frontend already handles with error states
- The 1000 req/hour limit applies per API key (free tier)
