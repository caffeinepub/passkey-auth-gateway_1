import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { 
  useGetCurrentTenant, 
  useGetTenantMembers,
  useGetAnalyticsSummary,
  useGetDailyTrend,
  useGetEventBreakdown,
  useGetUserRole
} from "../hooks/useQueries";
import { Loader2, AlertCircle, Key, Copy, RefreshCw, Check, AlertTriangle, TrendingUp, Users, Activity, Webhook, Shield, ShieldOff, ShieldAlert } from "lucide-react";
import type { Role } from "../backend";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { SimpleLineChart } from "../components/SimpleLineChart";
import { getUserFriendlyError, getToastErrorMessage } from "../lib/errorMessages";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { toast } from "sonner";
import { useAvantKeySession } from "../hooks/useAvantKeySession";

/**
 * Truncate a principal for display
 * Example: "abc123...xyz789"
 */
function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
}

/**
 * Format bigint timestamp to readable date
 */
function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n); // Convert nanoseconds to milliseconds
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get badge variant and label for role
 */
function getRoleBadge(role: Role) {
  switch (role) {
    case "Admin":
      return { variant: "default" as const, className: "bg-success text-white hover:bg-success/90" };
    case "Member":
      return { variant: "secondary" as const, className: "bg-info text-white hover:bg-info/90" };
    case "Viewer":
      return { variant: "outline" as const, className: "" };
    default:
      return { variant: "outline" as const, className: "" };
  }
}

/**
 * Format bigint to number for display
 */
function formatBigInt(value: bigint): string {
  return value.toString();
}

/**
 * Format success rate percentage
 */
function formatSuccessRate(rate: bigint): string {
  return `${rate.toString()}%`;
}

/**
 * Get success rate color class
 */
function getSuccessRateColor(rate: bigint): string {
  const numRate = Number(rate);
  if (numRate >= 95) return "text-green-600";
  if (numRate >= 90) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Format a nanosecond timestamp as a short datetime string
 */
function formatTimestampShort(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format how many hours/minutes until a nanosecond timestamp
 */
function formatRelativeExpiry(expiresAtNs: bigint): string {
  const nowMs = Date.now();
  const expiresMs = Number(expiresAtNs / 1_000_000n);
  const diffMs = expiresMs - nowMs;

  if (diffMs <= 0) return "Expired";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return `in ${days} day${days !== 1 ? "s" : ""}`;
  }
  if (diffHours > 0) {
    return `in ${diffHours}h ${diffMinutes}m`;
  }
  return `in ${diffMinutes}m`;
}

/**
 * Convert daily trend data to chart format
 */
function formatTrendData(data: Array<[bigint, bigint]>): Array<{ date: string; value: number }> {
  return data.map(([day, calls]) => {
    // Convert day number to readable date (last X days)
    const currentDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const daysAgo = currentDay - Number(day);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Number(calls),
    };
  });
}

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const {
    data: tenant,
    isLoading: tenantLoading,
    error: tenantError,
    refetch: refetchTenant,
  } = useGetCurrentTenant();
  const { session, isLoading: sessionLoading, revokeSession } = useAvantKeySession();
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
  } = useGetTenantMembers();

  // API Key management state
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showKeyRevealDialog, setShowKeyRevealDialog] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Analytics period state (7 or 30 days)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<7 | 30>(7);

  // Analytics queries
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useGetAnalyticsSummary(tenant?.id, analyticsPeriod);

  const {
    data: dailyTrendData,
    isLoading: trendLoading,
  } = useGetDailyTrend(tenant?.id, 30);

  const {
    data: eventBreakdownData,
    isLoading: breakdownLoading,
  } = useGetEventBreakdown(tenant?.id);

  // Fetch user role for permissions
  const { data: userRole } = useGetUserRole();

  const isLoading = tenantLoading || membersLoading;
  const error = tenantError || membersError;

  // Generate masked API key based on tenant ID
  const getMaskedApiKey = () => {
    if (!tenant) return "pk_••••••••_••••••••••••••••";
    return `pk_${tenant.id}_••••••••••••••••`;
  };

  // Handle API key regeneration
  const handleRegenerateApiKey = async () => {
    if (!actor) return;
    
    setIsRegenerating(true);
    try {
      const newApiKey = await actor.regenerateApiKey();
      setCurrentApiKey(newApiKey);
      setShowRegenerateDialog(false);
      setShowKeyRevealDialog(true);
      setIsRevealed(true);
      toast.success("API key regenerated successfully");
    } catch (err) {
      console.error("Failed to regenerate API key:", err);
      toast.error(getToastErrorMessage(err));
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle closing the reveal dialog
  const handleCloseRevealDialog = () => {
    setShowKeyRevealDialog(false);
    setIsRevealed(false);
    setCurrentApiKey(null);
  };

  // Handle session revocation
  const [isRevokingSession, setIsRevokingSession] = useState(false);
  const handleRevokeSession = async () => {
    setIsRevokingSession(true);
    try {
      await revokeSession();
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setIsRevokingSession(false);
    }
  };

  // Determine session status
  const sessionIsActive = session !== null && session !== undefined && !session.revoked;
  const sessionIsRevoked = session !== null && session !== undefined && session.revoked;
  const sessionIsExpired =
    session !== null &&
    session !== undefined &&
    !session.revoked &&
    Number(session.expiresAt / 1_000_000n) < Date.now();

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading tenant data...
            </p>
          </div>
        </div>
      )}
        {/* Error State */}
      {error && (() => {
        const friendlyError = getUserFriendlyError(error);
        return (
          <ErrorCard
            title={friendlyError.title}
            message={friendlyError.message}
            canRetry={friendlyError.canRetry}
            onRetry={friendlyError.canRetry ? refetchTenant : undefined}
          />
        );
      })()}

      {/* Analytics Section */}
      {tenant && !isLoading && (
        <>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-semibold">Analytics</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor your authentication gateway usage and performance
                </p>
              </div>
              {/* Period Toggle */}
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod(7)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    analyticsPeriod === 7
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  7 days
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod(30)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    analyticsPeriod === 30
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  30 days
                </button>
              </div>
            </div>

            {/* Hero Metrics Cards */}
            {analyticsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="shadow-card">
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : analyticsData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total API Calls */}
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Total API Calls
                        </p>
                        <p className="text-2xl font-bold">
                          {formatBigInt(analyticsData.totalApiCalls)}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active End-Users */}
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Active End-Users
                        </p>
                        <p className="text-2xl font-bold">
                          {formatBigInt(analyticsData.activeEndUsers)}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-info" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Success Rate */}
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Success Rate
                        </p>
                        <p className={`text-2xl font-bold ${getSuccessRateColor(analyticsData.authSuccessRate)}`}>
                          {formatSuccessRate(analyticsData.authSuccessRate)}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Webhook Health */}
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Webhook Health
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-success">
                            {formatBigInt(analyticsData.webhookHealth.success)}
                          </p>
                          <p className="text-sm text-muted-foreground">/</p>
                          <p className="text-sm text-destructive">
                            {formatBigInt(analyticsData.webhookHealth.failure)}
                          </p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No analytics data available yet. Start using your API to see metrics.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Daily API Calls Chart */}
            {!trendLoading && dailyTrendData && dailyTrendData.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Daily API Calls</CardTitle>
                  <CardDescription>API call volume over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleLineChart data={formatTrendData(dailyTrendData)} height={240} />
                </CardContent>
              </Card>
            )}

            {/* Event Breakdown */}
            {!breakdownLoading && eventBreakdownData && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Event Breakdown</CardTitle>
                  <CardDescription>Authentication events by type (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Registered */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium">User Registered</span>
                      </div>
                      <span className="text-sm font-bold">{formatBigInt(eventBreakdownData.registered)}</span>
                    </div>

                    {/* Authenticated */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-success"></div>
                        <span className="text-sm font-medium">User Authenticated</span>
                      </div>
                      <span className="text-sm font-bold">{formatBigInt(eventBreakdownData.authenticated)}</span>
                    </div>

                    {/* Failed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-destructive"></div>
                        <span className="text-sm font-medium">Authentication Failed</span>
                      </div>
                      <span className="text-sm font-bold">{formatBigInt(eventBreakdownData.failed)}</span>
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-sm font-semibold">Total Events</span>
                      <span className="text-sm font-bold">
                        {formatBigInt(
                          eventBreakdownData.registered +
                          eventBreakdownData.authenticated +
                          eventBreakdownData.failed
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Tenant Info Card */}
      {tenant && !isLoading && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Tenant Information</CardTitle>
            <CardDescription>
              Your organization details and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tenant Name
                </dt>
                <dd className="text-sm font-medium">{tenant.name}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tenant ID
                </dt>
                <dd className="text-sm font-mono text-foreground/80">
                  {tenant.id}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Owner Principal
                </dt>
                <dd className="text-sm font-mono text-foreground/80 break-all">
                  {tenant.owner.toString()}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Created
                </dt>
                <dd className="text-sm">{formatTimestamp(tenant.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
      {/* AvantKey Session Card */}
      {tenant && !isLoading && (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Avantkey Session
                </CardTitle>
                <CardDescription className="mt-1">
                  Your delegated session issued by Avantkey
                </CardDescription>
              </div>
              {sessionIsActive && !sessionIsExpired && (
                <Badge className="bg-success/15 text-success border-success/20 border">
                  <span className="relative flex h-1.5 w-1.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                  </span>
                  Active
                </Badge>
              )}
              {sessionIsExpired && (
                <Badge variant="outline" className="text-warning border-warning/30">
                  Expired
                </Badge>
              )}
              {sessionIsRevoked && (
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  Revoked
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sessionLoading && !session ? (
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Registering delegation...</p>
              </div>
            ) : sessionIsRevoked || sessionIsExpired ? (
              <div className="flex items-center gap-3 py-2 text-muted-foreground">
                <ShieldOff className="w-4 h-4 shrink-0" />
                <p className="text-sm">
                  No active session.{" "}
                  <span className="text-foreground/70">Re-authenticate to start a new session.</span>
                </p>
              </div>
            ) : session ? (
              <div className="space-y-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Session ID
                    </dt>
                    <dd className="text-sm font-mono text-foreground/80">
                      {session.sessionId.slice(0, 12)}...
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Issued At
                    </dt>
                    <dd className="text-sm text-foreground/80">
                      {formatTimestampShort(session.issuedAt)}
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Expires
                    </dt>
                    <dd className="text-sm text-foreground/80">
                      {formatRelativeExpiry(session.expiresAt)}
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Tenant ID
                    </dt>
                    <dd className="text-sm font-mono text-foreground/80 truncate">
                      {session.tenantId}
                    </dd>
                  </div>
                </dl>

                <div className="pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRevokeSession}
                    disabled={isRevokingSession}
                  >
                    {isRevokingSession ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Revoke Session
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Registering delegation...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Key Card */}
      {tenant && !isLoading && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key
            </CardTitle>
            <CardDescription>
              Use this key to authenticate your applications with the gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* API Key Display */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between gap-4">
                  <code className="text-sm font-mono break-all flex-1">
                    {isRevealed && currentApiKey ? currentApiKey : getMaskedApiKey()}
                  </code>
                  <div className="flex items-center gap-2 shrink-0">
                    {isRevealed && currentApiKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyApiKey(currentApiKey)}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Message (shown when revealed) */}
              {isRevealed && currentApiKey && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-xs text-warning-foreground">
                    <strong>Save this key now</strong> - you won't see it again after you close this
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {userRole === "Admin" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowRegenerateDialog(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate API Key
                  </Button>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 border border-border rounded-md">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Only admins can regenerate API keys
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Members Table */}
      {members && !isLoading && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Team Members</CardTitle>
            <CardDescription>
              Users with access to this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No members found
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-display">Principal</TableHead>
                      <TableHead className="font-display">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const principalStr = member.user.toString();
                      const isCurrentUser =
                        identity && principalStr === identity.getPrincipal().toString();
                      const roleBadge = getRoleBadge(member.role);

                      return (
                        <TableRow key={principalStr}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {truncatePrincipal(principalStr)}
                              </code>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={roleBadge.variant}
                              className={roleBadge.className}
                            >
                              {member.role}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate your current API key. Any applications using the old key will stop working. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateApiKey}
              disabled={isRegenerating}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Key Reveal Dialog */}
      <Dialog open={showKeyRevealDialog} onOpenChange={handleCloseRevealDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              Save this key securely. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* API Key Display */}
            <div className="bg-muted rounded-lg p-4 border border-border">
              <code className="text-sm font-mono break-all block mb-3">
                {currentApiKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => currentApiKey && handleCopyApiKey(currentApiKey)}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to clipboard
                  </>
                )}
              </Button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-md">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-warning-foreground">
                  Save this key now
                </p>
                <p className="text-xs text-warning-foreground/80">
                  You won't see it again after you close this dialog. Store it securely in your password manager or environment variables.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
