import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Fingerprint, Loader2, X, Lock } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, isLoggingIn, isLoginError, loginError, isLoginSuccess } =
    useInternetIdentity();

  // Auto-close when login succeeds
  useEffect(() => {
    if (isLoginSuccess) {
      onClose();
    }
  }, [isLoginSuccess, onClose]);

  const handleLogin = () => {
    login();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isLoggingIn) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] p-0 overflow-hidden border-0 bg-transparent shadow-none"
        // Hide default DialogContent close button — we render our own
        aria-describedby="login-modal-desc"
      >
        {/* Outer glow wrapper */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.04 240) 0%, oklch(0.16 0.03 240) 100%)",
            boxShadow:
              "0 0 0 1px oklch(0.65 0.18 155 / 0.25), 0 0 40px oklch(0.65 0.18 155 / 0.12), 0 24px 60px oklch(0.05 0.02 240 / 0.6)",
          }}
        >
          {/* Subtle top glow streak */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.65 0.18 155 / 0.6), transparent)",
            }}
          />

          {/* Close button — hidden when logging in */}
          {!isLoggingIn && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: "oklch(0.28 0.025 240)",
                color: "oklch(0.60 0.015 240)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.32 0.025 240)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.90 0.005 240)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.28 0.025 240)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.60 0.015 240)";
              }}
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="px-8 py-10">
            <DialogHeader className="sr-only">
              <DialogTitle>Sign in to Avantkey</DialogTitle>
            </DialogHeader>

            {/* Brand mark */}
            <div className="flex flex-col items-center gap-4 mb-8">
              {/* Shield icon with glow */}
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 155 / 0.2), oklch(0.65 0.18 155 / 0.08))",
                  boxShadow:
                    "0 0 0 1px oklch(0.65 0.18 155 / 0.3), 0 0 20px oklch(0.65 0.18 155 / 0.15)",
                }}
              >
                <Shield
                  className="w-8 h-8"
                  style={{ color: "oklch(0.65 0.18 155)" }}
                />
                {/* Animated ring when logging in */}
                {isLoggingIn && (
                  <div
                    className="absolute inset-0 rounded-2xl animate-ping"
                    style={{
                      background: "oklch(0.65 0.18 155 / 0.15)",
                      animationDuration: "1.5s",
                    }}
                  />
                )}
              </div>

              {/* Wordmark */}
              <p
                className="font-display font-bold text-xl tracking-tight"
                style={{ color: "oklch(0.95 0.005 240)" }}
              >
                Avantkey
              </p>
            </div>

            {/* Headline + subtext */}
            <div className="text-center mb-8 space-y-2">
              <h2
                className="font-display font-semibold text-lg"
                id="login-modal-desc"
                style={{ color: "oklch(0.95 0.005 240)" }}
              >
                Sign in to Avantkey
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.60 0.015 240)" }}
              >
                Authenticate with a passkey.
                <br />
                No passwords, no breaches.
              </p>
            </div>

            {/* Primary action */}
            <Button
              className="w-full h-11 gap-2.5 font-semibold text-sm relative overflow-hidden"
              onClick={handleLogin}
              disabled={isLoggingIn}
              style={
                {
                  background: isLoggingIn
                    ? "oklch(0.55 0.14 155)"
                    : "oklch(0.65 0.18 155)",
                  color: "oklch(0.11 0.02 240)",
                  boxShadow: isLoggingIn
                    ? "none"
                    : "0 0 0 1px oklch(0.65 0.18 155 / 0.5), 0 4px 16px oklch(0.65 0.18 155 / 0.25)",
                  border: "none",
                  transition: "all 0.2s ease",
                } as React.CSSProperties
              }
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Continue with Passkey
                </>
              )}
            </Button>

            {/* Error message */}
            {isLoginError && loginError && (
              <div
                className="mt-3 px-4 py-2.5 rounded-lg text-sm text-center"
                style={{
                  background: "oklch(0.55 0.22 25 / 0.12)",
                  border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                  color: "oklch(0.75 0.18 25)",
                }}
              >
                {loginError.message === "Login failed"
                  ? "Authentication cancelled. Please try again."
                  : loginError.message}
              </div>
            )}

            {/* Trust footer */}
            <div
              className="flex items-center justify-center gap-1.5 mt-6 text-xs"
              style={{ color: "oklch(0.45 0.01 240)" }}
            >
              <Lock className="w-3 h-3 shrink-0" />
              <span>Secured by Internet Identity · No passwords stored</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
