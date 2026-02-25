import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorCardProps {
  title: string;
  message: string;
  canRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Full-width error card with retry option
 */
export function ErrorCard({
  title,
  message,
  canRetry = false,
  onRetry,
  className = "",
}: ErrorCardProps) {
  return (
    <Card className={`border-destructive ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <CardTitle className="text-destructive">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {canRetry && onRetry && (
          <Button variant="outline" onClick={onRetry} size="sm">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
