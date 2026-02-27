import { useState, useEffect, useCallback } from "react";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type { AvantKeySession } from "../backend";

interface UseAvantKeySessionResult {
  session: AvantKeySession | null;
  isLoading: boolean;
  registerSession: (tenantId: string) => Promise<void>;
  revokeSession: () => Promise<void>;
}

export function useAvantKeySession(): UseAvantKeySessionResult {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [session, setSession] = useState<AvantKeySession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing session on mount / when actor becomes available
  useEffect(() => {
    if (!actor || isFetching || !identity) return;

    let cancelled = false;

    const loadSession = async () => {
      setIsLoading(true);
      try {
        const existing = await actor.getMySession();
        if (!cancelled) {
          setSession(existing);
        }
      } catch {
        // Silently ignore — session may not exist yet
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, identity]);

  const registerSession = useCallback(
    async (tenantId: string) => {
      if (!actor) return;
      setIsLoading(true);
      try {
        const newSession = await actor.registerDelegation(tenantId);
        setSession(newSession);
      } catch (err) {
        console.error("Failed to register delegation:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [actor]
  );

  const revokeSession = useCallback(async () => {
    if (!actor) return;
    setIsLoading(true);
    try {
      await actor.revokeMySession();
      setSession((prev) => (prev ? { ...prev, revoked: true } : prev));
    } catch (err) {
      console.error("Failed to revoke session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  return { session, isLoading, registerSession, revokeSession };
}
