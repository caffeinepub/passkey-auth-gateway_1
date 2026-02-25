import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "line";
  count?: number;
  className?: string;
}

/**
 * Skeleton loader for cards, tables, and lines
 */
export function LoadingSkeleton({
  variant = "card",
  count = 1,
  className = "",
}: LoadingSkeletonProps) {
  if (variant === "line") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`line-${i}-${count}`}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`table-${i}-${count}`}
            className="flex items-center gap-4 p-4 border border-border rounded-lg"
          >
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  // Card variant
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`card-${i}-${count}`} className="shadow-card">
          <CardHeader>
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-16" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
