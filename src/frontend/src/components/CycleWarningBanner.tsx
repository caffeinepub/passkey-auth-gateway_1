import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CycleWarningBannerProps {
  cycleBalance: bigint;
  onViewDetails: () => void;
}

const TRILLION = BigInt(1_000_000_000_000);
const WARNING_THRESHOLD = 10n * TRILLION; // 10T cycles
const CRITICAL_THRESHOLD = 5n * TRILLION; // 5T cycles
const SESSION_STORAGE_KEY = "cycle-warning-dismissed";

/**
 * Warning banner that shows when cycle balance is low
 * Only visible to Admin users
 * Dismissible per browser session
 */
export default function CycleWarningBanner({
  cycleBalance,
  onViewDetails,
}: CycleWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Don't show if balance is healthy or dismissed
  if (cycleBalance >= WARNING_THRESHOLD || isDismissed) {
    return null;
  }

  const isCritical = cycleBalance < CRITICAL_THRESHOLD;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
  };

  return (
    <div
      className={`${
        isCritical
          ? "bg-destructive/10 border-destructive/20"
          : "bg-warning/10 border-warning/20"
      } border-b px-6 py-3`}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle
            className={`w-5 h-5 shrink-0 ${
              isCritical ? "text-destructive" : "text-warning"
            }`}
          />
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                isCritical ? "text-destructive-foreground" : "text-foreground"
              }`}
            >
              {isCritical ? "Critical:" : "Warning:"} Low cycle balance
              detected.{" "}
              <button
                type="button"
                onClick={onViewDetails}
                className="underline hover:no-underline font-semibold"
              >
                View Details
              </button>
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
