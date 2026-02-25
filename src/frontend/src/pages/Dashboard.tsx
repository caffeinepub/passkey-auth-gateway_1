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
import { Loader2, AlertCircle, Key, Copy, RefreshCw, Check, AlertTriangle, TrendingUp, Users, Activity, Webhook } from "lucide-react";
import type { Role } from "../backend";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { SimpleLineChart } from "../components/SimpleLineChart";

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
  } = useGetCurrentTenant();
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
    } catch (err) {
      console.error("Failed to regenerate API key:", err);
      alert("Failed to regenerate API key. Please try again.");
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
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load tenant data"}
            </p>
          </CardContent>
        </Card>
      )}

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
                    {members.map((member, index) => {
                      const principalStr = member.user.toString();
                      const isCurrentUser =
                        identity && principalStr === identity.getPrincipal().toString();
                      const roleBadge = getRoleBadge(member.role);

                      return (
                        <TableRow key={`${principalStr}-${index}`}>
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
