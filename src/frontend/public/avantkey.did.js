// avantkey.did.js — Candid IDL for the Avantkey canister
// Canister ID: lep6p-paaaa-aaaai-q5v4q-cai
// Version: 1.0
//
// Usage (browser):
//   import { idlFactory } from 'https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js'
//
// Usage (Node.js):
//   const { idlFactory } = await import('https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js')

export const idlFactory = ({ IDL }) => {
  const Role = IDL.Variant({
    Viewer: IDL.Null,
    Member: IDL.Null,
    Admin: IDL.Null,
  });

  const TenantId = IDL.Text;

  const ApiKey = IDL.Text;
  const ApiKeyHash = IDL.Text;
  const Time = IDL.Int;
  const Day = IDL.Int;

  const Tenant = IDL.Record({
    id: TenantId,
    name: IDL.Text,
    owner: IDL.Principal,
    createdAt: Time,
    apiKeyHash: ApiKeyHash,
  });

  const Membership = IDL.Record({
    tenantId: TenantId,
    userId: IDL.Principal,
    role: Role,
  });

  const EndUser = IDL.Record({
    tenantId: TenantId,
    userId: IDL.Text,
    principal: IDL.Principal,
    firstSeenAt: Time,
    lastSeenAt: Time,
  });

  const Session = IDL.Record({
    tenantId: TenantId,
    userId: IDL.Text,
    principal: IDL.Principal,
    sessionToken: IDL.Text,
    createdAt: Time,
    expiresAt: Time,
  });

  const RateLimitStatus = IDL.Record({
    used: IDL.Nat,
    limit: IDL.Nat,
    resetTimestamp: Time,
  });

  const WebhookConfig = IDL.Record({
    url: IDL.Opt(IDL.Text),
    signingSecret: IDL.Text,
    enabled: IDL.Bool,
    enabledEvents: IDL.Vec(IDL.Text),
  });

  const VerifyAuthResult = IDL.Record({
    sessionToken: IDL.Text,
    userId: IDL.Text,
    expiresAt: Time,
    isNewUser: IDL.Bool,
  });

  const ValidateSessionResult = IDL.Record({
    userId: IDL.Text,
    valid: IDL.Bool,
    expiresAt: Time,
  });

  const AnalyticsSummary = IDL.Record({
    totalApiCalls: IDL.Nat,
    activeEndUsers: IDL.Nat,
    authSuccessRate: IDL.Nat,
    webhookHealth: IDL.Record({
      success: IDL.Nat,
      failure: IDL.Nat,
    }),
  });

  const EventBreakdown = IDL.Record({
    registered: IDL.Nat,
    authenticated: IDL.Nat,
    failed: IDL.Nat,
  });

  const TestWebhookResult = IDL.Record({
    status: IDL.Nat16,
    message: IDL.Text,
  });

  return IDL.Service({
    // ── Public Auth API ──────────────────────────────────────────────────────
    verifyAuth: IDL.Func(
      [ApiKey, IDL.Text],  // apiKey, principalText
      [VerifyAuthResult],
      []
    ),
    validateSession: IDL.Func(
      [ApiKey, IDL.Text],  // apiKey, sessionToken
      [ValidateSessionResult],
      []
    ),

    // ── Tenant Management ────────────────────────────────────────────────────
    getOrCreateTenant: IDL.Func([], [Tenant], []),
    getCurrentTenant: IDL.Func([], [Tenant], ['query']),
    authenticateWithAPIKey: IDL.Func([ApiKey], [Tenant], []),
    regenerateApiKey: IDL.Func([], [ApiKey], []),

    // ── Team / RBAC ──────────────────────────────────────────────────────────
    getTenantMembers: IDL.Func([], [IDL.Vec(Membership)], ['query']),
    getUserRole: IDL.Func([], [Role], ['query']),
    addMemberByPrincipal: IDL.Func([IDL.Principal, Role], [], []),
    updateMemberRole: IDL.Func([IDL.Principal, Role], [], []),
    removeMember: IDL.Func([IDL.Principal], [], []),

    // ── Analytics ────────────────────────────────────────────────────────────
    getAnalyticsSummary: IDL.Func([TenantId, IDL.Nat], [AnalyticsSummary], ['query']),
    getDailyTrend: IDL.Func([TenantId, IDL.Nat], [IDL.Vec(IDL.Tuple(Day, IDL.Nat))], ['query']),
    getEventBreakdown: IDL.Func([TenantId], [EventBreakdown], ['query']),
    getAllEndUsers: IDL.Func([], [IDL.Vec(EndUser)], ['query']),
    getAllSessions: IDL.Func([], [IDL.Vec(Session)], ['query']),
    recordAuthEvent: IDL.Func([TenantId, IDL.Text, IDL.Text, IDL.Bool], [], []),
    recordWebhookEvent: IDL.Func([TenantId, IDL.Bool], [], []),

    // ── Webhooks ─────────────────────────────────────────────────────────────
    getWebhookConfig: IDL.Func([], [WebhookConfig], ['query']),
    getWebhookDeliveries: IDL.Func([], [IDL.Vec(WebhookConfig)], ['query']),
    configureWebhook: IDL.Func([IDL.Text, IDL.Vec(IDL.Text)], [IDL.Text], []),
    updateWebhookStatus: IDL.Func([IDL.Bool], [IDL.Bool], []),
    testWebhook: IDL.Func([], [TestWebhookResult], []),

    // ── Rate Limiting ────────────────────────────────────────────────────────
    getRateLimitStatus: IDL.Func([ApiKeyHash], [RateLimitStatus], ['query']),
    getRateLimitStatusForCaller: IDL.Func([], [RateLimitStatus], ['query']),
    cleanupRateLimitBuckets: IDL.Func([], [IDL.Nat], []),
  });
};

export const init = ({ IDL }) => [];
