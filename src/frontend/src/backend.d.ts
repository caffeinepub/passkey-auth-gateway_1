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
export type Day = bigint;
export type ApiKeyHash = string;
export interface Membership {
    role: Role;
    user: Principal;
    tenantId: TenantId;
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
export enum Role {
    Viewer = "Viewer",
    Member = "Member",
    Admin = "Admin"
}
export interface backendInterface {
    addMemberByPrincipal(principal: Principal, role: Role): Promise<void>;
    authenticateWithAPIKey(apiKey: ApiKey): Promise<Tenant>;
    configureWebhook(url: string, enabledEvents: Array<string>): Promise<string>;
    getAnalyticsSummary(tenantId: TenantId, days: bigint): Promise<{
        webhookHealth: {
            failure: bigint;
            success: bigint;
        };
        activeEndUsers: bigint;
        totalApiCalls: bigint;
        authSuccessRate: bigint;
    }>;
    getCurrentTenant(): Promise<Tenant>;
    getDailyTrend(tenantId: TenantId, days: bigint): Promise<Array<[Day, bigint]>>;
    getEventBreakdown(tenantId: TenantId): Promise<{
        authenticated: bigint;
        failed: bigint;
        registered: bigint;
    }>;
    getOrCreateTenant(): Promise<Tenant>;
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
}
