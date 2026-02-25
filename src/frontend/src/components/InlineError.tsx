import { AlertCircle } from "lucide-react";

interface InlineErrorProps {
  message: string;
  className?: string;
}

/**
 * Small inline error for form fields
 */
export function InlineError({ message, className = "" }: InlineErrorProps) {
  return (
    <p className={`text-xs text-destructive flex items-center gap-1 ${className}`}>
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}
