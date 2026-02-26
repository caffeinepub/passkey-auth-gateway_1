import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ScrollText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Shield,
  Info,
} from "lucide-react";
import { useGetCurrentTenant, useGetUserRole, useGetAuditLog, useGetAuditLogCount } from "../hooks/useQueries";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorCard } from "../components/ErrorCard";
import { getUserFriendlyError } from "../lib/errorMessages";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert nanosecond bigint timestamp to a readable locale string.
 */
function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Classify an eventType into a color category.
 */
type EventCategory = "success" | "failure" | "system";

function getEventCategory(eventType: string): EventCategory {
  if (["user_registered", "user_authenticated"].includes(eventType)) return "success";
  if (["auth_failed"].includes(eventType)) return "failure";
  return "system"; // api_key_regenerated, member_added, member_removed, role_changed, etc.
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const category = getEventCategory(eventType);
  const label = eventType.replace(/_/g, " ");

  const classes =
    category === "success"
      ? "bg-success/15 text-success border-success/30"
      : category === "failure"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : "bg-info/15 text-info border-info/30";

  return (
    <Badge variant="outline" className={`font-mono text-xs ${classes}`}>
      {label}
    </Badge>
  );
}

function StatusBadge({ success }: { success: boolean }) {
  if (success) {
    return (
      <span className="flex items-center justify-center gap-1">
        <CheckCircle className="w-4 h-4 text-success" />
        <span className="text-xs text-success font-medium sr-only">ok</span>
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center gap-1">
      <XCircle className="w-4 h-4 text-destructive" />
      <span className="text-xs text-destructive font-medium sr-only">fail</span>
    </span>
  );
}

/**
 * Truncated text with inline copy button.
 */
function TruncatedId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  };

  const truncated =
    value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1.5 font-mono text-xs cursor-default">
            <span className="text-muted-foreground">{truncated}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
              aria-label="Copy value"
            >
              {copied ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-all">
          <p className="font-mono text-xs">{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditLog() {
  const { data: tenant } = useGetCurrentTenant();
  const { data: userRole, isLoading: roleLoading } = useGetUserRole();
  const {
    data: auditEntries,
    isLoading: logLoading,
    error: logError,
    refetch,
  } = useGetAuditLog(tenant?.id, 100);
  const { data: totalCount } = useGetAuditLogCount(tenant?.id);

  const isLoading = roleLoading || logLoading;

  // ── Access denied for non-Admin ──
  if (!roleLoading && userRole !== "Admin") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold">
            Certified Audit Log
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every auth event cryptographically recorded on-chain.
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
              Only administrators can access the certified audit log.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ──
  if (logError) {
    const friendlyError = getUserFriendlyError(logError);
    return (
      <div className="space-y-6">
        <AuditLogHeader />
        <ErrorCard
          title={friendlyError.title}
          message={friendlyError.message}
          canRetry={friendlyError.canRetry}
          onRetry={friendlyError.canRetry ? refetch : undefined}
        />
      </div>
    );
  }

  const displayCount = auditEntries?.length ?? 0;
  const totalCountNum = totalCount !== undefined ? Number(totalCount) : undefined;

  return (
    <div className="space-y-6">
      <AuditLogHeader />

      {/* ICP advantage info card */}
      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              On-Chain Certified Log
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This audit log is stored on Internet Computer blockchain
              infrastructure. Unlike traditional databases, on-chain logs cannot
              be silently modified or deleted by any party — not even us.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Count summary */}
      {!isLoading && totalCountNum !== undefined && (
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{displayCount}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalCountNum}</span>{" "}
            total events
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <LoadingSkeleton variant="table" count={6} />}

      {/* Audit log table */}
      {!isLoading && auditEntries && auditEntries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ScrollText className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground">No audit events yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                No audit events recorded yet. Events will appear here as your
                users authenticate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && auditEntries && auditEntries.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-base">
                  Recent Events
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Append-only on-chain record — cannot be edited or deleted
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold">Event Type</TableHead>
                  <TableHead className="text-xs font-semibold">User ID</TableHead>
                  <TableHead className="text-xs font-semibold">Caller Principal</TableHead>
                  <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3">
                      <EventTypeBadge eventType={entry.eventType} />
                    </TableCell>
                    <TableCell className="py-3">
                      {entry.userId ? (
                        <TruncatedId value={entry.userId} />
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {entry.callerPrincipal ? (
                        <TruncatedId value={entry.callerPrincipal} />
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <StatusBadge success={entry.success} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function AuditLogHeader() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-display font-semibold">
          Certified Audit Log
        </h2>
        <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30">
          ICP Certified
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Every auth event cryptographically recorded on-chain. This log is
        append-only and cannot be edited or deleted by anyone.
      </p>
    </div>
  );
}
