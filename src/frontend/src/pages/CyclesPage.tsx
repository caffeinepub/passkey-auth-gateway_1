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
import {
  Loader2,
  AlertCircle,
  Gauge,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Zap,
  ClipboardList,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyError } from "../lib/errorMessages";
import { ErrorCard } from "../components/ErrorCard";

const CANISTER_ID = "lep6p-paaaa-aaaai-q5v4q-cai";

const TOP_UP_OPTIONS = [
  {
    label: "5T cycles",
    amount: "5_000_000_000_000",
    usd: "~$6.50 USD",
    note: "good for early beta",
  },
  {
    label: "10T cycles",
    amount: "10_000_000_000_000",
    usd: "~$13.00 USD",
    note: "recommended buffer",
  },
  {
    label: "20T cycles",
    amount: "20_000_000_000_000",
    usd: "~$26.00 USD",
    note: "comfortable runway for launch",
  },
];

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
 * Small inline copy button that shows a checkmark briefly after copying
 */
function CopyButton({
  text,
  title = "Copy",
  variant = "ghost",
  size = "sm",
}: {
  text: string;
  title?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleCopy}
            className="h-7 w-7 p-0 shrink-0"
            aria-label={title}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{copied ? "Copied!" : title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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
  const [canisterIdCopied, setCanisterIdCopied] = useState(false);
  const queryClient = useQueryClient();

  const isLoading = roleLoading || statsLoading;

  // Redirect non-admins
  if (!roleLoading && userRole !== "Admin") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold">
            Cycle Monitoring
          </h2>
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

  const handleCopyCanisterId = async () => {
    try {
      await navigator.clipboard.writeText(CANISTER_ID);
      setCanisterIdCopied(true);
      setTimeout(() => setCanisterIdCopied(false), 1500);
    } catch {
      // clipboard not available
    }
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
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-semibold">
            Cycle Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your canister's cycle balance and health
          </p>
          {/* Canister ID badge */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-xs text-muted-foreground">Canister:</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
              {CANISTER_ID}
            </code>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCanisterId}
                    className="h-6 w-6 p-0"
                    aria-label="Copy canister ID"
                  >
                    {canisterIdCopied ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">
                    {canisterIdCopied ? "Copied!" : "Copy canister ID"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading cycle data...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {statsError &&
        (() => {
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
                    <CardTitle className="font-display">
                      Current Cycle Balance
                    </CardTitle>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          cycles
                        </p>
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
                      Consider topping up your canister cycles to maintain
                      service availability.
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
                      Your canister has sufficient cycles for normal operation.
                      Auto-refresh is enabled every 30 seconds.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Cards — 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1 — About Cycles */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  About Cycles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Cycles are the computational currency of the Internet
                  Computer. They power every operation your canister performs.
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
                      <strong>Auto-refresh:</strong> Data updates every 30
                      seconds
                    </p>
                  </div>
                </div>

                {/* Avantkey operation costs */}
                <div className="pt-3 border-t border-border">
                  <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Avantkey Operation Costs
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        API verify / authenticate
                      </span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                        ~0.001T
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Webhook delivery (HTTP outcall)
                      </span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                        ~0.4T
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Data storage (per KB/day)
                      </span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                        ~0.001T
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Row 1 — How to Top Up */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  How to Top Up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  To add cycles to your canister, use the dfx command-line tool
                  or the NNS dashboard.
                </p>
                <div className="space-y-3 pt-2">
                  <div>
                    <p className="font-medium mb-1">Via dfx (recommended):</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1.5 rounded flex-1 overflow-x-auto whitespace-nowrap">
                        dfx canister deposit-cycles [AMOUNT]{" "}
                        {CANISTER_ID}
                      </code>
                      <CopyButton
                        text={`dfx canister deposit-cycles [AMOUNT] ${CANISTER_ID}`}
                        title="Copy dfx command"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Via NNS Dashboard:</p>
                    <p className="text-muted-foreground">
                      Visit{" "}
                      <a
                        href={`https://nns.ic0.app/canister/?canister=${CANISTER_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        nns.ic0.app/canister/?canister={CANISTER_ID}
                      </a>{" "}
                      to manage cycles directly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Row 2 — Top-Up Guide */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <CardTitle className="font-display text-lg">
                    Recommended Top-Up Amounts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  {TOP_UP_OPTIONS.map((option) => {
                    const cmd = `dfx canister deposit-cycles ${option.amount} ${CANISTER_ID}`;
                    return (
                      <div
                        key={option.amount}
                        className="flex items-start gap-3 p-3 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {option.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {option.usd}
                            </span>
                            <span className="text-xs text-muted-foreground italic">
                              — {option.note}
                            </span>
                          </div>
                          <code className="text-xs font-mono text-muted-foreground break-all">
                            {cmd}
                          </code>
                        </div>
                        <CopyButton text={cmd} title="Copy dfx command" />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                  1 Trillion cycles ≈ $1.30 USD at current ICP rates
                </p>
              </CardContent>
            </Card>

            {/* Row 2 — Production Routine */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <CardTitle className="font-display text-lg">
                    Weekly Top-Up Checklist
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ol className="space-y-2.5">
                  {[
                    { id: "check-balance", text: "Check cycle balance in this dashboard" },
                    { id: "critical-topup", text: "If balance < 5T, top up immediately" },
                    { id: "warning-topup", text: "If balance < 10T, schedule top-up within 48 hours" },
                    { id: "beta-check", text: "After beta launch: check daily until traffic patterns stabilize" },
                  ].map((item, i) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ol>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Each webhook delivery costs ~0.4T cycles. At 100
                      webhooks/day, plan for{" "}
                      <strong className="text-foreground">
                        ~40T cycles/day
                      </strong>{" "}
                      in webhook costs.
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
