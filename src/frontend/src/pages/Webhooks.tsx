import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Loader2,
  Copy,
  Check,
  TestTube,
  AlertTriangle,
  Webhook,
} from "lucide-react";
import { useActor } from "../hooks/useActor";
import { useGetWebhookConfig, useGetWebhookDeliveries, useGetUserRole } from "../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserFriendlyError, getToastErrorMessage } from "../lib/errorMessages";
import { ErrorCard } from "../components/ErrorCard";
import { InlineError } from "../components/InlineError";

// Event type definitions
const EVENT_TYPES = [
  {
    id: "user.registered",
    label: "user.registered",
    description: "When an end-user signs up",
  },
  {
    id: "user.authenticated",
    label: "user.authenticated",
    description: "When an end-user logs in successfully",
  },
  {
    id: "auth.failed",
    label: "auth.failed",
    description: "When authentication fails",
  },
];

/**
 * Format bigint timestamp to relative time
 */
function formatRelativeTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n); // Convert nanoseconds to milliseconds
  const now = Date.now();
  const diff = now - ms;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Get badge variant and label for HTTP status
 */
function getStatusBadge(status: number | null) {
  if (status === null) {
    return { variant: "secondary" as const, label: "Failed", className: "bg-gray-500 text-white" };
  }
  if (status >= 200 && status < 300) {
    return { variant: "default" as const, label: "Success", className: "bg-green-600 text-white hover:bg-green-700" };
  }
  return { variant: "destructive" as const, label: `${status}`, className: "" };
}

export default function Webhooks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  // Fetch webhook config and deliveries
  const {
    data: webhookConfig,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useGetWebhookConfig();
  
  const {
    data: deliveries,
    isLoading: deliveriesLoading,
    refetch: refetchDeliveries,
  } = useGetWebhookDeliveries();

  // Fetch user role for permissions
  const { data: userRole } = useGetUserRole();

  // Form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [signingSecret, setSigningSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Load existing config into form
  useEffect(() => {
    if (webhookConfig) {
      setIsConfigured(!!webhookConfig.url);
      setWebhookUrl(webhookConfig.url || "");
      setSelectedEvents(webhookConfig.enabledEvents || []);
      setIsEnabled(webhookConfig.enabled);
    }
  }, [webhookConfig]);

  // Validate URL
  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError("Webhook URL is required");
      return false;
    }
    if (!url.startsWith("https://")) {
      setUrlError("Webhook URL must start with https://");
      return false;
    }
    try {
      new URL(url);
    } catch {
      setUrlError("Invalid URL format");
      return false;
    }
    setUrlError(null);
    return true;
  };

  // Validate events
  const validateEvents = (): boolean => {
    if (selectedEvents.length === 0) {
      setEventsError("At least one event type must be selected");
      return false;
    }
    setEventsError(null);
    return true;
  };

  // Handle event checkbox toggle
  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
    setEventsError(null);
  };

  // Handle webhook configuration save
  const handleSaveConfiguration = async () => {
    if (!actor) return;
    
    // Validate
    const isUrlValid = validateUrl(webhookUrl);
    const areEventsValid = validateEvents();
    
    if (!isUrlValid || !areEventsValid) {
      return;
    }

    setIsSaving(true);
    try {
      const secret = await actor.configureWebhook(webhookUrl, selectedEvents);
      setSigningSecret(secret);
      setShowSecretDialog(true);
      setIsConfigured(true);
      
      // Refetch config
      await queryClient.invalidateQueries({ queryKey: ["webhookConfig"] });
      
      toast.success("Webhook configured successfully");
    } catch (err) {
      console.error("Failed to configure webhook:", err);
      toast.error(getToastErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle webhook status toggle
  const handleToggleStatus = async (enabled: boolean) => {
    if (!actor) return;
    
    setIsTogglingStatus(true);
    try {
      await actor.updateWebhookStatus(enabled);
      setIsEnabled(enabled);
      
      // Refetch config
      await queryClient.invalidateQueries({ queryKey: ["webhookConfig"] });
      
      toast.success(`Webhook ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      console.error("Failed to update webhook status:", err);
      toast.error(getToastErrorMessage(err));
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Handle test webhook
  const handleTestWebhook = async () => {
    if (!actor) return;
    
    setIsTesting(true);
    const toastId = toast.loading("Sending test webhook...");
    try {
      const result = await actor.testWebhook();
      
      if (result.status >= 200 && result.status < 300) {
        toast.success(`Test webhook delivered successfully (${result.status})`, { id: toastId });
      } else {
        toast.error(`Test webhook failed (${result.status}): ${result.message}`, { id: toastId });
      }
      
      // Refetch deliveries to show the test
      setTimeout(() => {
        refetchDeliveries();
      }, 1000);
    } catch (err) {
      console.error("Failed to test webhook:", err);
      toast.error(getToastErrorMessage(err), { id: toastId });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground mt-2">
          Configure webhook endpoints to receive real-time auth events
        </p>
      </div>

      {/* Cycles Cost Warning */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-warning-foreground">
            Webhook Delivery Costs
          </p>
          <p className="text-xs text-warning-foreground/80">
            Each webhook costs ~0.4M cycles (~$0.0005 USD). Failed deliveries with retries cost ~1.6M cycles.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {configLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading webhook configuration...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {configError && (() => {
        const friendlyError = getUserFriendlyError(configError);
        return (
          <ErrorCard
            title={friendlyError.title}
            message={friendlyError.message}
            canRetry={friendlyError.canRetry}
            onRetry={friendlyError.canRetry ? refetchConfig : undefined}
          />
        );
      })()}

      {/* Webhook Configuration Card */}
      {!configLoading && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Set up your webhook endpoint to receive authentication events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userRole === "Viewer" ? (
              // Viewer - Read-only message
              <div className="flex items-start gap-3 p-6 bg-muted/50 border border-border rounded-lg text-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Webhook Configuration Access Restricted
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Only admins and members can configure webhooks. Contact your tenant admin for access.
                  </p>
                </div>
              </div>
            ) : (
              // Admin and Member - Full configuration UI
              <>
                {/* Webhook URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://api.example.com/webhooks"
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      setUrlError(null);
                    }}
                    className={urlError ? "border-destructive" : ""}
                  />
                  {urlError && <InlineError message={urlError} />}
                </div>

                {/* Signing Secret (if configured) */}
                {isConfigured && (
                  <div className="space-y-2">
                    <Label>Webhook Signing Secret</Label>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <code className="text-xs font-mono">whsec_••••••••••••••••</code>
                      <p className="text-xs text-muted-foreground mt-2">
                        The signing secret was shown once during configuration. Use it to verify webhook authenticity.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event Types */}
                <div className="space-y-3">
                  <Label>Event Types</Label>
                  {eventsError && <InlineError message={eventsError} />}
                  <div className="space-y-3">
                    {EVENT_TYPES.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={event.id}
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={() => handleEventToggle(event.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={event.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {event.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enable/Disable Toggle (only if configured) */}
                {isConfigured && (
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="space-y-0.5">
                      <Label htmlFor="webhook-enabled">Enable Webhook</Label>
                      <p className="text-xs text-muted-foreground">
                        Pause webhook delivery to save cycles
                      </p>
                    </div>
                    <Switch
                      id="webhook-enabled"
                      checked={isEnabled}
                      onCheckedChange={handleToggleStatus}
                      disabled={isTogglingStatus}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveConfiguration}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isConfigured ? (
                      "Update Configuration"
                    ) : (
                      "Save Configuration"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={!isConfigured || !webhookUrl || isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Webhook
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delivery History Card */}
      {!configLoading && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Deliveries (Last 50)</CardTitle>
            <CardDescription>
              Track webhook delivery status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !deliveries || deliveries.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No webhook deliveries yet. Configure a webhook URL and send a test event to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-display">Time</TableHead>
                      <TableHead className="font-display">Event Type</TableHead>
                      <TableHead className="font-display">Status</TableHead>
                      <TableHead className="font-display">Retry Count</TableHead>
                      <TableHead className="font-display">Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery: any, index: number) => {
                      const statusBadge = getStatusBadge(delivery.httpStatus);
                      const retryCount = Number(delivery.retryCount || 0n);
                      const responseTime = delivery.responseTime
                        ? Number(delivery.responseTime)
                        : null;

                      return (
                        <TableRow key={delivery.id || index}>
                          <TableCell className="text-sm">
                            {formatRelativeTime(delivery.timestamp)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {delivery.eventType}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusBadge.variant}
                              className={statusBadge.className}
                            >
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {retryCount}/4
                          </TableCell>
                          <TableCell className="text-sm">
                            {responseTime !== null ? `${responseTime}ms` : "—"}
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

      {/* Signing Secret Reveal Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Webhook Signing Secret</DialogTitle>
            <DialogDescription>
              Save this secret securely. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Secret Display */}
            <div className="bg-muted rounded-lg p-4 border border-border">
              <code className="text-sm font-mono break-all block mb-3">
                {signingSecret}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signingSecret && handleCopy(signingSecret)}
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
                  ⚠️ Save this secret now
                </p>
                <p className="text-xs text-warning-foreground/80">
                  You won't see it again after you close this dialog. Use it to verify webhook signatures in your application.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
