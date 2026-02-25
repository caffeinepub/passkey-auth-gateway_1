/**
 * Error message utility for user-friendly error handling
 * Maps backend errors and common failure patterns to helpful messages
 */

export interface FriendlyError {
  title: string;
  message: string;
  canRetry: boolean;
}

/**
 * Convert any error to a user-friendly error object
 */
export function getUserFriendlyError(error: unknown): FriendlyError {
  // Handle null/undefined
  if (!error) {
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred. Please try again.",
      canRetry: true,
    };
  }

  // Extract error message string
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network/Connection Errors
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("canister is stopped") ||
    lowerMessage.includes("not initialized")
  ) {
    return {
      title: "Connection Issue",
      message:
        "We're having trouble connecting to the service. This might be temporary. Please try again in a moment.",
      canRetry: true,
    };
  }

  // Permission Errors
  if (
    lowerMessage.includes("only admins") ||
    lowerMessage.includes("permission denied") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("not authorized")
  ) {
    return {
      title: "Permission Denied",
      message:
        "You don't have permission to perform this action. Contact your tenant admin if you need access.",
      canRetry: false,
    };
  }

  // Tenant/Resource Not Found
  if (
    lowerMessage.includes("tenant not found") ||
    lowerMessage.includes("not found")
  ) {
    return {
      title: "Not Found",
      message:
        "We couldn't find the requested resource. Your account may not be set up yet.",
      canRetry: true,
    };
  }

  // Validation Errors - Principal ID
  if (
    lowerMessage.includes("invalid principal") ||
    lowerMessage.includes("principal id format") ||
    lowerMessage.includes("principal format")
  ) {
    return {
      title: "Invalid Principal ID",
      message:
        "The Principal ID format is incorrect. It should look like: abc12-defgh-34567-ijklm...",
      canRetry: false,
    };
  }

  // Validation Errors - Webhook URL
  if (
    lowerMessage.includes("invalid url") ||
    lowerMessage.includes("webhook url") ||
    lowerMessage.includes("must start with https")
  ) {
    return {
      title: "Invalid URL",
      message:
        "The webhook URL must be a valid HTTPS URL (e.g., https://api.example.com/webhook).",
      canRetry: false,
    };
  }

  // Already Exists Errors
  if (
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("duplicate")
  ) {
    return {
      title: "Already Exists",
      message: "This resource already exists. Check your existing records.",
      canRetry: false,
    };
  }

  // Self-Action Errors
  if (
    lowerMessage.includes("cannot remove yourself") ||
    lowerMessage.includes("cannot change your own role") ||
    lowerMessage.includes("cannot remove last admin")
  ) {
    return {
      title: "Action Not Allowed",
      message:
        "This action cannot be performed on your own account or the last admin.",
      canRetry: false,
    };
  }

  // Member Not Found
  if (lowerMessage.includes("member not found")) {
    return {
      title: "Member Not Found",
      message:
        "The team member you're looking for doesn't exist. They may have been removed.",
      canRetry: false,
    };
  }

  // Webhook Test/Delivery Errors
  if (lowerMessage.includes("webhook") && lowerMessage.includes("failed")) {
    return {
      title: "Webhook Delivery Failed",
      message:
        "The webhook endpoint didn't respond successfully. Check your URL and ensure it's accepting requests.",
      canRetry: true,
    };
  }

  // API Key Errors
  if (lowerMessage.includes("api key")) {
    return {
      title: "API Key Error",
      message:
        "There was a problem with your API key. Try regenerating it or contact support.",
      canRetry: true,
    };
  }

  // Cycle/Resource Exhaustion
  if (lowerMessage.includes("out of cycles") || lowerMessage.includes("insufficient cycles")) {
    return {
      title: "Service Unavailable",
      message:
        "The service is temporarily unavailable due to resource constraints. Please try again shortly.",
      canRetry: true,
    };
  }

  // Generic Server Errors
  if (
    lowerMessage.includes("internal error") ||
    lowerMessage.includes("server error") ||
    lowerMessage.includes("failed to")
  ) {
    return {
      title: "Server Error",
      message:
        "Something went wrong on our end. We're working on it. Please try again in a moment.",
      canRetry: true,
    };
  }

  // Default fallback
  return {
    title: "Something went wrong",
    message:
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    canRetry: true,
  };
}

/**
 * Get a short, user-friendly error message for toasts
 */
export function getToastErrorMessage(error: unknown): string {
  const friendly = getUserFriendlyError(error);
  return friendly.message;
}
