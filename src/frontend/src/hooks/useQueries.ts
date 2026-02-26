import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Tenant, Membership, AuditLogEntry, CanisterAttestation } from "../backend";

/**
 * Default retry configuration for queries
 * Retries 3 times with exponential backoff (1s, 2s, 4s)
 */
const retryConfig = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Fetch the current user's tenant (or create if not exists)
 */
export function useGetCurrentTenant() {
  const { actor, isFetching } = useActor();
  return useQuery<Tenant>({
    queryKey: ["currentTenant"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getOrCreateTenant();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

/**
 * Fetch members of the current tenant
 */
export function useGetTenantMembers() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<Membership>>({
    queryKey: ["tenantMembers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getTenantMembers();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

/**
 * Fetch webhook configuration for the current tenant
 */
export function useGetWebhookConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<{ url?: string; enabled: boolean; enabledEvents: string[] }>({
    queryKey: ["webhookConfig"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getWebhookConfig();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

/**
 * Fetch webhook delivery history
 */
export function useGetWebhookDeliveries() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<any>>({
    queryKey: ["webhookDeliveries"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getWebhookDeliveries();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

/**
 * Fetch analytics summary for the current tenant
 */
export function useGetAnalyticsSummary(tenantId: string | undefined, days: number) {
  const { actor, isFetching } = useActor();
  return useQuery<{
    totalApiCalls: bigint;
    activeEndUsers: bigint;
    authSuccessRate: bigint;
    webhookHealth: {
      success: bigint;
      failure: bigint;
    };
  }>({
    queryKey: ["analyticsSummary", tenantId, days],
    queryFn: async () => {
      if (!actor || !tenantId) throw new Error("Actor or tenant not initialized");
      return actor.getAnalyticsSummary(tenantId, BigInt(days));
    },
    enabled: !!actor && !isFetching && !!tenantId,
    ...retryConfig,
  });
}

/**
 * Fetch daily API call trend
 */
export function useGetDailyTrend(tenantId: string | undefined, days: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, bigint]>>({
    queryKey: ["dailyTrend", tenantId, days],
    queryFn: async () => {
      if (!actor || !tenantId) throw new Error("Actor or tenant not initialized");
      return actor.getDailyTrend(tenantId, BigInt(days));
    },
    enabled: !!actor && !isFetching && !!tenantId,
    ...retryConfig,
  });
}

/**
 * Fetch event breakdown
 */
export function useGetEventBreakdown(tenantId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<{
    registered: bigint;
    authenticated: bigint;
    failed: bigint;
  }>({
    queryKey: ["eventBreakdown", tenantId],
    queryFn: async () => {
      if (!actor || !tenantId) throw new Error("Actor or tenant not initialized");
      return actor.getEventBreakdown(tenantId);
    },
    enabled: !!actor && !isFetching && !!tenantId,
    ...retryConfig,
  });
}

/**
 * Fetch current user's role
 */
export function useGetUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<"Admin" | "Member" | "Viewer">({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getUserRole();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

/**
 * Fetch current cycle balance (Admin only)
 * 
 * TODO: Backend Integration Required
 * Once the backend has getCycleBalance() implemented, replace the mock data with:
 *   return BigInt(await actor.getCycleBalance());
 * 
 * Backend function signature:
 *   public shared query ({ caller }) func getCycleBalance() : async Nat
 */
export function useGetCycleBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["cycleBalance"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      // TODO: Replace with actor.getCycleBalance() once backend is updated
      // For now, return a mock value
      return BigInt(8_547_321_000_000);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    ...retryConfig,
  });
}

/**
 * Fetch cycle statistics (Admin only)
 * 
 * TODO: Backend Integration Required
 * Once the backend has getCycleStats() implemented, replace the mock data with:
 *   const stats = await actor.getCycleStats();
 *   return {
 *     currentBalance: BigInt(stats.currentBalance),
 *     lastChecked: BigInt(stats.lastChecked),
 *   };
 * 
 * Backend function signature:
 *   public shared query ({ caller }) func getCycleStats() : async {
 *     currentBalance : Nat;
 *     lastChecked : Time.Time;
 *   }
 */
export function useGetCycleStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{ currentBalance: bigint; lastChecked: bigint }>({
    queryKey: ["cycleStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      // TODO: Replace with actor.getCycleStats() once backend is updated
      // For now, return mock data
      return {
        currentBalance: BigInt(8_547_321_000_000),
        lastChecked: BigInt(Date.now() * 1_000_000), // Convert to nanoseconds
      };
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    ...retryConfig,
  });
}

/**
 * Fetch audit log entries for a tenant (Admin only)
 */
export function useGetAuditLog(tenantId: string | undefined, limit: number = 100) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<AuditLogEntry>>({
    queryKey: ["auditLog", tenantId, limit],
    queryFn: async () => {
      if (!actor || !tenantId) throw new Error("Actor or tenant not initialized");
      return actor.getAuditLog(tenantId, BigInt(limit));
    },
    enabled: !!actor && !isFetching && !!tenantId,
    ...retryConfig,
  });
}

/**
 * Fetch total audit log count for a tenant (Admin only)
 */
export function useGetAuditLogCount(tenantId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["auditLogCount", tenantId],
    queryFn: async () => {
      if (!actor || !tenantId) throw new Error("Actor or tenant not initialized");
      return actor.getAuditLogCount(tenantId);
    },
    enabled: !!actor && !isFetching && !!tenantId,
    ...retryConfig,
  });
}

/**
 * Fetch canister attestation (public, no auth required)
 */
export function useGetCanisterAttestation() {
  const { actor, isFetching } = useActor();
  return useQuery<CanisterAttestation>({
    queryKey: ["canisterAttestation"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getCanisterAttestation();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000, // Cache for 1 minute — attestation doesn't change often
    ...retryConfig,
  });
}
