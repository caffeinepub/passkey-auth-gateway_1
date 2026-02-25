import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineBannerProps {
  onRetry: () => void;
}

/**
 * Banner shown when backend is offline/unavailable
 */
export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20 py-3">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive-foreground">
                Service Temporarily Unavailable
              </p>
              <p className="text-xs text-destructive-foreground/80">
                We're experiencing connectivity issues. Your data is safe.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            Check Again
          </Button>
        </div>
      </div>
    </div>
  );
}
