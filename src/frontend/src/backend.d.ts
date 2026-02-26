import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type TenantId = string;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Tenant {
    id: TenantId;
    apiKeyHash: ApiKeyHash;
    owner: Principal;
    name: string;
    createdAt: Time;
}
export interface AuditLogEntry {
    id: string;
    userId: string;
    tenantId: TenantId;
    timestamp: Time;
    callerPrincipal: string;
    success: boolean;
    eventType: string;
}
export type Day = bigint;
export interface ValidateSessionResult {
    expiresAt: Time;
    valid: boolean;
    userId: string;
}
export type ApiKey = string;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Session {
    principal: Principal;
    expiresAt: Time;
    userId: string;
    createdAt: Time;
    tenantId: TenantId;
    sessionToken: string;
}
export interface RateLimitStatus {
    resetTimestamp: Time;
    used: bigint;
    limit: bigint;
}
export type ApiKeyHash = string;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface WebhookConfig {
    url?: string;
    signingSecret: string;
    enabled: boolean;
    enabledEvents: Array<string>;
}
export interface EndUser {
    principal: Principal;
    lastSeenAt: Time;
    userId: string;
    firstSeenAt: Time;
    tenantId: TenantId;
}
export interface CanisterAttestation {
    network: string;
    version: string;
    message: string;
    timestamp: Time;
    canisterId: string;
}
export interface Membership {
    role: Role;
    user: Principal;
    tenantId: TenantId;
}
export interface VerifyAuthResult {
    isNewUser: boolean;
    expiresAt: Time;
    userId: string;
    sessionToken: string;
}
export enum Role {
    Viewer = "Viewer",
    Member = "Member",
    Admin = "Admin"
}
export interface backendInterface {
    addAuditLogEntry(tenantId: TenantId, eventType: string, userId: string, success: boolean, callerPrincipal: string): Promise<void>;
    addMemberByPrincipal(principal: Principal, role: Role): Promise<void>;
    authenticateWithAPIKey(apiKey: ApiKey): Promise<Tenant>;
    cleanupRateLimitBuckets(): Promise<bigint>;
    configureWebhook(url: string, enabledEvents: Array<string>): Promise<string>;
    getAllEndUsers(): Promise<Array<EndUser>>;
    getAllSessions(): Promise<Array<Session>>;
    getAnalyticsSummary(tenantId: TenantId, days: bigint): Promise<{
        webhookHealth: {
            failure: bigint;
            success: bigint;
        };
        activeEndUsers: bigint;
        totalApiCalls: bigint;
        authSuccessRate: bigint;
    }>;
    getAuditLog(tenantId: TenantId, limitParam: bigint): Promise<Array<AuditLogEntry>>;
    getAuditLogCount(tenantId: TenantId): Promise<bigint>;
    getCanisterAttestation(): Promise<CanisterAttestation>;
    getCurrentTenant(): Promise<Tenant>;
    getDailyTrend(tenantId: TenantId, days: bigint): Promise<Array<[Day, bigint]>>;
    getEventBreakdown(tenantId: TenantId): Promise<{
        authenticated: bigint;
        failed: bigint;
        registered: bigint;
    }>;
    getOrCreateTenant(): Promise<Tenant>;
    getRateLimitStatus(apiKeyHash: ApiKeyHash): Promise<RateLimitStatus>;
    getRateLimitStatusForCaller(): Promise<RateLimitStatus>;
    getTenantMembers(): Promise<Array<Membership>>;
    getUserRole(): Promise<Role>;
    getWebhookConfig(): Promise<{
        url?: string;
        enabled: boolean;
        enabledEvents: Array<string>;
    }>;
    getWebhookDeliveries(): Promise<Array<WebhookConfig>>;
    recordAuthEvent(tenantId: TenantId, eventType: string, userId: string, success: boolean): Promise<void>;
    recordWebhookEvent(tenantId: TenantId, success: boolean): Promise<void>;
    regenerateApiKey(): Promise<ApiKey>;
    removeMember(userPrincipal: Principal): Promise<void>;
    testWebhook(): Promise<{
        status: number;
        message: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateMemberRole(userPrincipal: Principal, newRole: Role): Promise<void>;
    updateWebhookStatus(enabled: boolean): Promise<boolean>;
    validateSession(apiKey: string, sessionToken: string): Promise<ValidateSessionResult>;
    verifyAuth(apiKey: string, principalText: string): Promise<VerifyAuthResult>;
}
