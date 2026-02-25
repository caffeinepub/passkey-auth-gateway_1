import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetCycleStats, useGetUserRole } from "../hooks/useQueries";
import { Loader2, AlertCircle, Gauge, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyError } from "../lib/errorMessages";
import { ErrorCard } from "../components/ErrorCard";

/**
 * Format cycle count to human-readable string with trillion suffix
 * Example: 8547321000000 -> "8.55 T"
 */
function formatCycles(cycles: bigint): string {
  const trillion = 1_000_000_000_000;
  const cyclesNum = Number(cycles);
  const trillions = cyclesNum / trillion;
  
  if (trillions >= 1000) {
    return `${(trillions / 1000).toFixed(2)} Q`; // Quadrillion
  } else if (trillions >= 1) {
    return `${trillions.toFixed(2)} T`;
  } else {
    const billions = cyclesNum / 1_000_000_000;
    return `${billions.toFixed(2)} B`;
  }
}

/**
 * Format bigint timestamp to readable date/time
 */
function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n); // Convert nanoseconds to milliseconds
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get status level based on cycle balance
 */
type StatusLevel = "healthy" | "warning" | "critical";

function getStatusLevel(balance: bigint): StatusLevel {
  const trillion = BigInt(1_000_000_000_000);
  if (balance >= 10n * trillion) return "healthy";
  if (balance >= 5n * trillion) return "warning";
  return "critical";
}

/**
 * Get status badge variant and icon
 */
function getStatusDisplay(level: StatusLevel) {
  switch (level) {
    case "healthy":
      return {
        label: "Healthy",
        icon: CheckCircle,
        badgeClass: "bg-success text-white hover:bg-success/90",
        textClass: "text-success",
      };
    case "warning":
      return {
        label: "Warning",
        icon: AlertTriangle,
        badgeClass: "bg-warning text-white hover:bg-warning/90",
        textClass: "text-warning",
      };
    case "critical":
      return {
        label: "Critical",
        icon: AlertCircle,
        badgeClass: "bg-destructive text-white hover:bg-destructive/90",
        textClass: "text-destructive",
      };
  }
}

/**
 * Calculate progress percentage relative to 10T "safe level"
 */
function getProgressPercentage(balance: bigint): number {
  const trillion = BigInt(1_000_000_000_000);
  const safeLevel = 10n * trillion;
  const percentage = (Number(balance) / Number(safeLevel)) * 100;
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Cycles Monitoring Dashboard Page
 * Admin-only page for monitoring canister cycle balance
 */
export default function CyclesPage() {
  const { data: userRole, isLoading: roleLoading } = useGetUserRole();
  const {
    data: cycleStats,
    isLoading: statsLoading,
    error: statsError,
    refetch,
  } = useGetCycleStats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const isLoading = roleLoading || statsLoading;

  // Redirect non-admins
  if (!roleLoading && userRole !== "Admin") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold">Cycle Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your canister's cycle balance and health
          </p>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only administrators can access the cycle monitoring dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["cycleStats"] });
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const statusLevel = cycleStats
    ? getStatusLevel(cycleStats.currentBalance)
    : "healthy";
  const statusDisplay = getStatusDisplay(statusLevel);
  const StatusIcon = statusDisplay.icon;
  const progressPercentage = cycleStats
    ? getProgressPercentage(cycleStats.currentBalance)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold">Cycle Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your canister's cycle balance and health
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading cycle data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {statsError && (() => {
        const friendlyError = getUserFriendlyError(statsError);
        return (
          <ErrorCard
            title={friendlyError.title}
            message={friendlyError.message}
            canRetry={friendlyError.canRetry}
            onRetry={friendlyError.canRetry ? refetch : undefined}
          />
        );
      })()}

      {/* Cycle Balance Hero Card */}
      {cycleStats && !isLoading && (
        <>
          <Card className="shadow-card border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gauge className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display">Current Cycle Balance</CardTitle>
                    <CardDescription>
                      Last updated: {formatTimestamp(cycleStats.lastChecked)}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={statusDisplay.badgeClass}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusDisplay.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Display */}
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <p className="text-5xl font-bold font-display">
                          {formatCycles(cycleStats.currentBalance)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">cycles</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-mono text-xs">
                        {cycleStats.currentBalance.toString()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Relative to 10T safe level
                  </span>
                  <span className={`font-semibold ${statusDisplay.textClass}`}>
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={progressPercentage}
                  className={`h-3 ${
                    statusLevel === "healthy"
                      ? "bg-muted"
                      : statusLevel === "warning"
                      ? "bg-warning/20"
                      : "bg-destructive/20"
                  }`}
                />
              </div>

              {/* Status Messages */}
              {statusLevel === "critical" && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive-foreground">
                      Critical: Immediate action required
                    </p>
                    <p className="text-xs text-destructive-foreground/80">
                      Your canister is running critically low on cycles. Top up
                      immediately to prevent service interruption.
                    </p>
                  </div>
                </div>
              )}

              {statusLevel === "warning" && (
                <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-md">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-warning-foreground">
                      Warning: Cycle balance is low
                    </p>
                    <p className="text-xs text-warning-foreground/80">
                      Consider topping up your canister cycles to maintain service
                      availability.
                    </p>
                  </div>
                </div>
              )}

              {statusLevel === "healthy" && (
                <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-md">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-success-foreground">
                      Healthy: Cycle balance is good
                    </p>
                    <p className="text-xs text-success-foreground/80">
                      Your canister has sufficient cycles for normal operation. Auto-refresh
                      is enabled every 30 seconds.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* About Cycles */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">About Cycles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Cycles are the computational currency of the Internet Computer. They
                  power every operation your canister performs.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>
                      <strong>1 Trillion cycles</strong> ≈ $1.30 USD
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>
                      <strong>Safe level:</strong> Keep above 10T cycles
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>
                      <strong>Auto-refresh:</strong> Data updates every 30 seconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Top Up */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">How to Top Up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  To add cycles to your canister, use the dfx command-line tool or the
                  NNS dashboard.
                </p>
                <div className="space-y-3 pt-2">
                  <div>
                    <p className="font-medium mb-1">Via dfx (recommended):</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                      dfx canister deposit-cycles [AMOUNT] [CANISTER-ID]
                    </code>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Via NNS Dashboard:</p>
                    <p className="text-muted-foreground">
                      Visit{" "}
                      <a
                        href="https://nns.ic0.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        nns.ic0.app
                      </a>{" "}
                      and navigate to your canister.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
