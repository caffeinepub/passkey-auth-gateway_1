import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Tenant, Membership } from "../backend";

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
  });
}
